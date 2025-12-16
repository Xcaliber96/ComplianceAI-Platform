
import requests
import os
import re
import time
import logging
from typing import List, Dict, Optional, Tuple, Set
from datetime import datetime, timedelta
from functools import lru_cache
import asyncio
import aiohttp
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# API Keys
SERPER_API_KEY = os.getenv("SERPER_API_KEY")
if not SERPER_API_KEY:
    raise ValueError("SERPER_API_KEY not found in environment variables or .env file")

# Configuration
SEC_HEADERS = {"User-Agent": "NomiAI/1.0 (nomiai@testmail.com)"}
SEC_RATE_LIMIT_DELAY = 0.11
MAX_RETRIES = 3
TIMEOUT = 10

# Company name cleaning
COMMON_BAD_WORDS = {
    "The", "Competitors", "Companies", "Company", "Products", "Alternatives",
    "Compare", "Who", "Which", "Top", "Should", "These", "Battle", "Main",
    "For", "With", "Aside", "Nothing", "Comprehensive", "Biggest", "Invest",
    "Exhausted", "Tech", "Titans", "Guide", "Across", "Inc", "Corp", "LLC"
}

# Department-specific filing priorities (aligned with your ROLE_ASSIGNMENTS)
DEPARTMENT_FILING_PRIORITIES = {
    "Legal": {
        "forms": ["8-K", "DEF 14A", "SC 13D", "SC 13G", "S-1", "S-4"],
        "keywords": ["litigation", "lawsuit", "settlement", "investigation", "regulatory action", "penalties", "compliance"],
        "risk_weight": 3
    },
    "IT": {
        "forms": ["8-K", "10-K", "10-Q"],
        "keywords": ["system failure", "infrastructure", "outage", "technology risk", "cybersecurity", "data breach"],
        "risk_weight": 2
    },
    "Finance": {
        "forms": ["10-K", "10-Q", "8-K", "20-F"],
        "keywords": ["restatement", "material weakness", "going concern", "default", "covenant", "revenue"],
        "risk_weight": 3
    },
    "Security": {
        "forms": ["8-K", "10-K", "10-Q"],
        "keywords": ["breach", "cybersecurity", "data loss", "ransomware", "unauthorized access", "incident"],
        "risk_weight": 4
    },
    "Audit": {
        "forms": ["10-K", "10-Q", "DEF 14A"],
        "keywords": ["internal control", "deficiency", "audit opinion", "material misstatement", "sox compliance"],
        "risk_weight": 3
    },
    "Compliance": {
        "forms": ["10-K", "10-Q", "8-K", "DEF 14A"],
        "keywords": ["non-compliance", "violation", "remediation", "regulatory", "sanctions", "penalties"],
        "risk_weight": 4
    }
}


