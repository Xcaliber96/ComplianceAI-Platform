
import os
import json
from typing import Dict, Any, List, Optional
from neo4j import GraphDatabase, basic_auth
from dotenv import load_dotenv
from src.core.regulations.cfr_loader import CFRLoader

load_dotenv()


def get_neo4j_driver():
    """Get Neo4j driver instance"""
    uri = os.getenv("NEO4J_URI")
    user = os.getenv("NEO4J_USER")
    pwd = os.getenv("NEO4J_PASSWORD")
    
    if not uri or not user or not pwd:
        raise RuntimeError("NEO4J_URI / NEO4J_USER / NEO4J_PASSWORD must be set")
    
    return GraphDatabase.driver(uri, auth=basic_auth(user, pwd))


def ingest_cfr_title(title_number: int, batch_size: int = 100) -> Dict[str, Any]:
    """
    Ingest a CFR title into Neo4j
    
    Graph Structure:
    (:Title)-[:HAS_CHAPTER]->(:Chapter)
    (:Chapter)-[:HAS_PART]->(:Part)
    (:Part)-[:HAS_SECTION]->(:Section)
    (:Section)-[:CONTAINS]->(:Regulation)
    
    Args:
        title_number: CFR title number (1-50)
        batch_size: Number of sections to process per batch
        
    Returns:
        Dict with ingestion stats
    """
    loader = CFRLoader()
    title_data = loader.load_title(title_number)
    
    if not title_data:
        return {"ok": False, "error": f"Title {title_number} not found"}
    
    driver = get_neo4j_driver()
    stats = {
        "title": title_number,
        "chapters": 0,
        "parts": 0,
        "sections": 0,
        "skipped_parts": 0
    }
    
    try:
        with driver.session() as session:
            # Create Title node
            session.execute_write(
                _create_title_node,
                title_data
            )
            stats["title"] = title_number
            
            # Process chapters, parts, and sections
            for chapter in title_data.get("chapters", []):
                # Handle null chapter_id
                chapter_id = chapter.get("chapter_id")
                if not chapter_id:
                    chapter_id = f"CHAPTER_{title_number}_UNKNOWN_{stats['chapters']}"
                    chapter["chapter_id"] = chapter_id
                
                session.execute_write(
                    _create_chapter_node,
                    title_number,
                    chapter
                )
                stats["chapters"] += 1
                
                for part in chapter.get("parts", []):
                    # Skip parts without part_number
                    if not part.get("part_number"):
                        stats["skipped_parts"] += 1
                        continue
                    
                    session.execute_write(
                        _create_part_node,
                        title_number,
                        chapter_id,
                        part
                    )
                    stats["parts"] += 1
                    
                    # Batch process sections
                    sections = part.get("sections", [])
                    for i in range(0, len(sections), batch_size):
                        batch = sections[i:i + batch_size]
                        try:
                            session.execute_write(
                                _create_sections_batch,
                                title_number,
                                part["part_number"],
                                batch
                            )
                            stats["sections"] += len(batch)
                        except Exception as e:
                            print(f" Error processing batch {i//batch_size + 1}: {e}")
                            continue
            
            print(f" Ingested Title {title_number}: {stats}")
            return {"ok": True, "stats": stats}
            
    except Exception as e:
        import traceback
        print(f"Error ingesting Title {title_number}: {e}")
        traceback.print_exc()
        return {"ok": False, "error": str(e)}
        
    finally:
        driver.close()


def _create_title_node(tx, title_data: Dict):
    """Create Title node"""
    cypher = """
    MERGE (t:Title {title_number: $title_number})
    SET t.title_name = $title_name,
        t.amendment_date = $amendment_date,
        t.created_at = timestamp()
    RETURN t.title_number
    """
    return tx.run(cypher,
        title_number=title_data.get("title_number"),
        title_name=title_data.get("title_name", ""),
        amendment_date=title_data.get("amendment_date", "")
    ).single()


def _create_chapter_node(tx, title_number: int, chapter: Dict):
    """Create Chapter node and link to Title"""
    
    # Ensure chapter_id is not null
    chapter_id = chapter.get("chapter_id")
    if not chapter_id:
        raise ValueError("chapter_id cannot be null")
    
    chapter_heading = chapter.get("chapter_heading") or "Unknown Chapter"
    
    cypher = """
    MATCH (t:Title {title_number: $title_number})
    MERGE (c:Chapter {
        title_number: $title_number,
        chapter_id: $chapter_id
    })
    SET c.chapter_heading = $chapter_heading,
        c.created_at = timestamp()
    MERGE (t)-[:HAS_CHAPTER]->(c)
    RETURN c.chapter_id
    """
    return tx.run(cypher,
        title_number=str(title_number),
        chapter_id=chapter_id,
        chapter_heading=chapter_heading
    ).single()


def _create_part_node(tx, title_number: int, chapter_id: str, part: Dict):
    """Create Part node and link to Chapter"""
    
    # Ensure required fields
    if not chapter_id:
        raise ValueError("chapter_id cannot be null")
    
    part_number = part.get("part_number")
    if not part_number:
        raise ValueError("part_number cannot be null")
    
    part_heading = part.get("part_heading") or "Unknown Part"
    
    cypher = """
    MATCH (c:Chapter {
        title_number: $title_number,
        chapter_id: $chapter_id
    })
    MERGE (p:Part {
        title_number: $title_number,
        part_number: $part_number
    })
    SET p.part_heading = $part_heading,
        p.chapter_id = $chapter_id,
        p.created_at = timestamp()
    MERGE (c)-[:HAS_PART]->(p)
    RETURN p.part_number
    """
    return tx.run(cypher,
        title_number=str(title_number),
        chapter_id=chapter_id,
        part_number=part_number,
        part_heading=part_heading
    ).single()


