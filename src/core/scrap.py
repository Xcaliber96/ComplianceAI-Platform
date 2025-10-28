import requests
from bs4 import BeautifulSoup

def scrape_eu_regulation(celex_id="32024R1987"):
    """
    Scrapes an EU regulation page from EUR-Lex and extracts title, date, whereas paragraphs, and first table.
    """
    url = f"https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:{celex_id}"
    headers = {"User-Agent": "ComplianceAI-Bot/1.0 (AkramMoustafa)"}
    print(f"📡 Fetching: {url}")

    resp = requests.get(url, headers=headers, timeout=20)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    # --- Title (in a <div class="title"> or h1 within header) ---
    title_tag = soup.select_one("div.title, div.docTitle, h1.title, h1")
    title = title_tag.get_text(strip=True) if title_tag else "Title not found"

    # --- Date (usually follows 'of DD Month YYYY') ---
    date_tag = soup.find(string=lambda t: t and " of " in t and "20" in t)
    date = date_tag.strip() if date_tag else "Date not found"

    # --- Main content paragraphs (recitals & articles) ---
    content_div = soup.select_one("div.docContent, div.main, div.content")
    paragraphs = []
    if content_div:
        for p in content_div.find_all("p"):
            text = p.get_text(" ", strip=True)
            if text:
                paragraphs.append(text)
    else:
        # fallback: grab all <p> tags
        paragraphs = [p.get_text(" ", strip=True) for p in soup.find_all("p") if p.get_text(strip=True)]

    # --- Extract Whereas clauses ---
    whereas = []
    collect = False
    for p in paragraphs:
        if p.startswith("Whereas") or p.startswith("(1)"):
            collect = True
        if collect:
            whereas.append(p)
        if "HAS ADOPTED THIS REGULATION" in p:
            break

    # --- Extract Annex / first table ---
    tables = []
    for tbl in soup.select("table"):
        rows = []
        for tr in tbl.find_all("tr"):
            cells = [td.get_text(" ", strip=True) for td in tr.find_all(["td", "th"])]
            if cells:
                rows.append(cells)
        if rows:
            tables.append(rows)
    table_preview = tables[0][:8] if tables else []

    return {
        "URL": url,
        "Title": title,
        "Date": date,
        "Whereas": whereas[:10],
        "TablePreview": table_preview,
    }


if __name__ == "__main__":
    data = scrape_eu_regulation("32024R1987")

    print("\n🧾 TITLE:", data["Title"])
    print("📅 DATE:", data["Date"])
    print("\n📜 WHEREAS (first few):")
    for w in data["Whereas"]:
        print("-", w)

    print("\n📊 TABLE PREVIEW:")
    for row in data["TablePreview"]:
        print(row)
