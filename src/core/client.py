# llm/client.py
import os
import time
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)
logger.addHandler(logging.NullHandler())

try:
    from openai import OpenAI
except Exception:
    # allow tests or envs without openai installed; callers must handle None
    OpenAI = None


def get_llm(api_key: str | None = None):
    """
    Lazy factory for OpenAI client. Returns None if not configured or if openai package not installed.
    """
    key = api_key or os.getenv("OPENAI_API_KEY")
    if not key:
        logger.debug("OPENAI_API_KEY not set; get_llm() -> None")
        return None
    if OpenAI is None:
        logger.warning("openai package not installed; get_llm() -> None")
        return None
    return OpenAI(api_key=key)


def safe_chat_completion(messages, model="gpt-4o-mini", temperature=0.0, max_tokens=800, attempts=3, backoff=1.0):
    """
    Safe wrapper to call the OpenAI chat completions via the OpenAI client.
    Returns dict: {"ok": True, "text": "..."} or {"ok": False, "error": "..."}.
    """
    client = get_llm()
    if client is None:
        return {"ok": False, "error": "OPENAI_API_KEY not configured or openai package missing"}

    for attempt in range(1, attempts + 1):
        try:
            resp = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            # Defensive extraction
            if not resp or not getattr(resp, "choices", None):
                return {"ok": False, "error": "empty response from LLM"}
            text = getattr(resp.choices[0].message, "content", None) or getattr(resp.choices[0], "text", None)
            if not text:
                # try dict fallback
                try:
                    d = resp.choices[0].to_dict()
                    text = (d.get("message") or {}).get("content") or d.get("text")
                except Exception:
                    text = None
            if not text:
                return {"ok": False, "error": "no textual content returned from LLM"}
            return {"ok": True, "text": str(text).strip()}
        except Exception as e:
            logger.exception("LLM call failed (attempt %d/%d): %s", attempt, attempts, e)
            if attempt == attempts:
                return {"ok": False, "error": str(e)}
            time.sleep(backoff * attempt)
