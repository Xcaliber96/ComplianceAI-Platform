from fastapi import FastAPI, UploadFile, File, Form, Depends
from fastapi.responses import JSONResponse
from typing import List
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pathlib import Path
from dotenv import load_dotenv, dotenv_values
import os
from uuid import uuid4
from datetime import datetime
from fastapi import Request, Response, HTTPException

from sqlalchemy.orm import Session
from typing import List, Optional
import logging, sys, io, json, os, tempfile, hashlib, requests
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from src.core.LLM import generate_market_insight

# Google API imports
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

# Local imports for DB
from src.api.models import ObligationInstance, RemediationTask, EvidenceArtifact, AuditLog, TaskState, Base
from src.api.db import get_db, engine, SessionLocal
from apscheduler.schedulers.background import BackgroundScheduler
import logging, sys,io,json, os
from src.core.backend import fetch_files_from_source
from src.core.work import DowComplianceDataFetcher
from src.core.RAG import ComplianceChecker as RAGComplianceChecker
from fastapi import FastAPI, Form
import os, json, requests, logging, sys, traceback,tempfile
import msal

from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google.oauth2.credentials import Credentials
from fastapi.responses import JSONResponse
from google.oauth2 import service_account
from pydantic import BaseModel
DOWNLOAD_DIR = os.path.abspath(os.path.join(os.getcwd(), "shared_downloads"))
os.makedirs(DOWNLOAD_DIR, exist_ok=True)
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from google.auth.transport.requests import Request as GoogleAuthRequest
from firebase_admin import auth as firebase_auth, credentials
from fastapi import HTTPException

from google.auth.exceptions import RefreshError
from src.core.extract_keywords import read_policy_text, extract_keywords
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from src.core.find_competitors import find_competitors, clean_names, get_company_filings
from fastapi import APIRouter
from openai import OpenAI
import os
from uuid import uuid4
from fastapi import Request, Response
from fastapi import Query
from fastapi import FastAPI
from .graph_api import router as graph_router   # plain import works when cwd is the folder
import sys, subprocess, os
from typing import Dict, Any


app = FastAPI()
app.include_router(graph_router)

# Check if Render secret file exists, else fallback to local
if os.path.exists("/etc/secrets/.env"):
    load_dotenv("/etc/secrets/.env", override=True)
    print("Loaded environment from /etc/secrets/.env (Render)")
else:
    load_dotenv(".env", override=True)
    print("Loaded environment from local .env")

app = FastAPI(title="ComplianceAI Platform API", version="2.0")
load_dotenv()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://nomioc.com",                        
        "https://www.nomioc.com",                       
        "http://localhost:8000",
        "http://localhost:8501", 
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
if os.path.exists("/etc/secrets/.env"):
    load_dotenv("/etc/secrets/.env", override=True)
    print("Loaded environment from /etc/secrets/.env (Render)")
else:
    load_dotenv(".env", override=True)
    print("Loaded environment from local .env")

# relative import of graph router (same package)
from .graph_api import router as graph_router

app = FastAPI(title="ComplianceAI Platform API", version="2.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://nomioc.com",
        "https://www.nomioc.com",
        "http://localhost:8000",
        "http://localhost:8501",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# include routers (do this AFTER app is created)
app.include_router(graph_router)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter()

TOKEN_FILE = "token.json"
G_SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
]
firebase_key_path = (
    "/etc/secrets/firebase-adminsdk.json"
    if os.path.exists("/etc/secrets/firebase-adminsdk.json")
    else "firebase-adminsdk.json"
)
if not firebase_admin._apps:
    cred = credentials.Certificate(firebase_key_path)
    firebase_admin.initialize_app(cred)
    
SESSIONS = {}

def store_user_if_new(uid, email):
    """Store a new Firebase user in the database if not already present."""
    from src.api.models import User  # local import avoids circular import
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.uid == uid).first()
        if not existing:
            user = User(
                uid=uid,
                email=email,
                created_at=datetime.utcnow()
            )
            db.add(user)
            print("-------------------------------------------------------------I'm here")
            db.commit()
            print(f"[DB] Created new user: {email}")
        else:
            print(f"[DB] User already exists: {email}")
    except Exception as e:
        print(f"[DB ERROR] store_user_if_new failed: {e}")
    finally:
        db.close()

