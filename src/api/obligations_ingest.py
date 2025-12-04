# src/api/obligations_ingest.py
import re
import hashlib
import json
import os
import traceback
from datetime import datetime
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, Body, HTTPException, Query
from fastapi.responses import JSONResponse

# spaCy
import spacy
try:
    nlp = spacy.load("en_core_web_sm")
except Exception as e:
    raise RuntimeError(
        "spaCy model en_core_web_sm not found. Run: python -m spacy download en_core_web_sm"
    ) from e

# Safe LLM wrapper (your repo)
from src.core.client import safe_chat_completion

# Neo4j driver
from neo4j import GraphDatabase, basic_auth

router = APIRouter()

# --- patterns & helpers ---
DEONTIC_PATTERNS = {
    "obligation": re.compile(r"\b(shall|must|is required to|required to|required that)\b", re.I),
    "prohibition": re.compile(r"\b(shall not|must not|is prohibited|may not|prohibited from)\b", re.I),
    "permission": re.compile(r"\b(may|is permitted|allowed to)\b", re.I),
}
SENT_SPLIT_RE = re.compile(r'(?<=[\.\?\!;])\s+(?=[A-Z0-9"])')


def normalize_text(s: str) -> str:
    return " ".join(s.split()).strip()


def obligation_id_for(doc_id: str, sentence: str) -> str:
    payload = f"{doc_id}||{normalize_text(sentence).lower()}"
    return "obl_" + hashlib.sha256(payload.encode("utf-8")).hexdigest()[:24]


def detect_deontic(sentence: str) -> Optional[str]:
    for label, pat in DEONTIC_PATTERNS.items():
        if pat.search(sentence):
            return label
    return None


def rule_extract(sentence: str) -> Dict[str, Any]:
    doc = nlp(sentence)
    subj, action, obj, cond = None, None, None, None

    for tok in doc:
        if tok.dep_ in ("nsubj", "nsubjpass"):
            subj = " ".join([t.text for t in tok.subtree])
            break

    root = next((t for t in doc if t.dep_ == "ROOT"), None)
    if root:
        tokens = []
        for t in doc[root.i:]:
            if t.is_punct:
                break
            tokens.append(t.text)
        action = " ".join(tokens)

    dobj = next((t for t in doc if t.dep_ in ("dobj", "pobj")), None)
    if dobj:
        obj = " ".join([t.text for t in dobj.subtree])

    cond_keywords = {"if", "when", "where", "during", "within", "until", "before", "after", "provided", "subject to", "in case of"}
    for tok in doc:
        if tok.text.lower() in cond_keywords:
            cond = " ".join([t.text for t in tok.subtree])
            break

    conf = 0.4
    if detect_deontic(sentence):
        conf += 0.3
    if subj:
        conf += 0.15
    if action:
        conf += 0.15
    conf = min(conf, 0.99)

    return {
        "text": sentence.strip(),
        "deontic": detect_deontic(sentence),
        "subject": subj,
        "action": action,
        "object": obj,
        "condition": cond,
        "confidence": conf,
        "extracted_by": "rule_v1",
    }


# -------------------------------
# LLM FALLBACK (safe wrapper)
# -------------------------------
def llm_fallback_extract(sentence: str) -> Dict[str, Any]:
    if not sentence or len(sentence) < 8:
        return {"is_obligation": False}

    prompt = f"""
You are an extraction assistant. Extract structured obligation info from this sentence:

\"\"\"{sentence}\"\"\"

Return ONLY a JSON object with these keys:
is_obligation: true/false
deontic: "obligation" | "prohibition" | "permission" | null
subject: string or null
action: string or null
object: string or null
condition: string or null
confidence: float between 0.0 and 1.0
"""

    messages = [
        {"role": "system", "content": "You extract obligations from regulatory sentences precisely."},
        {"role": "user", "content": prompt},
    ]

    try:
        resp = safe_chat_completion(messages=messages, model="gpt-4o-mini", max_tokens=400, temperature=0.0)
    except Exception as e:
        return {"is_obligation": False, "error": f"llm_call_exception: {str(e)}"}

    if not isinstance(resp, dict) or not resp.get("ok"):
        return {"is_obligation": False, "error": "llm_call_failed", "raw": resp}

    raw = (resp.get("text") or "").strip()

    # attempt parse
    try:
        data = json.loads(raw)
    except Exception:
        # try to recover JSON substring
        m = re.search(r"\{.*\}", raw, flags=re.S)
        if m:
            try:
                data = json.loads(m.group(0))
            except Exception:
                return {"is_obligation": False, "error": "llm_json_parse_failed", "raw": raw}
        else:
            return {"is_obligation": False, "error": "llm_json_missing", "raw": raw}

    try:
        is_ob = bool(data.get("is_obligation"))
        deontic = data.get("deontic")
        subj = data.get("subject")
        action = data.get("action")
        obj = data.get("object")
        cond = data.get("condition")
        confidence = float(data.get("confidence") or 0.5)
    except Exception:
        return {"is_obligation": False, "error": "llm_output_malformed", "raw": data}

    return {
        "is_obligation": is_ob,
        "deontic": deontic,
        "subject": subj,
        "action": action,
        "object": obj,
        "condition": cond,
        "confidence": max(0.0, min(1.0, confidence)),
        "extracted_by": "llm_v1",
    }


