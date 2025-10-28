import re
import os
from PyPDF2 import PdfReader
from docx import Document

def read_policy_text(file_path):
    """Read text from PDF, DOCX, or TXT file."""
    if file_path.lower().endswith(".pdf"):
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text

    elif file_path.lower().endswith(".docx"):
        doc = Document(file_path)
        return "\n".join([p.text for p in doc.paragraphs])

    elif file_path.lower().endswith(".txt"):
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()

    else:
        raise ValueError("Unsupported file type (must be .pdf, .docx, or .txt)")

def extract_keywords(text):
    """Extract important words and phrases using regex + heuristics."""
    # Lowercase and remove punctuation
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)

    # Remove short or common words
    stopwords = {
        "the","and","or","in","of","on","at","a","for","by","to","is","be",
        "as","an","that","it","this","from","are","was","with","will","may",
        "not","can","must","should","could"
    }

    # Extract potential keywords (e.g., two-word phrases)
    words = [w for w in text.split() if w not in stopwords and len(w) > 3]
    bigrams = [f"{words[i]} {words[i+1]}" for i in range(len(words)-1)]

    # Combine and deduplicate
    all_terms = set(words + bigrams)

    # Filter based on compliance or security-related patterns
    patterns = [
        r"privacy", r"security", r"policy", r"access", r"risk", r"control",
        r"compliance", r"confidential", r"integrity", r"availability",
        r"protection", r"audit", r"logging", r"incident", r"data", r"user",
        r"encryption", r"retention", r"reporting", r"breach", r"monitoring",
        r"authentic", r"authorization", r"management", r"threat", r"network",
        r"personal", r"hipaa", r"gdpr", r"sox", r"nist", r"soc2", r"fisma"
    ]

    keywords = [term for term in all_terms if any(re.search(p, term) for p in patterns)]

    # Sort by length (longer phrases first)
    keywords = sorted(keywords, key=len, reverse=True)

    return keywords[:20]  # top 20 keywords

if __name__ == "__main__":
    file_path = input("Enter path to your policy file: ").strip()
    if not os.path.exists(file_path):
        print("❌ File not found!")
        exit()

    print(f"📄 Reading file: {file_path}")
    text = read_policy_text(file_path)

    print("\n🔍 Extracting keywords...")
    keywords = extract_keywords(text)

    print("\n✅ Top extracted keywords:")
    for kw in keywords:
        print("-", kw)
