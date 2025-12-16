from src.api.audit_ingest import upsert_audit_to_neo4j
import json

def test_audit_save():
    """Test saving an audit to Neo4j"""
    
    print(" Testing Neo4j Audit Save...\n")
    
    #  Use the EXACT format from Neo4j
    test_results = [
        {
            "Reg_ID": "45-164-164.312",  #  Matches Neo4j regulation_id
            "Is_Compliant": False,
            "Compliance_Score": 45.2,
            "Risk_Rating": "High",
            "Narrative_Gap": "Missing encryption requirements for ePHI",
            "Evidence_Chunk": "Policy lacks encryption requirements",
            "Target_Area": "IT Security"
        },
        {
            "Reg_ID": "45-164-164.308",
            "Is_Compliant": True,
            "Compliance_Score": 95.0,
            "Risk_Rating": "Low",
            "Narrative_Gap": "",
            "Evidence_Chunk": "Policy meets requirements",
            "Target_Area": "Administration"
        }
    ]
    
    test_summary = {
        "high_risk_gaps": 1,
        "total_gaps": 1,
        "compliance_score": 70.1
    }
    
    result = upsert_audit_to_neo4j(
        user_uid="test_user",
        file_id="test_file_123",
        supplier_id="test_supplier_abc",
        results=test_results,
        summary=test_summary,
        metadata={"test": True}
    )
    
    print(" Result:")
    print(json.dumps(result, indent=2))
    
    if result.get("ok"):
        print("\n SUCCESS!")
        print(f"   Audit ID: {result.get('audit_id')}")
        print(f"   Compliance Score: {result.get('compliance_score')}%")
        print(f"   Gaps Found: {result.get('gap_count')}")
        print(f"   Gap Links Created: {result.get('gap_links_created')}")
        print(f"   Departments Flagged: {result.get('departments_flagged')}")
    else:
        print("\n FAILED!")
        print(f"   Error: {result.get('error')}")
    
    return result

if __name__ == "__main__":
    test_audit_save()

