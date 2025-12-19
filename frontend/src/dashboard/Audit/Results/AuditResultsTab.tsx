import React from "react";
import { useLocation } from "react-router-dom";

// ------------------ TYPES ------------------

type RiskRating = "Low" | "Medium" | "High" | string;

interface AuditResultItem {
  Reg_ID: string;
  Requirement_Text: string;
  Risk_Rating: RiskRating;
  match_score: number;
  gap_flag: boolean;
  evidence?: string;
  narrative?: string;
  department?: string;
}

interface AuditSummary {
  compliance_score: number;
  total_requirements: number;
  gap_count: number;
  high_risk_gaps: number;
  departments_flagged: string[];
}

export interface AuditOutput {
  status: string;
  audit_id: string;
  file: string;
  user_uid: string;
  results: AuditResultItem[];
  summary: AuditSummary;
}

// ------------------ MOCK DATA (fallback only) ------------------

const mockAuditData: AuditOutput = {
  status: "success",
  audit_id: "AID-MOCK",
  file: "mock.pdf",
  user_uid: "mock_user",
  summary: {
    compliance_score: 0,
    total_requirements: 0,
    gap_count: 0,
    high_risk_gaps: 0,
    departments_flagged: [],
  },
  results: [],
};

// ------------------ HELPERS ------------------

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (score >= 50) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-rose-600 bg-rose-50 border-rose-200";
}

function getRowColor(item: AuditResultItem): string {
  if (item.gap_flag && item.Risk_Rating.toLowerCase() === "high") {
    return "bg-rose-50";
  }
  if (item.gap_flag) return "bg-amber-50";
  if (item.match_score > 0.8) return "bg-emerald-50";
  return "bg-white";
}

function riskToLevel(r: RiskRating): "LOW" | "MED" | "HIGH" {
  const v = r.toString().toLowerCase();
  if (v === "high") return "HIGH";
  if (v === "medium" || v === "med") return "MED";
  return "LOW";
}

function buildRiskHeatmap(results: AuditResultItem[]) {
  const map: Record<string, { LOW: number; MED: number; HIGH: number }> = {};
  for (const r of results) {
    const dept = r.department || "Other";
    const lvl = riskToLevel(r.Risk_Rating);
    if (!map[dept]) map[dept] = { LOW: 0, MED: 0, HIGH: 0 };
    if (r.gap_flag) map[dept][lvl] += 1;
  }
  return map;
}

// ------------------ COMPONENT ------------------

