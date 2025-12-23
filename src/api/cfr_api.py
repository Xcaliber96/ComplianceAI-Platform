
from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import JSONResponse
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from src.core.regulations.cfr_loader import CFRLoader, search_cfr
from src.core.regulations.cfr_neo4j_ingest import (
    ingest_cfr_title, 
    ensure_cfr_indexes,
    get_neo4j_driver
)
from src.api.db import get_db

router = APIRouter(prefix="/api/v1/cfr", tags=["CFR Regulations"])
cfr_loader = CFRLoader()



@router.get("/titles")
async def list_cfr_titles():
    """
    List all available CFR titles (1-50)
    
    Returns:
        {
            "ok": true,
            "count": 50,
            "titles": [
                {
                    "title_number": "1",
                    "title_name": "Title 1—General Provisions",
                    "amendment_date": "...",
                    "chapter_count": 5
                }
            ]
        }
    """
    try:
        titles = cfr_loader.list_all_titles()
        return JSONResponse(content={
            "ok": True,
            "count": len(titles),
            "titles": titles
        })
    except Exception as e:
        return JSONResponse(
            content={"ok": False, "error": str(e)},
            status_code=500
        )


@router.get("/title/{title_number}")
async def get_cfr_title(title_number: int):
    """
    Get specific CFR title with all parts
    
    Args:
        title_number: Title number (1-50)
        
    Returns:
        {
            "ok": true,
            "title": {
                "title_number": "45",
                "title_name": "Title 45—Public Welfare",
                "parts": [...]
            }
        }
    """
    try:
        if not 1 <= title_number <= 50:
            raise HTTPException(status_code=400, detail="Title number must be 1-50")
        
        title_data = cfr_loader.load_title(title_number)
        if not title_data:
            raise HTTPException(status_code=404, detail=f"Title {title_number} not found")
        
        parts = cfr_loader.get_parts(title_number)
        
        return JSONResponse(content={
            "ok": True,
            "title": {
                "title_number": title_data.get("title_number"),
                "title_name": title_data.get("title_name"),
                "amendment_date": title_data.get("amendment_date"),
                "chapter_count": len(title_data.get("chapters", [])),
                "part_count": len(parts),
                "parts": parts
            }
        })
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            content={"ok": False, "error": str(e)},
            status_code=500
        )


@router.get("/section")
async def get_cfr_section(
    title: int = Query(..., ge=1, le=50, description="CFR Title (1-50)"),
    part: str = Query(..., description="Part number (e.g., 164)"),
    section: str = Query(..., description="Section number (e.g., 164.312)")
):
    """
    Get specific CFR section with full regulation text
    
    Example: GET /api/v1/cfr/section?title=45&part=164&section=164.312
    
    Returns:
        {
            "ok": true,
            "section": {
                "id": "45-164-164.312",
                "heading": "Technical safeguards",
                "regulation_text": [...],
                "citations": [...]
            }
        }
    """
    try:
        section_data = cfr_loader.get_section(title, part, section)
        if not section_data:
            raise HTTPException(
                status_code=404,
                detail=f"Section {title} CFR {part}.{section} not found"
            )
        
        return JSONResponse(content={
            "ok": True,
            "section": section_data
        })
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            content={"ok": False, "error": str(e)},
            status_code=500
        )

def split_regulations(
    regulations: List[Dict[str, Any]],
    split_cfr: bool = True
) -> List[Dict[str, Any]]:
    """
    Takes raw regulations and returns compliance-ready units.
    Splits CFR sections into subsections when applicable.
    """
    final_regs = []

    for reg in regulations:
        reg_id = reg.get("Reg_ID", "")

        # CFR section detected
        if split_cfr and reg_id.startswith("cfr-") and "regulation_text" in reg:
            section_id = reg_id
            full_text = reg["regulation_text"]

            split_subs = ComplianceChecker.split_cfr_subsections(
                section_id=section_id,
                full_text=full_text
            )

            final_regs.extend(split_subs)
        else:
            final_regs.append(reg)

    return final_regs


@router.get("/search")
async def search_cfr_regulations(
    query: str = Query(..., min_length=2, description="Search term"),
    title: Optional[int] = Query(None, ge=1, le=50, description="Filter by title"),
    limit: int = Query(50, ge=1, le=200, description="Max results")
):
    """
    Search CFR regulations by text
    
    Example: GET /api/v1/cfr/search?query=encryption&title=45&limit=20
    
    Returns:
        {
            "ok": true,
            "query": "encryption",
            "count": 7,
            "results": [
                {
                    "id": "45-164-164.312",
                    "heading": "Technical safeguards",
                    "section_number": "164.312",
                    "match_type": "text"
                }
            ]
        }
    """
    try:
        results = search_cfr(query, title=title)
        results = results[:limit]
        
        return JSONResponse(content={
            "ok": True,
            "query": query,
            "title_filter": title,
            "count": len(results),
            "results": results
        })
    except Exception as e:
        return JSONResponse(
            content={"ok": False, "error": str(e)},
            status_code=500
        )



