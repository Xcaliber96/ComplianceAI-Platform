# # import requests
# # from bs4 import BeautifulSoup
# # import re

# # ALL_CODES_URL = (
# #     "https://ars.apps.lara.state.mi.us/AdminCode/DeptBureauAdminCode"
# #     "?Department=Select+Department&Bureau=Select+Bureau&RuleNumber="
# # )

# # BASE_HOST = "https://ars.apps.lara.state.mi.us"

# # HEADERS = {
# #     "User-Agent": (
# #         "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
# #         "AppleWebKit/537.36 (KHTML, like Gecko) "
# #         "Chrome/120.0.0.0 Safari/537.36"
# #     )
# # }

# # def is_michigan_rule_number(text: str) -> bool:
# #     text = text.strip().lower()
# #     return bool(re.match(r"^r?\s*\d+\.\d+$", text))


# # def format_michigan_rule(rule: dict, rule_id: str = None):
# #     return {
# #         "id": rule_id or rule.get("id"),
# #         "title": rule.get("title", "").strip(),
# #         "text": rule.get("content", "").strip(),
# #         "location": "Michigan, USA",
# #         "regulation_type": "State",
# #     }

# # def search_michigan(query: str = "", limit: int = None):

# #     res = requests.get(ALL_CODES_URL, headers=HEADERS)
# #     res.raise_for_status()

# #     soup = BeautifulSoup(res.text, "html.parser")
# #     rows = soup.select("table tr")

# #     results = []
# #     q = query.lower().strip()

# #     for tr in rows:
# #         row_text = " ".join(tr.stripped_strings)
# #         row_lower = row_text.lower()

# #         # Apply optional filtering
# #         if q and q not in row_lower:
# #             continue

# #         html_link = None
# #         for a in tr.find_all("a"):
# #             if "HTML" in a.get_text(strip=True).upper():
# #                 html_link = a.get("href")
# #                 break

# #         if not html_link:
# #             continue

# #         # Extract RuleSet ID
# #         m = re.search(r"RuleId=(\d+)", html_link)
# #         rule_id = m.group(1) if m else None

# #         # Normalize URL
# #         url = BASE_HOST + html_link if html_link.startswith("/") else html_link

# #         results.append({
# #             "id": rule_id,
# #             "title": row_text,
# #             "url": url
# #         })

# #         if limit and len(results) >= limit:
# #             break

# #     return results

# # def fetch_michigan_rule(url: str):
# #     res = requests.get(url, headers=HEADERS)
# #     res.raise_for_status()

# #     soup = BeautifulSoup(res.text, "html.parser")

# #     text = soup.get_text(separator="\n")
# #     lines = [line.strip() for line in text.splitlines() if line.strip()]
# #     cleaned = "\n".join(lines)

# #     title = lines[0] if lines else "Michigan Administrative Rule"

# #     return {
# #         "title": title,
# #         "content": cleaned
# #     }

# # def fetch_rule_by_number(rule_number: str):
# #     normalized = re.sub(r"[^0-9]", "", rule_number.lower())

# #     res = requests.get(ALL_CODES_URL, headers=HEADERS)
# #     res.raise_for_status()

# #     soup = BeautifulSoup(res.text, "html.parser")
# #     rows = soup.select("table tr")

# #     for tr in rows:
# #         row_raw = " ".join(tr.stripped_strings).lower()
# #         row_clean = re.sub(r"[^0-9]", "", row_raw)

# #         if normalized in row_clean:
# #             for a in tr.find_all("a"):
# #                 if "html" in a.get_text(strip=True).lower():
# #                     href = a.get("href")
# #                     url = BASE_HOST + href if href.startswith("/") else href

# #                     raw = fetch_michigan_rule(url)
# #                     return format_michigan_rule(raw, rule_id=normalized)

# #     return None

# import requests
# from bs4 import BeautifulSoup
# import re

# ALL_CODES_URL = (
#     "https://ars.apps.lara.state.mi.us/AdminCode/DeptBureauAdminCode"
#     "?Department=Select+Department&Bureau=Select+Bureau&RuleNumber="
# )

