import re
import requests  # <- Fixed: import requests for HTTP calls

# Input types
INPUT_PACKAGE = "package"
INPUT_GRANULE = "granule"
INPUT_CFR = "cfr"
INPUT_TOPIC = "topic"
INPUT_FR_DOC = "federal_register_doc"
INPUT_GOVINFO_URL = "govinfo_url"
INPUT_DOC_URL = "document_url"
INPUT_UNKNOWN = "unknown"

BASE_SEARCH_URL = "https://www.federalregister.gov/api/v1/documents"
BASE_FR_URL = "https://www.federalregister.gov/api/v1/documents"

# Add headers for API requests
HEADERS = {"User-Agent": "Mozilla/5.0"}

def detect_input_type(text: str) -> str:
    text = text.strip()

    if text.startswith("https://www.govinfo.gov/app/details/"):
        return INPUT_GOVINFO_URL
    if text.startswith("https://"):
        return INPUT_DOC_URL
    if re.search(r"\b(\d+)\s*CFR\s*([\d\.]+)\b", text, re.IGNORECASE):
        return INPUT_CFR
    if re.match(r"^\d{4}-\d{5}$", text):
        return INPUT_FR_DOC
    if re.search(r"-Pg[A-Za-z0-9-]+$", text):
        return INPUT_GRANULE
    if re.match(r"^[A-Z]{2,}-\d{4}-", text):
        return INPUT_PACKAGE
    if re.search(r"[A-Za-z]", text):
        return INPUT_TOPIC

    return INPUT_UNKNOWN

def search_federal_register(query: str, limit: int = 20):
    """
    Searches the Federal Register for documents matching a query.
    Returns a list of dicts with title + document_number.
    """
    params = {
        "per_page": limit,
        "conditions[term]": query
    }

    try:
        res = requests.get(BASE_SEARCH_URL, params=params, headers=HEADERS)
        res.raise_for_status()
    except Exception as e:
        print(f"[ERROR] Federal Register search failed: {e}")
        return []

    data = res.json()
    results = []

    for doc in data.get("results", []):
        results.append({
            "title": doc.get("title"),
            "document_number": doc.get("document_number"),
            "type": doc.get("type"),
            "publication_date": doc.get("publication_date"),
        })

    return results

def get_full_text(doc_number: str):
    url = f"{BASE_FR_URL}/{doc_number}.json"
    try:
        resp = requests.get(url, headers=HEADERS)
        resp.raise_for_status()
        data = resp.json()

        mods_url = data.get("mods_url", "")
        print("modeslklergmemgklkmglmkletmlmelmrtlm_url",mods_url)
        package_id = extract_package_id(mods_url)
        print("kjvhevnovoefmvklemvklmve", package_id)
        raw_text_url = data.get("raw_text_url")
        if raw_text_url:
            text_resp = requests.get(raw_text_url, headers=HEADERS)
            text_resp.raise_for_status()
            full_text = text_resp.text
        else:
            full_text = data.get("full_text_xml_url", "") or data.get("document", {}).get("full_text", "")

        return full_text, package_id

    except Exception as e:
        print(f"[ERROR] Could not fetch full text for {doc_number}: {e}")
        return "", None
def extract_package_id(mods_url: str) -> str:
    """
    Extracts the package ID from a GovInfo mods URL.
    Works for URLs like:
    https://www.govinfo.gov/metadata/granule/FR-2025-09-16/2025-17826/mods.xml
    """
    try:
        # Split the URL by '/' and take the second-to-last element
        parts = mods_url.strip("/").split("/")
        if len(parts) >= 2:
            package_id = parts[-3]  # second to last part
            return package_id
        return None
    except Exception as e:
        print(f"Error extracting package ID: {e}")
        return None


def extract_citations(full_text: str):
    """
    Extract CFR and USC citations from text.
    Returns a tuple: (cfr_citations, usc_citations)
    """
    cfr_pattern = r"\b\d+\s*CFR\s*[\d\.]+\b"
    usc_pattern = r"\b\d+\s*U\.S\.C\.\s*§?\s*[\d\w\(\)\-]+\b"
    
    cfr_citations = re.findall(cfr_pattern, full_text)
    usc_citations = re.findall(usc_pattern, full_text)
    
    return cfr_citations, usc_citations
def clean_citations(citations):
    """
    Cleans a list of CFR citations:
    - Strips whitespace and newlines
    - Deduplicates
    """
    cleaned = [c.replace("\n", " ").strip() for c in citations]
    return sorted(set(cleaned))
