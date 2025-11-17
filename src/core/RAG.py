import os
import uuid
import re
import chromadb
from datetime import datetime, timezone
from PyPDF2 import PdfReader
from openai import OpenAI

class ComplianceChecker:
    def __init__(self, pdf_path, regulations, collection_name="policies",
                 compliance_threshold=0.60, top_k=1):
        self.pdf_path = pdf_path
        self.regulations = regulations
        self.collection_name = collection_name
        self.compliance_threshold = compliance_threshold
        self.top_k = top_k

        # OpenAI LLM client
        openai_key = os.environ.get("OPENAI_API_KEY")
        if not openai_key:
            raise ValueError("❌ OPENAI_API_KEY is not set in environment!")
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
        """Generate compliance gap narrative with LLM (OpenAI)."""
        prompt = f"""
You are a compliance analyst. Compare the following REGULATION with the POLICY EVIDENCE
and state the compliance GAP in one clear sentence.

REGULATION: "{reg_text}"

POLICY EVIDENCE: "{evidence_chunk[:500]}"

GAP SUMMARY:
"""
        try:
            completion = self.llm_client.chat.completions.create(
                model="gpt-4.1-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=150,
                temperature=0.3
            )
            content = self._extract_content_from_completion(completion)
            if content:
                # prepend label for clarity (keeps previous behavior)
                if not content.lower().startswith("gap summary"):
                    content = "GAP SUMMARY: " + content
                return content
            # fallback: return a compact debug repr
            try:
                # try to get a readable repr of the first choice
                if hasattr(completion, "choices") and len(completion.choices) > 0:
                    return f"LLM API Error: unexpected choice shape; repr: {repr(completion.choices[0])[:400]}"
                return "LLM API Error: no content returned"
            except Exception as e:
                return f"LLM API Error: {e}"
        except Exception as e:
            return f"LLM API Error: {e}"

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


# -------------------------------
# Example usage:
# -------------------------------
if __name__ == "__main__":
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
            "Risk_RATING": "Critical (Financial/Legal)",
            "Target_Area": "Employee Conduct, Conflict of Interest",
            "Dow_Focus": "Avoiding Conflicts of Interest, Proper Usage"
        }
    ]

    checker = ComplianceChecker(pdf_path="test_policy.pdf", regulations=REGULATION_LIBRARY)
    results = checker.run_check()
    summary = checker.dashboard_summary(results, industry="Finance")
    print(summary)
