import os
import sys
import json
import subprocess
import traceback
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime, date

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel
from dotenv import load_dotenv
from neo4j import GraphDatabase

from src.api.auth_backend import get_current_user
from src.api.models import User

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / ".env")

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PW = os.getenv("NEO4J_PW")

if not NEO4J_PW:
    raise RuntimeError("NEO4J_PW not set in .env")

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PW))

router = APIRouter(prefix="/api/graph", tags=["graph"])


class IngestRequest(BaseModel):
    audit_path: str
    async_run: bool = False


def _sanitize_value(v: Any) -> Any:
    """Make a single property value JSON-serializable (or convert to string)."""
    if v is None:
        return None

    if isinstance(v, (str, int, float, bool)):
        return v

    try:
        json.dumps(v)
        return v
    except Exception:
        pass

    if isinstance(v, (bytes, bytearray)):
        try:
            return v.decode("utf-8", errors="ignore")
        except Exception:
            return str(v)

    if isinstance(v, (datetime, date)):
        try:
            return v.isoformat()
        except Exception:
            return str(v)

    try:
        return str(v)
    except Exception:
        return None


def _sanitize_props(props: dict) -> dict:
    """Ensure Neo4j property dict is JSON-safe by coercing values where needed."""
    if not isinstance(props, dict):
        return {}
    clean = {}
    for k, v in props.items():
        clean[k] = _sanitize_value(v)
    return clean


def run_ingest_script(audit_path: str) -> Dict[str, Any]:
    """
    Run the ingestion script using the same Python executable that runs this process
    (this avoids mismatched venv issues). Capture stdout/stderr and return them.
    """
    project_root = ROOT
    script_path = project_root / "scripts" / "ingest_audit_to_neo4j.py"
    if not script_path.exists():
        raise FileNotFoundError(f"Ingest script not found at {script_path}")

    python_bin = os.environ.get("PYTHON_BIN", sys.executable)
    cmd = [python_bin, str(script_path), str(audit_path)]

    proc = subprocess.run(cmd, capture_output=True, text=True, cwd=str(project_root))
    print(f"[INGEST] cmd: {cmd}")
    print(f"[INGEST] returncode: {proc.returncode}")
    print(f"[INGEST] stdout:\n{proc.stdout}")
    print(f"[INGEST] stderr:\n{proc.stderr}")
    return {
        "returncode": proc.returncode,
        "stdout": proc.stdout,
        "stderr": proc.stderr
    }


def _read_graph(limit: int = 100, user_uid: str = None) -> Dict[str, List[Dict[str, Any]]]:
    nodes = []
    edges = []
    try:
        with driver.session() as sess:
            q_nodes = """
            MATCH (n)
            WHERE n.user_uid = $user_uid OR NOT exists(n.user_uid)
            WITH n, labels(n) AS labs, properties(n) AS props
            RETURN id(n) AS _id, labs, props
            LIMIT $limit
            """
            result = sess.execute_read(lambda tx: tx.run(q_nodes, limit=limit, user_uid=user_uid).data())

            for r in result:
                props = _sanitize_props(r.get("props") or {})
                label = r.get("labs")[0] if r.get("labs") else "Node"
                nodes.append({
                    "id": str(r["_id"]),
                    "label": label,
                    "props": props
                })

            q_edges = """
            MATCH (a)-[rel]->(b)
            WHERE (a.user_uid = $user_uid OR NOT exists(a.user_uid))
              AND (b.user_uid = $user_uid OR NOT exists(b.user_uid))
            RETURN id(rel) AS id, id(a) AS source, id(b) AS target, type(rel) AS type, properties(rel) AS props
            LIMIT $limit
            """
            res2 = sess.execute_read(lambda tx: tx.run(q_edges, limit=limit, user_uid=user_uid).data())
            for r in res2:
                edges.append({
                    "id": str(r["id"]),
                    "source": str(r["source"]),
                    "target": str(r["target"]),
                    "type": r["type"],
                    "props": _sanitize_props(r.get("props") or {})
                })

        return {"nodes": nodes, "edges": edges}
    except Exception as e:
        tb = traceback.format_exc()
        return {"error": "failed to read graph", "detail": str(e), "traceback": tb}


