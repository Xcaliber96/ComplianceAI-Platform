# import os
# import uuid
# import re
# from PyPDF2 import PdfReader
# from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction

# try:
#     from src.core.client import get_llm
# except Exception:
#     get_llm = None

# def split_into_sentences(text: str):
#     if not text:
#         return []
#     sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', text)
#     return [s.strip() for s in sentences if s and s.strip()]

# def chunk_sentences(sentences, max_sentences=3):
#     chunks = []
#     current = []
#     for s in sentences:
#         if len(current) >= max_sentences:
#             chunks.append(" ".join(current))
#             current = []
#         current.append(s)
#     if current:
#         chunks.append(" ".join(current))
#     return chunks

# # LLM fallback
# USE_CENTRALIZED_LLM = False
# try:
#     from src.core.compliance_narratives import generate_gap_summary
#     USE_CENTRALIZED_LLM = True
# except Exception:
#     try:
#         from llm.compliance_narratives import generate_gap_summary
#         USE_CENTRALIZED_LLM = True
#     except Exception:
#         USE_CENTRALIZED_LLM = False

# OpenAI = None
# if not USE_CENTRALIZED_LLM:
#     try:
#         from openai import OpenAI
#     except:
#         OpenAI = None


# class ComplianceChecker:
#     def __init__(self, pdf_path, regulations, collection_name="policies",
#                  compliance_threshold=0.60, top_k=1):

#         self.pdf_path = pdf_path
#         self.regulations = regulations
#         self.collection_name = collection_name
#         self.compliance_threshold = compliance_threshold
#         self.top_k = top_k

#         # Fallback LLM
#         if not USE_CENTRALIZED_LLM:
#             key = os.environ.get("OPENAI_API_KEY")
#             if not key:
#                 raise ValueError("❌ Missing OPENAI_API_KEY")
#             self.llm_client = OpenAI(api_key=key)

#         # ---- Chroma 0.4.x client (Windows-safe) ----
#         from chromadb import Client
#         from chromadb.config import Settings

#         self.chroma_client = Client(
#             Settings(
#                 chroma_api_impl="rest",
#                 chroma_server_host="localhost",
#                 chroma_server_http_port=8001,
#             )
#         )

#         embedding_fn = OpenAIEmbeddingFunction(
#             api_key=os.environ["OPENAI_API_KEY"],
#             model_name="text-embedding-3-small"
#         )

#         # Create or load the collection
#         self.collection = self.chroma_client.get_or_create_collection(
#             name=self.collection_name,
#             embedding_function=embedding_fn,
#             metadata={"hnsw:space": "cosine"},
#         )

#         # Load and store PDF chunks
#         self.policies = self.read_pdf_and_chunk()
#         if self.collection.count() == 0:
#             self.collection.add(
#                 ids=[str(uuid.uuid4()) for _ in self.policies],
#                 documents=self.policies,
#                 metadatas=[{"chunk": i} for i in range(len(self.policies))]
#             )
#             print(f"Inserted {len(self.policies)} chunks into `{self.collection_name}`")

#     def read_pdf_and_chunk(self, max_sentences=3):
#         if not os.path.exists(self.pdf_path):
#             raise FileNotFoundError(f"PDF not found: {self.pdf_path}")

#         reader = PdfReader(self.pdf_path)
#         text = ""

#         for page in reader.pages:
#             page_text = page.extract_text()
#             if page_text:
#                 text += page_text + " "

#         sentences = split_into_sentences(text)
#         chunks = chunk_sentences(sentences, max_sentences)
#         return chunks

#     def _extract_content_from_completion(self, completion):
#         try:
#             if hasattr(completion, "choices"):
#                 msg = completion.choices[0].message
#                 if hasattr(msg, "content"):
#                     return msg.content.strip()
#         except:
#             pass
#         return None

#     def generate_llm_narrative(self, reg_text, evidence_chunk):
#         if USE_CENTRALIZED_LLM:
#             try:
#                 resp = generate_gap_summary(regulation_text=reg_text,
#                                             evidence_chunks=[evidence_chunk])
#                 if resp and resp.get("ok"):
#                     result = resp["result"]
#                     summary = result.get("summary", "")
#                     missing = result.get("missing_items", [])
#                     confidence = result.get("confidence")

