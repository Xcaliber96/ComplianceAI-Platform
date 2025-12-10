import os
import json
import requests
from typing import List, Dict

# Folder containing granule JSON files
GRANULE_DIR = "federal_granules"

# Folder to store full text files
FULLTEXT_DIR = "federal_fulltext"
os.makedirs(FULLTEXT_DIR, exist_ok=True)

# Toggle to force re-download of full text files
FORCE_REFRESH = False

import re
from pathlib import Path

FOLDER = "federal_fulltext"  

def read_file(filename):

    import os

    full_path = os.path.join(FOLDER, filename)

    try:
        with open(full_path, "r", errors="ignore") as f:
            return f.read()
    except Exception as e:
        return f"Error reading file: {e}"
    

def load_all_granule_ids() -> List[str]:
    """
    Reads all granule JSON files and extracts granuleIds (document numbers).
    """
    granule_ids = []

    if not os.path.exists(GRANULE_DIR):
        print("[FullText] No granule directory found.")
        return granule_ids

    for filename in os.listdir(GRANULE_DIR):
        if not filename.endswith(".json"):
            continue

        path = os.path.join(GRANULE_DIR, filename)
        try:
            with open(path, "r", encoding="utf-8") as f:
                granules = json.load(f)

            for g in granules:
                gid = g.get("granuleId")
                if gid:
                    granule_ids.append(gid)

        except Exception as e:
            print(f"[FullText] ERROR reading {filename}: {e}")

    return sorted(set(granule_ids))  # deduplicate


def fetch_full_text(doc_number: str) -> str:
    """
    Fetches full text for a Federal Register document using its document number.
    """
    fr_url = f"https://www.federalregister.gov/api/v1/documents/{doc_number}.json"

    try:
        resp = requests.get(fr_url)
        resp.raise_for_status()
        data = resp.json()

        raw_url = data.get("raw_text_url")
        if not raw_url:
            # print(f"[FullText] No raw_text_url for {doc_number}")
            return ""

        text_resp = requests.get(raw_url)
        text_resp.raise_for_status()

        return text_resp.text

    except Exception as e:
        # print(f"[FullText] ERROR fetching full text for {doc_number}: {e}")
        return ""


def save_full_text(doc_number: str, text: str):
    """
    Save full text to disk.
    """
    path = os.path.join(FULLTEXT_DIR, f"{doc_number}.txt")
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


def refresh_full_text_cache():
    """
    Loop through all granules, fetch full text for each, save locally.
    Respects caching unless FORCE_REFRESH=True.
    """
    # print("[FullText] Loading granule IDs...")
    granule_ids = load_all_granule_ids()
    # print(f"[FullText] Found {len(granule_ids)} granule IDs.")

    for doc_number in granule_ids:
        out_path = os.path.join(FULLTEXT_DIR, f"{doc_number}.txt")

        # Skip already cached files
        if os.path.exists(out_path) and not FORCE_REFRESH:
            # print(f"[FullText] {doc_number}: Already cached.")
            continue

        # print(f"[FullText] Fetching {doc_number}...")
        text = fetch_full_text(doc_number)

        if text:
            save_full_text(doc_number, text)
            # print(f"[FullText] Saved → {out_path}")
        else:
            print(f"[FullText] Skipped {doc_number} (no text)")


if __name__ == "__main__":
    print("\n=== BUILDING FULL TEXT CACHE ===\n")
    refresh_full_text_cache()
    print("\n=== DONE ===\n")