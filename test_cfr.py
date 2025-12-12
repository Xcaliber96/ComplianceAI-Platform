from src.core.regulations.cfr_loader import CFRLoader, search_cfr

def test_load_title():
    """Test loading Title 45 (HIPAA)"""
    loader = CFRLoader()
    
    print("🔍 Loading Title 45 (HIPAA)...")
    title_data = loader.load_title(45)
    
    if title_data:
        print(f" Loaded: {title_data.get('title_name')}")
        print(f"   Chapters: {len(title_data.get('chapters', []))}")
        print()
    else:
        print("Failed to load Title 45")
        return
    
    # Get parts
    print(" Parts in Title 45:")
    parts = loader.get_parts(45)
    for part in parts[:5]:  # Show first 5
        print(f"   Part {part['part_number']}: {part['part_heading']}")
    print(f"   ... {len(parts)} total parts\n")
    
    # Get specific section (HIPAA encryption requirement)
    print(" Getting §164.312 (Technical safeguards)...")
    section = loader.get_section(45, "164", "164.312")
    
    if section:
        print(f" Found: {section['heading_full']}")
        print(f"   Regulation text paragraphs: {len(section.get('regulation_text', []))}")
        print(f"   First paragraph:")
        print(f"   {section['regulation_text'][0][:200]}...")
        print()
    
    # Search test
    print(" Searching for 'encryption'...")
    results = search_cfr("encryption", title=45)
    print(f" Found {len(results)} results")
    for r in results[:3]:
        print(f"   {r['id']}: {r['heading']}")


if __name__ == "__main__":
    test_load_title()
