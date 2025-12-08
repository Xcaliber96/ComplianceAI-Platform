from src.core.regulations.state_regulations.state_michigan import (
    search_michigan,
    fetch_michigan_rule,
    fetch_rule_by_number,
    is_michigan_rule_number,
    format_michigan_rule,
)

from uuid import uuid4
import re
def search_state_regulations(state: str, query: str):
    state = state.lower().strip()
    query = (query or "").strip()

    if state not in ("michigan", "mi"):
        return [{"error": f"State '{state}' not supported."}]


    try_rule_number = False
    if is_michigan_rule_number(query):
 
        if "-" in query:
            try_rule_number = True
        else:
            try_rule_number = True

        try:
            results = handle_rule_number(query)  # your existing function
           
            if isinstance(results, list) and results:
                return results
        except Exception as e:
            # Don't kill the request, just log and fall back
            print(f"[Michigan] rule-number handler failed for '{query}': {e}")

    rows = search_michigan(query)
    output = []
    for row in rows:
        output.append({
            "id": row["id"],
            "name": row["title"],
            "code": extract_code_from_title(row["title"]),  # your helper
            "region": "Michigan",
            "category": "Administrative Code",
            "risk": None,
            "description": row["title"],
            "source": "Michigan Administrative Code",
        })
    return output

def extract_code_from_title(title: str) -> str | None:
    """
    Extracts something like:
    R 141.1
    R 141.11 - R 141.25
    R 205.401
    R 205.401 – R 205.416
    from the Michigan search result title text.
    """
    if not title:
        return None

    # Match "R 141.1" or "R141.1"
    matches = re.findall(r"R\s*\d+\.\d+", title)

    if not matches:
        return None

    if len(matches) == 1:
        return matches[0].replace("  ", " ").strip()

    # If multiple → return range
    first = matches[0].replace("  ", " ").strip()
    last = matches[-1].replace("  ", " ").strip()
    return f"{first}-{last}"

    
def clean_text_block(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"Courtesy of.*$", "", text, flags=re.IGNORECASE)
    return (
        text.replace("\u2013", "-")
            .replace("\u2014", "-")
            .replace("\u2026", "...")
    )


def extract_rule_range(raw_text: str) -> str | None:
    """
    Extract rule number range ONLY from the header (first 30 lines),
    so internal citations do not break the code.
    """
    if not raw_text:
        return None

    # Look only at the top of the document where the rule title appears
    header = "\n".join(raw_text.splitlines()[:30])

    matches = re.findall(r"R\s*\d+\.\d+", header)
    matches = [m.strip() for m in matches]

    if not matches:
        return None

    # if header shows only one rule, return that
    if len(matches) == 1:
        return matches[0]

    # otherwise return first-last
    return f"{matches[0]}-{matches[-1]}"


def extract_subtitle(raw_text: str, title: str) -> str | None:
    lines = [ln.strip() for ln in raw_text.splitlines() if ln.strip()]
    for ln in lines:
        if ln.upper() == ln and ln != title and 3 <= len(ln.split()) <= 8:
            return ln.title()
    return None


def normalize_regulation(pkg: dict) -> dict:
    if not pkg or "text" not in pkg:
        raise ValueError("Invalid Michigan package format.")

    raw_text = pkg.get("text", "")
    title = (pkg.get("title") or "").strip()

    code = extract_rule_range(raw_text)
    subtitle = extract_subtitle(raw_text, title)

    if title and subtitle:
        name = f"{title} - {subtitle}"
    else:
        name = title or subtitle or "Michigan Administrative Rule"

    clean_text = clean_text_block(raw_text)
    description = clean_text[:300].rstrip() + ("..." if len(clean_text) > 300 else "")

    return {
        "id": pkg.get("id"),
        "name": name,
        "code": code,
        "region": "Michigan",
        "category": "Administrative Code",
        "risk": None,
        "description": description,
        "source": "Michigan Administrative Code",
    }
