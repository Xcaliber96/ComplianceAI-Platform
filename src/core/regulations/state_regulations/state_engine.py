from src.core.regulations.state_regulations.state_michigan import (
    search_michigan,
    fetch_rule_by_number,
    is_michigan_rule_number,
    format_michigan_rule,
)

def search_state_regulations(state: str, query: str):
    state = state.lower().strip()

    if state in ("michigan", "mi"):

        # Case 1 — Rule number
        if is_michigan_rule_number(query):
            rule = fetch_rule_by_number(query)
            if rule:
                return [rule]  # already formatted
            return [{"error": "No rule found for this rule number."}]

        # Case 2 — Topic search
        results = search_michigan(query)
        formatted = []

        for row in results:
            url = row["url"]
            full = fetch_rule_by_number(row["id"]) if row.get("id") else None
            if not full:
                full = format_michigan_rule(fetch_michigan_rule(url), rule_id=row["id"])
            formatted.append(full)

        return formatted

    return [{"error": f"State '{state}' not supported."}]