@app.post("/session/login")
async def session_login(request: Request, response: Response):
    data = await request.json()
    id_token = data.get("idToken")
    uid = data.get("uid")

    if not id_token:
        raise HTTPException(status_code=400, detail="Missing idToken")

    try:
        decoded = firebase_auth.verify_id_token(id_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Firebase token: {e}")

    email = decoded.get("email")

    try:
        store_user_if_new(uid, email)
    except Exception as e:
        print(f"[Warning] Could not store user info: {e}")

    session_id = str(uuid4())
    SESSIONS[session_id] = {"email": email, "timestamp": datetime.utcnow().isoformat()}

    ENV = os.getenv("ENV", "dev").strip().lower()
    FRONTEND_URL = os.getenv("FRONTEND_URL", "").strip().lower()

    if not FRONTEND_URL:
        FRONTEND_URL = "http://localhost:8501"

    IS_LOCAL = (
        ENV == "dev"
        or "localhost" in FRONTEND_URL
        or FRONTEND_URL.startswith("http://127.0.0.1")
    )

    print(f"ENV={ENV} | FRONTEND_URL={FRONTEND_URL} | IS_LOCAL={IS_LOCAL}")

    if IS_LOCAL:
        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=True,
            secure=False,
            samesite="Lax",
            path="/"
        )
    else:
        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=True,
            secure=True,
            samesite="None",
            domain=".nomioc.com",
            path="/"
        )

    return {"status": "success", "email": email, "uid": uid}

@app.get("/session/me")
async def get_current_user(request: Request):
    session_id = request.cookies.get("session_id")
    print(" Cookies received:", request.cookies)
    if not session_id or session_id not in SESSIONS:
        print(" Missing or invalid session_id:", session_id)
        raise HTTPException(status_code=401, detail="Not authenticated")
    print(" Authenticated session:", SESSIONS[session_id])
    return {"status": "authenticated", "user": SESSIONS[session_id]}

@app.post("/session/logout")
async def logout(request: Request, response: Response):
    session_id = request.cookies.get("session_id")
    if session_id in SESSIONS:
        del SESSIONS[session_id]
    response.delete_cookie("session_id")
    return {"status": "logged_out"}

def extract_text_from_pdf_bytes(pdf_bytes):
    import io
    from PyPDF2 import PdfReader
    reader = PdfReader(io.BytesIO(pdf_bytes))
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text
def run_ingest_script(audit_path: str) -> Dict[str, Any]:
    project_root = ROOT
    script_path = project_root / "scripts" / "ingest_audit_to_neo4j.py"
    if not script_path.exists():    
        raise FileNotFoundError(f"Ingest script not found at {script_path}")

    python_bin = os.environ.get("PYTHON_BIN", sys.executable)
    cmd = [python_bin, str(script_path), str(audit_path)]
    # run and capture
    proc = subprocess.run(cmd, capture_output=True, text=True, cwd=str(project_root))
    # log to server console for debugging
    print(f"[INGEST] cmd: {cmd}")
    print(f"[INGEST] returncode: {proc.returncode}")
    print(f"[INGEST] stdout:\n{proc.stdout}")
    print(f"[INGEST] stderr:\n{proc.stderr}")
    return {
        "returncode": proc.returncode,
        "stdout": proc.stdout,
        "stderr": proc.stderr
    }


def get_gdrive_credentials():
    """Safely load Google Drive credentials, auto-delete invalid token.json"""
    creds = None
    if os.path.exists(TOKEN_FILE):
        try:
            creds = Credentials.from_authorized_user_file(TOKEN_FILE, G_SCOPES)
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(GoogleAuthRequest())
        except (ValueError, RefreshError) as e:
            print(f"Invalid or expired token.json: {e}")
            try:
                os.remove(TOKEN_FILE)
                print("Removed corrupted token.json; will re-auth next time.")
            except Exception:
                pass
            creds = None

    if not creds:
        flow = InstalledAppFlow.from_client_secrets_file("client_secret.json", G_SCOPES)
        creds = flow.run_local_server(
            port=8080,
            access_type="offline",
            prompt="consent",
            include_granted_scopes="true",
        )
        with open(TOKEN_FILE, "w") as token:
            token.write(creds.to_json())

    return creds

# Load GCP settings
PROJECT_ID = "compliance-473813"
ROLE = "roles/storage.objectAdmin"

