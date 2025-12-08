import requests

BASE_URL = "https://api.opencorporates.com/v0.4"

def oc_search_company(name: str):
    """Search a company by legal name."""
    try:
        url = f"{BASE_URL}/companies/search"
        params = {"q": name, "per_page": 5}
        res = requests.get(url, params=params, timeout=10)
        data = res.json()

        if "results" not in data:
            return {"error": "Unexpected response"}

        companies = data["results"].get("companies", [])

        if not companies:
            return {"error": "No companies found"}

        # Return first match
        first = companies[0]["company"]

        return {
            "name": first.get("name"),
            "company_number": first.get("company_number"),
            "jurisdiction": first.get("jurisdiction_code"),
            "incorporation_date": first.get("incorporation_date"),
            "company_type": first.get("company_type"),
            "inactive": first.get("inactive"),
            "current_status": first.get("current_status"),
            "registered_address": first.get("registered_address_in_full"),
        }

    except Exception as e:
        return {"error": str(e)}


def oc_get_company(jurisdiction: str, company_number: str):
    """Get full company details including officers and subsidiaries."""
    try:
        url = f"{BASE_URL}/companies/{jurisdiction}/{company_number}"
        res = requests.get(url, timeout=10)
        data = res.json()

        if "results" not in data:
            return {"error": "Unexpected response"}

        company = data["results"].get("company", {})

        officers = company.get("officers", [])
        parents = company.get("corporate_groupings", [])
        data_sources = company.get("data", {})

        return {
            "name": company.get("name"),
            "status": company.get("current_status"),
            "incorporated": company.get("incorporation_date"),
            "registered_address": company.get("registered_address_in_full"),
            "officers": [off["officer"]["name"] for off in officers],
            "parents": parents,
            "raw": company,
        }

    except Exception as e:
        return {"error": str(e)}
if __name__ == "__main__":
    name = input("Enter legal company name: ")

    print("\n=== Searching OpenCorporates ===")
    basic = oc_search_company(name)
    print(basic)

    if "error" not in basic:
        jurisdiction = basic["jurisdiction"]
        number = basic["company_number"]

        print("\n=== Fetching Full Company Record ===")
        full = oc_get_company(jurisdiction, number)
        print(full)
