import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_market_insight(company_name, competitors, filings):
    """
    Generate an AI-based compliance insight about a company
    using its name, competitors, and their filings.
    """

    # --- Step 1: Build a clean structured prompt for GPT ---
    competitors_list = ", ".join(competitors) if competitors else "N/A"
    filings_summary = (
        "\n".join(filings) if isinstance(filings, list) else str(filings)
    )

    prompt = f"""
    You are a compliance and market intelligence analyst.
    Provide a professional insight report about **{company_name}**.

    - Competitors: {competitors_list}
    - Filings Data (summarized): {filings_summary}

    Include:
    1. Compliance strengths or transparency initiatives.
    2. Key risks or weaknesses (e.g. regulation, privacy, data handling).
    3. Strategic recommendations for better compliance or reputation.
    Keep your answer concise (under 200 words), and formatted for readability.
    """

    # --- Step 2: Call GPT (LLM) ---
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
    )

    # --- Step 3: Return clean text ---
    return response.choices[0].message.content.strip()

def extract_document_metadata(text):
    """
    Extract structured metadata from a document using GPT-4o-mini.
    Input: plain text extracted from PDF or DOCX
    Output: structured JSON (dictionary)
    """

    extraction_prompt = f"""
    You are a compliance document metadata extractor.
    Return ONLY valid JSON. No explanations.

    Extract the following fields:

    document_type
    category
    regulated_under
    company_names
    supplier_name
    competitors
    address
    country
    jurisdiction
    industry
    department_owner
    contact_email
    effective_date
    last_updated
    contract_expiration

    key_clauses {{
        data_retention
        incident_response
        access_control
        encryption
        data_sharing
        consent
        children_data
        data_transfer
    }}

    risk_keywords
    summary_short
    summary_bullets
    risk_summary
    regulations_mentioned
    frameworks_mentioned

    Document text:
    ---
    {text[:15000]}
    ---
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0,
        max_tokens=1200,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "Extract compliance metadata. Return JSON only."},
            {"role": "user", "content": extraction_prompt}
        ],
    )

    import json
    try:
        return json.loads(response.choices[0].message.content)
    except:
        return {
            "error": "Could not parse JSON",
            "raw": response.choices[0].message.content,
        }
