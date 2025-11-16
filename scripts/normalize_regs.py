import json
import os
from pathlib import Path

SRC = Path("sample_regulations.json")   # adjust path if needed
OUT = Path("sample_regulations.cleaned.json")

# canonical keys we want
KEYS = ["Reg_ID", "Requirement_Text", "Risk_Rating", "Target_Area", "Dow_Focus"]

# candidate fallback keys mapping
FALLBACKS = {
    "Reg_ID": ["reg_id", "id", "RegId"],
    "Requirement_Text": ["requirement_text", "text", "requirement", "Requirement"],
    "Risk_Rating": ["risk_rating", "risk", "Risk"],
    "Target_Area": ["target_area", "target", "TargetArea"],
    "Dow_Focus": ["dow_focus", "dow", "DowFocus"]
}

def guess_field(obj, key):
    # return first matching candidate or None
    for k in FALLBACKS.get(key, []):
        if k in obj and obj[k] not in (None, ""):
            return obj[k]
    if key in obj and obj[key] not in (None, ""):
        return obj[key]
    return None

def normalize_item(it):
    out = {}
    # copy canonical fields
    for k in KEYS:
        out[k] = guess_field(it, k)
    # keep any extra fields for traceability
    for k, v in it.items():
        if k not in out:
            out[k] = v
    return out

def main():
    if not SRC.exists():
        print("ERROR: sample_regulations.json not found at", SRC.resolve())
        return
    with open(SRC, "r", encoding="utf-8") as f:
        regs = json.load(f)
    if not isinstance(regs, list):
        # try common wrapper
        if isinstance(regs, dict) and "regulations" in regs:
            regs = regs["regulations"]
        else:
            print("ERROR: Unexpected JSON shape. Expecting a list of regulations.")
            print("Top-level keys:", list(regs.keys()) if isinstance(regs, dict) else "N/A")
            return

    cleaned = []
    missing_count = 0
    for i, r in enumerate(regs):
        c = normalize_item(r)
        if not c.get("Requirement_Text") and not c.get("Reg_ID"):
            missing_count += 1
            print(f"WARNING: reg #{i} likely invalid (no id/text): {r}")
        cleaned.append(c)

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(cleaned, f, indent=2, ensure_ascii=False)

    print(f"Wrote cleaned regs -> {OUT} ({len(cleaned)} items). Missing entries: {missing_count}")

if __name__ == "__main__":
    main()