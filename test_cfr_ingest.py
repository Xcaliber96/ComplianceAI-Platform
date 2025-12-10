
from src.core.regulations.cfr_neo4j_ingest import (
    ensure_cfr_indexes,
    ingest_cfr_title,
    ingest_specific_regulations
)

def test_ingest_hipaa():
    """Test ingesting HIPAA regulations"""
    
    # Create indexes
    print(" Creating Neo4j indexes...")
    ensure_cfr_indexes()
    
    # Ingest Title 45 (HIPAA)
    print("\n Ingesting Title 45 (HIPAA)...")
    print(" This may take a few minutes...")
    
    result = ingest_cfr_title(45)
    
    if result.get("ok"):
        print("\n Success!")
        print(f"   Stats: {result.get('stats')}")
    else:
        print(f"\n Failed: {result.get('error')}")

if __name__ == "__main__":
    test_ingest_hipaa()