# CIK Lookup with caching
@lru_cache(maxsize=500)
def get_cik_from_ticker(ticker: str) -> Optional[str]:
    """Get CIK from ticker using SEC's company tickers JSON. Cached to reduce API calls."""
    try:
        url = "https://www.sec.gov/files/company_tickers.json"
        resp = requests.get(url, headers=SEC_HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        
        data = resp.json()
        ticker_upper = ticker.upper().strip()
        
        for entry in data.values():
            if entry.get("ticker", "").upper() == ticker_upper:
                cik = str(entry["cik_str"]).zfill(10)
                logger.info(f"Found CIK {cik} for ticker {ticker}")
                return cik
        
        logger.warning(f"No CIK found for ticker {ticker}")
        return None
    except Exception as e:
        logger.error(f"Error fetching CIK for {ticker}: {e}")
        return None


def get_cik(company_name: str) -> Optional[str]:
    """Search company CIK by name or ticker."""
    try:
        # Try ticker format first
        if len(company_name) <= 5 and company_name.isupper():
            cik = get_cik_from_ticker(company_name)
            if cik:
                return cik
        
        # Fallback: search by company name
        search_url = f"https://www.sec.gov/cgi-bin/browse-edgar?company={company_name}&owner=exclude&action=getcompany&output=atom"
        resp = requests.get(search_url, headers=SEC_HEADERS, timeout=TIMEOUT)
        
        if resp.status_code != 200:
            return None
        
        match = re.search(r"CIK=(\d{10})", resp.text)
        if match:
            logger.info(f"Found CIK {match.group(1)} for {company_name}")
            return match.group(1)
        
        return None
    except Exception as e:
        logger.error(f"Error getting CIK for {company_name}: {e}")
        return None


# Company name extraction
def extract_company_names(text: str) -> List[str]:
    """Extract potential company names using capitalization patterns."""
    pattern = r'\b[A-Z][A-Za-z0-9&\-\s]{2,}\b'
    return list(set(re.findall(pattern, text)))


def clean_names(names: List[str]) -> List[str]:
    """Clean and filter extracted company names."""
    cleaned = []
    for n in names:
        n = n.strip()
        
        if not n or n.endswith('.'):
            continue
        
        if len(n.split()) > 4:
            continue
        
        first_word = n.split()[0]
        if first_word in COMMON_BAD_WORDS:
            continue
        
        if re.match(r"^[A-Z0-9][A-Za-z0-9&\-\s]+$", n):
            cleaned.append(n)
    
    return list(set(cleaned))


# Competitor discovery
def find_competitors(company_name: str, num_results: int = 10) -> List[str]:
    """Search for competitors using Serper.dev with retry logic."""
    query = f"{company_name} competitors OR alternatives OR similar companies"
    url = "https://google.serper.dev/search"
    payload = {"q": query, "num": num_results}
    headers = {"X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json"}
    
    for attempt in range(MAX_RETRIES):
        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
            resp.raise_for_status()
            data = resp.json()
            
            competitors = set()
            for result in data.get("organic", []):
                snippet = result.get("snippet", "")
                title = result.get("title", "")
                
                for name in extract_company_names(snippet + " " + title):
                    if name.lower() != company_name.lower():
                        competitors.add(name.strip())
            
            logger.info(f"Found {len(competitors)} competitors for {company_name}")
            return list(competitors)
        
        except requests.exceptions.RequestException as e:
            logger.warning(f"Attempt {attempt + 1}/{MAX_RETRIES} failed: {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(2 ** attempt)
            else:
                logger.error(f"Failed to find competitors for {company_name}")
                return []
    
    return []


# SEC Filings with department context
def get_recent_filings(
    cik: str, 
    limit: int = 10,
    departments: Optional[List[str]] = None
) -> List[Dict]:
    """
    Fetch recent SEC filings with optional department filtering.
    Returns enriched filing data with cross-departmental relevance scoring.
    """
    try:
        time.sleep(SEC_RATE_LIMIT_DELAY)
        
        url = f"https://data.sec.gov/submissions/CIK{cik}.json"
        resp = requests.get(url, headers=SEC_HEADERS, timeout=TIMEOUT)
        
        if resp.status_code != 200:
            logger.warning(f"Failed to fetch filings for CIK {cik}: {resp.status_code}")
            return []
        
        data = resp.json()
        company_name = data.get("name", "Unknown")
        filings = data.get("filings", {}).get("recent", {})
        
        results = []
        forms = filings.get("form", [])
        dates = filings.get("filingDate", [])
        accessions = filings.get("accessionNumber", [])
        primary_docs = filings.get("primaryDocument", [])
        
        for i in range(min(len(forms), limit * 2)):  # Fetch extra to filter
            form = forms[i]
            filing_date = dates[i] if i < len(dates) else None
            accession = accessions[i] if i < len(accessions) else None
            primary_doc = primary_docs[i] if i < len(primary_docs) else None
            
            # Calculate cross-departmental relevance
            dept_relevance = calculate_department_relevance(form, departments)
            
            # Skip if no departments are interested
            if departments and not dept_relevance:
                continue
            
            # Generate SEC URL
            if accession and primary_doc:
                clean_accession = accession.replace("-", "")
                sec_url = f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{clean_accession}/{primary_doc}"
            else:
                sec_url = None
            
            results.append({
                "company": company_name,
                "cik": cik,
                "form": form,
                "filing_date": filing_date,
                "accession_number": accession,
                "primary_document": primary_doc,
                "sec_url": sec_url,
                "department_relevance": dept_relevance,
                "cross_department_priority": calculate_cross_dept_priority(dept_relevance)
            })
            
            if len(results) >= limit:
                break
        
        logger.info(f"Retrieved {len(results)} filings for CIK {cik}")
        return results
    
    except Exception as e:
        logger.error(f"Error fetching filings for CIK {cik}: {e}")
        return []


def calculate_department_relevance(form: str, departments: Optional[List[str]]) -> Dict[str, Dict]:
    """
    Calculate which departments should be interested in this filing.
    Returns dict mapping department -> {relevant: bool, priority: int, keywords: list}
    """
    relevance = {}
    
    if not departments:
        departments = list(DEPARTMENT_FILING_PRIORITIES.keys())
    
    for dept in departments:
        dept_config = DEPARTMENT_FILING_PRIORITIES.get(dept, {})
        relevant_forms = dept_config.get("forms", [])
        
        is_relevant = form in relevant_forms
        priority = dept_config.get("risk_weight", 1) if is_relevant else 0
        
        relevance[dept] = {
            "relevant": is_relevant,
            "priority": priority,
            "keywords": dept_config.get("keywords", []) if is_relevant else []
        }
    
    return relevance


def calculate_cross_dept_priority(dept_relevance: Dict[str, Dict]) -> int:
    """
    Calculate overall cross-departmental priority score.
    Higher score means more departments are interested.
    """
    total_priority = sum(
        dept_info.get("priority", 0) 
        for dept_info in dept_relevance.values()
        if dept_info.get("relevant", False)
    )
    
    interested_depts = sum(
        1 for dept_info in dept_relevance.values()
        if dept_info.get("relevant", False)
    )
    
    # Boost score if multiple departments are interested (cross-dept collaboration needed)
    cross_dept_multiplier = 1.5 if interested_depts > 1 else 1.0
    
    return int(total_priority * cross_dept_multiplier)


def get_company_filings(
    company_list: List[str], 
    departments: Optional[List[str]] = None
) -> Dict[str, List[Dict]]:
    """
    Fetch filings for multiple companies with cross-departmental context.
    Returns filings grouped by company with department relevance scores.
    """
    results = {}
    
    for name in company_list:
        cik = get_cik(name)
        
        if cik:
            filings = get_recent_filings(cik, limit=10, departments=departments)
            # Sort by cross-departmental priority (high to low)
            filings.sort(key=lambda x: x.get("cross_department_priority", 0), reverse=True)
            results[name] = filings[:5]
        else:
            logger.warning(f"Could not find CIK for {name}")
            results[name] = []
    
    return results


def generate_department_alerts(filings: List[Dict]) -> Dict[str, List[Dict]]:
    """
    Generate department-specific alerts from filings.
    Returns alerts grouped by department for graph ingestion.
    """
    alerts_by_dept = {}
    
    for filing in filings:
        dept_relevance = filing.get("department_relevance", {})
        
        for dept, relevance_info in dept_relevance.items():
            if not relevance_info.get("relevant", False):
                continue
            
            if dept not in alerts_by_dept:
                alerts_by_dept[dept] = []
            
            alert = {
                "department": dept,
                "company": filing.get("company"),
                "form_type": filing.get("form"),
                "filing_date": filing.get("filing_date"),
                "sec_url": filing.get("sec_url"),
                "priority": relevance_info.get("priority", 0),
                "keywords": relevance_info.get("keywords", []),
                "requires_cross_dept_review": filing.get("cross_department_priority", 0) > 2,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            alerts_by_dept[dept].append(alert)
    
    return alerts_by_dept


# Async support for parallel fetching
async def fetch_filings_async(
    session: aiohttp.ClientSession,
    company: str,
    departments: Optional[List[str]] = None
) -> Tuple[str, List[Dict]]:
    """Async fetch filings for a single company."""
    cik = get_cik(company)
    
    if not cik:
        return company, []
    
    await asyncio.sleep(SEC_RATE_LIMIT_DELAY)
    
    url = f"https://data.sec.gov/submissions/CIK{cik}.json"
    
    try:
        async with session.get(url, headers=SEC_HEADERS, timeout=TIMEOUT) as resp:
            if resp.status != 200:
                return company, []
            
            data = await resp.json()
            company_name = data.get("name", company)
            filings = data.get("filings", {}).get("recent", {})
            
            results = []
            forms = filings.get("form", [])
            dates = filings.get("filingDate", [])
            accessions = filings.get("accessionNumber", [])
            
            for i in range(min(len(forms), 15)):
                form = forms[i]
                dept_relevance = calculate_department_relevance(form, departments)
                
                if departments and not any(dr.get("relevant") for dr in dept_relevance.values()):
                    continue
                
                results.append({
                    "company": company_name,
                    "cik": cik,
                    "form": form,
                    "filing_date": dates[i] if i < len(dates) else None,
                    "accession_number": accessions[i] if i < len(accessions) else None,
                    "department_relevance": dept_relevance,
                    "cross_department_priority": calculate_cross_dept_priority(dept_relevance)
                })
            
            results.sort(key=lambda x: x.get("cross_department_priority", 0), reverse=True)
            return company, results[:5]
    
    except Exception as e:
        logger.error(f"Async fetch failed for {company}: {e}")
        return company, []


async def get_company_filings_async(
    company_list: List[str],
    departments: Optional[List[str]] = None
) -> Dict[str, List[Dict]]:
    """Fetch filings for multiple companies in parallel."""
    async with aiohttp.ClientSession() as session:
        tasks = [
            fetch_filings_async(session, company, departments)
            for company in company_list
        ]
        results = await asyncio.gather(*tasks)
    
    return dict(results)


# Integration with graph API for cross-departmental collaboration
def prepare_graph_nodes_edges(
    filings_by_company: Dict[str, List[Dict]],
    departments: List[str]
) -> Dict[str, List[Dict]]:
    """
    Prepare nodes and edges for Neo4j graph ingestion.
    Creates relationships between departments, companies, and filings.
    """
    nodes = []
    edges = []
    
    # Create company nodes
    for company_name, filings in filings_by_company.items():
        nodes.append({
            "id": f"company_{company_name.replace(' ', '_')}",
            "label": "Company",
            "props": {
                "name": company_name,
                "type": "competitor",
                "filing_count": len(filings),
                "last_updated": datetime.utcnow().isoformat()
            }
        })
        
        # Create filing nodes and edges to departments
        for filing in filings:
            filing_id = f"filing_{filing.get('accession_number', '').replace('-', '_')}"
            
            nodes.append({
                "id": filing_id,
                "label": "Filing",
                "props": {
                    "form_type": filing.get("form"),
                    "filing_date": filing.get("filing_date"),
                    "sec_url": filing.get("sec_url"),
                    "cross_dept_priority": filing.get("cross_department_priority", 0)
                }
            })
            
            # Edge from company to filing
            edges.append({
                "source": f"company_{company_name.replace(' ', '_')}",
                "target": filing_id,
                "type": "FILED",
                "props": {"filing_date": filing.get("filing_date")}
            })
            
            # Edges from departments to filings
            dept_relevance = filing.get("department_relevance", {})
            for dept, relevance_info in dept_relevance.items():
                if relevance_info.get("relevant", False):
                    dept_id = f"dept_{dept}"
                    
                    # Ensure department node exists
                    if not any(n.get("id") == dept_id for n in nodes):
                        nodes.append({
                            "id": dept_id,
                            "label": "Department",
                            "props": {"name": dept}
                        })
                    
                    # Edge from department to filing
                    edges.append({
                        "source": dept_id,
                        "target": filing_id,
                        "type": "MONITORS",
                        "props": {
                            "priority": relevance_info.get("priority", 0),
                            "keywords": relevance_info.get("keywords", [])[:5]  # Limit keywords
                        }
                    })
    
    return {"nodes": nodes, "edges": edges}


if __name__ == "__main__":
    # Example: Cross-departmental monitoring for Apple competitors
    company = "Apple"
    departments = ["Legal", "Compliance", "Finance"]
    
    print(f"\nFinding competitors for {company}...")
    competitors = find_competitors(company, num_results=10)
    competitors = clean_names(competitors)
    print(f"Found {len(competitors)} competitors: {competitors[:5]}")
    
    print(f"\nFetching filings for departments: {', '.join(departments)}...")
    filings = get_company_filings(competitors[:3], departments=departments)
    
    for comp, docs in filings.items():
        print(f"\n{comp} ({len(docs)} relevant filings):")
        for doc in docs:
            priority = doc.get("cross_department_priority", 0)
            print(f"  [{priority}] {doc['form']} filed on {doc['filing_date']}")
            
            # Show which departments are interested
            dept_rel = doc.get("department_relevance", {})
            interested = [d for d, info in dept_rel.items() if info.get("relevant")]
            if interested:
                print(f"      Departments: {', '.join(interested)}")
    
    # Generate alerts
    print("\nGenerating department-specific alerts...")
    all_filings = [f for filings_list in filings.values() for f in filings_list]
    alerts = generate_department_alerts(all_filings)
    
    for dept, dept_alerts in alerts.items():
        print(f"\n{dept}: {len(dept_alerts)} alerts")
        for alert in dept_alerts[:2]:
            print(f"  - {alert['company']}: {alert['form_type']} (Priority: {alert['priority']})")
    
    # Prepare for graph ingestion
    print("\nPreparing graph data for Neo4j...")
    graph_data = prepare_graph_nodes_edges(filings, departments)
    print(f"Generated {len(graph_data['nodes'])} nodes and {len(graph_data['edges'])} edges")