# -------------------------------
# Neo4j upsert functions
# -------------------------------
def get_neo4j_driver():
    uri = os.getenv("NEO4J_URI")
    user = os.getenv("NEO4J_USER")
    pwd = os.getenv("NEO4J_PASSWORD")
    if not uri or not user or not pwd:
        raise RuntimeError("NEO4J_URI / NEO4J_USER / NEO4J_PASSWORD must be set")
    return GraphDatabase.driver(uri, auth=basic_auth(user, pwd), max_connection_lifetime=60*60)


def upsert_obligations_neo4j(obligations: List[Dict[str, Any]]):
    """
    Batch upsert obligations into Neo4j.
    Creates/updates Obligation nodes and MERGE relation to Regulation node.
    """
    if not obligations:
        return 0

    driver = get_neo4j_driver()
    created = 0
    cypher = """
UNWIND $rows AS r
MERGE (o:Obligation {obligation_id: r.obligation_id})
SET o.text = r.text,
    o.deontic = r.deontic,
    o.subject = r.subject,
    o.action = r.action,
    o.object = r.object,
    o.condition = r.condition,
    o.confidence = r.confidence,
    o.extracted_by = r.extracted_by,
    o.status = r.status,
    o.provenance = r.provenance,
    o.created_at = r.created_at,
    o.user_uid = r.user_uid
WITH o, r
MERGE (reg:Regulation {regulation_id: r.source_doc})
ON CREATE SET reg.created_at = coalesce(reg.created_at, timestamp())
MERGE (reg)-[:HAS_OBLIGATION]->(o)
RETURN count(o) AS cnt
"""
    # prepare rows with JSON strings for provenance
    rows = []
    for r in obligations:
        row = {
            "obligation_id": r["obligation_id"],
            "text": r["text"],
            "deontic": r.get("deontic"),
            "subject": r.get("subject"),
            "action": r.get("action"),
            "object": r.get("object"),
            "condition": r.get("condition"),
            "confidence": float(r.get("confidence") or 0.0),
            "extracted_by": r.get("extracted_by"),
            "status": r.get("status"),
            "provenance": json.dumps(r.get("provenance") or {}),
            "source_doc": r.get("source_doc"),
            "created_at": r.get("created_at"),
            "user_uid": r.get("user_uid")  # new
        }
        rows.append(row)

    session = driver.session()
    try:
        res = session.run(cypher, rows=rows)
        record = res.single()
        if record:
            created = record["cnt"] or 0
    finally:
        session.close()
        driver.close()
    return created


# -------------------------------
# Main orchestration
# -------------------------------
def extract_obligations_from_text(
    doc_id: str,
    raw_text: str,
    meta: Optional[Dict[str, Any]] = None,
    llm_threshold: float = 0.75,
    auto_create_threshold: float = 0.85,
) -> List[Dict[str, Any]]:
    meta = meta or {}
    sents = SENT_SPLIT_RE.split(raw_text or "")
    out: List[Dict[str, Any]] = []

    for sent in sents:
        try:
            sent = normalize_text(sent)
            if not sent or len(sent) < 8:
                continue

            if not detect_deontic(sent):
                continue

            slots = rule_extract(sent)
            use_llm = slots.get("confidence", 0.0) < llm_threshold
            extracted = None

            if use_llm:
                llm_res = llm_fallback_extract(sent)
                if isinstance(llm_res, dict) and llm_res.get("is_obligation"):
                    extracted = {
                        "text": sent,
                        "deontic": llm_res.get("deontic"),
                        "subject": llm_res.get("subject"),
                        "action": llm_res.get("action"),
                        "object": llm_res.get("object"),
                        "condition": llm_res.get("condition"),
                        "confidence": float(llm_res.get("confidence") or 0.5),
                        "extracted_by": llm_res.get("extracted_by", "llm_v1"),
                    }
                else:
                    extracted = slots
                    extracted["note"] = llm_res.get("error") if isinstance(llm_res, dict) else None
            else:
                extracted = slots

            if not extracted:
                continue

            confidence = float(extracted.get("confidence") or 0.0)
            status = "auto_created" if confidence >= auto_create_threshold else "review_pending"
            oid = obligation_id_for(doc_id, extracted["text"])

            out.append({
                "obligation_id": oid,
                "source_doc": doc_id,
                "text": extracted["text"],
                "deontic": extracted.get("deontic"),
                "subject": extracted.get("subject"),
                "action": extracted.get("action"),
                "object": extracted.get("object"),
                "condition": extracted.get("condition"),
                "confidence": confidence,
                "extracted_by": extracted.get("extracted_by", "rule_v1"),
                "status": status,
                "provenance": {
                    "fetch_date": meta.get("fetch_date"),
                    "package_id": meta.get("package_id"),
                    "chunk_id": meta.get("chunk_id"),
                },
                "created_at": datetime.utcnow().isoformat()
            })
        except Exception:
            traceback.print_exc()
            continue

    return out