# BASE_HOST = "https://ars.apps.lara.state.mi.us"

# HEADERS = {
#     "User-Agent": (
#         "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
#         "AppleWebKit/537.36 (KHTML, like Gecko) "
#         "Chrome/120.0.0.0 Safari/537.36"
#     )
# }

# REQUEST_TIMEOUT = 10  # seconds  ⭐ important


# def is_michigan_rule_number(text: str) -> bool:
#     text = text.strip().lower()
#     return bool(re.match(r"^r?\s*\d+\.\d+$", text))


# def format_michigan_rule(rule: dict, rule_id: str = None):
#     return {
#         "id": rule_id or rule.get("id"),
#         "title": rule.get("title", "").strip(),
#         "text": rule.get("content", "").strip(),
#         "location": "Michigan, USA",
#         "regulation_type": "State",
#     }

# def search_michigan(query: str = "", limit: int = None):
#     res = requests.get(ALL_CODES_URL, headers=HEADERS)
#     res.raise_for_status()

#     soup = BeautifulSoup(res.text, "html.parser")
#     rows = soup.select("table tr")

#     results = []
#     q = query.lower().strip()

#     for tr in rows:
#         text = " ".join(tr.stripped_strings)
#         text_lower = text.lower()

#         if q and q not in text_lower:
#             continue

#         # Find HTML link
#         html_link = None
#         for a in tr.find_all("a"):
#             if "html" in a.get_text(strip=True).lower():  # reliable under new site
#                 html_link = a.get("href")
#                 break

#         if not html_link:
#             continue

#         # Extract a usable ID (from file name)
#         file_match = re.search(r"FileName=([^&]+)", html_link)
#         rule_id = file_match.group(1).replace("%20", "_") if file_match else text[:50]

#         url = BASE_HOST + html_link

#         results.append({
#             "id": rule_id,
#             "title": text,
#             "url": url
#         })

#         if limit and len(results) >= limit:
#             break

#     return results

# def fetch_michigan_rule(url: str):
#     res = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
#     res.raise_for_status()

#     soup = BeautifulSoup(res.text, "html.parser")

#     text = soup.get_text(separator="\n")
#     lines = [line.strip() for line in text.splitlines() if line.strip()]
#     cleaned = "\n".join(lines)

#     title = lines[0] if lines else "Michigan Administrative Rule"

#     return {
#         "title": title,
#         "content": cleaned
#     }


# def fetch_rule_by_number(rule_number: str):
#     normalized = re.sub(r"[^0-9]", "", rule_number.lower())

#     res = requests.get(ALL_CODES_URL, headers=HEADERS, timeout=REQUEST_TIMEOUT)
#     res.raise_for_status()

#     soup = BeautifulSoup(res.text, "html.parser")
#     rows = soup.select("table tr")

#     for tr in rows:
#         row_raw = " ".join(tr.stripped_strings).lower()
#         row_clean = re.sub(r"[^0-9]", "", row_raw)

#         if normalized in row_clean:
#             for a in tr.find_all("a"):
#                 if "html" in a.get_text(strip=True).lower():
#                     href = a.get("href")
#                     url = BASE_HOST + href if href.startswith("/") else href

#                     raw = fetch_michigan_rule(url)
#                     return format_michigan_rule(raw, rule_id=normalized)

#     return None

# src/core/regulations/state_regulations/state_michigan.py

import re
import requests
from bs4 import BeautifulSoup

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

REQUEST_TIMEOUT = 15  # seconds

def is_michigan_rule_number(q: str) -> bool:
    """
    Detects:
      • single rule:  R 205.401
      • compact form: R205.401
      • range: R 205.401 - R 205.416
    """
    if not isinstance(q, str):
        return False

    q = q.strip()

    # Range case
    if "-" in q:
        parts = [p.strip() for p in q.split("-")]
        if len(parts) != 2:
            return False

        pattern = r"^R\s*\d+\.\d+$"
        return bool(re.match(pattern, parts[0])) and bool(re.match(pattern, parts[1]))

    # Single rule case
    return bool(re.match(r"^R\s*\d+\.\d+$", q))

