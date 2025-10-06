from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import List
from src.core.backend import fetch_files, fetch_files_from_source
# from src.core.compliance_checker import ComplianceChecker
from src.core.work import DowComplianceDataFetcher
from src.core.RAG import ComplianceChecker as RAGComplianceChecker

app = FastAPI()

@app.post("/api/fetch_files")
async def fetch_files(source: str = Form(...)):
    """Call the unified backend fetch function."""
    result = fetch_files_from_source(source)
    return result

# ===== Compliance Analysis (Internal) =====

@app.post("/api/internal_compliance_audit")
async def internal_compliance(file: UploadFile = File(...)):
    content = await file.read()
    # checker = ComplianceChecker()
    # result = checker.check_policy_compliance(content)
    result = {"status": "success", "details": "Policy audit mock result"}
    return JSONResponse(content=result)

# ===== External Intelligence Fetching =====

@app.get("/api/external_intelligence")
async def external_intelligence(industry: str):
    # fetcher = DowComplianceDataFetcher()
    # result = fetcher.fetch_regulatory_intelligence(industry)
    result = {"status": "success", "details": f"Fetched data for {industry}"}
    return JSONResponse(content=result)

# ===== RAG-Powered Unified Compliance Analysis =====

@app.post("/api/rag_compliance_analysis")
async def rag_analysis(file: UploadFile = File(...), regulations: str = Form(...)):
    pdf_bytes = await file.read()
    # rag_checker = RAGComplianceChecker()
    # findings = rag_checker.check_compliance(pdf_bytes, regulations)
    findings = {"status": "success", "details": "RAG policy-compliance mock result"}
    return JSONResponse(content=findings)

# ===== Visualization Graph Data Endpoint =====

@app.get("/api/source_graph")
async def source_graph(platform: str):
    # graph_data = build_graph_data(platform) # Call graph.py logic
    graph_data = {"nodes": ["A", "B"], "edges": [("A", "B")]}
    return JSONResponse(content=graph_data)