# Load service account credentials
SERVICE_ACCOUNT_FILE = "admin-key.json"

class UserAccessRequest(BaseModel):
    email: str

# Local imports for DB
from src.api.models import ObligationInstance, RemediationTask, EvidenceArtifact, AuditLog, TaskState, Base
from src.api.db import get_db, engine, SessionLocal


# Constants
G_SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
]
G_CLIENT_SECRET = "client_secret.json"
TOKEN_FILE = "token.json"
STORED_FILES = "stored_drive_files.json"

# Setup logging
logging.basicConfig(level=logging.INFO, stream=sys.stdout)

# Processed regulations cache
processed_regulations = set()

REGULATORY_SOURCES = {
    "FEDERAL_REGISTER": "https://www.federalregister.gov/api/v1/documents.json?fields[]=title&fields[]=publication_date&per_page=10"
}

REGULATION_TEMPLATES = {
    "GDPR": [
        {
            "description": "Implement data retention and deletion policies",
            "tasks": [
                {"role": "Legal", "title": "Draft data retention policy"},
                {"role": "IT", "title": "Implement automated deletion workflows"}
            ]
        },
        {
            "description": "Establish consent management system",
            "tasks": [
                {"role": "IT", "title": "Deploy consent tracking tool"},
                {"role": "Legal", "title": "Review consent language"}
            ]
        },
        {
            "description": "Implement data breach notification procedures",
            "tasks": [
                {"role": "Security", "title": "Create incident response plan"},
                {"role": "Legal", "title": "Draft breach notification templates"}
            ]
        }
    ],
    "SOX": [
        {
            "description": "SOX 404 internal controls assessment",
            "tasks": [
                {"role": "Finance", "title": "Document financial controls"},
                {"role": "IT", "title": "IT general controls review"}
            ]
        },
        {
            "description": "Financial statement certification process",
            "tasks": [
                {"role": "Finance", "title": "Prepare certification documentation"},
                {"role": "Audit", "title": "Review financial disclosures"}
            ]
        }
    ],
    "SOC2": [
        {
            "description": "Access control management",
            "tasks": [
                {"role": "IT", "title": "Implement MFA"},
                {"role": "Security", "title": "Review access logs"}
            ]
        },
        {
            "description": "Vulnerability management program",
            "tasks": [
                {"role": "Security", "title": "Schedule quarterly pen tests"},
                {"role": "IT", "title": "Deploy patch management system"}
            ]
        }
    ],
    "HIPAA": [
        {
            "description": "PHI encryption requirements",
            "tasks": [
                {"role": "IT", "title": "Implement encryption at rest"},
                {"role": "Security", "title": "Configure TLS for transit"}
            ]
        },
        {
            "description": "Business associate agreements",
            "tasks": [
                {"role": "Legal", "title": "Draft BAA templates"},
                {"role": "Compliance", "title": "Vendor BAA collection"}
            ]
        }
    ]
}

ROLE_ASSIGNMENTS = {
    "Legal": "legal@company.com",
    "IT": "it@company.com",
    "Finance": "finance@company.com",
    "Security": "security@company.com",
    "Audit": "audit@company.com",
    "Compliance": "compliance@company.com"
}

from src.api.models import Supplier  