const AuditResultsTab: React.FC = () => {
  const location = useLocation();

  // console.log("🎯 Received navigation state:", location.state);

  // Use backend data if passed, otherwise fallback to mock
  const data: AuditOutput = location.state || mockAuditData;

  // console.log("📦 Final audit data being used:", data);

  // SAFETY GUARDS — prevent undefined.length crash
  if (!data || typeof data !== "object") {
    console.warn("⚠️ No audit data at all. Rendering fallback.");
    return <div className="p-6 text-red-600">No audit data available.</div>;
  }

  if (!Array.isArray(data.results)) {
    console.warn("⚠️ data.results missing or invalid:", data.results);
    return <div className="p-6 text-red-600">No results found for this audit.</div>;
  }


const results: AuditResultItem[] = (Array.isArray(data.results) ? data.results : []).map((item: any) => ({
  Reg_ID: item.Reg_ID,
  Requirement_Text: item.Requirement_Text || item.Target_Area || "",

  // Risk Rating
  Risk_Rating: item.Risk_Rating || "Low",

  match_score: item.match_score ??
               item.Compliance_Score ??
               item.Score ??
               0,
  gap_flag:
    item.gap_flag !== undefined
      ? item.gap_flag
      : item.Is_Compliant === false
      ? true
      : item.Narrative_Gap
      ? true
      : false,
 
  evidence: item.evidence || item.Evidence_Chunk || "",
  narrative: item.narrative || item.Narrative_Gap || "",

  department: item.department || item.Target_Area || "Other",
}));

const summary: AuditSummary = data.summary ?? {
  compliance_score: 0,
  total_requirements: results.length,
  gap_count: results.filter(r => r.gap_flag).length,
  high_risk_gaps: results.filter(r => r.gap_flag && r.Risk_Rating.toLowerCase() === "high").length,
  departments_flagged: [
    ...new Set(results.filter(r => r.gap_flag).map(r => r.department || "Other"))
  ]
};

if (!summary.compliance_score || Number.isNaN(summary.compliance_score)) {
  const compliantCount = results.filter(r => !r.gap_flag).length;
  summary.compliance_score = results.length
    ? Math.round((compliantCount / results.length) * 100)
    : 0;
}
  const gaps = results.filter((r) => r.gap_flag);
  const heatmap = buildRiskHeatmap(results);
  const scoreColor = getScoreColor(summary.compliance_score);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="border-b pb-4 mb-6">
          <h1 className="text-2xl font-semibold">Compliance Audit Results</h1>
          <p className="text-sm text-slate-600">
            File: <strong>{data.file}</strong>
          </p>
          <p className="text-xs text-slate-400">
            Audit ID: <span className="font-mono">{data.audit_id}</span>
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-[2fr,1fr]">
          <div className="rounded-xl bg-white p-5 shadow">
            <h2 className="text-sm font-semibold uppercase text-slate-500">
              Compliance Score
            </h2>

            <div className="flex justify-between items-center mt-4">
              <div>
                <p className="text-xs text-slate-400">
                  Overall performance against selected regulations
                </p>
              </div>

              <div className={`h-20 w-20 rounded-full flex items-center justify-center border-4 text-xl font-bold ${scoreColor}`}>
                {summary.compliance_score}%
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm bg-slate-50 p-4 rounded-lg">
              <div>
                <p className="text-xs text-slate-500 uppercase">Requirements</p>
                <p className="font-semibold">{summary.total_requirements}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Gaps</p>
                <p className="font-semibold text-amber-600">{summary.gap_count}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">High Risk</p>
                <p className="font-semibold text-rose-600">{summary.high_risk_gaps}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Departments</p>
                <p className="font-semibold">{(summary.departments_flagged || []).length}</p>
              </div>
            </div>
          </div>
          

          {/* File Info */}
          <div className="rounded-xl bg-white p-5 shadow">
            <h2 className="text-sm font-semibold uppercase text-slate-500">
              Evidence File
            </h2>
            <p className="mt-3 text-sm">
              <strong>{data.file}</strong>
            </p>
            <p className="text-xs text-slate-500 mt-1">Uploaded by {data.user_uid}</p>
          </div>
        </section>

        {/* ---------------- RESULTS TABLE ---------------- */}
        <section className="mt-8 rounded-xl bg-white p-5 shadow">
          <h2 className="text-sm font-semibold uppercase text-slate-500 mb-3">
            Compliance Checks
          </h2>

          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-100 text-xs text-slate-600">
                <th className="px-3 py-2">Requirement</th>
                <th className="px-3 py-2">Compliant?</th>
                <th className="px-3 py-2">Risk</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Evidence</th>
                <th className="px-3 py-2">Narrative</th>
              </tr>
            </thead>

            <tbody>
              {results.map((item) => (
                <tr key={item.Reg_ID} className={`${getRowColor(item)} border-b border-slate-200`}>
                  <td className="px-3 py-3">
                    <strong>{item.Reg_ID}</strong>
                    <p>{item.Requirement_Text}</p>
                  </td>

                  <td className="px-3 py-3">
                    {item.gap_flag ? (
                      <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-[10px]">
                        ❌ Gap
                      </span>
                    ) : item.match_score >= 0.8 ? (
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px]">
                        ✔ Compliant
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-[10px]">
                        ⚠ Partial
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] ${
                      riskToLevel(item.Risk_Rating) === "HIGH"
                        ? "bg-rose-100 text-rose-700"
                        : riskToLevel(item.Risk_Rating) === "MED"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {item.Risk_Rating}
                    </span>
                  </td>

                  <td className="px-3 py-3">
                  {(item.match_score > 1 ? item.match_score : item.match_score * 100).toFixed(0)}%

                  </td>

                  <td className="px-3 py-3 text-xs">
                    {item.evidence || "—"}
                  </td>

                  <td className="px-3 py-3 text-xs">
                    {item.narrative || "—"}
                  </td>
                </tr>
              ))}

              {results.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-400">
                    No results available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* ---------------- HEATMAP ---------------- */}
        <section className="mt-8 rounded-xl bg-white p-5 shadow">
          <h2 className="text-sm font-semibold uppercase text-slate-500 mb-3">
            Risk Heatmap
          </h2>

          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600">
                <th className="px-3 py-2">Department</th>
                <th className="px-3 py-2 text-center">Low</th>
                <th className="px-3 py-2 text-center">Medium</th>
                <th className="px-3 py-2 text-center">High</th>
              </tr>
            </thead>

            <tbody>
              {Object.entries(heatmap).map(([dept, lvl]) => (
                <tr key={dept} className="border-b">
                  <td className="px-3 py-2">{dept}</td>
                  {(["LOW", "MED", "HIGH"] as const).map((cat) => (
                    <td key={cat} className="px-3 py-2 text-center">
                      {lvl[cat] || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

      </div>
    </div>
  );
};

export default AuditResultsTab;
