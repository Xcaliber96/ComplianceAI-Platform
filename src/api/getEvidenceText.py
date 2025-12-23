#!/usr/bin/env python3
"""
getevidencetext.py

Standalone utility to extract audit-grade evidence text
from a PDF file.

Usage:
    python getevidencetext.py evidence.pdf
"""

import sys
import os
import json
import io
import re
from typing import List, Dict


# ---------------------------------------------------
# TEXT EXTRACTION
# ---------------------------------------------------

def extract_text_from_pdf(pdf_path: str) -> str:
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"File not found: {pdf_path}")

    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()

    # 1️⃣ PyMuPDF (best)
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text("text") + "\n"
        if text.strip():
            return text
    except Exception as e:
        print("[WARN] PyMuPDF failed:", e)

    # 2️⃣ PDFMiner
    try:
        from pdfminer.high_level import extract_text
        text = extract_text(io.BytesIO(pdf_bytes))
        if text.strip():
            return text
    except Exception as e:
        print("[WARN] PDFMiner failed:", e)

    # 3️⃣ PyPDF2 (last resort)
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(io.BytesIO(pdf_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text
    except Exception as e:
        print("[ERROR] PyPDF2 failed:", e)

    return ""


# ---------------------------------------------------
# EVIDENCE NORMALIZATION (AUDIT-GRADE)
# ---------------------------------------------------

def extract_evidence_chunks(
    text: str,
    min_length: int = 120,
    max_chunks: int = 25
) -> List[Dict]:
    """
    Convert raw PDF text into paragraph-level evidence chunks.
    This matches how auditors treat evidence.
    """

    # Normalize line endings
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Split ONLY on true paragraph breaks (blank lines)
    raw_paragraphs = re.split(r"\n\s*\n", text)

    cleaned_paragraphs = []

    for para in raw_paragraphs:
        # Join wrapped lines inside a paragraph
        joined = " ".join(line.strip() for line in para.split("\n"))
        joined = re.sub(r"\s+", " ", joined).strip()

        if len(joined) >= min_length:
            cleaned_paragraphs.append(joined)

    evidence = []
    for idx, paragraph in enumerate(cleaned_paragraphs[:max_chunks], start=1):
        evidence.append({
            "id": f"ev-{idx}",
            "type": "policy_statement",
            "text": paragraph
        })

    return evidence

def main():
    if len(sys.argv) < 2:
        print("Usage: python getevidencetext.py <evidence.pdf>")
        sys.exit(1)

    pdf_path = sys.argv[1]

    print("\n==============================")
    print(" EVIDENCE TEXT EXTRACTION TOOL")
    print("==============================\n")
    print(f"File: {pdf_path}\n")

    try:
        text = extract_text_from_pdf(pdf_path)
    except Exception as e:
        print("[ERROR] Failed to extract text:", e)
        sys.exit(1)

    if not text.strip():
        print("[ERROR] No text extracted from file.")
        sys.exit(1)

    evidence_chunks = extract_evidence_chunks(text)

    if not evidence_chunks:
        print("[INFO] No evidence-grade paragraphs found.")
        sys.exit(0)

    print(f"Extracted {len(evidence_chunks)} evidence items:\n")

    for ev in evidence_chunks:
        print(f"--- {ev['id']} ---")
        print(ev["text"])
        print()

    output_file = os.path.splitext(os.path.basename(pdf_path))[0] + "_evidence.json"

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(
            {
                "file": os.path.basename(pdf_path),
                "evidence": evidence_chunks
            },
            f,
            indent=2,
            ensure_ascii=False
        )

    print(f"\nEvidence saved to: {output_file}")
    print("\nDone.\n")


if __name__ == "__main__":
    main()
