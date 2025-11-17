
import os
import json
from pathlib import Path
from dotenv import load_dotenv
from neo4j import GraphDatabase

# load .env from project root
ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PW = os.getenv("NEO4J_PW")

if not NEO4J_PW:
    raise RuntimeError("Set NEO4J_PW in .env before running this script")

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PW))


# --- transaction helpers ---
def upsert_document(tx, meta):
    doc_id = meta.get("id") or meta.get("saved_filename") or meta.get("original_filename") or f"doc_{os.urandom(4).hex()}"
    tx.run(
        "MERGE (d:Document {id:$id}) "
        "SET d.filename=$filename, d.path=$path, d.department=$department, d.uploaded_at=$uploaded_at",
        id=doc_id,
        filename=meta.get("original_filename"),
        path=meta.get("path"),
        department=meta.get("department"),
        uploaded_at=meta.get("uploaded_at")
    )
    return doc_id

def upsert_regulation(tx, reg_id, reg):
    tx.run(
        "MERGE (r:Regulation {id:$id}) "
        "SET r.risk=$risk, r.target=$target, r.title=$title",
        id=reg_id,
        risk=reg.get("Risk_Rating"),
        target=reg.get("Target_Area"),
        title=reg.get("Requirement_Text") or reg.get("title")
    )
    return reg_id

def upsert_finding(tx, fid, finding):
    tx.run(
        "MERGE (f:Finding {id:$id}) "
        "SET f.score=$score, f.is_compliant=$is_compliant, f.evidence=$evidence, f.narrative=$narrative",
        id=fid,
        score=finding.get("Compliance_Score"),
        is_compliant=bool(finding.get("Is_Compliant")),
        evidence=finding.get("Evidence_Chunk"),
        narrative=finding.get("Narrative_Gap")
    )
    return fid

def create_relationships(tx, doc_id, reg_id, fid, department=None):
    if department:
        tx.run(
            "MERGE (dep:Department {name:$dep})",
            dep=department
        )
        tx.run(
            "MATCH (dep:Department {name:$dep}), (d:Document {id:$doc_id}) "
            "MERGE (dep)-[:OWNS]->(d)",
            dep=department, doc_id=doc_id
        )

    tx.run(
        "MATCH (d:Document {id:$doc_id}), (r:Regulation {id:$reg_id}), (f:Finding {id:$fid}) "
        "MERGE (d)-[:EVIDENCE_FOR]->(r) "
        "MERGE (r)-[:HAS_FINDING]->(f) "
        "MERGE (d)-[:HAS_FINDING]->(f)",
        doc_id=doc_id, reg_id=reg_id, fid=fid
    )
    return True


# --- main ingestion flow ---
def ingest_audit(audit_path: str):
    if not os.path.exists(audit_path):
        raise FileNotFoundError(f"audit file not found: {audit_path}")

    with open(audit_path, "r", encoding="utf-8") as fh:
        data = json.load(fh)

    meta = data.get("metadata", {})
    results = data.get("results", [])

    # Use a session and execute_write for neo4j v6+
    with driver.session() as sess:
        # upsert document and get its id
        doc_id = sess.execute_write(upsert_document, meta)
        dept = meta.get("department")

        inserted = 0
        for i, r in enumerate(results):
            # pick a stable reg_id if present, else create one
            reg_id = r.get("Reg_ID") or f"{doc_id}_reg_{i}"
            fid = f"{doc_id}_finding_{i}"

            sess.execute_write(upsert_regulation, reg_id, r)
            sess.execute_write(upsert_finding, fid, r)
            sess.execute_write(create_relationships, doc_id, reg_id, fid, dept)
            inserted += 1

    print(f"Ingest complete. Document: {doc_id}. Findings inserted: {inserted}")


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python scripts/ingest_audit_to_neo4j.py path/to/audit.json")
        sys.exit(1)
    ingest_audit(sys.argv[1])