@router.get("/audit/{audit_id}/gaps")
async def get_audit_regulation_gaps(audit_id: str):
    """
    Get all regulation gaps for a specific audit
    
    Returns gaps linked to CFR regulations in Neo4j
    
    Example: GET /api/v1/cfr/audit/audit_abc123/gaps
    
    Returns:
        {
            "ok": true,
            "audit_id": "audit_abc123",
            "gap_count": 5,
            "gaps": [
                {
                    "regulation_id": "45-164-164.312",
                    "heading": "Technical safeguards",
                    "risk_rating": "High",
                    "narrative": "Missing encryption...",
                    "compliance_score": 45.2
                }
            ]
        }
    """
    try:
        driver = get_neo4j_driver()
        
        with driver.session() as session:
            result = session.run("""
                MATCH (a:AuditRun {audit_id: $audit_id})
                      -[gap:FOUND_GAP]->
                      (r:Regulation)
                RETURN 
                  r.regulation_id as regulation_id,
                  r.heading as heading,
                  r.section_number as section_number,
                  r.regulation_text as regulation_text,
                  gap.risk_rating as risk_rating,
                  gap.narrative as narrative,
                  gap.compliance_score as compliance_score,
                  gap.evidence_chunk as evidence_chunk
                ORDER BY gap.risk_rating DESC
            """, audit_id=audit_id)
            
            gaps = []
            for record in result:
                gaps.append({
                    "regulation_id": record["regulation_id"],
                    "heading": record["heading"],
                    "section_number": record["section_number"],
                    "regulation_text": record["regulation_text"],
                    "risk_rating": record["risk_rating"],
                    "narrative": record["narrative"],
                    "compliance_score": record["compliance_score"],
                    "evidence_chunk": record["evidence_chunk"]
                })
        
        driver.close()
        
        return JSONResponse(content={
            "ok": True,
            "audit_id": audit_id,
            "gap_count": len(gaps),
            "gaps": gaps
        })
        
    except Exception as e:
        return JSONResponse(
            content={"ok": False, "error": str(e)},
            status_code=500
        )


@router.get("/regulation/{regulation_id}/audits")
async def get_regulation_audit_history(regulation_id: str):
    """
    Get all audits that found gaps in this regulation
    
    Example: GET /api/v1/cfr/regulation/45-164-164.312/audits
    
    Returns:
        {
            "ok": true,
            "regulation_id": "45-164-164.312",
            "audit_count": 3,
            "audits": [
                {
                    "audit_id": "audit_abc",
                    "compliance_score": 45.2,
                    "risk_rating": "High",
                    "created_at": "2025-12-10T10:00:00"
                }
            ]
        }
    """
    try:
        driver = get_neo4j_driver()
        
        with driver.session() as session:
            result = session.run("""
                MATCH (a:AuditRun)-[gap:FOUND_GAP]->(r:Regulation {regulation_id: $regulation_id})
                RETURN 
                  a.audit_id as audit_id,
                  a.compliance_score as compliance_score,
                  a.created_at as created_at,
                  gap.risk_rating as risk_rating,
                  gap.narrative as narrative
                ORDER BY a.created_at DESC
            """, regulation_id=regulation_id)
            
            audits = []
            for record in result:
                audits.append({
                    "audit_id": record["audit_id"],
                    "compliance_score": record["compliance_score"],
                    "created_at": record["created_at"],
                    "risk_rating": record["risk_rating"],
                    "narrative": record["narrative"]
                })
        
        driver.close()
        
        return JSONResponse(content={
            "ok": True,
            "regulation_id": regulation_id,
            "audit_count": len(audits),
            "audits": audits
        })
        
    except Exception as e:
        return JSONResponse(
            content={"ok": False, "error": str(e)},
            status_code=500
        )


@router.get("/department/{department_name}/gaps")
async def get_department_regulation_gaps(department_name: str):
    """
    Get all regulation gaps for a specific department
    
    Example: GET /api/v1/cfr/department/IT Security/gaps
    
    Returns:
        {
            "ok": true,
            "department": "IT Security",
            "gap_count": 8,
            "regulations": [...]
        }
    """
    try:
        driver = get_neo4j_driver()
        
        with driver.session() as session:
            result = session.run("""
                MATCH (d:Department {name: $dept_name})
                      <-[:FLAGGED_DEPT]-(a:AuditRun)
                      -[gap:FOUND_GAP]->(r:Regulation)
                RETURN 
                  r.regulation_id as regulation_id,
                  r.heading as heading,
                  count(gap) as occurrence_count,
                  collect(gap.risk_rating) as risk_ratings,
                  collect(a.audit_id) as audit_ids
                ORDER BY occurrence_count DESC
            """, dept_name=department_name)
            
            regulations = []
            for record in result:
                regulations.append({
                    "regulation_id": record["regulation_id"],
                    "heading": record["heading"],
                    "occurrence_count": record["occurrence_count"],
                    "risk_ratings": record["risk_ratings"],
                    "audit_ids": record["audit_ids"]
                })
        
        driver.close()
        
        return JSONResponse(content={
            "ok": True,
            "department": department_name,
            "gap_count": len(regulations),
            "regulations": regulations
        })
        
    except Exception as e:
        return JSONResponse(
            content={"ok": False, "error": str(e)},
            status_code=500
        )



@router.post("/admin/ingest/title/{title_number}")
async def ingest_title_to_neo4j(title_number: int):
    """
    [ADMIN] Ingest a CFR title into Neo4j
    
    Takes 2-5 minutes per title. Title 45 (HIPAA) recommended.
    
    Example: POST /api/v1/cfr/admin/ingest/title/45
    """
    try:
        if not 1 <= title_number <= 50:
            raise HTTPException(status_code=400, detail="Title number must be 1-50")
        
        result = ingest_cfr_title(title_number)
        
        if result.get("ok"):
            return JSONResponse(content=result)
        else:
            return JSONResponse(content=result, status_code=500)
            
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            content={"ok": False, "error": str(e)},
            status_code=500
        )


@router.post("/admin/ensure-indexes")
async def ensure_indexes():
    """
    [ADMIN] Ensure Neo4j indexes for CFR data
    
    Example: POST /api/v1/cfr/admin/ensure-indexes
    """
    try:
        ensure_cfr_indexes()
        return JSONResponse(content={
            "ok": True,
            "message": "CFR indexes ensured"
        })
    except Exception as e:
        return JSONResponse(
            content={"ok": False, "error": str(e)},
            status_code=500
        )
