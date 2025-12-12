
import json
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from functools import lru_cache

# Path to CFR JSON files
CFR_DATA_DIR = Path(__file__).parent.parent.parent.parent / "cfr_data" / "ecfr_titles_json"


class CFRLoader:
    """Load and search CFR regulations from JSON files"""
    
    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or CFR_DATA_DIR
        if not self.data_dir.exists():
            raise FileNotFoundError(f"CFR data directory not found: {self.data_dir}")
    
    @lru_cache(maxsize=10)
    def load_title(self, title_number: int) -> Optional[Dict[str, Any]]:
        """
        Load a specific CFR title from JSON
        
        Args:
            title_number: Title number (1-50)
            
        Returns:
            Dict with title data or None if not found
        """
        file_path = self.data_dir / f"title-{title_number}.json"
        
        if not file_path.exists():
            print(f"⚠️ Title {title_number} not found")
            return None
        
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"❌ Error loading Title {title_number}: {e}")
            return None
    
    def list_all_titles(self) -> List[Dict[str, Any]]:
        """
        List all available CFR titles
        
        Returns:
            List of dicts with title metadata
        """
        titles = []
        for i in range(1, 51):
            title_data = self.load_title(i)
            if title_data:
                titles.append({
                    "title_number": title_data.get("title_number"),
                    "title_name": title_data.get("title_name"),
                    "amendment_date": title_data.get("amendment_date"),
                    "chapter_count": len(title_data.get("chapters", []))
                })
        return titles
    
    def get_parts(self, title_number: int) -> List[Dict[str, Any]]:
        """
        Get all parts in a title
        
        Args:
            title_number: Title number
            
        Returns:
            List of parts with metadata
        """
        title_data = self.load_title(title_number)
        if not title_data:
            return []
        
        parts = []
        for chapter in title_data.get("chapters", []):
            for part in chapter.get("parts", []):
                parts.append({
                    "part_number": part.get("part_number"),
                    "part_heading": part.get("part_heading"),
                    "chapter_id": chapter.get("chapter_id"),
                    "section_count": len(part.get("sections", []))
                })
        return parts
    
    def get_section(self, title_number: int, part_number: str, 
                   section_number: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific regulation section
        
        Args:
            title_number: Title number
            part_number: Part number
            section_number: Section number (e.g., "164.312")
            
        Returns:
            Section data with regulation text
        """
        title_data = self.load_title(title_number)
        if not title_data:
            return None
        
        for chapter in title_data.get("chapters", []):
            for part in chapter.get("parts", []):
                if part.get("part_number") == part_number:
                    for section in part.get("sections", []):
                        if section.get("section_number") == section_number:
                            return section
        
        return None
    
    def search_regulations(self, query: str, title_number: Optional[int] = None,
                          limit: int = 50) -> List[Dict[str, Any]]:
        """
        Search regulations by text
        
        Args:
            query: Search term
            title_number: Optional title to limit search
            limit: Max results
            
        Returns:
            List of matching sections
        """
        query_lower = query.lower()
        results = []
        
        # Search specific title or all titles
        titles_to_search = [title_number] if title_number else range(1, 51)
        
        for t_num in titles_to_search:
            title_data = self.load_title(t_num)
            if not title_data:
                continue
            
            for chapter in title_data.get("chapters", []):
                for part in chapter.get("parts", []):
                    for section in part.get("sections", []):
                        # Search in heading and regulation text
                        heading = section.get("heading", "").lower()
                        reg_text = " ".join(section.get("regulation_text", [])).lower()
                        
                        if query_lower in heading or query_lower in reg_text:
                            results.append({
                                "id": section.get("id"),
                                "title_number": t_num,
                                "part_number": part.get("part_number"),
                                "section_number": section.get("section_number"),
                                "heading": section.get("heading"),
                                "heading_full": section.get("heading_full"),
                                "match_type": "heading" if query_lower in heading else "text"
                            })
                            
                            if len(results) >= limit:
                                return results
        
        return results
    
    def get_regulation_by_id(self, reg_id: str) -> Optional[Dict[str, Any]]:
        """
        Get regulation by ID (e.g., "45-164-164.312")
        
        Args:
            reg_id: Regulation ID in format "title-part-section"
            
        Returns:
            Section data
        """
        parts = reg_id.split("-")
        if len(parts) < 3:
            return None
        
        title_num = int(parts[0])
        part_num = parts[1]
        section_num = parts[2]
        
        return self.get_section(title_num, part_num, section_num)


# Global instance
cfr_loader = CFRLoader()


# Convenience functions
def load_title(title_number: int) -> Optional[Dict]:
    """Load a CFR title"""
    return cfr_loader.load_title(title_number)


def search_cfr(query: str, title: Optional[int] = None) -> List[Dict]:
    """Search CFR regulations"""
    return cfr_loader.search_regulations(query, title)


def get_regulation(reg_id: str) -> Optional[Dict]:
    """Get regulation by ID"""
    return cfr_loader.get_regulation_by_id(reg_id)
