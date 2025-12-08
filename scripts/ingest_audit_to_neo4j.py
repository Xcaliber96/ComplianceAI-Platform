# scripts/ingest_audit_to_neo4j.py
import os
import json
import logging
from pathlib import Path
from dotenv import load_dotenv
from neo4j import GraphDatabase

# basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# load .env from project root
ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PW = os.getenv("NEO4J_PW")

if not NEO4J_PW:
    raise RuntimeError("Set NEO4J_PW in .env before running this script")

# Create driver and verify connectivity early so failures are clear and fast
driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PW))
try:
    driver.verify_connectivity()
except Exception as e:
    logger.error("Cannot connect to Neo4j at %s — verify the DB is running and .env values are correct", NEO4J_URI)
    logger.debug("Driver error details:", exc_info=True)
    raise SystemExit(1) from e


# --- transaction helpers ---
def upsert_document(tx, meta: dict):
    """
    Upsert a Document node. meta is expected to contain keys:
      - id (optional)
      - saved_filename or original_filename
      - path
      - department
      - uploaded_at
      - owner
    Returns the doc id used.
    """
    doc_id = meta.get("id") or meta.get("saved_filename") or meta.get("original_filename") or f"doc_{os.urandom(4).hex()}"
    filename = meta.get("original_filename") or meta.get("saved_filename") or doc_id

    tx.run(
        """
        MERGE (d:Document {id:$id})
        SET d.filename = $filename,
            d.path = $path,
            d.department = $department,
            d.uploaded_at = $uploaded_at,
            d.owner = $owner
        """,
        id=doc_id,
        filename=filename,
        path=meta.get("path"),
        department=meta.get("department"),
        uploaded_at=meta.get("uploaded_at"),
        owner=meta.get("owner")
    )
    return doc_id


def upsert_regulation(tx, reg_id: str, reg: dict):
    tx.run(
        """
        MERGE (r:Regulation {id:$id})
        SET r.risk = $risk,
            r.target = $target,
            r.title = $title
        """,
        id=reg_id,
        risk=reg.get("Risk_Rating") or reg.get("risk"),
        target=reg.get("Target_Area") or reg.get("target"),
        title=reg.get("Requirement_Text") or reg.get("title")
    )
    return reg_id


def upsert_finding(tx, fid: str, finding: dict):
    tx.run(
        """
        MERGE (f:Finding {id:$id})
        SET f.score = $score,
            f.is_compliant = $is_compliant,
            f.evidence = $evidence,
            f.narrative = $narrative
        """,
        id=fid,
        score=finding.get("Compliance_Score"),
        is_compliant=bool(finding.get("Is_Compliant")),
        evidence=finding.get("Evidence_Chunk"),
        narrative=finding.get("Narrative_Gap")
    )
    return fid


def create_relationships(tx, doc_id: str, reg_id: str, fid: str, department: str = None):
    # Ensure department exists and link to document
    if department:
        # Use two MATCH clauses to avoid cartesian product warnings
        tx.run(
            """
            MERGE (dep:Department {name:$dep})
            ON CREATE SET dep.created_at = timestamp()
            SET dep.last_seen = timestamp()
            """,
            dep=department
        )
        tx.run(
            """
            MATCH (dep:Department {name:$dep})
            MATCH (d:Document {id:$doc_id})
            MERGE (dep)-[:OWNS]->(d)
            """,
            dep=department, doc_id=doc_id
        )

    # Create/regard regulation and finding and link them to document
    tx.run(
        """
        MATCH (d:Document {id:$doc_id})
        MERGE (r:Regulation {id:$reg_id})
        MERGE (f:Finding {id:$fid})
        MERGE (d)-[:EVIDENCE_FOR]->(r)
        MERGE (r)-[:HAS_FINDING]->(f)
        MERGE (d)-[:HAS_FINDING]->(f)
        """,
        doc_id=doc_id, reg_id=reg_id, fid=fid
    )
    return True


# --- main ingestion flow ---
def ingest_audit(audit_path: str):
    if not os.path.exists(audit_path):
        raise FileNotFoundError(f"audit file not found: {audit_path}")

    with open(audit_path, "r", encoding="utf-8") as fh:
        data = json.load(fh)

    # Defensive metadata handling
    meta = data.get("metadata", {}) or {}
    department = meta.get("department")
    owner = meta.get("owner")

    if not department or (isinstance(department, str) and department.strip() == ""):
        logger.warning("Audit %s missing metadata.department; defaulting to 'Unassigned'", audit_path)
        department = "Unassigned"

    if not owner or (isinstance(owner, str) and owner.strip() == ""):
        logger.warning("Audit %s missing metadata.owner; defaulting to 'Unassigned'", audit_path)
        owner = "Unassigned"

    # Write sanitized values back into meta for downstream compatibility
    meta["department"] = department
    meta["owner"] = owner

    # normalize filename keys
    if "original_filename" not in meta and "filename" in meta:
        meta["original_filename"] = meta.get("filename")
    # if still missing, use audit file stem to help identify
    meta.setdefault("original_filename", Path(audit_path).stem)

    results = data.get("results", []) or []

    # Use a session and execute_write for neo4j v4/5/6 compatible pattern
    with driver.session() as sess:
        # Create/refresh Department node so queries relying on it won't fail
        sess.execute_write(lambda tx: tx.run(
            "MERGE (dep:Department {name:$dep}) "
            "ON CREATE SET dep.created_at = timestamp() "
            "SET dep.last_seen = timestamp()",
            dep=department
        ))

        # prepare document metadata for upsert
        doc_meta = {
            "id": meta.get("document_id") or meta.get("doc_id") or meta.get("id"),
            "saved_filename": meta.get("saved_filename"),
            "original_filename": meta.get("original_filename"),
            "path": meta.get("path") or str(Path(audit_path).resolve()),
            "department": department,
            "uploaded_at": meta.get("uploaded_at"),
            "owner": owner
        }

        doc_id = sess.execute_write(upsert_document, doc_meta)
        logger.info("Upserted Document id=%s department=%s owner=%s", doc_id, department, owner)

        inserted = 0
        for i, r in enumerate(results):
            reg_id = r.get("Reg_ID") or r.get("regulation_id") or f"{doc_id}_reg_{i}"
            fid = f"{doc_id}_finding_{i}"

            sess.execute_write(upsert_regulation, reg_id, r)
            sess.execute_write(upsert_finding, fid, r)
            sess.execute_write(create_relationships, doc_id, reg_id, fid, department)
            inserted += 1

    logger.info("Ingest complete. Document: %s. Findings inserted: %d", doc_id, inserted)
    print(f"Ingest complete. Document: {doc_id}. Findings inserted: {inserted}")


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python scripts/ingest_audit_to_neo4j.py path/to/audit.json")
        sys.exit(1)
    ingest_audit(sys.argv[1])
