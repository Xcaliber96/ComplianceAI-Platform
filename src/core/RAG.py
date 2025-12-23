import os
import uuid
import re
import chromadb
import math
from datetime import datetime, timezone
from PyPDF2 import PdfReader
FALLBACK_NARRATIVE = (
    "The system could not generate an AI gap narrative for this requirement. "
    "Treat this as not fully assessed and review the evidence manually."
)

# --- Helpers required by scripts/reindex_chroma.py and others ---

try:
    from src.core.client import get_llm
except Exception:
    try:
        from src.core.client import get_llm
    except Exception:
        get_llm = None

def chunk_sentences(sentences, max_sentences=3):
    """
    Group a list of sentences into ~max_sentences-per-chunk strings.
    Returns list of chunk strings.
    """
    chunks = []
    current = []
    for s in sentences:
        if len(current) >= max_sentences:
            chunks.append(" ".join(current))
            current = []
        current.append(s)
    if current:
        chunks.append(" ".join(current))
    return chunks


def is_informative_chunk(chunk: str, min_chars: int = 30):
    """
    Heuristic filter to drop empty/boilerplate chunks.
    You can adjust min_chars if you want stricter filtering.
    """
    if not chunk:
        return False
    c = chunk.strip()
    if len(c) < min_chars:
        return False
    # drop chunks that look like page numbers or copyright lines
    low = c.lower()
    if low.isdigit() or low.startswith("page ") or "copyright" in low:
        return False
    return True


def create_embeddings_batch(text_batch, model_name="text-embedding-3-small"):
    """
    Create embeddings for a batch (list) of strings.
    Strategy:
      1. If src.core.client.get_llm() exists and returns a client, call client.embeddings.create(...)
      2. Else, if sentence-transformers is installed, use it as fallback (local embeddings)
      3. Otherwise raise a clear error.
    Returns: list of embeddings (list of lists/floats) in same order as text_batch.
    """
    if not isinstance(text_batch, (list, tuple)):
        raise ValueError("text_batch must be a list of strings")

    # Try OpenAI via centralized client
    if get_llm is not None:
        client = get_llm()
        if client is not None:
            try:
                resp = client.embeddings.create(model=model_name, input=text_batch)
                # resp may be an object with .data list of {embedding: [...]}
                data = getattr(resp, "data", None) or (resp.get("data", None) if isinstance(resp, dict) else None)
                if data:
                    embs = []
                    for item in data:
                        if hasattr(item, "embedding"):
                            embs.append(list(item.embedding))
                        elif isinstance(item, dict) and "embedding" in item:
                            embs.append(item["embedding"])
                        else:
                            raise RuntimeError("Could not parse embedding item from OpenAI response")
                    return embs
            except Exception as e:
                try:
                    import logging
                    logging.getLogger(__name__).exception("OpenAI embeddings call failed: %s", e)
                except Exception:
                    pass

    # Fallback: sentence-transformers if available
    try:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer("all-mpnet-base-v2")
        embs = model.encode(text_batch, convert_to_numpy=False, show_progress_bar=False)
        return [list(e) for e in embs]
    except Exception:
        pass

    # Last resort: helpful error
    raise RuntimeError(
        "No embeddings backend available. Install 'sentence-transformers' or set OPENAI_API_KEY and ensure src.core.client.get_llm() is available."
    )
# --- end helpers ---


# Try to import centralized LLM helper. If available use it; otherwise fall back to inline OpenAI client.
USE_CENTRALIZED_LLM = False
try:
    # preferred centralized helper (adjust depending on package layout)
    from src.core.compliance_narratives import generate_gap_summary
    USE_CENTRALIZED_LLM = True
except Exception:
    try:
        # fallback to direct llm package path (if you used llm/ earlier)
        from llm.compliance_narratives import generate_gap_summary
        USE_CENTRALIZED_LLM = True
    except Exception:
        USE_CENTRALIZED_LLM = False

# Import OpenAI only if needed for fallback behavior.
OpenAI = None
if not USE_CENTRALIZED_LLM:
    try:
        from openai import OpenAI
    except Exception:
        OpenAI = None  # will raise later if needed


