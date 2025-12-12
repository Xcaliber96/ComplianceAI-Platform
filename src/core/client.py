

import os
import time
import logging
import json
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
from collections import defaultdict
from functools import wraps
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)
logger.addHandler(logging.NullHandler())

try:
    from openai import OpenAI
    from openai import RateLimitError, APIError, APITimeoutError, APIConnectionError
except Exception as e:
    logger.warning(f"Failed to import OpenAI: {e}")
    OpenAI = None
    RateLimitError = APIError = APITimeoutError = APIConnectionError = None

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MAX_RETRIES = 3
BASE_BACKOFF = 1.0
MAX_BACKOFF = 32.0
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 50  # requests per window

# Token tracking
TOKEN_USAGE = {
    "total_tokens": 0,
    "prompt_tokens": 0,
    "completion_tokens": 0,
    "total_requests": 0,
    "failed_requests": 0,
    "last_reset": datetime.utcnow()
}

# Rate limiting tracker
REQUEST_TRACKER = defaultdict(list)

def reset_token_stats():
    """Reset token usage statistics."""
    TOKEN_USAGE.update({
        "total_tokens": 0,
        "prompt_tokens": 0,
        "completion_tokens": 0,
        "total_requests": 0,
        "failed_requests": 0,
        "last_reset": datetime.utcnow()
    })

def get_token_stats() -> Dict[str, Any]:
    """Get current token usage statistics."""
    return TOKEN_USAGE.copy()

def check_rate_limit(user_id: str = "default") -> bool:
    """
    Check if request is within rate limits.
    Returns True if allowed, False if rate limit exceeded.
    """
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW
    
    # Clean old requests
    REQUEST_TRACKER[user_id] = [
        req_time for req_time in REQUEST_TRACKER[user_id]
        if req_time > window_start
    ]
    
    # Check limit
    if len(REQUEST_TRACKER[user_id]) >= RATE_LIMIT_MAX_REQUESTS:
        logger.warning(f"Rate limit exceeded for user {user_id}")
        return False
    
    # Record this request
    REQUEST_TRACKER[user_id].append(now)
    return True

def get_llm(api_key: Optional[str] = None) -> Optional[OpenAI]:
    """
    Lazy factory for OpenAI client.
    Returns None if not configured or if openai package not installed.
    """
    key = api_key or OPENAI_API_KEY
    
    if not key:
        logger.debug("OPENAI_API_KEY not set; get_llm() -> None")
        return None
    
    if OpenAI is None:
        logger.warning("openai package not installed; get_llm() -> None")
        return None
    
    try:
        return OpenAI(api_key=key)
    except Exception as e:
        logger.error(f"Failed to initialize OpenAI client: {e}")
        return None

def validate_model(model: str) -> str:
    """
    Validate and normalize model name.
    Returns valid model or falls back to gpt-5-nano.
    """
    valid_models = {
        "gpt-5-nano": "gpt-5-nano",
        "gpt5-nano": "gpt-5-nano",
        "gpt-5nano": "gpt-5-nano",
    }
    
    normalized = model.lower().strip()
    
    if normalized in valid_models:
        return valid_models[normalized]
    
    logger.warning(f"Unknown model '{model}', falling back to gpt-5-nano")
    return "gpt-5-nano"

