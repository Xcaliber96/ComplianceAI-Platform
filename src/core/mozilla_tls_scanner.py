import requests
import time

def ssllabs_scan(domain: str):
    api = "https://api.ssllabs.com/api/v3/analyze"

    params = {"host": domain, "publish": "off", "startNew": "on", "all": "done"}

    print(f"[*] Starting SSL Labs scan for {domain}")
    
    resp = requests.get(api, params=params).json()

    # Poll until ready
    while resp.get("status") in ("DNS", "IN_PROGRESS"):
        print(f"[*] Scan status: {resp.get('status')}")
        time.sleep(5)
        resp = requests.get(api, params={"host": domain}).json()

    return resp


# Test
if __name__ == "__main__":
    domain = input("Domain: ")
    result = ssllabs_scan(domain)
    print(result)
