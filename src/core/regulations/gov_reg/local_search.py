import os
import json
from typing import List, Dict

PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../../..")
)

PACKAGE_FILE = os.path.join(PROJECT_ROOT, "data", "federal_packages.json")
GRANULE_DIR = os.path.join(PROJECT_ROOT, "federal_granules")
# # Debug print
# print("ROOT =", PROJECT_ROOT)
# print("PACKAGE_FILE =", PACKAGE_FILE)
# print("GRANULE_DIR =", GRANULE_DIR)
# print("PACKAGE_FILE exists? →", os.path.exists(PACKAGE_FILE))
# print("GRANULE_DIR exists? →", os.path.exists(GRANULE_DIR))


# print("ROOT =", PROJECT_ROOT)
# print("PACKAGE_FILE =", PACKAGE_FILE)
# print("GRANULE_DIR =", GRANULE_DIR)
# print("PACKAGE_FILE exists? →", os.path.exists(PACKAGE_FILE))
# print("GRANULE_DIR exists? →", os.path.exists(GRANULE_DIR))


def get_package_ids() -> List[str]:
    """Return list of cached package IDs like FR-2025-11-25."""
    
    if not os.path.exists(PACKAGE_FILE):
        print("[local_search] No PACKAGE_FILE found:", PACKAGE_FILE)
        return []

    try:
        with open(PACKAGE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            packages = data.get("packages", [])
            return [p["packageId"] for p in packages]
    except Exception as e:
        print("[local_search] Failed reading PACKAGE_FILE:", e)
        return []

def get_package_ids():
    """Return list of cached package IDs like FR-2025-11-25."""
    if not os.path.exists(PACKAGE_FILE):
        return []

    try:
        with open(PACKAGE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            packages = data.get("packages", [])
            return [p["packageId"] for p in packages]
    except Exception as e:
        print(f"[Error] Failed to read package list: {e}")
        return []


def load_all_granules() -> List[Dict]:
    """Loads all granule JSON files into memory."""
    granules = []

    if not os.path.exists(GRANULE_DIR):
        return granules

    for filename in os.listdir(GRANULE_DIR):
        if not filename.endswith(".json"):
            continue

        path = os.path.join(GRANULE_DIR, filename)

        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                granules.extend(data)
        except Exception as e:
            print(f"[Error] Could not read {filename}: {e}")

    return granules


def load_granules_for_package(package_id: str):
    """Load granules belonging to a single package ID."""
    filename = f"{package_id}.json"
    path = os.path.join(GRANULE_DIR, filename)

    if not os.path.exists(path):
        return []

    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[Error] Could not load granules for {package_id}: {e}")
        return []


def search_granules_in_package(package_id: str, topic: str):
    topic = topic.lower().strip()
    granules = load_granules_for_package(package_id)

    results = []

    for g in granules:
        title = g.get("title", "").lower()
        summary = g.get("summary", "").lower()
        details = g.get("details", "").lower()

        if topic in title or topic in summary or topic in details:
            results.append(g)

    return results


def search_local_granules(topic: str):
    topic = topic.lower().strip()

    results = []

    for package_id in get_package_ids():
        granules = load_granules_for_package(package_id)

        for g in granules:
            if (topic in g.get("title", "").lower()
                or topic in g.get("summary", "").lower()
                or topic in g.get("details", "").lower()):
                results.append(g)

    return results
