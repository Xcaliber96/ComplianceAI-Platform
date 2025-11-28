import requests
from bs4 import BeautifulSoup
import re

ALL_CODES_URL = (
    "https://ars.apps.lara.state.mi.us/AdminCode/DeptBureauAdminCode"
    "?Department=Select+Department&Bureau=Select+Bureau&RuleNumber="
)

BASE_HOST = "https://ars.apps.lara.state.mi.us"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

def is_michigan_rule_number(text: str) -> bool:
    text = text.strip().lower()
    return bool(re.match(r"^r?\s*\d+\.\d+$", text))


def format_michigan_rule(rule: dict, rule_id: str = None):
    return {
        "id": rule_id or rule.get("id"),
        "title": rule.get("title", "").strip(),
        "text": rule.get("content", "").strip(),
        "location": "Michigan, USA",
        "regulation_type": "State",
    }

def search_michigan(query: str, limit: int = 10):
    q = query.lower().strip()
    if not q:
        return []

    res = requests.get(ALL_CODES_URL, headers=HEADERS)
    res.raise_for_status()

    soup = BeautifulSoup(res.text, "html.parser")
    rows = soup.select("table tr")
    results = []

    for tr in rows:
        row_text = " ".join(tr.stripped_strings)
        if q not in row_text.lower():
            continue

        html_link = None
        for a in tr.find_all("a"):
            if "HTML" in a.get_text(strip=True).upper():
                html_link = a.get("href")
                break

        if not html_link:
            continue

        # Extract RuleSet ID
        m = re.search(r"RuleId=(\d+)", html_link)
        rule_id = m.group(1) if m else None

        # Normalize URL
        if html_link.startswith("/"):
            url = BASE_HOST + html_link
        else:
            url = html_link

        results.append({
            "id": rule_id,
            "title": row_text,
            "url": url
        })

        if len(results) >= limit:
            break

    return results

def fetch_michigan_rule(url: str):
    res = requests.get(url, headers=HEADERS)
    res.raise_for_status()

    soup = BeautifulSoup(res.text, "html.parser")

    text = soup.get_text(separator="\n")
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    cleaned = "\n".join(lines)

    title = lines[0] if lines else "Michigan Administrative Rule"

    return {
        "title": title,
        "content": cleaned
    }

def fetch_rule_by_number(rule_number: str):
    normalized = re.sub(r"[^0-9]", "", rule_number.lower())

    res = requests.get(ALL_CODES_URL, headers=HEADERS)
    res.raise_for_status()

    soup = BeautifulSoup(res.text, "html.parser")
    rows = soup.select("table tr")

    for tr in rows:
        row_raw = " ".join(tr.stripped_strings).lower()
        row_clean = re.sub(r"[^0-9]", "", row_raw)

        if normalized in row_clean:
            for a in tr.find_all("a"):
                if "html" in a.get_text(strip=True).lower():
                    href = a.get("href")
                    url = BASE_HOST + href if href.startswith("/") else href

                    raw = fetch_michigan_rule(url)
                    return format_michigan_rule(raw, rule_id=normalized)

    return None
