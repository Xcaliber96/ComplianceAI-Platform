# llm/market_insights.py
from typing import Iterable
from src.core.client import safe_chat_completion


def generate_market_insight(company_name: str, competitors: Iterable[str] | None = None, filings: list | str | None = None):
    comps = ", ".join(list(competitors)) if competitors else "N/A"
    filings_summary = ""
    if isinstance(filings, list):
        filings_summary = "\n".join(filings[:10])
    elif filings:
        filings_summary = str(filings)[:8000]

    prompt = f"""
You are a compliance and market intelligence analyst.
Provide a concise (<=200 words), actionable insight about {company_name}.

- Competitors: {comps}
- Filings summary: {filings_summary}

Include:
1) Compliance strengths / transparency initiatives.
2) Key regulatory / privacy / data-handling risks.
3) 2 prioritized recommendations.

Return as plain text with short bullets or paragraphs.
"""
    messages = [{"role": "user", "content": prompt}]
    resp = safe_chat_completion(messages, model="gpt-4o-mini", temperature=0.2, max_tokens=400)
    if not resp.get("ok"):
        return {"ok": False, "error": resp.get("error")}
    return {"ok": True, "insight": resp["text"].strip()}
