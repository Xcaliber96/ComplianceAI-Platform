# llm/compliance_narratives.py
import json
from typing import Iterable
from src.core.client import safe_chat_completion
import logging

logger = logging.getLogger(__name__)
logger.addHandler(logging.NullHandler())

def generate_gap_summary(regulation_text: str, evidence_chunks: Iterable[str], max_evidence_chunks: int = 8):
    """
    Returns: {"ok": True, "result": {...}} or {"ok": False, "error": "..."}
    result expected keys: summary (str), missing_items (list), confidence (float 0-1)
    """
    # join few chunks for context
    preview = "\n\n---\n".join(list(evidence_chunks)[:max_evidence_chunks])
    prompt = f"""
You are a compliance analyst. Given the regulation excerpt and the evidence below, return EXACTLY one JSON object with keys:
  - summary: a one-paragraph summary about compliance (<=75 words)
  - missing_items: array of up to 8 missing items or responsibilities
  - confidence: a number from 0.0 to 1.0 indicating confidence

Regulation:
---
{regulation_text[:5000]}
---

Evidence (most relevant chunks):
---
{preview[:5000]}
---
"""
    messages = [
        {"role": "system", "content": "You are a concise compliance analyst. Return JSON only."},
        {"role": "user", "content": prompt},
    ]
    resp = safe_chat_completion(messages, model="gpt-4o-mini", temperature=0.0, max_tokens=800)
    if not resp.get("ok"):
        return {"ok": False, "error": resp.get("error")}
    raw = resp["text"].strip()
    try:
        parsed = json.loads(raw)
        return {"ok": True, "result": parsed}
    except Exception:
        # try substring extraction
        s = raw.find("{")
        e = raw.rfind("}")
        if s != -1 and e != -1 and e > s:
            try:
                parsed = json.loads(raw[s:e+1])
                return {"ok": True, "result": parsed, "note": "extracted_json_substring"}
            except Exception as ex:
                logger.exception("Failed to parse LLM JSON substring: %s", ex)
                return {"ok": False, "error": "failed to parse LLM JSON substring", "raw": raw}
        return {"ok": False, "error": "unexpected LLM output", "raw": raw}
