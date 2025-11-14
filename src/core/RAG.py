
"""
RAG.py - Compliance Retrieval & Gap-checking using OpenAI embeddings.

Replaces HF embedding usage with OpenAI embeddings (text-embedding-3-large).
Provides:
 - batching for embeddings
 - optional Chromadb upsert (if chromadb client available)
 - local in-memory nearest-neighbor via cosine similarity fallback
"""

import os
import json
import math
import logging
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import numpy as np
from uuid import uuid4

# OpenAI client - official package (openai.OpenAI). Use same style as other files.
try:
    from openai import OpenAI
except Exception:
    # Provide helpful message; will be checked at runtime
    OpenAI = None

# Optional: chromadb (if you want a persistent vector DB)
try:
    import chromadb
    from chromadb.utils import embedding_functions
    CHROMADB_AVAILABLE = True
except Exception:
    CHROMADB_AVAILABLE = False

# Logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Default embedding model (OpenAI)
OPENAI_EMBED_MODEL = os.getenv("OPENAI_EMBED_MODEL", "text-embedding-3-large")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", None)

if OpenAI is not None and OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
else:
    openai_client = None

# Helper dataclass for chunked document pieces
@dataclass
class DocChunk:
    id: str
    doc_id: str
    text: str
    metadata: Dict

# Utility functions
def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
        return 0.0
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def chunk_text(text: str, max_chars: int = 2000, overlap: int = 200) -> List[str]:
    """Simple char-based chunker with overlap."""
    if not text:
        return []
    chunks = []
    start = 0
    L = len(text)
    while start < L:
        end = min(start + max_chars, L)
        chunk = text[start:end]
        chunks.append(chunk)
        if end == L:
            break
        start = max(end - overlap, end)  # ensure some overlap; prevents infinite loop
    return chunks

def batch_iterable(iterable, batch_size):
    it = iter(iterable)
    while True:
        batch = []
        for _ in range(batch_size):
            try:
                batch.append(next(it))
            except StopIteration:
                break
        if not batch:
            break
        yield batch