def format_michigan_rule(rule: dict, rule_id: str | None = None) -> dict:
    """
    Normalize raw HTML scrape into a consistent structure.
    """
    return {
        "id": rule_id or rule.get("id"),
        "title": rule.get("title", "").strip(),
        "text": rule.get("content", "").strip(),
        "location": "Michigan, USA",
        "regulation_type": "State",
    }


def _build_rule_id_from_href(href: str, fallback_text: str) -> str:
    """
    Extract something stable from FileName=... in the URL.
    Example href:
      /AdminCode/DownloadAdminCodeFile?FileName=R%20325.64001%20to%20R%20325.64001.pdf&ReturnHTML=True
    → ID: R_325_64001_to_R_325_64001
    """
    m = re.search(r"FileName=([^&]+)", href, flags=re.I)
    if not m:
        # fall back to truncated text
        return re.sub(r"\W+", "_", fallback_text.strip())[:80]

    raw_name = requests.utils.unquote(m.group(1))  # "R 325.64001 to R 325.64001.pdf"
    base = raw_name.rsplit(".", 1)[0]  # remove .pdf
    rule_id = re.sub(r"\W+", "_", base.strip())  # replace spaces & punctuation with "_"
    return rule_id


def search_michigan(query: str = "", limit: int | None = None) -> list[dict]:
    """
    Scrape the Michigan Admin Code index table and return basic rows:
      [{ id, title, url }, ...]
    If query is empty, returns ALL (up to `limit` if provided).
    """
    res = requests.get(ALL_CODES_URL, headers=HEADERS, timeout=REQUEST_TIMEOUT)
    res.raise_for_status()

    soup = BeautifulSoup(res.text, "html.parser")
    rows = soup.select("table tr")

    results: list[dict] = []
    q = (query or "").lower().strip()

    for tr in rows:
        row_text = " ".join(tr.stripped_strings)
        if not row_text:
            continue

        row_lower = row_text.lower()
        if q and q not in row_lower:
            continue

        # find the HTML link for this row
        html_link = None
        for a in tr.find_all("a"):
            if "html" in a.get_text(strip=True).lower():
                html_link = a.get("href")
                break

        if not html_link:
            continue

        href = html_link
        url = BASE_HOST + href if href.startswith("/") else href
        rule_id = _build_rule_id_from_href(href, row_text)

        results.append(
            {
                "id": rule_id,
                "title": row_text,
                "url": url,
            }
        )

        if limit and len(results) >= limit:
            break

    return results


def fetch_michigan_rule(url: str) -> dict:
    """
    Fetch a single Michigan rule HTML page and clean it into plain text.
    """
    res = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
    res.raise_for_status()

    soup = BeautifulSoup(res.text, "html.parser")

    # Dump text, remove empty lines
    text = soup.get_text(separator="\n")
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    cleaned = "\n".join(lines)

    title = lines[0] if lines else "Michigan Administrative Rule"

    return {
        "title": title,
        "content": cleaned,
    }


def fetch_rule_by_number(rule_number: str) -> dict | None:
    """
    Very rough: scan the index table and look for the digits of the rule number.
    Example: "R 325.1001" → normalized "3251001".
    """
    normalized = re.sub(r"[^0-9]", "", rule_number.lower())

    res = requests.get(ALL_CODES_URL, headers=HEADERS, timeout=REQUEST_TIMEOUT)
    res.raise_for_status()

    soup = BeautifulSoup(res.text, "html.parser")
    rows = soup.select("table tr")

    for tr in rows:
        row_raw = " ".join(tr.stripped_strings).lower()
        row_clean = re.sub(r"[^0-9]", "", row_raw)

        if normalized and normalized in row_clean:
            for a in tr.find_all("a"):
                if "html" in a.get_text(strip=True).lower():
                    href = a.get("href")
                    url = BASE_HOST + href if href.startswith("/") else href

                    raw = fetch_michigan_rule(url)
                    rule_id = _build_rule_id_from_href(href, row_raw)
                    return format_michigan_rule(raw, rule_id=rule_id)

    return None
