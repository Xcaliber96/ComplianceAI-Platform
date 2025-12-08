import json
import logging
from src.core.client import safe_chat_completion
import os
from difflib import SequenceMatcher

from src.core.client import safe_chat_completion

logger = logging.getLogger(__name__)
logger.addHandler(logging.NullHandler())

PROMPT = """
You are a compliance metadata extractor.
Return STRICT JSON ONLY. NO comments, no explanations.

Your output MUST follow exactly this structure:

{{
  "mandatory_metadata": {{
    "document_type": null,
    "category": null,
    "regulated_under": [],
    "company_names": [],
    "supplier_name": null,
    "address": null,
    "country": null,
    "jurisdiction": null,
    "industry": null,
    "department_owner": null,
    "contact_email": null,
    "effective_date": null,
    "last_updated": null,
    "contract_expiration": null
  }},

  "compliance_clauses": {{
    "data_retention": null,
    "incident_response": null,
    "access_control": null,
    "encryption": null,
    "data_sharing": null,
    "consent": null,
    "children_data": null,
    "data_transfer": null
  }},

  "risks_obligations": {{
    "risk_keywords": [],
    "risk_summary": null,
    "regulations_mentioned": [],
    "frameworks_mentioned": [],
    "obligations": []
  }},

  "enforcement_deadlines": {{
    "review_cycle": null,
    "renewal_date": null,
    "audit_due": null,
    "events": []
  }}
}}

Document excerpt:
---
{excerpt}
---
"""


def extract_document_metadata(text: str, excerpt_len: int = 15000):
    excerpt = text[:excerpt_len]

    messages = [
        {"role": "system", "content": "Return STRICT JSON only. No commentary."},
        {"role": "user", "content": PROMPT.format(excerpt=excerpt)}
    ]

    resp = safe_chat_completion(
        messages,
        model="gpt-4o-mini",
        temperature=0,
        max_tokens=1400
    )

    raw = resp.get("text", "").strip()

    # Attempt direct JSON parse
    try:
        return {"ok": True, "metadata": json.loads(raw)}
    except:
        pass

    # Try extracting substring JSON
    s = raw.find("{")
    e = raw.rfind("}")
    if s != -1 and e != -1:
        try:
            cleaned = raw[s:e+1]
            return {"ok": True, "metadata": json.loads(cleaned)}
        except:
            logger.exception("JSON substring extraction failed")

    return {
        "ok": False,
        "error": "Could not parse JSON",
        "raw": raw
    }


SAMPLE_REG_PATH = "sample_regulations.json"

def load_regulation_library():
    if not os.path.exists(SAMPLE_REG_PATH):
        print("⚠ sample_regulations.json not found.")
        return []
    with open(SAMPLE_REG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

REG_LIBRARY = load_regulation_library()

def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def extract_regulation(text: str):
    """
    Matches your document text against all regulations in sample_regulations.json.
    """
    text_lower = text.lower()
    matches = []

    for entry in REG_LIBRARY:

        reg_id = entry.get("id", "")
        reg_type = entry.get("regulation_type", "")
        title = entry.get("title", "")
        body = entry.get("text", "")

        # Direct keyword match
        if reg_type.lower() in text_lower or title.lower() in text_lower:
            matches.append({
                "id": reg_id,
                "regulation_type": reg_type,
                "title": title,
                "confidence": 0.85,
                "match_type": "keyword"
            })
            continue

        # Fuzzy match
        score = similarity(body[:200], text[:3000])
        if score > 0.55:
            matches.append({
                "id": reg_id,
                "regulation_type": reg_type,
                "title": title,
                "confidence": round(score, 2),
                "match_type": "fuzzy"
            })

    return {"regulations": matches}

def run_full_extraction(text: str):
    """Runs metadata + regulation extraction."""

    meta = extract_document_metadata(text)
    if not meta.get("ok"):
        return None

    regs = extract_regulation(text)

    result = meta["metadata"]
    result["regulations"] = regs["regulations"]  # attach regulation matches

    return result

    