@app.post("/api/suppliers")
def create_supplier(
    name: str = Form(...),
    email: str = Form(...),
    industry: str = Form(...),
    region: str = Form(...),
    db: Session = Depends(get_db),
    user_uid: str = Form(...)
):
    supplier = Supplier(
        name=name,
        email=email,
        industry=industry,
        region=region,
        user_uid=user_uid 
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier

from fastapi import Query

@app.get("/api/suppliers")
def list_suppliers(
    user_uid: Optional[str] = Query(None),  # Now optional
    db: Session = Depends(get_db)
):
    if user_uid:
        return db.query(Supplier).filter(Supplier.user_uid == user_uid).all()
    else:
        # Defensive: Return empty list if user_uid not provided
        return []


@app.post("/api/suppliers/{supplier_id}/upload")
def upload_supplier_file(
    supplier_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    file_location = f"uploads/supplier_{supplier_id}_{file.filename}"
    with open(file_location, "wb") as f:
        f.write(file.file.read())
   
    return {"supplier_id": supplier_id, "filename": file.filename, "message": "File uploaded"}


@app.post("/api/competitors")
async def get_competitors(company_name: str = Form(...)):
    """
    Given a company name, return its competitors and their recent filings.
    """
    try:
        competitors = find_competitors(company_name)
        cleaned = clean_names(competitors)
        filings = get_company_filings(cleaned)
        return {"company": company_name, "competitors": cleaned, "filings": filings}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/analyze")
async def analyze_company(company_name: str = Form(...)):
    """
    Generate AI-based insights for a company using GPT-4o.
    """
    try:
        competitors = clean_names(find_competitors(company_name))
        filings = get_company_filings(competitors)
        insight = generate_market_insight(company_name, competitors, filings)
        return {"company": company_name, "insight": insight}
    except Exception as e:
        return {"error": str(e)}

def check_federal_register():
    """Monitor Federal Register for new rules"""
    try:
        response = requests.get(REGULATORY_SOURCES["FEDERAL_REGISTER"], timeout=10)
        data = response.json()
        new_regulations = []
        
        for doc in data.get('results', [])[:5]:
            reg_id = hashlib.md5(doc['title'].encode()).hexdigest()
            if reg_id not in processed_regulations:
                processed_regulations.add(reg_id)
                new_regulations.append({
                    "source": "Federal Register",
                    "title": doc['title'],
                    "date": doc.get('publication_date'),
                    "url": f"https://www.federalregister.gov/documents/{doc.get('document_number', '')}",
                    "impact_areas": ["Legal", "Compliance"],
                    "regulation_type": "Federal"
                })
        return new_regulations
    except Exception as e:
        logging.error(f"Federal Register monitoring failed: {e}")
        return []

def analyze_regulation_impact(regulation: dict):
    """Analyze regulation impact"""
    impact_analysis = {
        "affected_departments": regulation.get("impact_areas", ["Legal"]),
        "required_actions": [],
        "risk_level": "Medium"
    }
    
    # Simple keyword matching
    title_lower = regulation.get("title", "").lower()
    if any(word in title_lower for word in ["security", "cybersecurity", "data"]):
        impact_analysis["affected_departments"].extend(["IT", "Security"])
        impact_analysis["required_actions"] = [
            "Review security controls",
            "Update security documentation",
            "Implement required changes"
        ]
        impact_analysis["risk_level"] = "High"
    elif any(word in title_lower for word in ["financial", "audit", "reporting"]):
        impact_analysis["affected_departments"].extend(["Finance", "Audit"])
        impact_analysis["required_actions"] = [
            "Review financial controls",
            "Update reporting procedures"
        ]
    else:
        impact_analysis["required_actions"] = [
            "Review regulation requirements",
            "Assess compliance impact"
        ]
    
    return impact_analysis

def auto_create_from_detected_regulation(regulation: dict, impact: dict, db: Session):
    """Create obligations and tasks from detected regulation"""
    obligation = ObligationInstance(
        description=f"{regulation['title'][:200]} - Compliance Required",
        regulation=regulation.get('regulation_type', 'Federal'),
        due_date=datetime.utcnow() + timedelta(days=90)
    )
    db.add(obligation)
    db.commit()
    db.refresh(obligation)
    
    log_audit(db, "ObligationInstance", obligation.id, "auto_detect", "regulatory_monitor", 
              f"Auto-detected from {regulation['source']}: {regulation['title'][:100]}")
    
    for idx, action in enumerate(impact["required_actions"]):
        dept = impact["affected_departments"][idx % len(impact["affected_departments"])]
        assigned_to = ROLE_ASSIGNMENTS.get(dept, "compliance@company.com")
        
        task = RemediationTask(
            obligation_id=obligation.id,
            assigned_to=assigned_to,
            sla_due=datetime.utcnow() + timedelta(days=60 - idx*10),
            checklist_template={"title": action, "regulation_url": regulation.get("url", "")}
        )
        db.add(task)
        db.commit()
    
    return obligation.id

def regulatory_monitoring_job():
    """Background job for regulatory monitoring"""
    logging.info("Running regulatory monitoring job...")
    db = SessionLocal()
    
    try:
        new_regulations = check_federal_register()
        
        for regulation in new_regulations:
            logging.info(f"Processing: {regulation['title'][:50]}...")
            impact = analyze_regulation_impact(regulation)
            obligation_id = auto_create_from_detected_regulation(regulation, impact, db)
            logging.info(f"Created obligation #{obligation_id}")
        
        if new_regulations:
            logging.info(f"Processed {len(new_regulations)} new regulations")
    except Exception as e:
        logging.error(f"Regulatory monitoring failed: {e}")
    finally:
        db.close()

# Initialize scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(regulatory_monitoring_job, 'interval', hours=12)
scheduler.start()

@app.post("/api/fetch_files")
async def fetch_files(source: str = Form(...)):
    try:
        result = {"status": "ok", "total_requirements": 15, "file_name": file.filename}
        return result
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}
    finally:
        cleanup_temp_files()
async def extract_keywords_api(file: UploadFile = File(...)):
    """Automatically extract compliance-related keywords from uploaded file."""
    # Save uploaded file temporarily
    file_path = os.path.join(SHARED_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    try:
        text = read_policy_text(file_path)
        keywords = extract_keywords(text)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

    return {"filename": file.filename, "keywords": keywords}

@app.post("/api/fetch_files")
async def fetch_files(
    source: str = Form(...),
    folder_id: str = Form(default="root")
):

    logging.info(f"Fetching files from source: {source}, folder_id: {folder_id}")

    creds = get_gdrive_credentials()
    service = build("drive", "v3", credentials=creds)
    result = fetch_files_from_source(source, folder_id, service)

    try:
        upload_for_audit(result)
    except Exception as e:
        logging.warning(f"Upload for audit failed: {e}")

    if not os.path.exists(DOWNLOAD_DIR):
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)

    downloaded_files = [os.path.join(DOWNLOAD_DIR, f) for f in os.listdir(DOWNLOAD_DIR) if os.path.isfile(os.path.join(DOWNLOAD_DIR, f))]
    if not downloaded_files:
        logging.warning("No downloaded files found in shared_downloads.")
        return {"files": result, "keywords": [], "message": "No files found to analyze."}

    latest_file = max(downloaded_files, key=os.path.getmtime)
    logging.info(f"Latest downloaded file detected: {latest_file}")

    # Extract text + keywords
    try:
        text = read_policy_text(latest_file)
        keywords = extract_keywords(text)
        logging.info(f"Extracted {len(keywords)} keywords from {os.path.basename(latest_file)}")
    except Exception as e:
        logging.error(f"Keyword extraction failed: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

    # Return clean response
    return {
        "files": result,
        "keywords": keywords,
        "analyzed_file": os.path.basename(latest_file),
        "download_path": latest_file
    }
def load_stored_files(response_model=None):
    if os.path.exists(STORED_FILES):
        with open(STORED_FILES, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

@app.post("/api/download_file", response_model=None)
async def download_gdrive_file(file_id: str = Form(...)):
    try:
        creds = None
        if os.path.exists("token.json"):
            creds = get_gdrive_credentials()
        else:
            return {"error": "Not authenticated with Google Drive."}

        service = build("drive", "v3", credentials=creds)
        file = service.files().get(fileId=file_id, fields="name").execute()
        file_name = file["name"]

        request = service.files().get_media(fileId=file_id)
        file_path = os.path.join(DOWNLOAD_DIR, file_name)

        fh = io.FileIO(file_path, "wb")
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            status, done = downloader.next_chunk()

        return {"message": "Downloaded successfully", "path": file_path}
    except Exception as e:
        return {"error": str(e)}

def save_stored_files(data, response_model=None):
    with open(STORED_FILES, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)
@app.post("/api/internal_compliance_audit")
async def internal_compliance_audit(file: UploadFile = File(...), response_model=None):
    try:
        # Step 1: Save the uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        # Step 2: Load the regulations file
        if not os.path.exists("sample_regulations.json"):
            raise FileNotFoundError("sample_regulations.json not found in backend directory")

        with open("sample_regulations.json", "r", encoding="utf-8") as f:
            regulations = json.load(f)

        # Step 3: Run the compliance checker
        from src.core.RAG import ComplianceChecker 
        checker = ComplianceChecker(pdf_path=tmp_path, regulations=regulations)
        results = checker.run_check()

        # Step 4: Summarize results
        summary = checker.dashboard_summary(results)
        
        # Step 5: Return structured response
        return JSONResponse(content={
            "status": "success",
            "total_requirements": len(results),
            "results": results
        })

    except Exception as e:
        # Print full traceback to console for debugging
        print("INTERNAL ERROR in /internal_compliance_audit:\n", traceback.format_exc())

        # Return structured JSON error for the frontend
        return JSONResponse(
            content={"status": "error", "message": str(e)},
            status_code=500
        )

from openai import OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.get("/api/external_intelligence", response_model=None)
async def external_intelligence(industry: str):
    prompt = (
        f"Generate structured JSON on compliance, risk trends, and new regulations for the {industry} industry. "
        "Format as: {"
        '"source": "MarketReport",'
        '"headline": "...",'
        '"key_risks": ["...", "..."],'
        '"regulation_news": ['
            '{"regulation": "...", "summary": "...", "link": "..."}'
        ']}'
    )
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are an enterprise compliance assistant."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=600,
        temperature=0.2,
        response_format={"type": "json_object"},
    )
    import json
    content = response.choices[0].message.content
    try:
        findings = [json.loads(content)]
    except Exception:
        findings = [{"headline": "Parsing error", "error": content}]
    return JSONResponse(content={"status": "success", "details": findings})

@app.get("/api/source_graph")
async def source_graph(platform: str):
    graph_data = {"nodes": ["A", "B"], "edges": [("A", "B")]}
    return JSONResponse(content=graph_data)

# Obligation Management
@app.post("/api/obligation")
async def create_obligation(
    description: str = Form(...), 
    regulation: str = Form(...), 
    due_date: str = Form(...), 
    db: Session = Depends(get_db)
):
    obj = ObligationInstance(
        description=description, 
        regulation=regulation, 
        due_date=datetime.fromisoformat(due_date)
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    log_audit(db, "ObligationInstance", obj.id, "create", "system", f"Created obligation: {description}")
    return obj

@app.get("/api/obligations")
async def get_obligations(db: Session = Depends(get_db)):
    obligations = db.query(ObligationInstance).all()
    return obligations

@app.post("/api/task")
async def create_task(
    obligation_id: int = Form(...),
    assigned_to: str = Form(...),
    sla_due: str = Form(...),
    supplier_id: str = Form(None),
    checklist_template: str = Form("{}"),
    user_uid: str = Form(...), 
    db: Session = Depends(get_db)
):
    template = json.loads(checklist_template) if checklist_template else {}

    task = RemediationTask(
        obligation_id=obligation_id,
        assigned_to=assigned_to,
        sla_due=datetime.fromisoformat(sla_due),
        supplier_id=supplier_id, 
        checklist_template=template,
        user_uid=user_uid, 
    )
    
    db.add(task)
    db.commit()
    db.refresh(task)
    log_audit(
        db,
        "RemediationTask",
        task.id,
        "create",
         user_uid,  
        f"Created task for obligation {obligation_id} (supplier: {supplier_id})"
    )
    return task

@app.get("/api/tasks")
async def get_tasks(
    user_uid: Optional[str] = Query(None),  # Now optional
    db: Session = Depends(get_db)
):
    if user_uid:
        return db.query(RemediationTask).filter(RemediationTask.user_uid == user_uid).all()
    else:
        # Defensive: Return empty list if user_uid not provided
        return []

  
@app.get("/api/task/{task_id}")
async def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(RemediationTask).filter(RemediationTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@app.post("/api/task/{task_id}/transition")
async def transition_task(
    task_id: int, 
    new_state: str = Form(...), 
    user: str = Form("system"),
    db: Session = Depends(get_db)
):
    task = db.query(RemediationTask).filter(RemediationTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    allowed = {
        "TODO": ["IN_PROGRESS", "WAIVER"],
        "IN_PROGRESS": ["REVIEW", "WAIVER"],
        "REVIEW": ["DONE", "WAIVER"],
        "WAIVER": ["IN_PROGRESS"]
    }
    
    if new_state not in allowed.get(task.state, []):
        return JSONResponse(content={"error": f"Invalid transition from {task.state} to {new_state}"}, status_code=400)
    
    old_state = task.state
    task.state = new_state
    db.commit()
    log_audit(db, "RemediationTask", task.id, "transition", user, f"Transitioned from {old_state} to {new_state}")
    return task

# Evidence Management
@app.post("/api/task/{task_id}/evidence")
async def add_evidence(
    task_id: int, 
    evidence_file: UploadFile = File(...),
    user: str = Form("system"),
    db: Session = Depends(get_db),
    user_uid: str = Form(...), 
):
    task = db.query(RemediationTask).filter(RemediationTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    evidence_bytes = await evidence_file.read()
    evidence_id = hashlib.sha256(evidence_bytes).hexdigest()[:16]
    chromadb_id = f"chroma_{evidence_id}"
    
    artifact = EvidenceArtifact(
        task_id=task_id,
        chromadb_id=chromadb_id,
        valid=True,
        validation_errors=[],
        user_uid=user_uid
    )
    db.add(artifact)
    db.commit()
    db.refresh(artifact)
    log_audit(db, "EvidenceArtifact", artifact.id, "upload", user, f"Uploaded evidence for task {task_id}")
    return artifact

@app.get("/api/task/{task_id}/evidence")
async def get_evidence(task_id: int, db: Session = Depends(get_db)):
    evidence = db.query(EvidenceArtifact).filter(EvidenceArtifact.task_id == task_id).all()
    return evidence

@app.post("/api/evidence/{evidence_id}/attest")
async def attest_evidence(
    evidence_id: int, 
    user: str = Form(...),
    db: Session = Depends(get_db)
):
    artifact = db.query(EvidenceArtifact).filter(EvidenceArtifact.id == evidence_id).first()
    if not artifact:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    if not artifact.valid:
        raise HTTPException(status_code=400, detail="Cannot approve invalid evidence")
    
    artifact.approved_by = user
    artifact.approved_on = datetime.utcnow()
    artifact.attestation_hash = hashlib.sha256(
        json.dumps({"id": artifact.id, "chromadb_id": artifact.chromadb_id, "user": user}, sort_keys=True).encode()
    ).hexdigest()
    
    db.commit()
    log_audit(db, "EvidenceArtifact", artifact.id, "attest", user, "Evidence approved and attested")
    return artifact

@app.get("/api/dashboard/summary")
async def get_dashboard_summary(db: Session = Depends(get_db)):
    total_tasks = db.query(RemediationTask).count()
    done_tasks = db.query(RemediationTask).filter(RemediationTask.state == TaskState.DONE).count()
    breached_tasks = db.query(RemediationTask).filter(RemediationTask.breach_flag == True).count()
    overdue_tasks = db.query(RemediationTask).filter(
        RemediationTask.sla_due < datetime.utcnow(),
        RemediationTask.state != TaskState.DONE
    ).count()
    
    return {
        "total_tasks": total_tasks,
        "done": done_tasks,
        "breached": breached_tasks,
        "overdue": overdue_tasks
    }

@app.get("/api/audit_log")
async def get_audit_log(limit: int = 100, db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return logs

# Automation
@app.post("/api/auto_generate_compliance")
async def auto_generate_compliance(
    regulation: str = Form(...),
    due_date_offset_days: int = Form(90),
    db: Session = Depends(get_db)
):
    if regulation not in REGULATION_TEMPLATES:
        return JSONResponse(
            content={"error": f"No template found for {regulation}"},
            status_code=400
        )
    
    template = REGULATION_TEMPLATES[regulation]
    base_due_date = datetime.utcnow() + timedelta(days=due_date_offset_days)
    
    created_obligations = []
    created_tasks = []
    
    for idx, obl_template in enumerate(template):
        obl_due = base_due_date + timedelta(days=idx * 7)
        obligation = ObligationInstance(
            description=obl_template["description"],
            regulation=regulation,
            due_date=obl_due
        )
        db.add(obligation)
        db.commit()
        db.refresh(obligation)
        created_obligations.append(obligation)
        log_audit(db, "ObligationInstance", obligation.id, "auto_create", "system", f"Auto-generated for {regulation}")
        
        for task_idx, task_template in enumerate(obl_template["tasks"]):
            task_due = obl_due - timedelta(days=(len(obl_template["tasks"]) - task_idx) * 3)
            assigned_to = ROLE_ASSIGNMENTS.get(task_template["role"], "default@company.com")
            task = RemediationTask(
                obligation_id=obligation.id,
                assigned_to=assigned_to,
                sla_due=task_due,
                checklist_template={"title": task_template["title"]}
            )
            db.add(task)
            db.commit()
            db.refresh(task)
            created_tasks.append(task)
            log_audit(db, "RemediationTask", task.id, "auto_create", "system", f"Auto-generated task: {task_template['title']}")
    
    return JSONResponse(content={
        "status": "success",
        "regulation": regulation,
        "obligations_created": len(created_obligations),
        "tasks_created": len(created_tasks),
        "obligations": [{"id": o.id, "description": o.description} for o in created_obligations]
    })

@app.post("/api/trigger_regulatory_scan")
async def trigger_regulatory_scan(background_tasks: BackgroundTasks):
    """Manually trigger regulatory monitoring"""
    background_tasks.add_task(regulatory_monitoring_job)
    return {"status": "success", "message": "Regulatory scan triggered"}

@app.get("/api/detected_regulations")
async def get_detected_regulations(db: Session = Depends(get_db)):
    """Get recently auto-detected regulations"""
    recent_detections = db.query(AuditLog).filter(
        AuditLog.action == "auto_detect",
        AuditLog.timestamp > datetime.utcnow() - timedelta(days=30)
    ).order_by(AuditLog.timestamp.desc()).limit(20).all()
    
    return recent_detections

# Helper
def log_audit(db: Session, entity_type: str, entity_id: int, action: str, user: str, detail: str):
    entry = AuditLog(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        user=user,
        timestamp=datetime.utcnow(),
        detail=detail
    )
    db.add(entry)
    db.commit()

@app.get("/")
async def root():
    # return {"status": "online", "service": "ComplianceAI Platform API", "monitoring": "active"}


    findings = {"status": "success", "details": "RAG policy-compliance mock result"}
    return JSONResponse(content=findings)

@app.post("/add_user_to_gcs")
async def add_user_to_gcs(request: Request):
    try:
        data = await request.json()
        email = data.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Email missing")

        print(f"✅ Received user email: {email}")

        # Get current IAM policy
        policy = service.projects().getIamPolicy(
            resource=PROJECT_ID, body={}
        ).execute()

        new_member = f"user:{email}"
        binding_found = False

        # Search if role exists
        for binding in policy.get("bindings", []):
            if binding["role"] == ROLE:
                if new_member not in binding["members"]:
                    binding["members"].append(new_member)
                    print(f"✅ Added {new_member} to existing {ROLE}")
                binding_found = True
                break

        # If role not found, create new binding
        if not binding_found:
            policy["bindings"].append({"role": ROLE, "members": [new_member]})
            print(f"✅ Created new binding for {ROLE}")

        # Update IAM policy
        service.projects().setIamPolicy(
            resource=PROJECT_ID,
            body={"policy": policy}
        ).execute()

        print(f"🎯 Successfully granted {ROLE} to {email}")
        return JSONResponse(content={
            "status": "success",
            "message": f"✅ {email} added to project {PROJECT_ID} as {ROLE}"
        })

    except Exception as e:
        print(f"❌ Error adding user: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to add user: {e}")
    

from openai import OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.post("/api/rag_compliance_analysis", response_model=None)
async def rag_analysis(
    file: UploadFile = File(...),
    regulations: str = Form(...),
    supplierid: str = Form(...)
):
    pdf_bytes = await file.read()
    pdf_text = extract_text_from_pdf_bytes(pdf_bytes)

    prompt = (
        "Given this supplier evidence text:\n"
        f"{pdf_text[:3000]}\n\n"
        f"And these regulations: {regulations}.\n"
        "For each regulation, return a JSON object with: requirement, status (Compliant/Risk/Violation), details, evidence (summarized as section/page). "
        "Always return a JSON array, even for one regulation. Do not return a single object. Array of JSON objects, nothing else."
    )

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a compliance audit expert."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=800,
        temperature=0.2,
        response_format={"type": "json_object"},
    )
    import json
    content = response.choices[0].message.content
    try:
        findings = json.loads(content)
        # Normalize output to always be a list of findings
        if isinstance(findings, dict) and "regulations" in findings:
            findings = findings["regulations"]
        elif isinstance(findings, dict):
            findings = [findings]
    except Exception:
        findings = [{"error": "Parsing error", "output": content}]
    return JSONResponse(content={
        "status": "success",
        "supplier": supplierid,
        "details": findings
    })



if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("src.api.main_api:app", host="0.0.0.0", port=port)