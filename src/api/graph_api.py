
import os
import json
import subprocess
import traceback
from pathlib import Path
from typing import List, Dict, Any

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from dotenv import load_dotenv
from neo4j import GraphDatabase

# load .env (project root assumed two parents above this file)
ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / ".env")

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PW = os.getenv("NEO4J_PW", "neo4jdev")

if not NEO4J_PW:
    raise RuntimeError("NEO4J_PW not set in .env")

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PW))

router = APIRouter(prefix="/api/graph", tags=["graph"])

# Simple request model for ingestion
class IngestRequest(BaseModel):
    audit_path: str  # full path or relative path from project root
    async_run: bool = False  # if true, trigger background ingestion and return immediately

# Utility to run the ingestion script (subprocess) and capture stdout/stderr
def run_ingest_script(audit_path: str) -> Dict[str, Any]:
    project_root = ROOT
    script_path = project_root / "scripts" / "ingest_audit_to_neo4j.py"
    if not script_path.exists():
        raise FileNotFoundError(f"Ingest script not found at {script_path}")

    cmd = [os.environ.get("PYTHON_BIN", "python"), str(script_path), str(audit_path)]
    proc = subprocess.run(cmd, capture_output=True, text=True, cwd=str(project_root))
    return {
        "returncode": proc.returncode,
        "stdout": proc.stdout,
        "stderr": proc.stderr
    }

# Helper to read graph (nodes + edges)
def _read_graph(limit: int = 100) -> Dict[str, List[Dict[str, Any]]]:
    nodes = []
    edges = []
    with driver.session() as sess:
        # return basic node id, label and properties summary
        q_nodes = """
        MATCH (n)
        WITH n, labels(n) AS labs, keys(n) AS ks
        RETURN id(n) AS _id, labs, apoc.convert.toJson(map({k in ks | k: n[k]})) AS props
        LIMIT $limit
        """
        result = sess.execute_read(lambda tx: tx.run(q_nodes, limit=limit).data())

        for r in result:
            props = {}
            try:
                props = json.loads(r["props"])
            except Exception:
                props = {}
            label = r["labs"][0] if r["labs"] else "Node"
            nodes.append({
                "id": str(r["_id"]),
                "label": label,
                "props": props
            })

        # edges
        q_edges = """
        MATCH (a)-[rel]->(b)
        RETURN id(rel) AS id, id(a) AS source, id(b) AS target, type(rel) AS type, properties(rel) as props
        LIMIT $limit
        """
        res2 = sess.execute_read(lambda tx: tx.run(q_edges, limit=limit).data())
        for r in res2:
            edges.append({
                "id": str(r["id"]),
                "source": str(r["source"]),
                "target": str(r["target"]),
                "type": r["type"],
                "props": r.get("props", {})
            })

    return {"nodes": nodes, "edges": edges}

# Helper to fetch a department subgraph (nodes + edges)
def _read_department_subgraph(department_name: str, depth: int = 2) -> Dict[str, Any]:
    nodes = []
    edges = []
    with driver.session() as sess:
        q = """
        MATCH (d:Department {name:$name})-[*1..$depth]-(n)
        WITH collect(distinct n) + collect(distinct d) AS items
        UNWIND items AS n
        WITH distinct n
        OPTIONAL MATCH (n)-[r]->(m)
        RETURN id(n) AS nid, labels(n) AS labs, properties(n) AS props, 
               collect({rid: id(r), type: type(r), target: id(m)}) AS outs
        LIMIT 500
        """
        rows = sess.execute_read(lambda tx: tx.run(q, name=department_name, depth=depth).data())
        node_map = {}
        for r in rows:
            nid = str(r["nid"])
            label = r["labs"][0] if r["labs"] else "Node"
            props = r.get("props", {})
            node_map[nid] = {"id": nid, "label": label, "props": props}
            for out in r.get("outs", []) or []:
                if out and out.get("rid") is not None:
                    edges.append({
                        "id": str(out["rid"]),
                        "source": nid,
                        "target": str(out["target"]),
                        "type": out.get("type")
                    })

        nodes = list(node_map.values())
    return {"nodes": nodes, "edges": edges}

# Routes
@router.post("/ingest_audit")
def ingest_audit(req: IngestRequest, background_tasks: BackgroundTasks):
    audit_path = req.audit_path
    # allow relative path from project root
    if not os.path.isabs(audit_path):
        audit_path = str(ROOT / audit_path)

    if not os.path.exists(audit_path):
        raise HTTPException(status_code=404, detail=f"Audit file not found: {audit_path}")

    if req.async_run:
        # schedule background
        background_tasks.add_task(run_ingest_script, audit_path)
        return {"status": "started", "audit_path": audit_path}

    result = run_ingest_script(audit_path)
    if result["returncode"] != 0:
        raise HTTPException(status_code=500, detail={"stdout": result["stdout"], "stderr": result["stderr"]})
    # parse stdout to find "Findings inserted" if script prints it
    return {"status": "ok", "stdout": result["stdout"], "stderr": result["stderr"]}

@router.get("/")
def _read_graph(limit: int = 100) -> Dict[str, List[Dict[str, Any]]]:
    """
    Read nodes and edges from Neo4j without relying on APOC.
    Returns either {"nodes": [...], "edges": [...]} or
    {"error":"failed to read graph", "detail": "...", "traceback": "..."}
    """
    nodes = []
    edges = []
    try:
        with driver.session() as sess:
            # nodes: return properties via properties(n) (no APOC)
            q_nodes = """
            MATCH (n)
            WITH n, labels(n) AS labs, properties(n) AS props
            RETURN id(n) AS _id, labs, props
            LIMIT $limit
            """
            result = sess.execute_read(lambda tx: tx.run(q_nodes, limit=limit).data())

            for r in result:
                props = r.get("props") or {}
                label = r["labs"][0] if r.get("labs") else "Node"
                nodes.append({
                    "id": str(r["_id"]),
                    "label": label,
                    "props": props
                })

            # edges
            q_edges = """
            MATCH (a)-[rel]->(b)
            RETURN id(rel) AS id, id(a) AS source, id(b) AS target, type(rel) AS type, properties(rel) AS props
            LIMIT $limit
            """
            res2 = sess.execute_read(lambda tx: tx.run(q_edges, limit=limit).data())
            for r in res2:
                edges.append({
                    "id": str(r["id"]),
                    "source": str(r["source"]),
                    "target": str(r["target"]),
                    "type": r["type"],
                    "props": r.get("props") or {}
                })

        return {"nodes": nodes, "edges": edges}
    except Exception as e:
        tb = traceback.format_exc()
        return {"error": "failed to read graph", "detail": str(e), "traceback": tb}
    
@router.get("/department/{name}")
def get_department(name: str):
    return _read_department_subgraph(name, depth=2)
