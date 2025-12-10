

from dotenv import load_dotenv
load_dotenv()

import os
import json
import hashlib
import traceback
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from neo4j import GraphDatabase, basic_auth
from neo4j.exceptions import ServiceUnavailable, TransientError

router = APIRouter()


def get_neo4j_driver():
    """Get Neo4j driver instance."""
    uri = os.getenv("NEO4J_URI")
    user = os.getenv("NEO4J_USER")
    pwd = os.getenv("NEO4J_PASSWORD")
    
    if not uri or not user or not pwd:
        raise RuntimeError("NEO4J_URI / NEO4J_USER / NEO4J_PASSWORD must be set")
    
    return GraphDatabase.driver(
        uri, 
        auth=basic_auth(user, pwd), 
        max_connection_lifetime=60*60,
        max_connection_pool_size=50
    )


def generate_audit_id(user_uid: str, file_id: str, timestamp: str) -> str:
    """Generate unique audit_id from user, file, and timestamp."""
    payload = f"{user_uid}||{file_id}||{timestamp}"
    return "audit_" + hashlib.sha256(payload.encode("utf-8")).hexdigest()[:24]


def calculate_compliance_score(results: List[Dict[str, Any]]) -> float:
    """
    Calculate overall compliance score from results.
    Returns percentage (0-100).
    """
    if not results:
        return 0.0
    
    compliant_count = sum(1 for r in results if r.get("Is_Compliant", False))
    return round((compliant_count / len(results)) * 100, 2)


def extract_flagged_departments(results: List[Dict[str, Any]]) -> List[str]:
    """Extract unique departments from non-compliant results."""
    departments = set()
    
    for r in results:
        if not r.get("Is_Compliant", True):
            target_area = r.get("Target_Area", "")
            if target_area:
                for area in target_area.split(","):
                    clean_area = area.strip()
                    if clean_area:
                        departments.add(clean_area)
    
    return sorted(list(departments))


