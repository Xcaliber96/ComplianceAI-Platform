import os
import uuid
import re
import chromadb
from PyPDF2 import PdfReader
from huggingface_hub import InferenceClient

class ComplianceChecker:
    def __init__(self, pdf_path, regulations, collection_name="policies",
                 compliance_threshold=0.60, top_k=1):
        self.pdf_path = pdf_path
        self.regulations = regulations
        self.collection_name = collection_name
        self.compliance_threshold = compliance_threshold
        self.top_k = top_k

        # HuggingFace LLM client
        hf_token = os.environ.get("HF_API_TOKEN")
        if not hf_token:
            raise ValueError("❌ HF_API_TOKEN is not set in environment!")
        self.llm_client = InferenceClient(api_key=hf_token, provider="featherless-ai")

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
            if len(current_chunk) >= max_sentences:
                chunks.append(" ".join(current_chunk))
                current_chunk = []
            current_chunk.append(sentence.strip())
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        return chunks

    def generate_llm_narrative(self, reg_text, evidence_chunk):
        """Generate compliance gap narrative with LLM."""
        prompt = f"""
        You are a compliance analyst. Compare the following REGULATION with the POLICY EVIDENCE
        and state the compliance GAP in one clear sentence.

        REGULATION: "{reg_text}"

        POLICY EVIDENCE: "{evidence_chunk[:500]}"

        GAP SUMMARY:
        """
        try:
            completion = self.llm_client.chat.completions.create(
                model="mistralai/Mistral-7B-Instruct-v0.2",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=150,
                temperature=0.3
            )
            return completion.choices[0].message.content.strip()
        except Exception as e:
            return f"LLM API Error: {e}"

    def run_check(self):
        compliance_results = []
        for reg in self.regulations:
            reg_id = reg["Reg_ID"]
            query_text = reg["Requirement_Text"]

            result = self.collection.query(query_texts=[query_text], n_results=self.top_k)
            docs = result["documents"][0] if result["documents"] else []
            dists = result["distances"][0] if result["distances"] else []
            metas = result.get("metadatas", [[]])[0] if result.get("metadatas") else [{} for _ in docs]

            print("\n" + "="*90)
            print(f"📜 REGULATION: {reg_id}")
            print(f"TEXT: {query_text}")
            print("-"*90)

            if not docs:
                print("⚠️ No results returned.")
                continue

            for rank, (doc, dist, meta) in enumerate(zip(docs, dists, metas), start=1):
                similarity = 1 - dist
                score_percent = similarity * 100
                is_compliant = similarity >= self.compliance_threshold

                status = "✅ COMPLIANT" if is_compliant else "❌ GAP DETECTED"
                line_info = f" (chunk {meta.get('chunk')})" if isinstance(meta, dict) and 'chunk' in meta else ""

                print(f"[{rank}] {status} | Compliance Score: {score_percent:.2f}%{line_info}")
                print(f"    Evidence: {doc[:200]}{'...' if len(doc) > 200 else ''}")

                narrative = ""
                if not is_compliant:
                    print(f"   [🤖 Generating Narrative for {reg_id}...]")
                    narrative = self.generate_llm_narrative(query_text, doc)
                    print(f"   📌 Narrative Gap: {narrative}")

                compliance_results.append({
                    "Reg_ID": reg_id,
                    "Risk_Rating": reg['Risk_Rating'],
                    "Target_Area": reg['Target_Area'],
                    "Dow_Focus": reg['Dow_Focus'],
                    "Compliance_Score": score_percent,
                    "Evidence_Chunk": doc,
                    "Is_Compliant": is_compliant,
                    "Narrative_Gap": narrative
                })

        return compliance_results

    def summary(self, compliance_results):
        total_requirements = len(compliance_results)
        gaps = [r for r in compliance_results if not r['Is_Compliant']]
        overall_compliance = (total_requirements - len(gaps)) / total_requirements * 100

        print("\n" + "="*80)
        print("📊 DOW COMPLIANCE & RISK MANAGEMENT REPORT (MVP) - FULL AI CHECK")
        print("="*80)
        print(f"COMPLIANCE THRESHOLD: {self.compliance_threshold*100:.0f}%")
        print(f"OVERALL COMPLIANCE SCORE: {overall_compliance:.2f}%")
        print(f"TOTAL REQUIREMENTS CHECKED: {total_requirements}")
        print(f"HIGH-RISK GAPS FOUND: {len(gaps)}")
        print("="*80)

        print("\n🔎 GAP DETAILS (Requires Action)")
        for gap in gaps:
            print(f"- {gap['Reg_ID']} | Score: {gap['Compliance_Score']:.2f}% | Risk: {gap['Risk_Rating']}")
            print(f"  Narrative: {gap['Narrative_Gap']}")
            print(f"  Evidence: {gap['Evidence_Chunk'][:150]}...\n")

        print("✅ COMPLIANT AREAS")
        for ok in [r for r in compliance_results if r['Is_Compliant']]:
            print(f"- {ok['Reg_ID']} | Score: {ok['Compliance_Score']:.2f}%")


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
            "Risk_Rating": "Critical (Financial/Legal)",
            "Target_Area": "Employee Conduct, Conflict of Interest",
            "Dow_Focus": "Avoiding Conflicts of Interest, Proper Usage"
        }
    ]

    checker = ComplianceChecker(pdf_path="test_policy.pdf", regulations=REGULATION_LIBRARY)
    results = checker.run_check()
    checker.summary(results)