def safe_chat_completion(
    messages: List[Dict[str, str]],
    model: str = "gpt-5-nano",
    temperature: float = 0.0,
    max_tokens: int = 800,
    attempts: int = MAX_RETRIES,
    backoff: float = BASE_BACKOFF,
    user_id: str = "default",
    track_tokens: bool = True
) -> Dict[str, Any]:
    """
    Safe wrapper to call OpenAI chat completions with comprehensive error handling.
    
    Args:
        messages: List of message dicts with 'role' and 'content'
        model: Model name (default: gpt-5-nano)
        temperature: Sampling temperature (0.0-2.0)
        max_tokens: Maximum tokens to generate
        attempts: Number of retry attempts
        backoff: Initial backoff delay in seconds
        user_id: User identifier for rate limiting
        track_tokens: Whether to track token usage
    
    Returns dict:
        Success: {"ok": True, "text": "...", "tokens": {...}, "model": "...", "cached": False}
        Error: {"ok": False, "error": "...", "error_type": "...", "retry_after": <seconds>}
    """
    # Rate limiting check
    if not check_rate_limit(user_id):
        return {
            "ok": False,
            "error": "Rate limit exceeded",
            "error_type": "rate_limit",
            "retry_after": RATE_LIMIT_WINDOW
        }
    
    # Get client
    client = get_llm()
    if client is None:
        TOKEN_USAGE["failed_requests"] += 1
        return {
            "ok": False,
            "error": "OPENAI_API_KEY not configured or openai package missing",
            "error_type": "configuration"
        }
    
    # Validate model
    model = validate_model(model)
    
    # Retry loop with exponential backoff
    for attempt in range(1, attempts + 1):
        try:
            logger.debug(f"LLM request attempt {attempt}/{attempts} for user {user_id} with model {model}")
            
            # Make API call
            resp = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            
            # Defensive extraction
            if not resp or not getattr(resp, "choices", None):
                raise ValueError("Empty response from LLM")
            
            # Extract text content
            text = None
            try:
                text = getattr(resp.choices[0].message, "content", None)
            except Exception as content_error:
                logger.debug(f"Failed to extract content via message.content: {content_error}")
            
            if not text:
                try:
                    text = getattr(resp.choices[0], "text", None)
                except Exception as text_error:
                    logger.debug(f"Failed to extract content via text: {text_error}")
            
            if not text:
                try:
                    d = resp.choices[0].to_dict()
                    text = (d.get("message") or {}).get("content") or d.get("text")
                except Exception as dict_error:
                    logger.debug(f"Failed to extract content via to_dict: {dict_error}")
            
            if not text:
                raise ValueError("No textual content returned from LLM")
            
            # Track token usage
            token_info = {"total": 0, "prompt": 0, "completion": 0}
            if track_tokens and hasattr(resp, "usage"):
                try:
                    usage = resp.usage
                    token_info["total"] = getattr(usage, "total_tokens", 0)
                    token_info["prompt"] = getattr(usage, "prompt_tokens", 0)
                    token_info["completion"] = getattr(usage, "completion_tokens", 0)
                    
                    TOKEN_USAGE["total_tokens"] += token_info["total"]
                    TOKEN_USAGE["prompt_tokens"] += token_info["prompt"]
                    TOKEN_USAGE["completion_tokens"] += token_info["completion"]
                except Exception as token_error:
                    logger.warning(f"Failed to track token usage: {token_error}")
            
            TOKEN_USAGE["total_requests"] += 1
            
            logger.info(f"LLM request succeeded for user {user_id} (attempt {attempt}, model {model})")
            
            return {
                "ok": True,
                "text": str(text).strip(),
                "tokens": token_info,
                "model": model,
                "cached": False
            }
        
        except RateLimitError as e:
            logger.warning(f"Rate limit error (attempt {attempt}/{attempts}): {e}")
            TOKEN_USAGE["failed_requests"] += 1
            
            if attempt == attempts:
                return {
                    "ok": False,
                    "error": str(e),
                    "error_type": "rate_limit",
                    "retry_after": 60
                }
            
            # Exponential backoff with max cap
            sleep_time = min(backoff * (2 ** (attempt - 1)), MAX_BACKOFF)
            logger.info(f"Sleeping {sleep_time}s before retry")
            time.sleep(sleep_time)
        
        except (APITimeoutError, APIConnectionError) as e:
            logger.warning(f"Connection error (attempt {attempt}/{attempts}): {e}")
            TOKEN_USAGE["failed_requests"] += 1
            
            if attempt == attempts:
                return {
                    "ok": False,
                    "error": str(e),
                    "error_type": "connection"
                }
            
            sleep_time = min(backoff * attempt, MAX_BACKOFF)
            time.sleep(sleep_time)
        
        except APIError as e:
            logger.error(f"API error (attempt {attempt}/{attempts}): {e}")
            TOKEN_USAGE["failed_requests"] += 1
            
            if attempt == attempts:
                return {
                    "ok": False,
                    "error": str(e),
                    "error_type": "api_error"
                }
            
            sleep_time = min(backoff * attempt, MAX_BACKOFF)
            time.sleep(sleep_time)
        
        except Exception as e:
            logger.exception(f"Unexpected error (attempt {attempt}/{attempts}): {e}")
            TOKEN_USAGE["failed_requests"] += 1
            
            if attempt == attempts:
                return {
                    "ok": False,
                    "error": str(e),
                    "error_type": "unknown"
                }
            
            sleep_time = min(backoff * attempt, MAX_BACKOFF)
            time.sleep(sleep_time)
    
    # Should never reach here, but just in case
    return {
        "ok": False,
        "error": "Max retries exceeded",
        "error_type": "max_retries"
    }

