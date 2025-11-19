import socket
import shodan

SHODAN_API_KEY = "aCh5ugAMYnetYU0D0Dv30vXzD3V9egwi"

def shodan_scan(domain: str):
    """Resolve domain to IP and scan using Shodan."""
    
    try:
        # Step 1: Resolve domain to IP
        ip = socket.gethostbyname(domain)
        print(f"[+] Resolved {domain} → {ip}")
    except Exception as e:
        return {"error": f"Could not resolve domain: {e}"}

    try:
        # Step 2: Initialize Shodan API
        api = shodan.Shodan(SHODAN_API_KEY)

        # Step 3: Query Shodan for the IP
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

        # Extract per-port information
        for service in result.get("data", []):
            scan_output["data"].append({
                "port": service.get("port"),
                "banner": service.get("data"),
                "product": service.get("product"),
                "version": service.get("version"),
                "transport": service.get("transport"),
            })

        return scan_output

    except shodan.APIError as e:
        return {"error": str(e)}



# ---------------------------------------------------
# ⭐ MAIN FUNCTION — You can call it directly
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


# ---------------------------------------------------
# ⭐ RUN MAIN IF FILE EXECUTED DIRECTLY
# ---------------------------------------------------
if __name__ == "__main__":
    main()
