from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent  # script folder
load_dotenv(ROOT / ".." / ".env", override=True)

import os
print("DEBUG: Python sees OPENAI:", bool(os.getenv("OPENAI_API_KEY")))
import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from PyPDF2 import PdfReader
import chromadb, uuid, os
from src.core.RAG import split_into_sentences, chunk_sentences, is_informative_chunk, create_embeddings_batch

PDF_PATH = r"C:\NOMI\uploads\6108ff6ec8b14b37a11e5254a2caacde.pdf"
COL_NAME = "policies"
client = chromadb.Client()
try:
    client.delete_collection(name=COL_NAME)
except Exception:
    pass
col = client.get_or_create_collection(name=COL_NAME)

reader = PdfReader(PDF_PATH)
full_text = "\n".join([p.extract_text() or "" for p in reader.pages])
sentences = split_into_sentences(full_text)
raw_chunks = chunk_sentences(sentences, max_sentences=3)
clean_chunks = [c for c in raw_chunks if is_informative_chunk(c)]

# embeddings
embs = []
batch_size = 10
for i in range(0, len(clean_chunks), batch_size):
    batch = clean_chunks[i:i+batch_size]
    emb_batch = create_embeddings_batch(batch, model_name="text-embedding-3-small")
    embs.extend(emb_batch)

ids = [str(uuid.uuid4()) for _ in clean_chunks]
metas = [{"chunk_index": i} for i in range(len(clean_chunks))]
col.add(ids=ids, documents=clean_chunks, metadatas=metas, embeddings=embs)
print("Reindexed", len(clean_chunks), "chunks")