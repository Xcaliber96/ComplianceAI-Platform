# src/core/regulations/state_regulations/michigan_storage.py

import os
import json
import time
from typing import Dict, Any, List

from .state_michigan import (
    search_michigan,
    fetch_michigan_rule,
    format_michigan_rule,
)

# Base directory for cached Michigan rules
BASE_DIR = os.path.join("data", "state", "michigan")
RULE_DIR = os.path.join(BASE_DIR, "rules")
INDEX_PATH = os.path.join(BASE_DIR, "index.json")

os.makedirs(RULE_DIR, exist_ok=True)


def _extract_keywords(rule: Dict[str, Any]) -> List[str]:
    text = (
        rule.get("description")
        or rule.get("summary")
        or rule.get("text")
        or ""
    ).lower()

    words = text.split()
    common = {"the", "and", "or", "to", "of", "in", "is", "a"}

    return sorted(list({w for w in words if len(w) > 4 and w not in common}))


def _update_index(rule: Dict[str, Any]) -> None:
    """
    Add / update a rule in index.json.
    """
    index: List[Dict[str, Any]] = []

    if os.path.exists(INDEX_PATH):
        with open(INDEX_PATH, "r", encoding="utf-8") as f:
            index = json.load(f)

    # Remove old entry with same ID
    index = [r for r in index if str(r.get("id")) != str(rule["id"])]

    index.append(
        {
            "id": rule["id"],
            "title": rule.get("title") or rule.get("name"),
            "state": "Michigan",
            "source": "Michigan Administrative Code",
            "keywords": _extract_keywords(rule),
        }
    )

    with open(INDEX_PATH, "w", encoding="utf-8") as f:
        json.dump(index, f, indent=2, ensure_ascii=False)


def save_michigan_rule(rule: Dict[str, Any]) -> None:
    """
    Save a Michigan rule to disk and update the index.
    """
    rule_id = str(rule.get("id"))
    if not rule_id:
        raise ValueError("Rule is missing 'id' field.")

    rule_path = os.path.join(RULE_DIR, f"{rule_id}.json")

    with open(rule_path, "w", encoding="utf-8") as f:
        json.dump(rule, f, indent=2, ensure_ascii=False)

    _update_index(rule)


def load_michigan_rule(rule_id: str) -> Dict[str, Any] | None:
    path = os.path.join(RULE_DIR, f"{rule_id}.json")
    if not os.path.exists(path):
        return None

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_michigan_regulations(max_rules: int = 300, sleep_between: float = 0.5) -> int:
    """
    One-time (or occasional) job to cache Michigan rules locally.

    - Scrapes the index page
    - Fetches up to `max_rules` HTML pages
    - Writes each to JSON under RULE_DIR
    - Updates index.json

    You can run this from the terminal:

      python -c "from src.core.regulations.state_regulations.michigan_storage import save_michigan_regulations; print(save_michigan_regulations(775))"
    """
    # print(f"🔎 Fetching up to {max_rules} Michigan regulations...")

    rows = search_michigan("", limit=max_rules)
    # print(f"Found {len(rows)} index rows to process.")

    saved_count = 0

    for i, row in enumerate(rows, start=1):
        rid = row.get("id")
        url = row.get("url")

        # print(f"→ [{i}/{len(rows)}] Fetching {rid} ...", flush=True)

        try:
            full = fetch_michigan_rule(url)
            formatted = format_michigan_rule(full, rule_id=rid)

            rule_doc = {
                "id": rid,
                "title": formatted["title"],
                "text": formatted["text"],
                "state": "Michigan",
                "source": "Michigan Administrative Code",
            }

            save_michigan_rule(rule_doc)
            saved_count += 1

        except Exception as e:
            print(f"⚠️  Failed on rule {rid}: {e}")

        # be kind to the remote server
        if sleep_between > 0:
            time.sleep(sleep_between)

    # print(f"✅ Saved {saved_count} Michigan rules into: {RULE_DIR}")
    return saved_count


def _normalize_for_frontend(raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    Map stored JSON into the shape your React library expects.
    """
    return {
        "id": str(raw.get("id")),
        "name": raw.get("title") or raw.get("name") or "Unnamed Regulation",
        "code": raw.get("code"),
        "region": "Michigan",
        "category": "State",
        "risk": "Medium",
        "description": raw.get("text") or raw.get("description") or "",
        "source": raw.get("source") or "Michigan Administrative Code",
        "recommended": False,
        "workspace_status": "default",
    }


def search_local_michigan(query: str) -> List[Dict[str, Any]]:
    """
    Search the local index.json + rule files by keyword.
    Returns normalized regulation objects for the frontend.
    """
    if not os.path.exists(INDEX_PATH):
        return []

    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        index = json.load(f)

    q = query.lower().strip()
    if not q:
        matches = index  # return everything
    else:
        matches = [
            row
            for row in index
            if q in (row.get("title") or "").lower()
            or q in " ".join(row.get("keywords") or []).lower()
        ]

    output: List[Dict[str, Any]] = []

    for row in matches:
        raw_rule = load_michigan_rule(row["id"])
        if not raw_rule:
            continue

        output.append(_normalize_for_frontend(raw_rule))

    return output
