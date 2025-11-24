# llm/metadata_extractor.py
import json
import logging
from src.core.client import safe_chat_completion


logger = logging.getLogger(__name__)
logger.addHandler(logging.NullHandler())

_EXTRACTION_PROMPT = """
You are a compliance document metadata extractor. Return ONLY valid JSON (no commentary).
Extract these top-level keys (use null or empty structures when not present):
document_type, category, regulated_under, company_names, supplier_name,
competitors, address, country, jurisdiction, industry,
department_owner, contact_email, effective_date, last_updated, contract_expiration,
key_clauses, risk_keywords, summary_short, summary_bullets, risk_summary,
regulations_mentioned, frameworks_mentioned

key_clauses should be an object with:
data_retention, incident_response, access_control, encryption, data_sharing, consent, children_data, data_transfer

Return ISO dates when possible.
Document text:
---
{excerpt}
---
"""

def extract_document_metadata(text: str, excerpt_len: int = 15000):
    excerpt = text[:excerpt_len]
    prompt = _EXTRACTION_PROMPT.format(excerpt=excerpt)
    messages = [
        {"role": "system", "content": "You are a strict JSON-only metadata extractor for compliance documents."},
        {"role": "user", "content": prompt},
    ]
    resp = safe_chat_completion(messages, model="gpt-4o-mini", temperature=0, max_tokens=1200)
    if not resp.get("ok"):
        return {"ok": False, "error": resp.get("error")}

    raw = resp["text"].strip()
    # Try to parse; if fails, try extracting JSON substring
    try:
        parsed = json.loads(raw)
        return {"ok": True, "metadata": parsed}
    except json.JSONDecodeError:
        s = raw.find("{")
        e = raw.rfind("}")
        if s != -1 and e != -1 and e > s:
            maybe = raw[s:e+1]
            try:
                parsed = json.loads(maybe)
                return {"ok": True, "metadata": parsed, "note": "extracted_json_substring"}
            except Exception as ex:
                logger.exception("Failed to parse JSON substring: %s", ex)
        return {"ok": False, "error": "Could not parse JSON", "raw": raw}
