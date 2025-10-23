from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import logging, sys, io, json, os, tempfile, hashlib, requests
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler

# Core imports
from core.backend import fetch_files_from_source
from core.work import DowComplianceDataFetcher
from core.RAG import ComplianceChecker as RAGComplianceChecker

# Google API imports
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

# Local imports for DB
from api.models import ObligationInstance, RemediationTask, EvidenceArtifact, AuditLog, TaskState, Base
from api.db import get_db, engine, SessionLocal

# Create tables
Base.metadata.create_all(bind=engine)

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

# Initialize FastAPI app
app = FastAPI(title="ComplianceAI Platform API", version="2.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============== REGULATORY MONITORING ==============

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

# ============== API ENDPOINTS ==============

@app.post("/api/fetch_files")
async def fetch_files(source: str = Form(...)):
    logging.info(f"Fetching files from source: {source}")
    result = fetch_files_from_source(source)
    return result

def load_stored_files():
    if os.path.exists(STORED_FILES):
        with open(STORED_FILES, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

@app.post("/api/download_file")
async def download_gdrive_file(file_id: str = Form(...)):
    try:
        creds = None
        if os.path.exists("token.json"):
            creds = Credentials.from_authorized_user_file("token.json", G_SCOPES)
        else:
            return {"error": "Not authenticated with Google Drive."}

        service = build("drive", "v3", credentials=creds)
        file = service.files().get(fileId=file_id, fields="name").execute()
        file_name = file["name"]
        request = service.files().get_media(fileId=file_id)
        file_path = os.path.join("downloads", file_name)
        os.makedirs("downloads", exist_ok=True)

        fh = io.FileIO(file_path, "wb")
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            status, done = downloader.next_chunk()

        return {"message": "Downloaded successfully", "path": file_path}
    except Exception as e:
        return {"error": str(e)}

def save_stored_files(data):
    with open(STORED_FILES, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

@app.post("/api/internal_compliance_audit")
async def internal_compliance_audit(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    with open("sample_regulations.json", "r", encoding="utf-8") as f:
        regulations = json.load(f)

    checker = RAGComplianceChecker(pdf_path=tmp_path, regulations=regulations)
    results = checker.run_check()
    summary = checker.summary(results)

    return JSONResponse(content={
        "status": "success",
        "total_requirements": len(results),
        "results": results
    })

@app.get("/api/external_intelligence")
async def external_intelligence(industry: str):
    result = {"status": "success", "details": f"Fetched data for {industry}"}
    return JSONResponse(content=result)

@app.post("/api/rag_compliance_analysis")
async def rag_analysis(file: UploadFile = File(...), regulations: str = Form(...)):
    pdf_bytes = await file.read()
    findings = {"status": "success", "details": "RAG policy-compliance mock result"}
    return JSONResponse(content=findings)

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

# Task Management
@app.post("/api/task")
async def create_task(
    obligation_id: int = Form(...), 
    assigned_to: str = Form(...), 
    sla_due: str = Form(...),
    checklist_template: str = Form("{}"),
    db: Session = Depends(get_db)
):
    template = json.loads(checklist_template) if checklist_template else {}
    task = RemediationTask(
        obligation_id=obligation_id, 
        assigned_to=assigned_to, 
        sla_due=datetime.fromisoformat(sla_due),
        checklist_template=template
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    log_audit(db, "RemediationTask", task.id, "create", "system", f"Created task for obligation {obligation_id}")
    return task

@app.get("/api/tasks")
async def get_tasks(db: Session = Depends(get_db)):
    tasks = db.query(RemediationTask).all()
    return tasks

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
    db: Session = Depends(get_db)
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
        validation_errors=[]
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

# Dashboard
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
    return {"status": "online", "service": "ComplianceAI Platform API", "monitoring": "active"}
