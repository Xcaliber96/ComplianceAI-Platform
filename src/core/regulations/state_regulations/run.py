from src.core.regulations.state_regulations.state_michigan import (
    search_michigan,
    fetch_michigan_rule,
    fetch_rule_by_number,
    is_michigan_rule_number,
    format_michigan_rule,
)

def main():
    query = input("Enter Michigan rule number or topic: ").strip()

    if not query:
        print("No query provided.")
        return

    if is_michigan_rule_number(query):
        print("\nDetected rule number. Fetching rule...\n")
        rule = fetch_rule_by_number(query)

        if not rule:
            print("No rule found for this rule number.")
            return

        # fetch_rule_by_number ALREADY RETURNS formatted result
        print("=== MICHIGAN RULE ===")
        print("ID:", rule["id"])
        print("Title:", rule["title"])
        print("Location:", rule["location"])
        print("\nSnippet:\n")
        print("\n".join(rule["text"].splitlines()[:40]))
        return

    results = search_michigan(query)

    print("\n=== Search Results ===\n")
    if not results:
        print("No Michigan regulations found.")
        return

    for i, r in enumerate(results, start=1):
        print(f"{i}. {r['title']}")
        print(f"   URL: {r['url']}\n")

    # Preview the FIRST result
    first = results[0]
    full_rule = fetch_michigan_rule(first["url"])
    rule = format_michigan_rule(full_rule, rule_id=first.get("id"))

    print("\n=== FIRST RULE PREVIEW ===")
    print("ID:", rule["id"])
    print("Title:", rule["title"])
    print("Location:", rule["location"])
    print("\nSnippet:\n")
    print("\n".join(rule["text"].splitlines()[:40]))


if __name__ == "__main__":
    main()
