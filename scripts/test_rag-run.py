import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import json
from src.core.RAG import ComplianceChecker
import json
from datetime import datetime, timezone
from pathlib import Path

regs = json.load(open("sample_regulations.cleaned.json"))

checker = ComplianceChecker(
    pdf_path=r"C:\NOMI\uploads\6108ff6ec8b14b37a11e5254a2caacde.pdf",
    regulations=regs
)

results = checker.run_check()
summary = checker.dashboard_summary(results, industry="Manufacturing")

import json
print(json.dumps(summary, indent=2))

open(r"C:\NOMI\uploads\test_run.audit.json","w",encoding="utf-8").write(
    json.dumps({
        "metadata": {"original_filename":"test_policy.pdf"},
        "results": results,
        "summary": summary
    }, indent=2)
)
OUT_DIR = Path("uploads")
OUT_DIR.mkdir(exist_ok=True)

sample = {
    "metadata": {
        "filename": "sample_contract.pdf",
        "path": str((OUT_DIR/"sample_contract.pdf").resolve()),
        "department": "Procurement",
        "owner": "alice@example.com",
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    },
    "document": {
        "id": "sample_contract_001"
    },
    "results": [
        {
            "regulation_id": "iso-27001-1",
            "Compliance_Score": 42,
            "Is_Compliant": False,
            "Evidence_Chunk": "Clause X missing",
            "Narrative_Gap": "SLA clause missing"
        }
    ]
}

out_path = OUT_DIR / "sample_contract.audit.json"
out_path.write_text(json.dumps(sample, indent=2))
print(f"Wrote {out_path}")