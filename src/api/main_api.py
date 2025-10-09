from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import List
import logging, sys,io,json, os
from src.core.backend import fetch_files_from_source
from src.core.work import DowComplianceDataFetcher
from src.core.RAG import ComplianceChecker as RAGComplianceChecker
from googleapiclient.http import MediaIoBaseDownload
from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
import os, json, requests, logging, sys, traceback
import msal
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

G_SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
]
G_CLIENT_SECRET = "client_secret.json"
TOKEN_FILE = "token.json"

STORED_FILES = "stored_drive_files.json"

logging.basicConfig(level=logging.INFO, stream=sys.stdout)
app = FastAPI(title="ComplianceAI Platform API", version="2.0")

@app.post("/api/fetch_files")
async def fetch_files(source: str = Form(...)):
    """
    Fetch files from connected sources (Google Drive, OneDrive, SharePoint)
    using the logic defined in src/core/backend.py
    """
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
    """Download a file from Google Drive by its ID and save it locally."""
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
    # Step 1: Save the uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    # Step 2: Load a sample regulations list (could come from a CSV or database)
    with open("sample_regulations.json", "r", encoding="utf-8") as f:
        regulations = json.load(f)

    # Step 3: Run the compliance checker
    checker = ComplianceChecker(pdf_path=tmp_path, regulations=regulations)
    results = checker.run_check()

    # Step 4: Summarize results
    summary = checker.summary(results)

    # Step 5: Return structured response to Streamlit
    return JSONResponse(content={
        "status": "success",
        "total_requirements": len(results),
        "results": results
    })

@app.get("/api/external_intelligence")
async def external_intelligence(industry: str):
    # fetcher = DowComplianceDataFetcher()
    # result = fetcher.fetch_regulatory_intelligence(industry)
    result = {"status": "success", "details": f"Fetched data for {industry}"}
    return JSONResponse(content=result)

@app.post("/api/rag_compliance_analysis")
async def rag_analysis(file: UploadFile = File(...), regulations: str = Form(...)):
    pdf_bytes = await file.read()
    # rag_checker = RAGComplianceChecker()
    # findings = rag_checker.check_compliance(pdf_bytes, regulations)
    findings = {"status": "success", "details": "RAG policy-compliance mock result"}
    return JSONResponse(content=findings)

@app.get("/api/source_graph")
async def source_graph(platform: str):
    # graph_data = build_graph_data(platform) # Call graph.py logic
    graph_data = {"nodes": ["A", "B"], "edges": [("A", "B")]}
    return JSONResponse(content=graph_data)