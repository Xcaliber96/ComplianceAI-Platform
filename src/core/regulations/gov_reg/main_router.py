import requests
from src.core.regulations.gov_reg.process_input import detect_input_type, INPUT_PACKAGE, INPUT_GRANULE, INPUT_CFR, INPUT_TOPIC, search_federal_register, get_full_text, extract_citations, clean_citations
from src.core.regulations.gov_reg.summary import get_package_summary, get_granules


def route(user_input: str):
    input_type = detect_input_type(user_input)
    # print(input_type)
    if input_type == INPUT_PACKAGE:
        # OPTIONAL: include granules
        granules_link = package_summary.get("granulesLink")
        if granules_link:
            package_summary["granules"] = get_granules(granules_link)

        return {
            "input_type": "package",
            "package_id": user_input,
            "summary": package_summary
        }

    # CFR citation summary
    if input_type == INPUT_CFR:

        package_summary = get_package_summary(package_id)
        granules_link = package_summary.get("granulesLink")
        granules = get_granules(granules_link)
        cfr_list, _ = extract_citations(full_text)

        if cfr_list:
            all_citations.extend(cfr_list)
    
        # Clean and deduplicate citations
        unique_citations = clean_citations(all_citations)
        print("PACKAGEIDDDD: ", package_id)
        # get_package_summary(unique_citations)
        return {
            "input_type": "topic",
            "topic": user_input,
            "citations": unique_citations,
            "Summary":package_summary,
        }
        return None

    # Granules (placeholder for future implementation)
    if input_type == INPUT_GRANULE:
        return {"error": "Granule handler not implemented yet"}

    if input_type == INPUT_TOPIC:

        fr_results = search_federal_register(user_input)
        all_citations = []

        for doc in fr_results:
            doc_number = doc.get("document_number")
            if not doc_number:
                continue

            full_text, package_id = get_full_text(doc_number)
        
            package_summary = get_package_summary(package_id)
            granules_link = package_summary.get("granulesLink")
            granules = get_granules(granules_link)
            cfr_list, _ = extract_citations(full_text)

            if cfr_list:
                all_citations.extend(cfr_list)
        
        # Clean and deduplicate citations
        unique_citations = clean_citations(all_citations)
        print("PACKAGEIDDDD: ", package_id)
        # get_package_summary(unique_citations)
        return {
            "input_type": "topic",
            "topic": user_input,
            "citations": unique_citations,
            "Summary":package_summary,
        }
        return {"error": "Unknown input", "detected": input_type}

if __name__ == "__main__":
    user_input = input("Enter something: ")
    result = route(user_input)
    print(result)