"""
company_open_intel.py

High-level aggregator to pull open intelligence about a company from
multiple public APIs / OSINT-style sources.

Included integrations (template-style):

- SEC EDGAR (US public company filings)
- OpenCorporates (global company registry)
- UK Companies House (UK companies)
- Alpha Vantage (stock + financials)
- Clearbit (company enrichment)
- Censys (attack surface / infra)
- BuiltWith (technology stack)
- HaveIBeenPwned (breach info)
- Google Knowledge Graph (basic profile)
- OpenSanctions (sanctions / PEPs)
- CISA KEV (known exploited vulnerabilities – global, not per company)

You can call `gather_company_open_data(...)` to get a combined dict.

NOTE:
- Most APIs need API keys. Put them in the `api_keys` dict or env vars.
- Endpoints / fields may change: always check official docs before production use.
"""

from __future__ import annotations
import os
import json
from typing import Any, Dict, Optional, List

import requests

# -----------------------------
# Helpers
# -----------------------------

DEFAULT_USER_AGENT = "NomiAI-Compliance-Intel/0.1 (contact: your-email@example.com)"


def _get(headers: Dict[str, str], url: str, params: Dict[str, Any] | None = None):
    """Wrapper for requests.get with basic error handling."""
    try:
        resp = requests.get(url, headers=headers, params=params, timeout=15)
        resp.raise_for_status()
        return resp
    except Exception as e:
        return None


# ===========================================================
# 1. SEC EDGAR (US PUBLIC COMPANIES)
# ===========================================================

def fetch_sec_edgar_filings(
    cik_or_ticker: str,
    user_agent: str = DEFAULT_USER_AGENT,
) -> Dict[str, Any]:
    """
    Fetch basic SEC EDGAR submissions for a public US company.
    This uses the 'submissions' endpoint (no key required, but UA required).

    NOTE: For best results you should convert ticker → CIK first.
    Here we assume user passes a CIK or a CIK-like string.
    """
    # SEC expects numeric CIK zero-padded to 10 digits.
    cik_clean = "".join(ch for ch in cik_or_ticker if ch.isdigit())
    if cik_clean:
        cik_padded = cik_clean.zfill(10)
    else:
        # If not numeric, just try raw string (may fail)
        cik_padded = cik_or_ticker

    url = f"https://data.sec.gov/submissions/CIK{cik_padded}.json"
    headers = {"User-Agent": user_agent}

    resp = _get(headers, url)
    if resp is None:
        return {"error": "Failed to fetch SEC data (network or HTTP error)"}

    try:
        data = resp.json()
    except Exception as e:
        return {"error": f"Failed to parse SEC response: {e}"}

    # Return a trimmed subset for sanity
    filings = data.get("filings", {}).get("recent", {})
    return {
        "cik": data.get("cik"),
        "name": data.get("name"),
        "tickers": data.get("tickers"),
        "sic": data.get("sic"),
        "filings_recent": {
            "form": filings.get("form", [])[:20],
            "filed": filings.get("filingDate", [])[:20],
            "accessionNumber": filings.get("accessionNumber", [])[:20],
        },
    }


# ===========================================================
# 2. OPENCORPORATES
# ===========================================================

