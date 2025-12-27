import os
import requests

DATE = "2025-12-01"   # <<--- you can change this
BASE_URL = f"https://www.ecfr.gov/api/versioner/v1/full/{DATE}/title-{{num}}.xml"
OUTPUT_DIR = f"ecfr_titles_{DATE}"
HEADERS = {"User-Agent": "Mozilla/5.0"}

def download_title(num: int):
    url = BASE_URL.format(num=num)
    out_path = os.path.join(OUTPUT_DIR, f"title-{num}.xml")

    try:
        print(f"Downloading Title {num} ({DATE})... ", end="")
        r = requests.get(url, headers=HEADERS, timeout=60)
        r.raise_for_status()

        if len(r.content) < 500:  # sanity check to detect empty/invalid XML
            print("ERROR: File too small, likely invalid.")
            return False

        with open(out_path, "wb") as f:
            f.write(r.content)

        print(f"OK ({len(r.content):,} bytes)")
        return True

    except Exception as e:
        print(f"FAILED - {e}")
        return False


def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    print(f"Downloading ECFR snapshot for {DATE}")
    print("--------------------------------")

    for num in range(1, 51):
        download_title(num)

    print(f"\nDone. Files saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
