import os
import numpy as np
import re
import json
import requests
from PyPDF2 import PdfReader
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import os
from huggingface_hub import InferenceClient



# --- 1. Configuration and Setup ---
SBERT_MODEL_NAME = 'all-mpnet-base-v2' 
COMPLIANCE_THRESHOLD = 60.0 # Adjusted threshold for semantic scoring

HF_API_TOKEN = os.environ.get("HF_API_TOKEN")
HEADERS = {"Authorization": f"Bearer {HF_API_TOKEN}"} if HF_API_TOKEN else {}

client = InferenceClient(
    provider="featherless-ai",
    api_key=os.environ["HF_API_TOKEN"],
)

try:
    MODEL = SentenceTransformer(SBERT_MODEL_NAME)
    print(f"SBERT Model loaded successfully: {SBERT_MODEL_NAME}")
except Exception as e:
    print(f"FATAL ERROR: Could not load SBERT model. Error: {e}")
    exit(1)

# The Regulation Library (Customized for Dow's focus areas)
REGULATION_LIBRARY = [
    {
        "Reg_ID": "HIPAA-164.312(b)",
        "Requirement_Text": "The covered entity must implement hardware, software, and/or procedural mechanisms that record and examine activity in information systems that contain or use electronic protected health information (ePHI). This includes audit controls and logs.",
        "Risk_Rating": "High (Data Security)",
        "Target_Area": "Technical Control, Audit/Logging",
        "Dow_Focus": "Eliminating Issues, Avoiding Risk"
    },
    {
        "Reg_ID": "HIPAA-164.306(a)",
        "Requirement_Text": "Ensure the confidentiality, integrity, and availability of all electronic protected health information (ePHI) the covered entity creates, receives, maintains, or transmits.",
        "Risk_Rating": "High (Data Integrity)",
        "Target_Area": "Administrative Policy, Data Security",
        "Dow_Focus": "Long-Term Solutions, Avoiding Risk"
    },
    {
        "Reg_ID": "SEC-R404.1",
        "Requirement_Text": "Policy must establish a code of ethics that provides for the review of personal trading, including procedures for reporting and review of conflicts of interest.",
        "Risk_Rating": "Critical (Financial/Legal)",
        "Target_Area": "Employee Conduct, Conflict of Interest",
        "Dow_Focus": "Avoiding Conflicts of Interest, Proper Usage"
    }
]


# --- 2. Document Processing Functions ---

def extract_text_from_pdf(pdf_path):
    """Extracts all text from a local PDF file using PyPDF2."""
    text = ""
    try:
        with open(pdf_path, 'rb') as file:
            reader = PdfReader(file)
            for page in reader.pages:
                text += page.extract_text() or ""
        return text
    except FileNotFoundError:
        return None
    except Exception as e:
        print(f"An error occurred during PDF reading: {e}")
        return None

def chunk_text_by_sentences(text, max_sentences=4):
    """Splits text into context-preserving chunks for embedding."""
    # Simple regex to split text into sentences (a rough split for the MVP)
    sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', text)
    
    chunks = []
    current_chunk = []
    
    for sentence in sentences:
        if len(current_chunk) >= max_sentences:
            chunks.append(" ".join(current_chunk))
            current_chunk = []
        current_chunk.append(sentence.strip())

    if current_chunk:
        chunks.append(" ".join(current_chunk))
        
    # Generate embeddings for each chunk
    # This must be run on the final list of chunks
    chunk_embeddings = MODEL.encode(chunks, convert_to_numpy=True)
    
    # Return a list of tuples: (original_chunk_text, embedding)
    return [(chunk, embedding.reshape(1, -1)) for chunk, embedding in zip(chunks, chunk_embeddings)]


# --- 3. Core SBERT and Scoring Functions ---

def get_sbert_embedding(text):
    """Generates an embedding vector for the given text using the local SBERT model."""
    if not text:
        return None
    return MODEL.encode([text], convert_to_numpy=True).reshape(1, -1)

def calculate_cosine_similarity(emb1, emb2):
    """Calculates the cosine similarity between two embeddings."""
    if emb1 is None or emb2 is None:
        return 0.0
    return cosine_similarity(emb1, emb2)[0][0]