def upsert_audit_to_neo4j(
    user_uid: str,
    file_id: str,
    supplier_id: Optional[str],
    results: List[Dict[str, Any]],
    summary: Dict[str, Any],
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Save audit run and its findings to Neo4j as a graph.
    
    ✅ FIXED:
    - Uses transactions (all-or-nothing)
    - Better error handling
    - Fixed OPTIONAL MATCH logic
    - Added retries for transient errors
    - Updated for Neo4j 5.x API (execute_write)
    """
    if not results:
        raise ValueError("Cannot save audit with no results")
    
    metadata = metadata or {}
    
    # Generate unique audit ID
    timestamp = datetime.utcnow().isoformat()
    audit_id = generate_audit_id(user_uid, file_id, timestamp)
    
    # Calculate metrics
    compliance_score = calculate_compliance_score(results)
    flagged_departments = extract_flagged_departments(results)
    gap_count = sum(1 for r in results if not r.get("Is_Compliant", False))
    high_risk_count = summary.get("high_risk_gaps", 0)
    
    # Prepare audit node properties
    audit_props = {
        "audit_id": audit_id,
        "user_uid": user_uid,
        "file_id": file_id,
        "supplier_id": supplier_id or "unknown",
        "timestamp": timestamp,
        "compliance_score": compliance_score,
        "total_requirements": len(results),
        "gap_count": gap_count,
        "high_risk_count": high_risk_count,
        "status": "completed",
        "summary_json": json.dumps(summary),
        "metadata_json": json.dumps(metadata)
    }
    
    cypher_audit = """
    // Create or merge User
    MERGE (u:User {uid: $user_uid})
    ON CREATE SET u.created_at = timestamp()
    
    // Create or merge Supplier (if provided)
    MERGE (s:Supplier {supplier_id: $supplier_id})
    ON CREATE SET s.created_at = timestamp()
    
    // Create or merge File
    MERGE (f:File {file_id: $file_id})
    ON CREATE SET f.created_at = timestamp()
    
    // Create AuditRun node
    CREATE (a:AuditRun)
    SET a = $audit_props
    
    // Create relationships
    MERGE (u)-[:INITIATED_AUDIT]->(a)
    MERGE (s)-[:HAS_AUDIT]->(a)
    MERGE (a)-[:ANALYZED_FILE]->(f)
    
    RETURN a.audit_id AS audit_id
    """
    
    cypher_gaps = """
    UNWIND $gaps AS gap
    MATCH (a:AuditRun {audit_id: $audit_id})
    
    // Find regulation first
    OPTIONAL MATCH (reg:Regulation {regulation_id: gap.reg_id})
    
    // If regulation exists, find its obligations
    WITH a, gap, reg
    WHERE reg IS NOT NULL
    OPTIONAL MATCH (reg)-[:HAS_OBLIGATION]->(o:Obligation)
    
    // Create gap relationship if obligation exists
    WITH a, gap, o
    WHERE o IS NOT NULL
    MERGE (a)-[r:FOUND_GAP]->(o)
    SET r.compliance_score = gap.score,
        r.risk_rating = gap.risk,
        r.narrative = gap.narrative,
        r.evidence_chunk = gap.evidence,
        r.created_at = timestamp()
    
    RETURN count(o) AS gap_links
    """
    
    cypher_depts = """
    UNWIND $departments AS dept_name
    MATCH (a:AuditRun {audit_id: $audit_id})
    MERGE (d:Department {name: dept_name})
    ON CREATE SET d.created_at = timestamp()
    MERGE (a)-[:FLAGGED_DEPT]->(d)
    RETURN count(d) AS dept_count
    """
    
    driver = get_neo4j_driver()
    max_retries = 3
    
    for attempt in range(max_retries):
        try:
            with driver.session() as session:
                # ✅ Neo4j 5.x: execute_write (replaces write_transaction)
                result = session.execute_write(
                    _create_audit_tx,
                    cypher_audit,
                    audit_props,
                    cypher_gaps,
                    cypher_depts,
                    audit_id,
                    results,
                    flagged_departments
                )
                
                driver.close()
                return result
                
        except TransientError as e:
            if attempt < max_retries - 1:
                print(f"⚠️ Transient error, retrying ({attempt + 1}/{max_retries}): {e}")
                continue
            else:
                traceback.print_exc()
                driver.close()
                return {"ok": False, "error": f"Transient error after {max_retries} retries: {str(e)}"}
                
        except ServiceUnavailable as e:
            traceback.print_exc()
            driver.close()
            return {"ok": False, "error": f"Neo4j unavailable: {str(e)}"}
            
        except Exception as e:
            traceback.print_exc()
            driver.close()
            return {"ok": False, "error": str(e)}
    
    driver.close()
    return {"ok": False, "error": "Max retries exceeded"}


def _create_audit_tx(tx, cypher_audit, audit_props, cypher_gaps, cypher_depts, 
                     audit_id, results, flagged_departments):
    """
    Transaction function - all operations succeed or all fail
    """
    # 1. Create audit node and core relationships
    result = tx.run(cypher_audit, audit_props=audit_props, **audit_props)
    record = result.single()
    created_audit_id = record["audit_id"] if record else audit_id
    
    # 2. Link non-compliant findings to obligations
    gaps = []
    for r in results:
        if not r.get("Is_Compliant", True):
            gaps.append({
                "reg_id": r.get("Reg_ID"),
                "score": r.get("Compliance_Score", 0.0),
                "risk": r.get("Risk_Rating", ""),
                "narrative": r.get("Narrative_Gap", ""),
                "evidence": (r.get("Evidence_Chunk", "") or "")[:500]
            })
    
    gap_count_created = 0
    if gaps:
        result = tx.run(cypher_gaps, audit_id=audit_id, gaps=gaps)
        record = result.single()
        gap_count_created = record["gap_links"] if record else 0
    
    # 3. Link to flagged departments
    dept_count = 0
    if flagged_departments:
        result = tx.run(cypher_depts, audit_id=audit_id, departments=flagged_departments)
        record = result.single()
        dept_count = record["dept_count"] if record else 0
    
    return {
        "ok": True,
        "audit_id": created_audit_id,
        "compliance_score": audit_props["compliance_score"],
        "gap_count": audit_props["gap_count"],
        "high_risk_count": audit_props["high_risk_count"],
        "gap_links_created": gap_count_created,
        "departments_flagged": dept_count
    }


def get_audits_for_user(user_uid: str, limit: int = 50, skip: int = 0) -> List[Dict[str, Any]]:
    """Get all audit runs for a user."""
    driver = get_neo4j_driver()
    
    cypher = """
    MATCH (u:User {uid: $user_uid})-[:INITIATED_AUDIT]->(a:AuditRun)
    OPTIONAL MATCH (a)-[:ANALYZED_FILE]->(f:File)
    OPTIONAL MATCH (s:Supplier)-[:HAS_AUDIT]->(a)
    RETURN a AS audit,
           f.file_id AS file_id,
           s.supplier_id AS supplier_id
    ORDER BY a.timestamp DESC
    SKIP $skip LIMIT $limit
    """
    
    try:
        with driver.session() as session:
            # ✅ Neo4j 5.x: execute_read (replaces read_transaction)
            result = session.execute_read(
                lambda tx: list(tx.run(cypher, user_uid=user_uid, skip=skip, limit=limit))
            )
            
            audits = []
            for record in result:
                audit_node = record["audit"]
                props = dict(audit_node)
                
                try:
                    props["summary"] = json.loads(props.get("summary_json", "{}"))
                except:
                    props["summary"] = {}
                
                try:
                    props["metadata"] = json.loads(props.get("metadata_json", "{}"))
                except:
                    props["metadata"] = {}
                
                props["file_id"] = record.get("file_id")
                props["supplier_id"] = record.get("supplier_id")
                props.pop("summary_json", None)
                props.pop("metadata_json", None)
                
                audits.append(props)
            
            return audits
            
    finally:
        driver.close()


def get_audits_for_supplier(supplier_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Get all audit runs for a specific supplier."""
    driver = get_neo4j_driver()
    
    cypher = """
    MATCH (s:Supplier {supplier_id: $supplier_id})-[:HAS_AUDIT]->(a:AuditRun)
    OPTIONAL MATCH (a)-[:ANALYZED_FILE]->(f:File)
    RETURN a AS audit, f.file_id AS file_id
    ORDER BY a.timestamp DESC
    LIMIT $limit
    """
    
    try:
        with driver.session() as session:
            # ✅ Neo4j 5.x: execute_read
            result = session.execute_read(
                lambda tx: list(tx.run(cypher, supplier_id=supplier_id, limit=limit))
            )
            
            audits = []
            for record in result:
                audit_node = record["audit"]
                props = dict(audit_node)
                
                try:
                    props["summary"] = json.loads(props.get("summary_json", "{}"))
                except:
                    props["summary"] = {}
                
                props["file_id"] = record.get("file_id")
                props.pop("summary_json", None)
                props.pop("metadata_json", None)
                
                audits.append(props)
            
            return audits
            
    finally:
        driver.close()


def get_audit_detail(audit_id: str) -> Optional[Dict[str, Any]]:
    """Get detailed audit with all gaps and flagged obligations."""
    driver = get_neo4j_driver()
    
    cypher = """
    MATCH (a:AuditRun {audit_id: $audit_id})
    
    // Get gaps with obligations
    OPTIONAL MATCH (a)-[gap:FOUND_GAP]->(o:Obligation)
    OPTIONAL MATCH (reg:Regulation)-[:HAS_OBLIGATION]->(o)
    
    // Get flagged departments
    OPTIONAL MATCH (a)-[:FLAGGED_DEPT]->(d:Department)
    
    RETURN a AS audit,
           collect(DISTINCT {
               obligation_id: o.obligation_id,
               text: o.text,
               regulation_id: reg.regulation_id,
               compliance_score: gap.compliance_score,
               risk_rating: gap.risk_rating,
               narrative: gap.narrative,
               evidence_chunk: gap.evidence_chunk
           }) AS gaps,
           collect(DISTINCT d.name) AS departments
    """
    
    try:
        with driver.session() as session:
            # ✅ Neo4j 5.x: execute_read
            result = session.execute_read(
                lambda tx: tx.run(cypher, audit_id=audit_id).single()
            )
            
            if not result:
                return None
            
            audit_node = result["audit"]
            props = dict(audit_node)
            
            try:
                props["summary"] = json.loads(props.get("summary_json", "{}"))
            except:
                props["summary"] = {}
            
            props["gaps"] = [g for g in result["gaps"] if g.get("obligation_id")]
            props["flagged_departments"] = [d for d in result["departments"] if d]
            props.pop("summary_json", None)
            props.pop("metadata_json", None)
            
            return props
            
    finally:
        driver.close()


# API Routes
@router.get("/api/v1/audit/user/{user_uid}")
async def get_user_audits(
    user_uid: str,
    limit: int = Query(50, gt=0, le=100),
    skip: int = Query(0, ge=0)
):
    """Get all audits initiated by a user."""
    try:
        audits = get_audits_for_user(user_uid, limit=limit, skip=skip)
        return JSONResponse(content={
            "ok": True,
            "count": len(audits),
            "audits": audits
        })
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(content={
            "ok": False,
            "error": str(e)
        }, status_code=500)


@router.get("/api/v1/audit/supplier/{supplier_id}")
async def get_supplier_audits(
    supplier_id: str,
    limit: int = Query(50, gt=0, le=100)
):
    """Get all audits for a specific supplier."""
    try:
        audits = get_audits_for_supplier(supplier_id, limit=limit)
        return JSONResponse(content={
            "ok": True,
            "count": len(audits),
            "supplier_id": supplier_id,
            "audits": audits
        })
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(content={
            "ok": False,
            "error": str(e)
        }, status_code=500)


@router.get("/api/v1/audit/run/{audit_id}")
async def get_audit_details(audit_id: str):
    """Get detailed audit including all gaps and linked obligations."""
    try:
        audit = get_audit_detail(audit_id)
        if not audit:
            raise HTTPException(status_code=404, detail="Audit not found")
        return JSONResponse(content={
            "ok": True,
            "audit": audit
        })
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(content={
            "ok": False,
            "error": str(e)
        }, status_code=500)


def ensure_audit_indexes():
    """Create Neo4j indexes for audit queries."""
    try:
        driver = get_neo4j_driver()
    except Exception as e:
        print(f"⚠️ Skipping audit indexes: {e}")
        return
    
    indexes = [
        "CREATE INDEX IF NOT EXISTS FOR (a:AuditRun) ON (a.audit_id);",
        "CREATE INDEX IF NOT EXISTS FOR (a:AuditRun) ON (a.user_uid);",
        "CREATE INDEX IF NOT EXISTS FOR (a:AuditRun) ON (a.supplier_id);",
        "CREATE INDEX IF NOT EXISTS FOR (a:AuditRun) ON (a.timestamp);",
        "CREATE INDEX IF NOT EXISTS FOR (f:File) ON (f.file_id);",
        "CREATE INDEX IF NOT EXISTS FOR (s:Supplier) ON (s.supplier_id);",
        "CREATE INDEX IF NOT EXISTS FOR (u:User) ON (u.uid);",
        "CREATE INDEX IF NOT EXISTS FOR (d:Department) ON (d.name);",
        "CREATE INDEX IF NOT EXISTS FOR (r:Regulation) ON (r.regulation_id);",
        "CREATE INDEX IF NOT EXISTS FOR (o:Obligation) ON (o.obligation_id);",
    ]
    
    try:
        with driver.session() as session:
            for idx in indexes:
                try:
                    session.run(idx)
                except Exception as e:
                    print(f"⚠️ Index creation warning: {e}")
        
        print("✅ Audit Neo4j indexes ensured")
        
    finally:
        driver.close()
