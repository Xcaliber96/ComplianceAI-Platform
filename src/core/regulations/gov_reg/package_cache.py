import json
import os
import datetime
from typing import List, Dict
from src.core.regulations.gov_reg.summary import get_package_summary

CACHE_FILE = "data/federal_packages.json"

PACKAGE_CACHE: List[Dict] = []
LAST_REFRESH = None
CACHE_EXPIRY_HOURS = 24  # rebuild daily

def save_cache_to_file():
    """Save cache to local disk as JSON."""
    os.makedirs("data", exist_ok=True)

    payload = {
        "last_refresh": LAST_REFRESH.isoformat() if LAST_REFRESH else None,
        "packages": PACKAGE_CACHE,
    }

    with open(CACHE_FILE, "w") as f:
        json.dump(payload, f, indent=2)

    print(f"[PackageCache] Saved {len(PACKAGE_CACHE)} packages to disk.")


def load_cache_from_file() -> bool:
    """Load cache from disk if available."""
    global PACKAGE_CACHE, LAST_REFRESH

    if not os.path.exists(CACHE_FILE):
        return False

    try:
        with open(CACHE_FILE, "r") as f:
            data = json.load(f)

        PACKAGE_CACHE = data.get("packages", [])
        last = data.get("last_refresh")

        if last:
            LAST_REFRESH = datetime.datetime.fromisoformat(last)

        print(f"[PackageCache] Loaded {len(PACKAGE_CACHE)} packages from disk.")
        return True

    except Exception as e:
        print("[PackageCache] Failed to load cache:", e)
        return False

def build_last_7_days_packages() -> List[Dict]:
    today = datetime.date.today()
    packages = []

    for i in range(7):
        day = today - datetime.timedelta(days=i)
        package_id = f"FR-{day.year}-{day.month:02d}-{day.day:02d}"

        try:
            summary = get_package_summary(package_id)
            if summary:
                packages.append(summary)
        except Exception:
            continue

    return packages

def refresh_package_cache():
    global PACKAGE_CACHE, LAST_REFRESH

    print("[PackageCache] Refreshing Federal Register packages (7-day window)...")

    PACKAGE_CACHE = build_last_7_days_packages()
    LAST_REFRESH = datetime.datetime.now()

    save_cache_to_file()

    print(f"[PackageCache] Refreshed {len(PACKAGE_CACHE)} packages at {LAST_REFRESH}")

def get_cached_packages() -> List[Dict]:
    global LAST_REFRESH

    # 1) Load from disk if in-memory cache is empty
    if not PACKAGE_CACHE:
        loaded = load_cache_from_file()
        if loaded:
            # Check expiry
            if LAST_REFRESH and (
                datetime.datetime.now() - LAST_REFRESH
            ) < datetime.timedelta(hours=CACHE_EXPIRY_HOURS):
                return PACKAGE_CACHE

    # 2) If stale or missing → rebuild
    refresh_package_cache()

    return PACKAGE_CACHE

if __name__ == "__main__":
    refresh_package_cache()