# Router endpoint (with Neo4j upsert)

@router.post("/api/v1/ingest/raw")
async def ingest_raw(payload: Dict[str, Any] = Body(...)):
    doc_id = payload.get("doc_id") or payload.get("id") or payload.get("docId")
    raw_text = payload.get("raw_text") or payload.get("text") or payload.get("rawText")
    if not doc_id or not raw_text:
        raise HTTPException(status_code=400, detail="Missing doc_id or raw_text")

    # optional user id coming from fetcher or frontend
    user_uid = payload.get("user_uid") or payload.get("userId") or payload.get("user")

    meta = {
        "fetch_date": payload.get("fetch_date"),
        "package_id": payload.get("package_id"),
        "chunk_id": payload.get("chunk_id"),
    }

    obligations = extract_obligations_from_text(doc_id, raw_text, meta=meta)

    # attach user to obligations if provided
    if user_uid:
        for o in obligations:
            o["user_uid"] = user_uid

    
    try:
        created_count = upsert_obligations_neo4j(obligations)
    except Exception as e:
        
        traceback.print_exc()
        return JSONResponse(content={"ok": False, "error": str(e), "created_count": 0, "obligations": obligations}, status_code=500)

    return JSONResponse(content={"ok": True, "created_count": created_count, "obligations": obligations})



# fetch obligations for a user

@router.get("/api/v1/obligations/user/{user_uid}")
async def get_obligations_for_user(user_uid: str, limit: int = Query(100, gt=0, le=1000), skip: int = Query(0, ge=0)):
    """
    Returns obligations created/attached to the given user_uid with pagination
    """
    try:
        driver = get_neo4j_driver()
        q = """
        MATCH (o:Obligation)
        WHERE o.user_uid = $user_uid
        OPTIONAL MATCH (reg)-[:HAS_OBLIGATION]->(o)
        RETURN o AS obligation, reg.regulation_id AS regulation_id
        ORDER BY o.created_at DESC
        SKIP $skip LIMIT $limit
        """
        rows = []
        with driver.session() as session:
            res = session.run(q, {"user_uid": user_uid, "skip": skip, "limit": limit})
            for record in res:
                node = record["obligation"]
                # Neo4j python driver returns Node object, convert to dict
                props = dict(node)
                props["regulation_id"] = record.get("regulation_id")
                rows.append(props)
        driver.close()
        return JSONResponse(content={"ok": True, "count": len(rows), "obligations": rows})
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(content={"ok": False, "error": str(e)}, status_code=500)


# -------------------------------
# Optional helper to create indexes for production scaling
# run once manually or call at startup if you prefer
# -------------------------------
def ensure_neo4j_indexes():
    """
    Creates indexes used for lookups
    Call this manually from a startup hook if desired
    """
    try:
        driver = get_neo4j_driver()
    except Exception as e:
        print("ensure_neo4j_indexes skipped neo4j config missing", str(e))
        return

    idx_cypher = [
        "CREATE INDEX IF NOT EXISTS FOR (o:Obligation) ON (o.obligation_id);",
        "CREATE INDEX IF NOT EXISTS FOR (o:Obligation) ON (o.user_uid);",
        "CREATE INDEX IF NOT EXISTS FOR (r:Regulation) ON (r.regulation_id);",
    ]
    with driver.session() as session:
        for c in idx_cypher:
            try:
                session.run(c)
            except Exception:
                # ignore non fatal
                traceback.print_exc()
    driver.close()


# note for operators
# run ensure_neo4j_indexes() once after your neo4j is up or run these commands in the neo4j browser
# CREATE INDEX IF NOT EXISTS FOR (o:Obligation) ON (o.obligation_id);
# CREATE INDEX IF NOT EXISTS FOR (o:Obligation) ON (o.user_uid);
# CREATE INDEX IF NOT EXISTS FOR (r:Regulation) ON (r.regulation_id);
