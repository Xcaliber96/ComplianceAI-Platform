import json
import os

JSON_DIR = r"C:\Users\ammou\Downloads\cfr_data\ecfr_titles_json"

# Storage for user-selected regulations
selected_regulations = []


def load_title_json(title_number):
    """Load the JSON file for a given title."""
    file_path = os.path.join(JSON_DIR, f"title-{title_number}.json")
    if not os.path.exists(file_path):
        print(f"ERROR: Title {title_number} does not exist.")
        return None
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def list_parts(title_data):
    """Return a flat list of all parts in all chapters."""
    parts = []
    for chapter in title_data.get("chapters", []):
        for part in chapter.get("parts", []):
            parts.append(part)
    return parts


def list_sections(part):
    """Return the list of sections inside a part."""
    return part.get("sections", [])


def choose_title():
    """User chooses a Title number."""
    while True:
        try:
            t = int(input("Enter Title number (1–50): "))
            if 1 <= t <= 50:
                return t
            print("Invalid title number.")
        except ValueError:
            print("Please enter a valid number.")


def choose_part(parts):
    """User chooses Part number."""
    print("\nAvailable Parts:")
    for p in parts:
        print(f"  Part {p['part_number']}: {p.get('part_heading', '')}")

    while True:
        part_num = input("\nEnter Part number: ").strip()
        for p in parts:
            if p["part_number"] == part_num:
                return p
        print("Invalid part number. Try again.")


def choose_section(sections):
    """User chooses Section number."""
    print("\nAvailable Sections:")
    for s in sections:
        print(f"  § {s['section_number']}: {s['heading']}")

    while True:
        section_num = input("\nEnter Section number (e.g., 1.1): ").strip()
        for s in sections:
            if s["section_number"] == section_num:
                return s
        print("Invalid section number. Try again.")


def show_section(section):
    """Display full regulation text."""
    print("\n======================")
    print(f"SECTION {section['section_number']}: {section['heading']}")
    print("======================\n")

    for para in section["regulation_text"]:
        print(para)
        print()

    if section["citations"]:
        print("CITATIONS:")
        for c in section["citations"]:
            print(" -", c)


def ask_add(section):
    """Ask user if they want to save this regulation."""
    choice = input("\nAdd this regulation to your collection? (y/n): ").lower().strip()
    if choice == "y":
        selected_regulations.append(section)
        print("Added to your collection.\n")
    else:
        print("Not added.\n")


def main():
    while True:
        print("\n=== ECFR Regulation Browser ===")

        # Step 1: Choose Title
        title_number = choose_title()
        title_data = load_title_json(title_number)
        if title_data is None:
            continue

        print(f"\nYou selected:")
        print(f"Title {title_data['title_number']} — {title_data['title_name']}\n")

        # Step 3: Show Parts for this Title
        parts = list_parts(title_data)

        if not parts:
            print("No parts found for this title.")
            continue

        part = choose_part(parts)

        # Step 3: Show Sections for this Part
        sections = list_sections(part)
        section = choose_section(sections)

        # Step 4: Display Regulation
        show_section(section)

        # Step 5: Ask to Add to collection
        ask_add(section)

        # Continue?
        again = input("Browse another regulation? (y/n): ").lower().strip()
        if again != "y":
            break

    # At exit, show selected items
    print("\nYour selected regulations:")
    for s in selected_regulations:
        print(f" - {s['id']}: {s['heading']}")

    print("\nDone.")


if __name__ == "__main__":
    main()
