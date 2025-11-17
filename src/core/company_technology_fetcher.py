# compliance_scanners.py

import socket
import requests
from bs4 import BeautifulSoup

async def scan_tls(domain: str):
    url = (
        f"https://http-observatory.security.mozilla.org/api/v1/analyze"
        f"?host={domain}&rescan=true"
    )
    try:
        response = requests.get(url, timeout=15)
        data = response.json()

        return {
            "grade": data.get("grade"),
            "score": data.get("score"),
            "tests_passed": data.get("tests_passed"),
            "tests_failed": data.get("tests_failed"),
        }

    except Exception as e:
        return {"error": f"TLS scan failed: {str(e)}"}

SHODAN_KEY = "YOUR_SHODAN_API_KEY"

async def scan_shodan(domain: str):
    try:
        # Get IP address of domain
        ip = socket.gethostbyname(domain)

        url = f"https://api.shodan.io/shodan/host/{ip}?key={SHODAN_KEY}"
        response = requests.get(url, timeout=15)
        data = response.json()

        return {
            "ip": ip,
            "open_ports": data.get("ports", []),
            "vulnerabilities": data.get("vulns", []),
            "country": data.get("country_name"),
            "organization": data.get("org"),
        }

    except Exception as e:
        return {"error": f"Shodan scan failed: {str(e)}"}

WAPPALYZER_KEY = "YOUR_WAPPALYZER_API_KEY"

async def scan_technologies(domain: str):
    try:
        url = "https://api.wappalyzer.com/v2/lookup/"

        headers = {"x-api-key": WAPPALYZER_KEY}
        payload = {"urls": [f"https://{domain}"]}

        response = requests.post(url, json=payload, headers=headers, timeout=15)
        data = response.json()

        if not data:
            return {"technologies": []}

        entry = data[0]

        return {
            "urls": entry.get("urls", []),
            "technologies": entry.get("technologies", []),
        }

    except Exception as e:
        return {"error": f"Technology scan failed: {str(e)}"}

async def scan_policies(domain: str):
    possible_urls = [
        f"https://{domain}/privacy",
        f"https://{domain}/privacy-policy",
        f"https://{domain}/legal",
        f"https://{domain}/security",
        f"https://{domain}/terms",
        f"https://{domain}/policies",
    ]

    results = []

    for url in possible_urls:
        try:
            html = requests.get(url, timeout=15).text
            soup = BeautifulSoup(html, "html.parser")
            text = soup.get_text(separator="\n")

            # If the page has real content, keep it
            if len(text) > 300:
                results.append({
                    "url": url,
                    "snippet": text[:1500] + "..."
                })

        except:
            continue

    return {
        "policies_found": len(results),
        "policies": results
    }

async def run_compliance_discovery(domain: str):
    tls_result = await scan_tls(domain)
    shodan_result = await scan_shodan(domain)
    tech_result = await scan_technologies(domain)
    policy_result = await scan_policies(domain)

    return {
        "domain": domain,
        "tls": tls_result,
        "shodan": shodan_result,
        "technologies": tech_result,
        "policies": policy_result
    }
