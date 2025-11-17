import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import json
from src.core.RAG import ComplianceChecker

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