def _create_sections_batch(tx, title_number: int, part_number: str, sections: List[Dict]):
    """Create Section nodes in batch"""
    cypher = """
    MATCH (p:Part {
        title_number: $title_number,
        part_number: $part_number
    })
    UNWIND $sections AS section
    MERGE (s:Section {
        id: section.id
    })
    SET s.title_number = $title_number,
        s.part_number = $part_number,
        s.section_number = section.section_number,
        s.heading = section.heading,
        s.heading_full = section.heading_full,
        s.created_at = timestamp()
    MERGE (p)-[:HAS_SECTION]->(s)
    
    // Create Regulation node with full text
    MERGE (r:Regulation {regulation_id: section.id})
    SET r.title_number = $title_number,
        r.part_number = $part_number,
        r.section_number = section.section_number,
        r.heading = section.heading,
        r.regulation_text = section.regulation_text_combined,
        r.citations = section.citations,
        r.created_at = timestamp()
    MERGE (s)-[:CONTAINS]->(r)
    
    RETURN count(s) as section_count
    """
    
    # Prepare section data with validation
    section_data = []
    for s in sections:
        if not s.get("id"):
            continue  # Skip sections without ID
        
        section_data.append({
            "id": s.get("id"),
            "section_number": s.get("section_number", ""),
            "heading": s.get("heading", ""),
            "heading_full": s.get("heading_full", ""),
            "regulation_text_combined": "\n".join(s.get("regulation_text", [])),
            "citations": s.get("citations", [])
        })
    
    if not section_data:
        return None  # No valid sections to process
    
    return tx.run(cypher,
        title_number=str(title_number),
        part_number=part_number,
        sections=section_data
    ).single()


def ingest_specific_regulations(regulation_ids: List[str]) -> Dict[str, Any]:
    """
    Ingest specific regulations by ID
    
    Args:
        regulation_ids: List of regulation IDs (e.g., ["45-164-164.312"])
        
    Returns:
        Dict with ingestion results
    """
    loader = CFRLoader()
    driver = get_neo4j_driver()
    
    results = {"success": [], "failed": []}
    
    try:
        with driver.session() as session:
            for reg_id in regulation_ids:
                # Parse ID
                parts = reg_id.split("-")
                if len(parts) < 3:
                    results["failed"].append({"id": reg_id, "error": "Invalid ID format"})
                    continue
                
                title_num = int(parts[0])
                part_num = parts[1]
                section_num = parts[2]
                
                # Load section data
                section = loader.get_section(title_num, part_num, section_num)
                if not section:
                    results["failed"].append({"id": reg_id, "error": "Not found"})
                    continue
                
                # Ingest to Neo4j
                session.execute_write(
                    _create_regulation_node,
                    section
                )
                results["success"].append(reg_id)
        
        return {"ok": True, "results": results}
        
    except Exception as e:
        return {"ok": False, "error": str(e)}
        
    finally:
        driver.close()


def _create_regulation_node(tx, section: Dict):
    """Create standalone Regulation node"""
    cypher = """
    MERGE (r:Regulation {regulation_id: $regulation_id})
    SET r.title_number = $title_number,
        r.part_number = $part_number,
        r.section_number = $section_number,
        r.heading = $heading,
        r.heading_full = $heading_full,
        r.regulation_text = $regulation_text,
        r.citations = $citations,
        r.created_at = timestamp()
    RETURN r.regulation_id
    """
    
    return tx.run(cypher,
        regulation_id=section.get("id"),
        title_number=section.get("title_number"),
        part_number=section.get("part_number"),
        section_number=section.get("section_number"),
        heading=section.get("heading", ""),
        heading_full=section.get("heading_full", ""),
        regulation_text="\n".join(section.get("regulation_text", [])),
        citations=section.get("citations", [])
    ).single()


def ensure_cfr_indexes():
    """Create indexes for CFR nodes"""
    driver = get_neo4j_driver()
    
    indexes = [
        "CREATE INDEX IF NOT EXISTS FOR (t:Title) ON (t.title_number);",
        "CREATE INDEX IF NOT EXISTS FOR (c:Chapter) ON (c.chapter_id);",
        "CREATE INDEX IF NOT EXISTS FOR (p:Part) ON (p.part_number);",
        "CREATE INDEX IF NOT EXISTS FOR (s:Section) ON (s.id);",
        "CREATE INDEX IF NOT EXISTS FOR (r:Regulation) ON (r.regulation_id);",
        "CREATE INDEX IF NOT EXISTS FOR (r:Regulation) ON (r.section_number);",
    ]
    
    try:
        with driver.session() as session:
            for idx in indexes:
                session.run(idx)
        print(" CFR indexes created")
    except Exception as e:
        print(f" Error creating indexes: {e}")
    finally:
        driver.close()


if __name__ == "__main__":
    # Create indexes first
    ensure_cfr_indexes()
    
    # Ingest Title 45 (HIPAA)
    print("Ingesting Title 45 (HIPAA)...")
    result = ingest_cfr_title(45)
    print(json.dumps(result, indent=2))