class ComplianceChecker:
    def __init__(self, pdf_path, regulations, collection_name="policies",
                 compliance_threshold=0.60, top_k=1):
        self.pdf_path = pdf_path

        self.collection_name = collection_name
        self.compliance_threshold = compliance_threshold
        self.top_k = top_k
        self.regulations = []

        for reg in regulations:
            reg_id = reg.get("Reg_ID", "")
            text = reg.get("Requirement_Text", "")


            if ComplianceChecker.looks_like_cfr(text):
                print("kjfhviwhvjkenjkrjgioejivowmogiehjigoreiogjneiughjvioneivniwrtnbktrjb")
                self.regulations.extend(
                self.split_cfr_subsections(reg_id, text)
                )
            else:
                self.regulations.append(reg)
        
        self.llm_client = None
        if not USE_CENTRALIZED_LLM:
            openai_key = os.environ.get("OPENAI_API_KEY")
            print("\n========== LLM DEBUG ==========")
            print("USE_CENTRALIZED_LLM =", USE_CENTRALIZED_LLM)
            print("Env key exists?      =", bool(openai_key))
            print("Env key prefix:      =", openai_key[:12] if openai_key else None)
            print("Process ID:", os.getpid())
            print("================================\n")
            if not openai_key:
                raise ValueError("❌ OPENAI_API_KEY is not set in environment!")
            if OpenAI is None:
                raise ImportError("openai package not installed but OPENAI_API_KEY is required for inline LLM fallback.")
            self.llm_client = OpenAI(api_key=openai_key)


        # ChromaDB setup
        self.chroma_client = chromadb.Client()
        self.collection = self.chroma_client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}
        )

        # Load and insert policy text
        self.policies = self.read_pdf_and_chunk()
        if self.collection.count() == 0:
            self.collection.add(
                ids=[str(uuid.uuid4()) for _ in self.policies],
                documents=self.policies,
                metadatas=[{"chunk": i} for i in range(len(self.policies))]
            )
            print(f"Inserted {len(self.policies)} chunks into Chroma collection '{self.collection_name}'.")

    def read_pdf_and_chunk(self, max_sentences=3):
        """Read PDF and return list of ~3-sentence chunks."""
        if not os.path.exists(self.pdf_path):
            raise FileNotFoundError(f"PDF not found at: {self.pdf_path}")

        reader = PdfReader(self.pdf_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + " "

        # Split into sentences and group into chunks
        sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', text)
        chunks, current_chunk = [], []
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            if len(current_chunk) >= max_sentences:
                chunks.append(" ".join(current_chunk))
                current_chunk = []
            current_chunk.append(sentence)
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        return chunks
    @staticmethod
    def looks_like_cfr(text: str) -> bool:
        return bool(re.search(r"\n\s*\([a-z]\)", text))
    def _extract_content_from_completion(self, completion):
        """
        Robustly extract the text content from various OpenAI SDK response shapes.
        Returns string content or None.
        """
        try:
            # New SDK object pattern: completion.choices[0].message.content
            if hasattr(completion, "choices") and len(completion.choices) > 0:
                choice = completion.choices[0]
                # Try attribute `message` (object) first
                msg = getattr(choice, "message", None)
                if msg is not None:
                    content = getattr(msg, "content", None) or getattr(msg, "text", None)
                    if content:
                        return str(content).strip()
                # Try `text` attribute on choice
                text_attr = getattr(choice, "text", None)
                if text_attr:
                    return str(text_attr).strip()
                # Try to_dict on choice
                if hasattr(choice, "to_dict"):
                    d = choice.to_dict()
                    msg = d.get("message") or {}
                    if isinstance(msg, dict) and msg.get("content"):
                        return str(msg.get("content")).strip()
                    if d.get("text"):
                        return str(d.get("text")).strip()

            # If completion is a dict-like structure
            if isinstance(completion, dict):
                ch = completion.get("choices", [{}])[0]
                # message might be nested
                msg = ch.get("message") or ch.get("text") or {}
                if isinstance(msg, dict) and msg.get("content"):
                    return str(msg.get("content")).strip()
                if isinstance(ch, dict) and ch.get("text"):
                    return str(ch.get("text")).strip()

            # Fallback: try to stringify
            return None
        except Exception:
            return None

    def generate_llm_narrative(self, reg_text, evidence_chunk):
        """
        Generate compliance gap narrative with LLM.
        Always returns a clean, user-friendly sentence - never error messages.
        """
        if USE_CENTRALIZED_LLM:
            try:
                resp = generate_gap_summary(regulation_text=reg_text, evidence_chunks=[evidence_chunk])
                if resp and resp.get("ok"):
                    result = resp.get("result") or {}
                    summary = result.get("summary") or ""
                    missing = result.get("missing_items", [])
                    confidence = result.get("confidence", None)
                    
                    parts = []
                    if summary:
                        parts.append(f"GAP SUMMARY: {summary.strip()}")
                    if missing:
                        parts.append(f"MISSING: {', '.join(missing[:5])}")
                    if confidence is not None:
                        parts.append(f"CONFIDENCE: {confidence}")
                    
                    return " | ".join([p for p in parts if p]) if parts else FALLBACK_NARRATIVE
                else:
                    # Helper returned error or falsey response
                    return FALLBACK_NARRATIVE
            except Exception:
                # Unexpected helper failure
                return FALLBACK_NARRATIVE

        # Inline OpenAI fallback
        prompt = f"""You are a compliance analyst. Compare the following REGULATION with the POLICY EVIDENCE and state the compliance GAP in one clear sentence.

REGULATION: {reg_text}

POLICY EVIDENCE: {evidence_chunk[:500]}

GAP SUMMARY:"""

        try:
            if not getattr(self, "llm_client", None):
                return FALLBACK_NARRATIVE
                
            completion = self.llm_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=150,
                temperature=0.3
            )
            
            content = self._extract_content_from_completion(completion)  # Note the underscore!
            if content:
                if not content.lower().startswith("gap summary"):
                    content = "GAP SUMMARY: " + content
                return content
            return FALLBACK_NARRATIVE
        except Exception:
            return FALLBACK_NARRATIVE

    def run_check(self):
        compliance_results = []
        for reg in self.regulations:
            reg_id = reg.get("Reg_ID")
            query_text = reg.get("Requirement_Text", "")
            result = self.collection.query(query_texts=[query_text], n_results=self.top_k)
            docs = result["documents"][0] if result.get("documents") else []
            dists = result["distances"][0] if result.get("distances") else []
            metas = result.get("metadatas", [[]])[0] if result.get("metadatas") else [{} for _ in docs]

            if not docs:
                # still record the requirement with no matching evidence (optional)
                compliance_results.append({
                    "Reg_ID": reg_id,
                    "Risk_Rating": reg.get("Risk_Rating"),
                    "Target_Area": reg.get("Target_Area"),
                    "Dow_Focus": reg.get("Dow_Focus"),
                    "Compliance_Score": 0.0,
                    "Evidence_Chunk": None,
                    "Is_Compliant": False,
                    "Narrative_Gap": "No evidence found in policy documents."
                })
                continue

            for rank, (doc, dist, meta) in enumerate(zip(docs, dists, metas), start=1):
                try:
                    similarity = 1 - float(dist)
                except Exception:
                    # if dist is missing or not numeric, treat as low similarity
                    similarity = 0.0
                score_percent = similarity * 100
                is_compliant = similarity >= float(self.compliance_threshold)

                narrative = ""
                if not is_compliant:
                    narrative = self.generate_llm_narrative(query_text, doc)
                
                # Ensure every non-compliant result has a narrative
                if not is_compliant and not narrative:
                    narrative = FALLBACK_NARRATIVE

                compliance_results.append({
                    "Reg_ID": reg_id,
                    "Risk_Rating": reg.get('Risk_Rating'),
                    "Target_Area": reg.get('Target_Area'),
                    "Dow_Focus": reg.get('Dow_Focus'),
                    "Compliance_Score": score_percent,
                    "Evidence_Chunk": doc,
                    "Is_Compliant": is_compliant,
                    "Narrative_Gap": narrative
                })
        return compliance_results

    def dashboard_summary(self, compliance_results, industry=None):
        total_requirements = len(compliance_results)
        gaps = [r for r in compliance_results if not r.get('Is_Compliant')]

        # safe gap details
        gap_details = [
            {
                "Reg_ID": g.get('Reg_ID'),
                "Risk_Rating": g.get("Risk_Rating"),
                "Score": g.get("Compliance_Score"),
                "Narrative": g.get("Narrative_Gap")
            }
            for g in gaps
        ]

        overall_compliance = ((total_requirements - len(gaps)) / total_requirements * 100) if total_requirements else 0

        # safe, case-insensitive count of high/critical risk gaps
        def is_high_risk(risk_val):
            if not risk_val:
                return False
            rv = str(risk_val).lower()
            return ("critical" in rv) or ("high" in rv)

        high_risk_count = sum(1 for g in gaps if is_high_risk(g.get("Risk_Rating")))

        return {
            "status": "success",
            "action": "RAG Compliance Check",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "industry": industry,
            "regulations_checked": total_requirements,
            "compliance_score": round(overall_compliance, 2),
            "high_risk_gaps": high_risk_count,
            "gap_details": gap_details[:3],  # only top 3 for quick viewing
            "details": (
                f"RAG check complete. Score: {overall_compliance:.2f}%. "
                f"Gaps found: {len(gaps)}. "
                f"High risk gaps: {high_risk_count}."
            )
        }
    @staticmethod
    def split_cfr_subsections(section_id: str, full_text: str):
        """
        Splits a CFR section into TOP-LEVEL subsections only:
        (a), (b), (c), ...
        Ignores nested items like (1), (i), (ii).
        """

        # Match ONLY top-level subsection headers at line start
        pattern = re.compile(
            r"^\s*\((?P<label>[a-e])\)\s*(?P<body>.*?)(?=^\s*\([a-e]\)|\Z)",
            re.DOTALL | re.MULTILINE
        )

        results = []

        for match in pattern.finditer(full_text):
            label = match.group("label")
            body = match.group("body").strip()

            results.append({
                "Reg_ID": f"{section_id}({label})",
                "Requirement_Text": body,
                "Risk_Rating": "High",
                "Target_Area": "HIPAA Security Rule",
                "Dow_Focus": "Federal"
            })

        return results

