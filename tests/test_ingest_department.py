
import os
import time
import json
import subprocess
from pathlib import Path
import pytest
from neo4j import GraphDatabase

# env vars expected by test runner / CI
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASS = os.getenv("NEO4J_PASS", "password")

SAMPLE_AUDIT = Path("uploads/sample_contract.audit.json")
INGEST_SCRIPT = Path("scripts/ingest_audit_to_neo4j.py")

@pytest.fixture(scope="module")
def neo4j_driver():
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))
    yield driver
    driver.close()

def test_ingest_creates_department_and_owns_relationship(neo4j_driver):
    assert SAMPLE_AUDIT.exists(), "Run `python test_rag-run.py` to generate sample audit first"

    
    proc = subprocess.run(["python", str(INGEST_SCRIPT), str(SAMPLE_AUDIT.resolve())], capture_output=True, text=True)
    assert proc.returncode == 0, f"Ingest script failed: {proc.returncode}\nstdout:{proc.stdout}\nstderr:{proc.stderr}"

    # wait a little for eventual consistency / transactions to be committed
    time.sleep(0.5)

    # query neo4j to assert relationship exists
    with neo4j_driver.session() as session:
        res = session.run("""
            MATCH (d:Department {name: $department})-[:OWNS]->(doc:Document {id: $doc_id})
            RETURN count(doc) AS cnt
        """, department="Procurement", doc_id="sample_contract_001")
        rec = res.single()
        cnt = rec["cnt"] if rec else 0
        assert cnt >= 1, "Expected Department OWNS Document relationship not found in Neo4j"