def generate_llm_narrative(reg_text, evidence_chunk):
    """
    Generates a narrative explanation for a compliance gap using the Hugging Face InferenceClient.
    Uses mistralai/Mistral-7B-Instruct-v0.2 (through Featherless provider).
    """
    if not HF_API_TOKEN:
        return "Narrative generation skipped: HF_TOKEN not set."

    prompt = f"""
    You are a compliance analyst. Compare the following REGULATION with the POLICY EVIDENCE
    and state the compliance GAP in one clear sentence.

    REGULATION: "{reg_text}"

    POLICY EVIDENCE: "{evidence_chunk[:500]}"

    GAP SUMMARY:
    """

    try:
        completion = client.chat.completions.create(
            model="mistralai/Mistral-7B-Instruct-v0.2",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.3
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        return f"LLM API Error: {e}"


# --- 4. Main Pipeline Execution ---

if __name__ == "__main__":
    COMPANY_POLICY_PATH = "test_policy.pdf"
    
    # 1. ATTEMPT TO EXTRACT TEXT FROM PDF
    print(f"1. Attempting to extract text from {COMPANY_POLICY_PATH}...")
    policy_text = extract_text_from_pdf(COMPANY_POLICY_PATH)
    
    if policy_text is None or not policy_text.strip():
        print("\nFATAL ERROR: PDF extraction failed or file is empty.")
        print(f"Please ensure '{COMPANY_POLICY_PATH}' exists and is not an image-only PDF.")
        exit(1)
        
    # 2. Chunk and Embed the Policy Document
    print(f"2. Successfully extracted {len(policy_text)} characters. Chunking and embedding with {SBERT_MODEL_NAME}...")
    policy_chunks_with_embeddings = chunk_text_by_sentences(policy_text)
    
    if not policy_chunks_with_embeddings:
        print("Error: Policy text could not be processed into chunks. Exiting.")
        exit(1)
        
    print(f"Policy successfully chunked into {len(policy_chunks_with_embeddings)} segments.")
    print("\n--- Running Nested Compliance Check (SBERT Local) ---")

    compliance_results = []
    
    # 3. Outer Loop: Iterate through each Regulation Requirement
    for regulation in REGULATION_LIBRARY:
        reg_id = regulation['Reg_ID']
        reg_text = regulation['Requirement_Text']
        
        # Embed the regulation text once
        reg_embedding = get_sbert_embedding(reg_text)
        
        best_match_score = 0.0
        best_match_chunk = "N/A"
        
        # 4. Inner Loop: Compare Regulation to EVERY Policy Chunk
        for chunk_text, chunk_embedding in policy_chunks_with_embeddings:
            score = calculate_cosine_similarity(chunk_embedding, reg_embedding)
            
            if score > best_match_score:
                best_match_score = score
                best_match_chunk = chunk_text

        # 5. Aggregate Results for the Dashboard
        final_score = best_match_score * 100
        is_compliant = final_score >= COMPLIANCE_THRESHOLD # Use the adjusted threshold
        
        # Generate Narrative for Gaps Only (Value-Add Feature)
        narrative = ""
        if not is_compliant:
            print(f"   [Processing Narrative for {reg_id}...] (Requires internet/HF_TOKEN)")
            narrative = generate_llm_narrative(reg_text, best_match_chunk)

        compliance_results.append({
            "Reg_ID": reg_id,
            "Risk_Rating": regulation['Risk_Rating'],
            "Target_Area": regulation['Target_Area'],
            "Dow_Focus": regulation['Dow_Focus'],
            "Compliance_Score": final_score,
            "Evidence_Chunk": best_match_chunk,
            "Is_Compliant": is_compliant,
            "Narrative_Gap": narrative
        })

    # --- 6. Generate Dow-Specific Report ---
    
    total_requirements = len(compliance_results)
    gaps = [r for r in compliance_results if not r['Is_Compliant']]
    overall_compliance = (total_requirements - len(gaps)) / total_requirements * 100
    
    print("\n" + "="*80)
    print("      DOW COMPLIANCE & RISK MANAGEMENT REPORT (MVP) - FULL AI CHECK")
    print("="*80)
    print(f"MODEL USED: {SBERT_MODEL_NAME}")
    print(f"COMPLIANCE THRESHOLD: {COMPLIANCE_THRESHOLD:.1f}%")
    print(f"OVERALL COMPLIANCE SCORE: {overall_compliance:.2f}% (Compliance verified at the {COMPLIANCE_THRESHOLD:.1f}% confidence level)")
    print(f"TOTAL REQUIREMENTS CHECKED: {total_requirements}")
    print(f"HIGH-RISK GAPS FOUND: {len(gaps)}")
    print("="*80)
    
    # Display Alerts and Narratives
    print("\n PROACTIVE ALERTS (Action Required - Addressing Issues Promptly & Training)\n")
    
    for result in sorted(gaps, key=lambda x: x['Compliance_Score']):
        print(f"   [GAP: {result['Reg_ID']}] - RISK: {result['Risk_Rating']} (Score: {result['Compliance_Score']:.2f}%)")
        print(f"   Policy Area: {result['Target_Area']} (Dow Focus: {result['Dow_Focus']})")
        print(f"    NARRATIVE GAP: {result['Narrative_Gap']}")
        print(f"   Evidence Found: '{result['Evidence_Chunk'][:80]}...'")
        print("-" * 40)
        
    print("\n COMPLIANT AREAS (Long-Term Solutions & Confidence Confirmed)\n")
    for result in [r for r in compliance_results if r['Is_Compliant']]:
        print(f"   [OK: {result['Reg_ID']}] - Score: {result['Compliance_Score']:.2f}%")
        print("-" * 40)