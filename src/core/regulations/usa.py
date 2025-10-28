# usa.py
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import requests, os, json

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"

if not ENV_PATH.exists():
    ENV_PATH = BASE_DIR.parent / ".env"

load_dotenv(dotenv_path=ENV_PATH)

API_KEY = os.getenv("GOVINFO_API_KEY")

print(f"Loaded .env from: {ENV_PATH}")
print(f"GOVINFO_API_KEY found: {'Yes' if API_KEY else 'No'}")

app = FastAPI(title="ComplianceAI - GovInfo Regulation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/federal_regulations")
async def fetch_federal_regulations(
    query: str = Query("data privacy"),
    limit: int = Query(5)
):
    """Fetch real U.S. federal regulations using GovInfo API."""
    if not API_KEY:
        return {"error": "Missing GOVINFO_API_KEY"}

    url = f"https://api.govinfo.gov/search?api_key={API_KEY}"
    payload = {
        "query": query,
        "collection": ["CFR", "FR"],  
        "offsetMark": "*",            
        "pageSize": limit
    }

    resp = requests.post(url, json=payload)
    if resp.status_code != 200:
        return {"error": f"GovInfo API failed with {resp.status_code}", "details": resp.text}

    data = resp.json()
    formatted_results = []

    for item in data.get("results", []):
        formatted_results.append({
            "title": item.get("title"),
            "packageId": item.get("packageId"),
            "collection": item.get("collectionCode"),
            "agency": item.get("governmentAuthor", []),
            "dateIssued": item.get("dateIssued"),
            "lastModified": item.get("lastModified"),
            "url": f"https://www.govinfo.gov/app/details/{item.get('packageId')}",
            "download": item.get("download", {}),
        })

    return {
        "query": query,
        "count": data.get("count"),
        "results": formatted_results
    }

if __name__ == "__main__":
    if not API_KEY:
        print("Missing GOVINFO_API_KEY in your .env file")
        exit()

    query = input("Enter a topic to search for regulations (e.g., cybersecurity): ").strip() or "data privacy"
    limit = int(input("Enter how many results to fetch (default 5): ") or 5)
    url = f"https://api.govinfo.gov/search?api_key={API_KEY}"
    headers = {"Content-Type": "application/json"}

    payload = json.dumps({
        "query": query,
        "collection": ["CFR", "FR"],
        "offsetMark": "*",
        "pageSize": limit
    })

    response = requests.post(url, data=payload, headers=headers)
    if response.status_code != 200:
        print(f"API Error: {response.status_code}\n{response.text}")
        exit()

    data = response.json()
    results = data.get("results", [])

    if not results:
        print("⚠️ No results found.")
    else:
        print(f"✅ Found {len(results)} regulations:\n")
        for item in results:
            print(f"📘 {item.get('title')}")
            print(f"   Agency: {', '.join(item.get('governmentAuthor', []))}")
            print(f"   Date: {item.get('dateIssued')}")
            print(f"   URL: https://www.govinfo.gov/app/details/{item.get('packageId')}\n")

    # Optional: Save to file
    with open("govinfo_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
        print("💾 Results saved to govinfo_results.json")