if __name__ == "__main__":

    FULL_CFR_164_312 = """
    A covered entity or business associate must, in accordance with § 164.306:

    (a)(1) Standard: Access control.
    Implement technical policies and procedures for electronic information systems that maintain electronic protected health information to allow access only to those persons or software programs that have been granted access rights as specified in § 164.308(a)(4).

    (2) Implementation specifications:
    (i) Unique user identification (Required).
    (ii) Emergency access procedure (Required).
    (iii) Automatic logoff (Addressable).
    (iv) Encryption and decryption (Addressable).

    (b) Standard: Audit controls.
    Implement hardware, software, and/or procedural mechanisms that record and examine activity in information systems that contain or use electronic protected health information.

    (c) Standard: Integrity.
    (d) Standard: Person or entity authentication.
    (e) Standard: Transmission security.
    """

    # # ---- BASE REGULATIONS (UNCHANGED) ----
    # REGULATION_LIBRARY = [
    #     {
    #         "Reg_ID": "HIPAA-164.312(b)",
    #         "Requirement_Text": "The covered entity must implement hardware, software, and/or procedural mechanisms that record and examine activity in information systems that contain or use electronic protected health information (ePHI). This includes audit controls and logs.",
    #         "Risk_Rating": "High (Data Security)",
    #         "Target_Area": "Technical Control, Audit/Logging",
    #         "Dow_Focus": "Eliminating Issues, Avoiding Risk"
    #     },
    #     {
    #         "Reg_ID": "HIPAA-164.306(a)",
    #         "Requirement_Text": "Ensure the confidentiality, integrity, and availability of all electronic protected health information (ePHI) the covered entity creates, receives, maintains, or transmits.",
    #         "Risk_Rating": "High (Data Integrity)",
    #         "Target_Area": "Administrative Policy, Data Security",
    #         "Dow_Focus": "Long-Term Solutions, Avoiding Risk"
    #     },
    #     {
    #         "Reg_ID": "SEC-R404.1",
    #         "Requirement_Text": "Policy must establish a code of ethics that provides for the review of personal trading, including procedures for reporting and review of conflicts of interest.",
    #         "Risk_Rating": "Critical (Financial/Legal)",
    #         "Target_Area": "Employee Conduct, Conflict of Interest",
    #         "Dow_Focus": "Avoiding Conflicts of Interest, Proper Usage"
    #     }
    # ]
    REGULATION_LIBRARY = [
        {
            "Reg_ID": "45 CFR 164.312",
            "Requirement_Text": FULL_CFR_164_312,
            "Risk_Rating": "High",
            "Target_Area": "HIPAA Security Rule",
            "Dow_Focus": "Federal"
        }
    ]

    print("\n=== DEBUG: SPLIT CFR SUBSECTIONS ===")


    # ---- RUN COMPLIANCE ----
    checker = ComplianceChecker(
        pdf_path="C:\\ComplianceAI-Platform\\shared_downloads\\testing.pdf",
        regulations=REGULATION_LIBRARY,
        collection_name="policies_split_test"
    )

    results = checker.run_check()
    summary = checker.dashboard_summary(results, industry="Finance")
    print(summary)
