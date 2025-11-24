import socket
import shodan
import requests
import time
import re
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlparse, urljoin

SHODAN_API_KEY = os.getenv("SHODAN_API_KEY")

def shodan_scan(domain: str):
    try:
        ip = socket.gethostbyname(domain)
    except Exception as e:
        return {"error": f"DNS resolution failed: {e}"}

    try:
        api = shodan.Shodan(SHODAN_API_KEY)
        result = api.host(ip)

        services = []
        for service in result.get("data", []):
            services.append({
                "port": service.get("port"),
                "banner": service.get("data"),
                "product": service.get("product"),
                "version": service.get("version"),
                "transport": service.get("transport"),
            })

        return {
            "ip": ip,
            "country": result.get("country_name"),
            "organization": result.get("org"),
            "last_seen": result.get("last_update"),
            "open_ports": result.get("ports", []),
            "vulnerabilities": result.get("vulns", []),
            "tags": result.get("tags", []),
            "services": services
        }

    except Exception as e:
        return {"error": f"Shodan scan failed: {e}"}

def ssllabs_scan(domain: str):
    api = "https://api.ssllabs.com/api/v3/analyze"

    try:
        params = {"host": domain, "publish": "off", "startNew": "on", "all": "done"}
        response = requests.get(api, params=params).json()

        while response.get("status") in ("DNS", "IN_PROGRESS"):
            print(f"[*] TLS Scan status: {response.get('status')}")
            time.sleep(5)
            response = requests.get(api, params={"host": domain}).json()

        return response

    except Exception as e:
        return {"error": f"SSL Labs scan failed: {e}"}

def detect_technologies(domain: str):
    try:
        url = f"https://{domain}"
        response = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})

        html = response.text.lower()
        headers = response.headers
        tech = set()

        # Frameworks
        if "react" in html:
            tech.add("React")
        if "next" in html:
            tech.add("Next.js")
        if "vue" in html:
            tech.add("Vue.js")
        if "angular" in html:
            tech.add("Angular")

        # Libraries
        if "jquery" in html:
            tech.add("jQuery")

        # CSS Frameworks
        if "bootstrap" in html:
            tech.add("Bootstrap")
        if "tailwind" in html:
            tech.add("Tailwind CSS")

        # Server headers
        server = headers.get("Server", "").lower()
        if "cloudflare" in server:
            tech.add("Cloudflare")
        if "nginx" in server:
            tech.add("Nginx")
        if "apache" in server:
            tech.add("Apache")
        if "render" in server:
            tech.add("Render Hosting")

        # Analytics / SaaS
        if "google-analytics" in html or "gtag(" in html:
            tech.add("Google Analytics")
        if "googletagmanager" in html:
            tech.add("Google Tag Manager")
        if "stripe" in html:
            tech.add("Stripe")
        if "shopify" in html:
            tech.add("Shopify")
        if "hubspot" in html:
            tech.add("HubSpot")

        return list(tech)

    except Exception as e:
        return {"error": f"Technology detection failed: {e}"}


POSSIBLE_POLICY_PATHS = [
    "privacy", "privacy-policy", "legal/privacy", "legal",
    "policy", "policies", "security", "terms", "terms-of-service"
]

def find_policy_url(domain: str):
    for path in POSSIBLE_POLICY_PATHS:
        url = f"https://{domain}/{path}"
        try:
            r = requests.get(url, timeout=8, headers={"User-Agent": "Mozilla/5.0"})
            if r.status_code == 200:
                return url
        except:
            pass
    return None

def scrape_policy_text(url: str):
    try:
        r = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
        soup = BeautifulSoup(r.text, "html.parser")
        for tag in soup(["script", "style"]):
            tag.extract()
        text = soup.get_text(separator="\n")
        return re.sub(r"\n+", "\n", text).strip()[:5000]
    except Exception as e:
        return f"Policy scrape failed: {e}"

def get_company_policy(domain: str):
    url = find_policy_url(domain)
    if not url:
        return {
            "policy_url": None,
            "policy_text": "No policy page found."
        }
    text = scrape_policy_text(url)
    return {
        "policy_url": url,
        "policy_text": text
    }