def fetch_opencorporates_company(
    name_or_jurisdiction: str,
    opencorporates_api_key: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Simple example using OpenCorporates search.
    """
    url = "https://api.opencorporates.com/v0.4/companies/search"
    params = {"q": name_or_jurisdiction}
    if opencorporates_api_key:
        params["api_token"] = opencorporates_api_key

    resp = _get({"User-Agent": DEFAULT_USER_AGENT}, url, params=params)
    if resp is None:
        return {"error": "Failed to fetch from OpenCorporates"}

    try:
        data = resp.json()
    except Exception as e:
        return {"error": f"Failed to parse OpenCorporates: {e}"}

    return data


# ===========================================================
# 3. UK COMPANIES HOUSE
# ===========================================================

def fetch_companies_house_company(
    company_number: str,
    api_key: Optional[str],
) -> Dict[str, Any]:
    """
    UK Companies House API requires Basic Auth with API key as username.
    """
    if not api_key:
        return {"error": "Companies House API key missing"}

    url = f"https://api.company-information.service.gov.uk/company/{company_number}"
    try:
        resp = requests.get(
            url,
            auth=(api_key, ""),
            headers={"User-Agent": DEFAULT_USER_AGENT},
            timeout=15,
        )
        resp.raise_for_status()
    except Exception as e:
        return {"error": f"Companies House request failed: {e}"}

    try:
        return resp.json()
    except Exception as e:
        return {"error": f"Failed to parse Companies House: {e}"}


# ===========================================================
# 4. ALPHA VANTAGE (FINANCIALS)
# ===========================================================

def fetch_alpha_vantage_overview(
    symbol: str,
    api_key: Optional[str],
) -> Dict[str, Any]:
    """
    Fetch basic company overview / financial metrics from Alpha Vantage.
    """
    if not api_key:
        return {"error": "Alpha Vantage API key missing"}

    url = "https://www.alphavantage.co/query"
    params = {
        "function": "OVERVIEW",
        "symbol": symbol,
        "apikey": api_key,
    }
    resp = _get({"User-Agent": DEFAULT_USER_AGENT}, url, params=params)
    if resp is None:
        return {"error": "Alpha Vantage request failed"}

    try:
        data = resp.json()
    except Exception as e:
        return {"error": f"Failed to parse Alpha Vantage: {e}"}

    return data


# ===========================================================
# 5. CLEARBIT (COMPANY ENRICHMENT)
# ===========================================================

def fetch_clearbit_company(
    domain: str,
    api_key: Optional[str],
) -> Dict[str, Any]:
    """
    Clearbit Enrichment API (company).
    NOTE: must respect their ToS, free tier has limits.
    """
    if not api_key:
        return {"error": "Clearbit API key missing"}

    url = f"https://company.clearbit.com/v2/companies/find"
    try:
        resp = requests.get(
            url,
            params={"domain": domain},
            headers={
                "Authorization": f"Bearer {api_key}",
                "User-Agent": DEFAULT_USER_AGENT,
            },
            timeout=15,
        )
        if resp.status_code == 404:
            return {"error": "Company not found in Clearbit"}
        resp.raise_for_status()
    except Exception as e:
        return {"error": f"Clearbit request failed: {e}"}

    try:
        return resp.json()
    except Exception as e:
        return {"error": f"Failed to parse Clearbit: {e}"}


# ===========================================================
# 6. CENSYS (ATTACK SURFACE)
# ===========================================================

def fetch_censys_host(
    domain_or_ip: str,
    api_id: Optional[str],
    api_secret: Optional[str],
) -> Dict[str, Any]:
    """
    Example using Censys Search 2.0 Hosts API (simplified).
    You need a Censys account & keypair.
    """
    if not api_id or not api_secret:
        return {"error": "Censys API credentials missing"}

    url = f"https://search.censys.io/api/v2/hosts/search"
    payload = {
        "q": domain_or_ip,
        "per_page": 5,
    }

    try:
        resp = requests.post(
            url,
            auth=(api_id, api_secret),
            json=payload,
            headers={"User-Agent": DEFAULT_USER_AGENT},
            timeout=15,
        )
        resp.raise_for_status()
    except Exception as e:
        return {"error": f"Censys request failed: {e}"}

    try:
        return resp.json()
    except Exception as e:
        return {"error": f"Failed to parse Censys: {e}"}


# ===========================================================
# 7. BUILTWITH (TECH STACK)
# ===========================================================

def fetch_builtwith_techstack(
    domain: str,
    api_key: Optional[str],
) -> Dict[str, Any]:
    """
    BuiltWith tech profile API (paid, but has trial).
    """
    if not api_key:
        return {"error": "BuiltWith API key missing"}

    url = "https://api.builtwith.com/v21/api.json"
    params = {
        "KEY": api_key,
        "LOOKUP": domain,
    }

    resp = _get({"User-Agent": DEFAULT_USER_AGENT}, url, params=params)
    if resp is None:
        return {"error": "BuiltWith request failed"}

    try:
        return resp.json()
    except Exception as e:
        return {"error": f"Failed to parse BuiltWith: {e}"}


# ===========================================================
# 8. HAVE I BEEN PWNED (BREACHES)
# ===========================================================

def fetch_hibp_breaches_for_domain(
    domain: str,
    api_key: Optional[str],
) -> Dict[str, Any]:
    """
    HaveIBeenPwned domain breaches (requires paid API key).
    This is a *template*.
    """
    if not api_key:
        return {"error": "HIBP API key missing"}

    url = f"https://haveibeenpwned.com/api/v3/breaches"
    # HIBP does NOT have a simple free domain search; you typically query by account.
    # Some tools do domain-based search via enterprise API.
    headers = {
        "hibp-api-key": api_key,
        "User-Agent": DEFAULT_USER_AGENT,
    }

    resp = _get(headers, url)
    if resp is None:
        return {"error": "HIBP request failed"}

    try:
        breaches = resp.json()
    except Exception as e:
        return {"error": f"Failed to parse HIBP: {e}"}

    # Filter by domain if possible
    domain_lower = domain.lower()
    filtered = [b for b in breaches if b.get("Domain", "").lower() == domain_lower]

    return {
        "breaches_for_domain": filtered,
        "total_breaches": len(filtered),
    }


# ===========================================================
# 9. GOOGLE KNOWLEDGE GRAPH
# ===========================================================

def fetch_google_kg(
    query: str,
    api_key: Optional[str],
) -> Dict[str, Any]:
    """
    Google Knowledge Graph Search API.
    """
    if not api_key:
        return {"error": "Google KG API key missing"}

    url = "https://kgsearch.googleapis.com/v1/entities:search"
    params = {
        "query": query,
        "key": api_key,
        "limit": 5,
        "indent": True,
    }

    resp = _get({"User-Agent": DEFAULT_USER_AGENT}, url, params=params)
    if resp is None:
        return {"error": "Google KG request failed"}

    try:
        return resp.json()
    except Exception as e:
        return {"error": f"Failed to parse Google KG: {e}"}


# ===========================================================
# 10. OPENSANCTIONS
# ===========================================================

def fetch_opensanctions_search(
    name: str,
) -> Dict[str, Any]:
    """
    Simple search using OpenSanctions API.
    """
    url = "https://api.opensanctions.org/match/default"
    payload = {
        "queries": [
            {"name": name}
        ]
    }

    try:
        resp = requests.post(
            url,
            json=payload,
            headers={"User-Agent": DEFAULT_USER_AGENT},
            timeout=15,
        )
        resp.raise_for_status()
    except Exception as e:
        return {"error": f"OpenSanctions request failed: {e}"}

    try:
        return resp.json()
    except Exception as e:
        return {"error": f"Failed to parse OpenSanctions: {e}"}


# ===========================================================
# 11. CISA KEV – KNOWN EXPLOITED VULNERABILITIES (GLOBAL)
# ===========================================================

def fetch_cisa_kev() -> Dict[str, Any]:
    """
    Fetch the CISA Known Exploited Vulnerabilities catalog.
    This is not company-specific but important for risk context.
    """
    url = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
    resp = _get({"User-Agent": DEFAULT_USER_AGENT}, url)
    if resp is None:
        return {"error": "Failed to fetch CISA KEV"}

    try:
        data = resp.json()
    except Exception as e:
        return {"error": f"Failed to parse CISA KEV: {e}"}

    # Only return a small subset to avoid huge payload
    vulns = data.get("vulnerabilities", [])[:50]
    return {
        "count_returned": len(vulns),
        "sample_vulnerabilities": vulns,
    }


# ===========================================================
# AGGREGATOR
# ===========================================================

def gather_company_open_data(
    *,
    domain: Optional[str] = None,
    legal_name: Optional[str] = None,
    ticker_or_cik: Optional[str] = None,
    uk_company_number: Optional[str] = None,
    api_keys: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    """
    High-level function that calls multiple open/intel sources and returns a combined dict.

    api_keys can contain:
      - "alpha_vantage"
      - "clearbit"
      - "opencorporates"
      - "companies_house"
      - "censys_id"
      - "censys_secret"
      - "builtwith"
      - "hibp"
      - "google_kg"
    """
    api_keys = api_keys or {}

    result: Dict[str, Any] = {
        "input": {
            "domain": domain,
            "legal_name": legal_name,
            "ticker_or_cik": ticker_or_cik,
            "uk_company_number": uk_company_number,
        },
        "sources": {},
    }

    # SEC EDGAR
    if ticker_or_cik:
        result["sources"]["sec_edgar"] = fetch_sec_edgar_filings(
            ticker_or_cik,
            user_agent=DEFAULT_USER_AGENT,
        )

    # OpenCorporates
    if legal_name:
        result["sources"]["opencorporates"] = fetch_opencorporates_company(
            legal_name,
            opencorporates_api_key=api_keys.get("opencorporates"),
        )

    # Companies House (UK)
    if uk_company_number:
        result["sources"]["companies_house"] = fetch_companies_house_company(
            uk_company_number,
            api_key=api_keys.get("companies_house"),
        )

    # Alpha Vantage
    if ticker_or_cik and api_keys.get("alpha_vantage"):
        result["sources"]["alpha_vantage"] = fetch_alpha_vantage_overview(
            ticker_or_cik,
            api_key=api_keys.get("alpha_vantage"),
        )

    # Clearbit
    if domain and api_keys.get("clearbit"):
        result["sources"]["clearbit"] = fetch_clearbit_company(
            domain,
            api_key=api_keys.get("clearbit"),
        )

    # Censys
    if domain and api_keys.get("censys_id") and api_keys.get("censys_secret"):
        result["sources"]["censys"] = fetch_censys_host(
            domain,
            api_id=api_keys.get("censys_id"),
            api_secret=api_keys.get("censys_secret"),
        )

    # BuiltWith
    if domain and api_keys.get("builtwith"):
        result["sources"]["builtwith"] = fetch_builtwith_techstack(
            domain,
            api_key=api_keys.get("builtwith"),
        )

    # HIBP (template, may not work without enterprise-level access)
    if domain and api_keys.get("hibp"):
        result["sources"]["haveibeenpwned"] = fetch_hibp_breaches_for_domain(
            domain,
            api_key=api_keys.get("hibp"),
        )

    # Google Knowledge Graph
    if (legal_name or domain) and api_keys.get("google_kg"):
        query = legal_name or domain
        result["sources"]["google_kg"] = fetch_google_kg(
            query,
            api_key=api_keys.get("google_kg"),
        )

    # OpenSanctions
    if legal_name:
        result["sources"]["opensanctions"] = fetch_opensanctions_search(legal_name)

    # CISA KEV (global context)
    result["sources"]["cisa_kev"] = fetch_cisa_kev()

    return result


# ===========================================================
# MAIN (for quick CLI testing)
# ===========================================================

def main():
    print("=== Company Open Intelligence Aggregator ===")
    domain = input("Company domain (e.g. tesla.com, nomioc.com) [optional]: ").strip() or None
    name = input("Legal name (e.g. Tesla Inc) [optional]: ").strip() or None
    ticker = input("Ticker or CIK (e.g. TSLA, 0001318605) [optional]: ").strip() or None
    uk_number = input("UK company number [optional]: ").strip() or None

    # TODO: fill your API keys here or load from env vars
    api_keys = {
        "alpha_vantage": os.getenv("ALPHA_VANTAGE_KEY", ""),
        "clearbit": os.getenv("CLEARBIT_KEY", ""),
        "opencorporates": os.getenv("OPENCORPORATES_KEY", ""),
        "companies_house": os.getenv("COMPANIES_HOUSE_KEY", ""),
        "censys_id": os.getenv("CENSYS_ID", ""),
        "censys_secret": os.getenv("CENSYS_SECRET", ""),
        "builtwith": os.getenv("BUILTWITH_KEY", ""),
        "hibp": os.getenv("HIBP_KEY", ""),
        "google_kg": os.getenv("GOOGLE_KG_KEY", ""),
    }

    data = gather_company_open_data(
        domain=domain,
        legal_name=name,
        ticker_or_cik=ticker,
        uk_company_number=uk_number,
        api_keys=api_keys,
    )

    print("\n=== RAW RESULT (truncated) ===")
    # Pretty-print but truncate huge stuff if needed
    print(json.dumps(data, indent=2)[:10000])


if __name__ == "__main__":
    main()