def generate_compliance_intelligence(
    industry: str,
    departments: Optional[List[str]] = None,
    competitors: Optional[List[str]] = None,
    user_id: str = "default"
) -> Dict[str, Any]:
    """
    Generate structured compliance intelligence for external monitoring.
    Supports cross-departmental context.
    
    Args:
        industry: Target industry name
        departments: List of department names for focused analysis
        competitors: List of competitor companies to monitor
        user_id: User identifier for rate limiting
    
    Returns:
        Dict with intelligence data or error information
    """
    dept_context = ""
    if departments:
        dept_context = f"\nFocus on these departments: {', '.join(departments)}"
    
    competitor_context = ""
    if competitors:
        competitor_context = f"\nMonitor these competitors: {', '.join(competitors[:5])}"
    
    prompt = f"""Generate structured JSON on compliance, risk trends, and new regulations for the {industry} industry.
{dept_context}{competitor_context}

Format as a JSON object with:
- "source": "MarketReport"
- "headline": Brief summary of key compliance trends
- "key_risks": Array of top compliance risks
- "regulation_news": Array of objects with "regulation", "summary", "link", "affected_departments"
- "competitor_insights": If competitors provided, array of competitor compliance activities
- "department_priorities": Map of department -> priority areas

Return only valid JSON, no markdown formatting."""
    
    messages = [
        {"role": "system", "content": "You are an enterprise compliance intelligence assistant. Always return valid JSON."},
        {"role": "user", "content": prompt}
    ]
    
    result = safe_chat_completion(
        messages=messages,
        model="gpt-5-nano",
        max_tokens=1500,
        temperature=0.2,
        user_id=user_id
    )
    
    if not result.get("ok"):
        return result
    
    # Try to parse JSON
    try:
        text = result.get("text", "")
        # Remove markdown code blocks if present
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        intelligence = json.loads(text)
        
        return {
            "ok": True,
            "intelligence": intelligence,
            "tokens": result.get("tokens", {}),
            "model": result.get("model")
        }
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM JSON response: {e}")
        return {
            "ok": False,
            "error": f"Invalid JSON response: {e}",
            "error_type": "json_parse",
            "raw_text": result.get("text", "")
        }
    except Exception as e:
        logger.error(f"Unexpected error in intelligence generation: {e}")
        return {
            "ok": False,
            "error": str(e),
            "error_type": "unknown"
        }

def analyze_filing_for_departments(
    filing_text: str,
    form_type: str,
    company: str,
    departments: List[str],
    user_id: str = "default"
) -> Dict[str, Any]:
    """
    Analyze a SEC filing and generate department-specific insights.
    
    Args:
        filing_text: Text content from the filing
        form_type: SEC form type (e.g., 10-K, 8-K)
        company: str,
        departments: List of departments for analysis
        user_id: User identifier for rate limiting
    
    Returns:
        Dict with department analysis or error information
    """
    prompt = f"""Analyze this SEC {form_type} filing from {company}.

Filing excerpt (first 2000 chars):
{filing_text[:2000]}

For each of these departments: {', '.join(departments)}, identify:
1. Key risks or compliance issues relevant to that department
2. Required actions or monitoring needs
3. Priority level (High/Medium/Low)

Return as JSON:
{{
  "department_analysis": {{
    "Legal": {{"risks": [...], "actions": [...], "priority": "..."}},
    "Compliance": {{"risks": [...], "actions": [...], "priority": "..."}}
  }},
  "cross_department_issues": [...],
  "overall_risk_level": "..."
}}"""
    
    messages = [
        {"role": "system", "content": "You are a compliance analyst. Return only valid JSON."},
        {"role": "user", "content": prompt}
    ]
    
    result = safe_chat_completion(
        messages=messages,
        model="gpt-5-nano",
        max_tokens=1000,
        temperature=0.1,
        user_id=user_id
    )
    
    if not result.get("ok"):
        return result
    
    # Parse JSON
    try:
        text = result.get("text", "").strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```json"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        
        analysis = json.loads(text.strip())
        
        return {
            "ok": True,
            "analysis": analysis,
            "tokens": result.get("tokens", {}),
            "model": result.get("model")
        }
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse filing analysis JSON: {e}")
        return {
            "ok": False,
            "error": f"Invalid JSON response: {e}",
            "error_type": "json_parse",
            "raw_text": result.get("text", "")
        }
    except Exception as e:
        logger.error(f"Unexpected error in filing analysis: {e}")
        return {
            "ok": False,
            "error": str(e),
            "error_type": "unknown"
        }

if __name__ == "__main__":
    # Test basic completion
    print("Testing safe_chat_completion with gpt-5-nano...")
    result = safe_chat_completion(
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Say 'Hello, ComplianceAI!'"}
        ],
        model="gpt-5-nano",
        max_tokens=50
    )
    
    print(f"Result: {result}")
    print(f"\nToken stats: {get_token_stats()}")
    
    # Test intelligence generation
    print("\nTesting compliance intelligence generation...")
    intel = generate_compliance_intelligence(
        industry="Pharmaceutical",
        departments=["Legal", "Compliance"],
        competitors=["Pfizer", "Moderna"]
    )
    
    print(f"Intelligence result: {intel.get('ok')}")
    if intel.get("ok"):
        print(f"Headline: {intel.get('intelligence', {}).get('headline')}")
        print(f"Model used: {intel.get('model')}")
