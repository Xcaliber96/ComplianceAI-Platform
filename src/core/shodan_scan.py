import os
import socket
import shodan


def shodan_scan(domain: str):
    """Resolve domain to IP and scan using Shodan."""

  
    SHODAN_API_KEY = os.getenv("SHODAN_API_KEY")
    if not SHODAN_API_KEY:
        return {"error": "SHODAN_API_KEY not found in environment variables"}

   
    try:
        ip = socket.gethostbyname(domain)
        print(f"[+] Resolved {domain} → {ip}")
    except Exception as e:
        return {"error": f"Could not resolve domain: {e}"}

    try:
        api = shodan.Shodan(SHODAN_API_KEY)
        result = api.host(ip)

        scan_output = {
            "domain": domain,
            "ip": ip,
            "country": result.get("country_name"),
            "organization": result.get("org"),
            "last_seen": result.get("last_update"),
            "open_ports": result.get("ports", []),
            "vulnerabilities": result.get("vulns", []),
            "tags": result.get("tags", []),
            "data": []
        }

        # Per-port metadata
        for service in result.get("data", []):
            scan_output["data"].append({
                "port": service.get("port"),
                "banner": service.get("data"),
                "product": service.get("product"),
                "version": service.get("version"),
                "transport": service.get("transport")
            })

        return scan_output

    except shodan.APIError as e:
        return {"error": f"Shodan API error: {e}"}


# ---------------------------------------------------
# ⭐ RUN DIRECTLY
# ---------------------------------------------------
def main():
    print("=== Shodan Company Scanner ===")
    domain = input("Enter company domain (example: tesla.com): ").strip()

    if not domain:
        print("No domain given. Exiting...")
        return

    results = shodan_scan(domain)

    print("\n=== Scan Results ===")
    print(results)


if __name__ == "__main__":
    main()