#                     parts = []
#                     if summary:
#                         parts.append("GAP SUMMARY: " + summary)
#                     if missing:
#                         parts.append("MISSING: " + "; ".join(missing[:5]))
#                     if confidence is not None:
#                         parts.append(f"CONFIDENCE: {confidence}")

#                     return " | ".join(parts)
#             except:
#                 pass

#         # fallback
#         prompt = f"""
# You are a compliance analyst. Compare:

# REGULATION: {reg_text}

# EVIDENCE: {evidence_chunk[:400]}

# Return ONE sentence describing the compliance gap.
# """

#         try:
#             completion = self.llm_client.chat.completions.create(
#                 model="gpt-4.1-mini",
#                 messages=[{"role": "user", "content": prompt}],
#                 max_tokens=150,
#                 temperature=0.3
#             )
#             content = self._extract_content_from_completion(completion)
#             return "GAP SUMMARY: " + (content or "No summary available.")
#         except Exception as e:
#             return f"LLM ERROR: {e}"

#     def run_check(self):
#         results = []

#         for reg in self.regulations:
#             reg_id = reg["Reg_ID"]
#             text = reg["Requirement_Text"]

#             query = self.collection.query(
#                 query_texts=[text],
#                 n_results=self.top_k
#             )

#             docs = query["documents"][0]
#             dists = query["distances"][0]

#             if not docs:
#                 results.append({
#                     "Reg_ID": reg_id,
#                     "Compliance_Score": 0,
#                     "Is_Compliant": False,
#                     "Narrative_Gap": "No matching evidence."
#                 })
#                 continue

#             doc = docs[0]
#             similarity = 1 - dists[0]
#             is_compliant = similarity >= self.compliance_threshold

#             narrative = ""
#             if not is_compliant:
#                 narrative = self.generate_llm_narrative(text, doc)

#             results.append({
#                 "Reg_ID": reg_id,
#                 "Compliance_Score": similarity * 100,
#                 "Evidence_Chunk": doc,
#                 "Is_Compliant": is_compliant,
#                 "Narrative_Gap": narrative
#             })

#         return results

#     def dashboard_summary(self, compliance_results, industry=None):
#         total = len(compliance_results)
#         gaps = [r for r in compliance_results if not r["Is_Compliant"]]

#         score = ((total - len(gaps)) / total * 100) if total else 0

#         return {
#             "status": "success",
#             "industry": industry,
#             "regulations_checked": total,
#             "compliance_score": round(score, 2),
#             "gaps": gaps[:3]
#         }


# if __name__ == "__main__":
#     REGULATION_LIBRARY = [
#         {
#             "Reg_ID": "HIPAA-164.312(b)",
#             "Requirement_Text": "Audit controls protecting ePHI must be implemented.",
#             "Risk_Rating": "High"
#         }
#     ]

#     checker = ComplianceChecker("test_policy.pdf", REGULATION_LIBRARY)
#     results = checker.run_check()
#     print(results)

import os
import uuid
import re
from PyPDF2 import PdfReader

from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from openai import OpenAI

def split_into_sentences(text: str):
    if not text:
        return []
    sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', text)
    return [s.strip() for s in sentences if s.strip()]


def chunk_sentences(sentences, max_sentences=3):
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

