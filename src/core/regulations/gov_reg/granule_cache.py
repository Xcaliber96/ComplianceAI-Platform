# src/core/regulations/gov_reg/granule_cache.py

import os
import json
import requests
from typing import List, Dict
from src.core.regulations.gov_reg.package_cache import get_cached_packages
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GOVINFO_API_KEY")

GRANULE_DIR = "federal_granules"
os.makedirs(GRANULE_DIR, exist_ok=True)

def fetch_granules_for_package(package_id: str, granules_link: str) -> List[Dict]:
    """
    Fetch all granules for a package using its granulesLink.
    Saves as: federal_granules/{package_id}.json
    """

    # print(f"[Granules] Fetching granules for {package_id}...")

    # Build URL with API key
    if "?" in granules_link:
        url = f"{granules_link}&api_key={API_KEY}"
    else:
        url = f"{granules_link}?api_key={API_KEY}"

    try:
        resp = requests.get(url)
        resp.raise_for_status()
        data = resp.json()
        granules = data.get("granules", [])

        # Save to file
        path = os.path.join(GRANULE_DIR, f"{package_id}.json")
        with open(path, "w") as f:
            json.dump(granules, f, indent=2)

        print(f"[Granules] Saved {len(granules)} granules → {path}")
        return granules

    except Exception as e:
        print(f"[Granules ERROR] {package_id}: {e}")
        return []


def load_local_granules(package_id: str) -> List[Dict]:
    """Loads granules from disk if already saved."""
    path = os.path.join(GRANULE_DIR, f"{package_id}.json")
    if not os.path.exists(path):
        return []

    with open(path, "r") as f:
        return json.load(f)


def refresh_granule_cache():
    """
    Fetch granules for ALL cached packages (from the 7-day system).
    """
    packages = get_cached_packages()
    print(f"[Granules] Refreshing granule cache for {len(packages)} packages...")

    for pkg in packages:
        package_id = pkg.get("packageId")
        granules_link = pkg.get("granulesLink")
        FORCE_REFRESH = False
        if not package_id or not granules_link:
            continue

        # Avoid downloading duplicates
        existing = load_local_granules(package_id)
        if existing and FORCE_REFRESH:
            print(f"[Granules] {package_id}: Already cached ({len(existing)})")
            continue

        fetch_granules_for_package(package_id, granules_link)

    print("[Granules] Granule cache refresh complete.")

if __name__ == "__main__":
    print("\n=== TESTING GRANULE CACHE EXTRACTION ===\n")
    refresh_granule_cache()
    print("\n=== DONE ===\n")
    