class ComplianceChecker:
    """
    ComplianceChecker: loads PDF/text, chunks content, computes embeddings using OpenAI,
    and performs semantic retrieval against supplied regulations or other docs.
    """

    def __init__(
        self,
        pdf_path: Optional[str] = None,
        text: Optional[str] = None,
        regulations: Optional[List[Dict]] = None,
        embed_model: str = OPENAI_EMBED_MODEL,
        use_chroma: bool = False,
        chroma_collection_name: str = None,
        batch_size: int = 64,
    ):
        if not openai_client:
            logger.warning("OpenAI client not initialized - OPENAI_API_KEY missing.")
        self.pdf_path = pdf_path
        self.text = text
        self.regulations = regulations or []
        self.embed_model = embed_model
        self.batch_size = batch_size
        self.use_chroma = use_chroma and CHROMADB_AVAILABLE
        self.chroma_collection_name = chroma_collection_name or f"compliance_{uuid4().hex[:8]}"
        self.chunks: List[DocChunk] = []
        self.embeddings: List[np.ndarray] = []
        self.doc_ids: List[str] = []
        # chroma client & collection optional
        self.chroma_client = None
        self.chroma_collection = None
        if self.use_chroma and CHROMADB_AVAILABLE:
            try:
                self.chroma_client = chromadb.Client()
                # create or get collection
                self.chroma_collection = self.chroma_client.get_or_create_collection(self.chroma_collection_name)
            except Exception as e:
                logger.warning("Failed to init ChromaDB - falling back to in-memory search: %s", e)
                self.use_chroma = False

        # load text from pdf if path provided
        if pdf_path and not text:
            self.text = self._extract_text_from_pdf(pdf_path)

        # chunk text into small pieces
        if self.text:
            self._prepare_chunks(self.text)

        # prepare regulation texts as mini-docs (so we can embed them too)
        self.reg_chunks: List[DocChunk] = []
        if self.regulations:
            self._prepare_regulation_chunks(self.regulations)

    def _extract_text_from_pdf(self, path: str) -> str:
        try:
            from PyPDF2 import PdfReader
        except Exception:
            raise RuntimeError("PyPDF2 required to read PDF files. pip install PyPDF2")
        txt = []
        try:
            reader = PdfReader(path)
            for p in reader.pages:
                txt.append(p.extract_text() or "")
        except Exception as e:
            logger.error("Failed to extract text from PDF %s: %s", path, e)
            raise
        return "\n".join(txt)

    def _prepare_chunks(self, text: str):
        chunk_texts = chunk_text(text)
        doc_id = f"doc_{uuid4().hex[:8]}"
        for i, c in enumerate(chunk_texts):
            chunk = DocChunk(id=f"{doc_id}_c{i}", doc_id=doc_id, text=c, metadata={"chunk_index": i})
            self.chunks.append(chunk)

    def _prepare_regulation_chunks(self, regulations: List[Dict]):
        for r in regulations:
            rid = r.get("id") or f"reg_{uuid4().hex[:8]}"
            text = r.get("text") or r.get("title", "")
            # keep regulation as a single chunk
            chunk = DocChunk(id=f"{rid}_reg", doc_id=rid, text=text, metadata={"regulation": r.get("title")})
            self.reg_chunks.append(chunk)

    def _get_openai_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Call OpenAI embeddings endpoint in batches. Returns list of embedding vectors (floats)."""
        if openai_client is None:
            raise RuntimeError("OPENAI_API_KEY not configured; cannot generate embeddings.")
        all_embs = []
        for batch in batch_iterable(texts, self.batch_size):
            try:
                resp = openai_client.embeddings.create(model=self.embed_model, input=batch)
                # resp['data'] is list of dicts with 'embedding'
                batch_embs = [item.embedding for item in resp.data]
                all_embs.extend(batch_embs)
            except Exception as e:
                logger.exception("OpenAI embeddings call failed: %s", e)
                # Raise after logging to make failure explicit
                raise
        return all_embs

    def build_embeddings(self, include_regulations: bool = True):
        """Compute embeddings for chunks (and optionally regulations). Stores self.embeddings as numpy arrays."""
        texts = [c.text for c in self.chunks]
        reg_texts = [c.text for c in self.reg_chunks] if include_regulations else []
        if texts:
            logger.info("Computing embeddings for %d document chunks...", len(texts))
            embs = self._get_openai_embeddings(texts)
            self.embeddings = [np.array(e, dtype=np.float32) for e in embs]
            self.doc_ids = [c.doc_id for c in self.chunks]
            # optionally upsert into chroma
            if self.use_chroma and self.chroma_collection:
                try:
                    self.chroma_collection.add(
                        documents=[c.text for c in self.chunks],
                        metadatas=[c.metadata for c in self.chunks],
                        ids=[c.id for c in self.chunks],
                        embeddings=[e.tolist() for e in self.embeddings]
                    )
                except Exception as e:
                    logger.warning("Chroma upsert failed: %s", e)
        else:
            logger.info("No document chunks to embed.")

        if reg_texts:
            logger.info("Computing embeddings for %d regulations...", len(reg_texts))
            reg_embs = self._get_openai_embeddings(reg_texts)
            self.reg_embeddings = [np.array(e, dtype=np.float32) for e in reg_embs]
        else:
            self.reg_embeddings = []

    def _semantic_search(self, query: str, top_k: int = 5) -> List[Tuple[DocChunk, float]]:
        """Return top_k matching chunks with similarity scores"""
        if not (self.embeddings and self.chunks):
            raise RuntimeError("Embeddings not built; call build_embeddings() first.")
        # embed query
        q_emb = np.array(self._get_openai_embeddings([query])[0], dtype=np.float32)
        sims = [cosine_similarity(q_emb, e) for e in self.embeddings]
        # get top k indices
        idxs = sorted(range(len(sims)), key=lambda i: sims[i], reverse=True)[:top_k]
        results = [(self.chunks[i], sims[i]) for i in idxs]
        return results

    def _regulation_match_scores(self) -> List[Dict]:
        """Compute a simple match score between each regulation and the document by cosine between regulation embedding and document embeddings."""
        if not hasattr(self, "reg_embeddings") or not self.reg_embeddings:
            return []
        results = []
        for ridx, r_emb in enumerate(self.reg_embeddings):
            # compute max similarity between regulation and any doc chunk (simple heuristic)
            best_score = max(cosine_similarity(r_emb, d_emb) for d_emb in (self.embeddings or [np.zeros_like(r_emb)]))
            results.append({
                "regulation_id": self.reg_chunks[ridx].doc_id,
                "regulation_title": self.reg_chunks[ridx].metadata.get("regulation"),
                "score": float(best_score)
            })
        return results

    def run_check(self, top_k: int = 5, threshold: float = 0.45):
        """
        Main entry: run compliance check and return findings.
        - Builds embeddings (if not present)
        - For each regulation, computes regulation match scores and returns matches above threshold
        """
        if openai_client is None:
            raise RuntimeError("OPENAI_API_KEY not configured. Please set OPENAI_API_KEY to use the compliance checker.")

        # Build embeddings if not precomputed
        if not getattr(self, "embeddings", None):
            self.build_embeddings(include_regulations=True)

        # Compute regulation match scores
        reg_scores = self._regulation_match_scores()

        # Convert scores into findings -> classify as Compliant / Risk / Violation using thresholds
        findings = []
        for rs in reg_scores:
            score = rs["score"]
            if score >= 0.75:
                status = "Compliant"
            elif score >= 0.5:
                status = "Risk"
            else:
                status = "Violation"
            findings.append({
                "regulation_id": rs["regulation_id"],
                "regulation_title": rs["regulation_title"],
                "score": score,
                "status": status
            })

        # Sort by score descending
        findings = sorted(findings, key=lambda x: x["score"], reverse=True)

        # Optionally attach supporting context: top_k chunks for each top regulation
        enriched = []
        for f in findings[:top_k]:
            top_chunks = self._semantic_search(f["regulation_title"], top_k=3)
            enriched.append({
                "regulation_id": f["regulation_id"],
                "regulation_title": f["regulation_title"],
                "score": f["score"],
                "status": f["status"],
                "supporting_evidence": [{"text": c.text[:800], "similarity": s} for c, s in top_chunks]
            })

        return enriched

    def dashboard_summary(self, results):
        """Simple aggregated stats for UI"""
        counts = {"Compliant": 0, "Risk": 0, "Violation": 0}
        for r in results:
            counts[r.get("status", "Violation")] = counts.get(r.get("status", "Violation"), 0) + 1
        return {"total": len(results), "by_status": counts}