def _read_department_subgraph(department_name: str, user_uid: str, depth: int = 2) -> Dict[str, Any]:
    """
    Fetch nodes and edges for a department subgraph. Sanitizes props to ensure JSON serializability.

    Note: Neo4j does not accept parameter maps inside variable-length patterns (e.g. [*1..$depth]).
    We therefore inject `depth` as a literal integer into the Cypher string (safe because depth is an int).
    The department name remains a parameter to avoid injection risk.
    """
    nodes = []
    edges = []
    try:
        with driver.session() as sess:
            if not isinstance(depth, int) or depth < 1 or depth > 10:
                depth = max(1, min(int(depth) if isinstance(depth, int) else 2, 10))

            q = f"""
            MATCH (d:Department {{name:$name, user_uid:$user_uid}})-[*1..{depth}]-(n)
            WHERE n.user_uid = $user_uid OR NOT exists(n.user_uid)
            WITH collect(distinct n) + collect(distinct d) AS items
            UNWIND items AS n
            WITH distinct n
            OPTIONAL MATCH (n)-[r]->(m)
            WHERE m.user_uid = $user_uid OR NOT exists(m.user_uid)
            RETURN id(n) AS nid, labels(n) AS labs, properties(n) AS props, 
                   collect({{rid: id(r), type: type(r), target: id(m)}}) AS outs
            LIMIT 500
            """

            rows = sess.execute_read(lambda tx: tx.run(q, name=department_name, user_uid=user_uid).data())

            node_map: Dict[str, Dict[str, Any]] = {}
            for r in rows:
                nid = str(r["nid"])
                label = r["labs"][0] if r.get("labs") else "Node"
                props = _sanitize_props(r.get("props", {}) or {})
                node_map[nid] = {"id": nid, "label": label, "props": props}

                for out in r.get("outs", []) or []:
                    if out and out.get("rid") is not None:
                        try:
                            rid = out.get("rid")
                            tgt = out.get("target")
                            typ = out.get("type")
                            edges.append({
                                "id": str(rid),
                                "source": nid,
                                "target": str(tgt) if tgt is not None else None,
                                "type": typ
                            })
                        except Exception:
                            print(f"[GRAPH] Skipped malformed 'outs' entry for node {nid}: {out}")
                            continue

            nodes = list(node_map.values())
        return {"nodes": nodes, "edges": edges}
    except Exception as e:
        tb = traceback.format_exc()
        return {"error": "failed to read department subgraph", "detail": str(e), "traceback": tb}


@router.post("/ingest_audit")
def ingest_audit(
    req: IngestRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    audit_path = req.audit_path
    if not os.path.isabs(audit_path):
        audit_path = str(ROOT / audit_path)

    if not os.path.exists(audit_path):
        raise HTTPException(status_code=404, detail=f"Audit file not found: {audit_path}")

    if req.async_run:
        background_tasks.add_task(run_ingest_script, audit_path)
        return {"status": "started", "audit_path": audit_path}

    result = run_ingest_script(audit_path)
    if result["returncode"] != 0:
        raise HTTPException(status_code=500, detail={"stdout": result["stdout"], "stderr": result["stderr"]})
    return {"status": "ok", "stdout": result["stdout"], "stderr": result["stderr"]}


@router.get("/")
def read_graph_endpoint(
    limit: int = 100,
    current_user: User = Depends(get_current_user)
) -> Dict[str, List[Dict[str, Any]]]:
    return _read_graph(limit=limit, user_uid=current_user.uid)


@router.get("/department/{name}")
def get_department(
    name: str,
    current_user: User = Depends(get_current_user)
):
    return _read_department_subgraph(name, user_uid=current_user.uid, depth=2)