def categorize_domain(host: str):
    """Very simple categorizer for known third-party domains."""
    host = host.lower()
    categories = []

    # Analytics / Marketing
    if any(k in host for k in ["google-analytics", "googletagmanager", "googletagservices",
                               "doubleclick", "facebook", "fbcdn", "hotjar", "mixpanel", "segment"]):
        categories.append("Analytics/Tracking")

    # Ads
    if any(k in host for k in ["doubleclick", "adservice", "adsystem", "adnxs"]):
        categories.append("Advertising")

    # Payment
    if any(k in host for k in ["stripe", "paypal", "braintree", "adyen"]):
        categories.append("Payments")

    # CRM / Chat
    if any(k in host for k in ["hubspot", "intercom", "zendesk", "freshdesk", "salesforce"]):
        categories.append("CRM/Support")

    # CDN
    if any(k in host for k in ["cloudflare", "akamai", "fastly", "cdn", "cloudfront.net", "jsdelivr", "cdnjs"]):
        categories.append("CDN")

    # Marketing Automation
    if any(k in host for k in ["marketo", "pardot", "mailchimp", "sendgrid"]):
        categories.append("Email/Marketing Automation")

    if not categories:
        categories.append("Other/Uncategorized")

    return categories


def discover_third_parties(domain: str):
    """
    Discover 3rd-party domains by scanning HTML tags that reference external sources.
    """
    try:
        url = f"https://{domain}"
        res = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
        soup = BeautifulSoup(res.text, "html.parser")

        base_host = domain.lower()
        if base_host.startswith("www."):
            base_host = base_host[4:]

        resources = []

        def process_url(tag_name, attr_name, tag):
            src = tag.get(attr_name)
            if not src:
                return
            full_url = urljoin(url, src)
            parsed = urlparse(full_url)

            if not parsed.scheme.startswith("http"):
                return

            host = parsed.hostname or ""
            low_host = host.lower()

            # First-party? skip
            if low_host == base_host or low_host.endswith("." + base_host):
                return

            cats = categorize_domain(low_host)

            resources.append({
                "tag": tag_name,
                "attribute": attr_name,
                "url": full_url,
                "host": low_host,
                "categories": cats,
            })

        # script src
        for tag in soup.find_all("script"):
            process_url("script", "src", tag)

        # link href
        for tag in soup.find_all("link"):
            process_url("link", "href", tag)

        # img src
        for tag in soup.find_all("img"):
            process_url("img", "src", tag)

        # iframe src
        for tag in soup.find_all("iframe"):
            process_url("iframe", "src", tag)

        # a href
        for tag in soup.find_all("a"):
            process_url("a", "href", tag)

        # form action
        for tag in soup.find_all("form"):
            process_url("form", "action", tag)

        # Aggregate by domain
        domain_map = {}
        for r in resources:
            host = r["host"]
            if host not in domain_map:
                domain_map[host] = {
                    "host": host,
                    "categories": set(),
                    "sample_urls": set(),
                }
            for c in r["categories"]:
                domain_map[host]["categories"].add(c)
            domain_map[host]["sample_urls"].add(r["url"])

        third_party_summary = []
        for host, info in domain_map.items():
            third_party_summary.append({
                "host": host,
                "categories": sorted(info["categories"]),
                "sample_urls": sorted(info["sample_urls"])[:5],  # cap a few examples
            })

        return {
            "third_party_domains": sorted(domain_map.keys()),
            "third_party_summary": third_party_summary,
            "raw_references": resources,  # can be removed if too noisy
        }

    except Exception as e:
        return {"error": f"Third-party discovery failed: {e}"}


def full_company_scan(domain: str):
    print(f"\n=== Running Full Scan for {domain} ===")

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {
            executor.submit(shodan_scan, domain): "shodan",
            executor.submit(ssllabs_scan, domain): "tls",
            executor.submit(detect_technologies, domain): "tech",
            executor.submit(get_company_policy, domain): "policy",
            executor.submit(discover_third_parties, domain): "third_parties",
        }

        results = {"domain": domain}

        for future in as_completed(futures):
            key = futures[future]
            try:
                results[key] = future.result()
            except Exception as e:
                results[key] = {"error": str(e)}

    return results

def main():
    print("=== Full Company Scanner ===")
    domain = input("Enter domain: ").strip()
    if not domain:
        print("Domain required.")
        return

    results = full_company_scan(domain)

    print("\n=== RESULTS ===")
    print(results)


if __name__ == "__main__":
    main()
