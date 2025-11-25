# # llm/metadata_extractor.py
# import json
# import logging
# from src.core.client import safe_chat_completion


# logger = logging.getLogger(__name__)
# logger.addHandler(logging.NullHandler())

# # _EXTRACTION_PROMPT = """
# # You are a compliance document metadata extractor. Return ONLY valid JSON (no commentary).
# # Extract these top-level keys (use null or empty structures when not present):
# # document_type, category, regulated_under, company_names, supplier_name,
# # competitors, address, country, jurisdiction, industry,
# # department_owner, contact_email, effective_date, last_updated, contract_expiration,
# # key_clauses, risk_keywords, summary_short, summary_bullets, risk_summary,
# # regulations_mentioned, frameworks_mentioned

# # key_clauses should be an object with:
# # data_retention, incident_response, access_control, encryption, data_sharing, consent, children_data, data_transfer

# # Return ISO dates when possible.
# # Document text:
# # ---
# # {excerpt}
# # ---
# # """

# # def extract_document_metadata(text: str, excerpt_len: int = 15000):
# #     excerpt = text[:excerpt_len]
# #     prompt = _EXTRACTION_PROMPT.format(excerpt=excerpt)
# #     messages = [
# #         {"role": "system", "content": "You are a strict JSON-only metadata extractor for compliance documents."},
# #         {"role": "user", "content": prompt},
# #     ]
# #     resp = safe_chat_completion(messages, model="gpt-4o-mini", temperature=0, max_tokens=1200)
# #     if not resp.get("ok"):
# #         return {"ok": False, "error": resp.get("error")}

# #     raw = resp["text"].strip()
# #     # Try to parse; if fails, try extracting JSON substring
# #     try:
# #         parsed = json.loads(raw)
# #         return {"ok": True, "metadata": parsed}
# #     except json.JSONDecodeError:
# #         s = raw.find("{")
# #         e = raw.rfind("}")
# #         if s != -1 and e != -1 and e > s:
# #             maybe = raw[s:e+1]
# #             try:
# #                 parsed = json.loads(maybe)
# #                 return {"ok": True, "metadata": parsed, "note": "extracted_json_substring"}
# #             except Exception as ex:
# #                 logger.exception("Failed to parse JSON substring: %s", ex)
# #         return {"ok": False, "error": "Could not parse JSON", "raw": raw}

# import json
# import logging
# from src.core.client import safe_chat_completion

# logger = logging.getLogger(__name__)
# logger.addHandler(logging.NullHandler())

# PROMPT = """
# You are a compliance metadata extractor.
# Return STRICT JSON ONLY. NO comments, no explanations.

# Your output MUST follow exactly this structure:

# {
#   "mandatory_metadata": {
#     "document_type": null,
#     "category": null,
#     "regulated_under": [],
#     "company_names": [],
#     "supplier_name": null,
#     "address": null,
#     "country": null,
#     "jurisdiction": null,
#     "industry": null,
#     "department_owner": null,
#     "contact_email": null,
#     "effective_date": null,
#     "last_updated": null,
#     "contract_expiration": null
#   },

#   "compliance_clauses": {
#     "data_retention": null,
#     "incident_response": null,
#     "access_control": null,
#     "encryption": null,
#     "data_sharing": null,
#     "consent": null,
#     "children_data": null,
#     "data_transfer": null
#   },

#   "risks_obligations": {
#     "risk_keywords": [],
#     "risk_summary": null,
#     "regulations_mentioned": [],
#     "frameworks_mentioned": [],
#     "obligations": []
#   },

#   "enforcement_deadlines": {
#     "review_cycle": null,
#     "renewal_date": null,
#     "audit_due": null,
#     "events": []
#   }
# }

# Rules:
# - Use true JSON `null`, not "null".
# - Arrays must be real arrays, not strings.
# - If unknown, leave the field as null or an empty array.
# - DO NOT ADD EXTRA KEYS.

# Document excerpt:
# ---
# {excerpt}
# ---
# """

# def extract_document_metadata(text: str, excerpt_len: int = 15000):
#     excerpt = text[:excerpt_len]

#     messages = [
#         {"role": "system", "content": "Return STRICT JSON only. No commentary."},
#         {"role": "user", "content": PROMPT.format(excerpt=excerpt)}
#     ]

#     resp = safe_chat_completion(
#         messages,
#         model="gpt-4o-mini",
#         temperature=0,
#         max_tokens=1400
#     )

#     raw = resp.get("text", "").strip()

#     # FIRST TRY = direct load
#     try:
#         return {"ok": True, "metadata": json.loads(raw)}
#     except:
#         pass

#     # SECOND TRY = substring extraction
#     s = raw.find("{")
#     e = raw.rfind("}")
#     if s != -1 and e != -1:
#         try:
#             cleaned = raw[s:e+1]
#             return {"ok": True, "metadata": json.loads(cleaned)}
#         except:
#             logger.exception("JSON substring extraction failed")

#     # FINAL FAIL
#     return {
#         "ok": False,
#         "error": "Could not parse JSON",
#         "raw": raw
#     }

import json
import logging
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
