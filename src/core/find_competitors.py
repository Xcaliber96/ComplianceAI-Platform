import requests
import os
import re
from dotenv import load_dotenv
import time

load_dotenv()
SERPER_API_KEY = os.getenv("SERPER_API_KEY")

HEADERS = {"User-Agent": "ComplianceAI/1.0 (akram@example.com)"}

COMMON_BAD_WORDS = {
    "The", "Competitors", "Companies", "Company", "Products", "Alternatives",
    "Compare", "Who", "Which", "Top", "Should", "These", "Battle", "Main",
    "For", "With", "Aside", "Nothing", "Comprehensive", "Biggest", "Invest",
    "Exhausted", "Tech", "Titans", "Guide", "Across"
}

def clean_names(names):
    cleaned = []
    for n in names:
        n = n.strip()

        if not n or any(c.isdigit() for c in n):
            continue
        if len(n.split()) > 3 or n.endswith('.'):
            continue

        if n.split()[0] in COMMON_BAD_WORDS:
            continue

        if re.match(r"^[A-Z][A-Za-z&\-\s]+$", n):
            cleaned.append(n)
    return list(set(cleaned))

if not SERPER_API_KEY:
    raise ValueError("SERPER_API_KEY not found in environment variables or .env file")

def extract_company_names(text: str):
    """Basic name extractor using capitalization patterns"""
    return list(set(re.findall(r"\b[A-Z][A-Za-z&\-\s]{2,}\b", text)))

def find_competitors(company_name: str, num_results: int = 10):
    """Search for competitors of a given company using Serper.dev"""
    query = f"{company_name} competitors OR alternatives OR similar companies"
    url = "https://google.serper.dev/search"

    payload = {"q": query, "num": num_results}
    headers = {"X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json"}

    resp = requests.post(url, json=payload, headers=headers)
    resp.raise_for_status()
    data = resp.json()

    competitors = set()
    for result in data.get("organic", []):
        snippet = result.get("snippet", "")
        title = result.get("title", "")
        for name in extract_company_names(snippet + " " + title):
            if name.lower() != company_name.lower():
                competitors.add(name.strip())

    return list(competitors)

def get_cik(company_name: str):
    """Search company CIK (unique SEC ID)"""
    search_url = f"https://www.sec.gov/cgi-bin/browse-edgar?company={company_name}&owner=exclude&action=getcompany&output=atom"
    resp = requests.get(search_url, headers=HEADERS)
    if resp.status_code != 200:
        return None
    import re
    match = re.search(r"CIK=(\d{10})", resp.text)
    return match.group(1) if match else None

def get_recent_filings(cik: str):
    """Fetch recent filings for a company via SEC JSON feed"""
    url = f"https://data.sec.gov/submissions/CIK{cik}.json"
    resp = requests.get(url, headers=HEADERS)
    if resp.status_code != 200:
        return []
    data = resp.json()
    filings = data.get("filings", {}).get("recent", {})
    return list(zip(filings.get("form", []), filings.get("filingDate", [])))

def get_company_filings(company_list):
    """Fetch filings for a list of companies"""
    results = {}
    for name in company_list:
        cik = get_cik(name)
        if cik:
            filings = get_recent_filings(cik)
            results[name] = filings[:5]  # last 5 filings
            time.sleep(0.5)  # avoid rate-limit
        else:
            results[name] = []
    return results


if __name__ == "__main__":
    comps = find_competitors("Apple")
    comps = clean_names(comps)
    filings = get_company_filings(comps)
    for company, docs in filings.items():
        print(f"\n📂 {company} filings:")
        for form, date in docs:
            print(f" - {form} filed on {date}")
    print("🔍 Found competitors:", comps)