class ComplianceChecker:
    
    print(">>> USING THIS ComplianceChecker FILE <<<")
    def __init__(
        self,
        pdf_path,
        regulations,
        base_collection_name="policies",
        compliance_threshold=0.60,
        top_k=1,
    ):
        self.pdf_path = pdf_path
        self.regulations = regulations
        self.compliance_threshold = compliance_threshold
        self.top_k = top_k

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("Missing OPENAI_API_KEY")
        self.openai = OpenAI(api_key=api_key)

        qdrant_url = os.getenv("QDRANT_URL")
        qdrant_api = os.getenv("QDRANT_API_KEY")

        if not qdrant_url:
            raise ValueError("Missing QDRANT_URL")
        if not qdrant_api:
            raise ValueError("Missing QDRANT_API_KEY")

        self.qdrant = QdrantClient(url=qdrant_url, api_key=qdrant_api)

        self.collection_name = f"{base_collection_name}_{uuid.uuid4()}"
        print(f"📌 Creating temp Qdrant collection: {self.collection_name}")

        self.policy_chunks = self.read_pdf_and_chunk()


        self._create_and_index_collection()

        self.regulation_cache = {}
        self._cache_regulation_embeddings()

    def read_pdf_and_chunk(self, max_sentences=3):
        if not os.path.exists(self.pdf_path):
            raise FileNotFoundError(self.pdf_path)

        reader = PdfReader(self.pdf_path)
        text = ""

        for page in reader.pages:
            txt = page.extract_text()
            if txt:
                text += txt + " "

        sentences = split_into_sentences(text)
        return chunk_sentences(sentences, max_sentences)
    def embed(self, texts):
        res = self.openai.embeddings.create(
            model="text-embedding-3-small",
            input=texts
        )
        return [d.embedding for d in res.data]


    def _create_and_index_collection(self):
        print("📌 Embedding & indexing PDF chunks...")

        # Embed PDF chunks ONCE
        embeddings = self.embed(self.policy_chunks)
        dim = len(embeddings[0])

        # Create collection
        self.qdrant.create_collection(
            collection_name=self.collection_name,
            vectors_config=qmodels.VectorParams(
                size=dim,
                distance=qmodels.Distance.COSINE,
            )
        )

        # Upsert chunks
        points = [
            qmodels.PointStruct(
                id=str(uuid.uuid4()),
                vector=embeddings[i],
                payload={"text": self.policy_chunks[i], "chunk": i}
            )
            for i in range(len(self.policy_chunks))
        ]

        self.qdrant.upsert(collection_name=self.collection_name, points=points)
        print(f"✔ Indexed {len(points)} chunks")

    def _cache_regulation_embeddings(self):
        for reg in self.regulations:
            text = (
                reg.get("Requirement_Text")
                or reg.get("text")
                or reg.get("description")
                or reg.get("title")
            )
            reg_id = reg.get("Reg_ID") or reg.get("id") or reg.get("name")

            if not text:
                self.regulation_cache[reg_id] = None
                continue

            emb = self.embed([text])[0]
            self.regulation_cache[reg_id] = emb

    def generate_gap_summary(self, regulation_text, evidence):
        prompt = f"""
You are a compliance analyst. Compare:

Regulation: {regulation_text}
Evidence: {evidence[:300]}

Describe the compliance gap in ONE sentence.
"""
        completion = self.openai.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=120
        )
        return completion.choices[0].message.content.strip()


    def run_check(self):
        results = []

        for reg in self.regulations:
            reg_id = reg.get("Reg_ID") or reg.get("id") or reg.get("name")
            text = (
                reg.get("Requirement_Text")
                or reg.get("text")
                or reg.get("description")
                or reg.get("title")
            )

            vector = self.regulation_cache.get(reg_id)

            if not text or vector is None:
                results.append({
                    "Reg_ID": reg_id,
                    "Compliance_Score": 0,
                    "Is_Compliant": False,
                    "Narrative_Gap": "No regulation text."
                })
                continue

            # Qdrant query
            result = self.qdrant.query_points(
                collection_name=self.collection_name,
                query=vector,
                limit=self.top_k
            )

            hits = result.points
            if not hits:
                results.append({
                    "Reg_ID": reg_id,
                    "Compliance_Score": 0,
                    "Is_Compliant": False,
                    "Narrative_Gap": "No evidence found."
                })
                continue

            best = hits[0]
            evidence = best.payload["text"]

            # Convert distance→similarity
            similarity = 1 - best.score
            compliant = similarity >= self.compliance_threshold

            narrative = ""
            if not compliant:
                narrative = self.generate_gap_summary(text, evidence)

            results.append({
                "Reg_ID": reg_id,
                "Evidence_Chunk": evidence,
                "Compliance_Score": round(similarity * 100, 2),
                "Is_Compliant": compliant,
                "Narrative_Gap": narrative
            })

        return results
