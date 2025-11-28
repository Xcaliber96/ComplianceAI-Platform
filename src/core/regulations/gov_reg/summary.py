import os
import requests

API_KEY = os.getenv("GOVINFO_API_KEY")  # You can hard-code if needed

BASE = "https://api.govinfo.gov/packages"


def get_package_summary(package_id: str, api_key: str = API_KEY):

    if not api_key:
        raise ValueError("Missing API key. Set GOVINFO_API_KEY environment variable.")

    url = f"{BASE}/{package_id}/summary?api_key={api_key}"

    resp = requests.get(url)
    
    # raise error if the request failed
    resp.raise_for_status()

    return resp.json()

def get_granules(granules_link: str, api_key: str = API_KEY):
    """
    Fetches granules from a GovInfo package granules link.

    Args:
        granules_link: The 'granulesLink' URL from package summary.
        api_key: Your GovInfo API key.

    Returns:
        List of granules (dicts), or empty list if none found.
    """
    if "?" in granules_link:
        url = f"{granules_link}&api_key={api_key}"
    else:
        url = f"{granules_link}?api_key={api_key}"

    try:
        resp = requests.get(url)
        resp.raise_for_status()
        data = resp.json()
        return data.get("granules", [])
    except Exception as e:
        print(f"[ERROR] Could not fetch granules: {e}")
        return []

# if __name__ == "__main__":
#     # Simple manual test
#     test_id = "CREC-2018-01-04"
#     print(get_package_summary(test_id))
#     package_summary = get_package_summary("CREC-2018-01-04")
#     granules_link = package_summary.get("granulesLink")
#     granules = get_granules(granules_link)
#     for g in granules[:5]:  # first 5 granules
#          print(g["granuleId"], "-", g["title"])
