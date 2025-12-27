import os
import glob
import json
import xml.etree.ElementTree as ET

# Change these paths to match your machine
INPUT_DIR = r"C:\Users\ammou\Downloads\New folder\ecfr_titles_2025-12-01"
OUTPUT_DIR = r"C:\Users\ammou\Downloads\New folder\ecfr_titles_json"

def ensure_output_dir(path: str) -> None:
    """Create output directory if it does not exist."""
    os.makedirs(path, exist_ok=True)


def extract_text(elem) -> str:
    """
    Extract all text from an XML element, joining child text, and
    normalizing whitespace.
    """
    if elem is None:
        return ""
    text = "".join(elem.itertext())
    # Normalize whitespace: collapse multiple spaces/newlines into single space
    return " ".join(text.split())


def build_section(sec_div: ET.Element, title_number: str, part_number: str) -> dict:
    """
    Build a JSON-ready dict for a SECTION (the actual regulation).
    """
    sec_number = (sec_div.get("N") or "").strip()

    # Full heading as it appears in the XML
    head_el = sec_div.find("HEAD")
    heading_full = extract_text(head_el)

    # Try to derive a shorter heading (without the "§ 1.1" part)
    heading_short = heading_full
    if heading_full.startswith("§"):
        try:
            without_symbol = heading_full.lstrip("§").strip()
            parts = without_symbol.split(None, 1)  # split into [section_number, rest]
            if len(parts) == 2:
                heading_short = parts[1].strip(" .")
        except Exception:
            # If anything goes wrong, just keep heading_full
            heading_short = heading_full

    # Paragraphs inside the section are the actual regulation text
    paragraphs = [extract_text(p) for p in sec_div.findall("P")]

    # Citations at the section level
    citations = [extract_text(c) for c in sec_div.findall("CITA")]

    # Unique ID: TITLE-PART-SECTION
    section_id = f"{title_number}-{part_number}-{sec_number}"

    section_data = {
        "id": section_id,
        "title_number": title_number,
        "part_number": part_number,
        "section_number": sec_number,
        "heading_full": heading_full,
        "heading": heading_short,
        "regulation_text": paragraphs,  # array of paragraphs
        "citations": citations,
    }

    return section_data


def build_part(part_div: ET.Element, title_number: str) -> dict:
    """
    Build a JSON-ready dict for a PART, including its sections.
    """
    part_number = (part_div.get("N") or "").strip()

    # Full part heading, e.g., "PART 1—PRIVACY ACT"
    part_heading_full = extract_text(part_div.find("HEAD"))

    # AUTH and SOURCE blocks (authority, source notes)
    authority_texts = [extract_text(auth) for auth in part_div.findall("AUTH")]
    source_texts = [extract_text(src) for src in part_div.findall("SOURCE")]

    # All sections inside this part
    sections_data = []
    for sec_div in part_div.findall(".//DIV8[@TYPE='SECTION']"):
        section_data = build_section(sec_div, title_number=title_number, part_number=part_number)
        sections_data.append(section_data)

    part_data = {
        "part_number": part_number,
        "part_heading": part_heading_full,
        "authority": authority_texts,
        "source": source_texts,
        "sections": sections_data,
    }

    return part_data


def process_title_file(xml_path: str, output_dir: str) -> None:
    """
    Parse a single ECFR title-XX.xml file and write out a corresponding
    JSON file with the full hierarchy:
        Title -> Chapters -> Parts -> Sections
    """
    print(f"Processing: {xml_path}")

    tree = ET.parse(xml_path)
    root = tree.getroot()

    amendment_date = (root.findtext("AMDDATE") or "").strip()

    # Title DIV1
    title_div = root.find(".//DIV1[@TYPE='TITLE']")
    if title_div is None:
        print(f"  WARNING: No DIV1 TYPE='TITLE' found in {xml_path}")
        return
        
    title_number = (title_div.get("N") or "").strip()
    if not title_number:
        # fallback: extract from filename like "title-11.xml"
        base = os.path.basename(xml_path)
        name, _ = os.path.splitext(base)
        # assumes pattern "title-<number>"
        if "-" in name:
            title_number = name.split("-", 1)[1]
        else:
            title_number = name

    # Title heading text
    title_name = extract_text(title_div.find("HEAD"))

    # Build chapter + part + section hierarchy
    chapters_data = []
    used_part_elements = set()

    # First, process chapters with their parts
    for chap_div in title_div.findall(".//DIV3[@TYPE='CHAPTER']"):
        chapter_id = (chap_div.get("N") or "").strip()
        chapter_heading = extract_text(chap_div.find("HEAD"))

        parts_data = []
        for part_div in chap_div.findall(".//DIV5[@TYPE='PART']"):
            part_data = build_part(part_div, title_number=title_number)
            parts_data.append(part_data)
            used_part_elements.add(part_div)

        if parts_data:
            chapters_data.append(
                {
                    "chapter_id": chapter_id,
                    "chapter_heading": chapter_heading,
                    "parts": parts_data,
                }
            )

    all_part_divs = title_div.findall(".//DIV5[@TYPE='PART']")
    unassigned_parts = []
    for part_div in all_part_divs:
        if part_div not in used_part_elements:
            part_data = build_part(part_div, title_number=title_number)
            unassigned_parts.append(part_data)

    if unassigned_parts:
        chapters_data.append(
            {
                "chapter_id": None,
                "chapter_heading": "UNASSIGNED PARTS",
                "parts": unassigned_parts,
            }
        )

    # Top-level JSON structure for this title
    title_data = {
        "title_number": title_number,
        "title_name": title_name,
        "amendment_date": amendment_date,
        "chapters": chapters_data,
    }

    # Output JSON filename mirrors the XML filename
    base_name = os.path.splitext(os.path.basename(xml_path))[0] + ".json"
    out_path = os.path.join(output_dir, base_name)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(title_data, f, ensure_ascii=False, indent=2)

    print(f"  Wrote: {out_path}")


def main():
    ensure_output_dir(OUTPUT_DIR)

    pattern = os.path.join(INPUT_DIR, "title-*.xml")
    xml_files = sorted(glob.glob(pattern))

    if not xml_files:
        print(f"No XML files found matching {pattern}")
        return

    print(f"Found {len(xml_files)} XML files.")
    for xml_path in xml_files:
        try:
            process_title_file(xml_path, OUTPUT_DIR)
        except Exception as e:
            print(f"ERROR processing {xml_path}: {e}")


if __name__ == "__main__":
    main()
