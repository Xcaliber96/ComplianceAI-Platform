import os
import json
from typing import List, Dict, Any

BASE_DIR = os.path.join("data", "state", "michigan")
RULE_DIR = os.path.join(BASE_DIR, "rules")
INDEX_PATH = os.path.join(BASE_DIR, "index.json")

def extract_rule_links(html):
    soup = BeautifulSoup(html, "html.parser")
    rows = soup.select("table tr")
    links = []

    for tr in rows:
        for a in tr.find_all("a"):
            href = a.get("href", "")
            if "ReturnHTML=True" not in href:
                continue

            # full URL
            url = BASE_HOST + href if href.startswith("/") else href

            # extract filename
            m = re.search(r"FileName=([^&]+)", href)
            if m:
                raw_name = requests.utils.unquote(m.group(1))
                # example: "R 4.411 to R 4.473.pdf"
                # strip .pdf
                name = raw_name.replace(".pdf", "").strip()
                # use it as ID
                rule_id = name.replace(" ", "_").replace(".", "_")
            else:
                rule_id = str(uuid4())

            links.append({
                "id": rule_id,
                "url": url,
            })

    return links

def normalize_regulation(raw: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(raw.get("id")),
        "name": raw.get("title") or raw.get("name") or "Unnamed Regulation",
        "code": raw.get("code"),
        "region": "Michigan",
        "category": "State",
        "risk": "Medium",
        "description": raw.get("text") or raw.get("description") or "",
        "source": "Michigan Administrative Code",
        "workspace_status": "default",
    }

def load_michigan_rule(rule_id: str):
    path = os.path.join(RULE_DIR, f"{rule_id}.json")
    if not os.path.exists(path):
        return None

    with open(path, "r", encoding="utf-8") as f:
        raw = json.load(f)
        return normalize_regulation(raw)

def search_local_michigan(query: str) -> List[Dict[str, Any]]:
    if not os.path.exists(INDEX_PATH):
        return []

    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        index = json.load(f)

    q = query.lower().strip()
    matches = [row for row in index if q in row["title"].lower()
                                 or q in " ".join(row["keywords"]).lower()]

    output = []
    for row in matches:
        rule = load_michigan_rule(row["id"])
        if rule:
            output.append(rule)

    return output

def get_state_regulations(state: str, query: str):
    if state.lower() not in ("michigan", "mi"):
        return [{"error": f"State '{state}' not supported"}]

    return search_local_michigan(query)
