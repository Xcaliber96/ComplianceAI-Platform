import React, { useEffect, useState } from "react";
import { getUserAudits } from "../../../api/client";

// ---------------- TYPES ----------------

interface AuditSummary {
  audit_id: string;
  file_name: string;
  uploaded_by: string;
  status: string;

  compliance_score: number;
  total_requirements: number;
  gaps_detected: number;
  high_risk_issues: number;
  departments_flagged: string[];
}

interface UserAuditsResponse {
  ok: boolean;
  count: number;
  audits: AuditSummary[];
}

// ---------------- COMPONENT ----------------

const AllResults = () => {
  // 🔹 STATE
  const [loading, setLoading] = useState(true);
  const [audit, setAudit] = useState<AuditSummary | null>(null); // top summary
  const [audits, setAudits] = useState<AuditSummary[]>([]);     // list below

  const user_uid = localStorage.getItem("user_uid");

  // ---------------- EFFECT ----------------

  useEffect(() => {
    if (!user_uid) {
      setLoading(false);
      return;
    }

    const loadAudits = async () => {
      try {
        const data: UserAuditsResponse = await getUserAudits(user_uid);
        console.log(data)
        if (data.ok && Array.isArray(data.audits)) {
          // normalize audits
          const normalizedAudits = data.audits.map((a) => ({
            ...a,
            departments_flagged: Array.isArray(a.departments_flagged)
              ? a.departments_flagged
              : [],
          }));

          setAudits(normalizedAudits);

          // use first audit for top summary (temporary)
          if (normalizedAudits.length > 0) {
            setAudit(normalizedAudits[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load audits", err);
      } finally {
        setLoading(false);
      }
    };

    loadAudits();
  }, [user_uid]);

  // ---------------- STATES ----------------

  if (loading) {
    return <div className="p-10 text-slate-500">Loading audit results…</div>;
  }

  if (!audit) {
    return (
      <div className="p-10 text-rose-600">
        No audits found for this user.
      </div>
    );
  }

  // ---------------- RENDER ----------------

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* HEADER */}
        <header className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Compliance Audit</h1>
            <p className="text-sm text-slate-500">
              File: {audit.file_name}
            </p>
            <p className="text-xs text-slate-400">
              Audit ID: {audit.audit_id}
            </p>
          </div>

          <span className="flex items-center gap-2 text-sm text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Status: {audit.status}
          </span>
        </header>

        {/* SUMMARY */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

          {/* SCORE */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow">
            <h2 className="text-sm font-semibold uppercase text-slate-500 mb-4">
              Compliance Score
            </h2>

            <div className="flex justify-between items-center">
              <div className="space-y-4">
                <p className="text-xs text-slate-400 max-w-sm">
                  Snapshot of this document’s overall alignment with the selected regulations.
                </p>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg text-sm">
                  <div>
                    <p className="text-xs uppercase text-slate-500">Total Requirements</p>
                    <p className="font-semibold">{audit.total_requirements}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-500">Gaps Detected</p>
                    <p className="font-semibold text-amber-600">
                      {audit.gaps_detected}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-500">High-Risk Issues</p>
                    <p className="font-semibold text-rose-600">
                      {audit.high_risk_issues}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-500">
                      Departments Flagged
                    </p>
                    <p className="font-semibold">
                      {audit.departments_flagged.length}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {audit.departments_flagged.map((dept) => (
                    <span
                      key={dept}
                      className="text-xs bg-slate-100 px-3 py-1 rounded-full"
                    >
                      {dept}
                    </span>
                  ))}
                </div>
              </div>

              <div className="h-28 w-28 rounded-full border-4 border-emerald-200 bg-emerald-50 flex items-center justify-center text-3xl font-bold text-emerald-600">
                {audit.compliance_score}%
              </div>
            </div>
          </div>

          {/* FILE */}
          <div className="bg-white rounded-xl p-6 shadow">
            <h2 className="text-sm font-semibold uppercase text-slate-500 mb-4">
              Evidence File
            </h2>

            <p className="text-sm font-medium">{audit.file_name}</p>
            <p className="text-xs text-slate-500 mt-1">
              Uploaded by {audit.uploaded_by}
            </p>
            <p className="text-xs text-slate-500 mb-4">File Type: PDF</p>

            <button className="w-full bg-slate-900 text-white text-sm py-2 rounded-lg">
              View PDF Document
            </button>
          </div>
        </section>

        {/* AUDIT LIST BELOW */}
        <section className="bg-white rounded-xl p-6 shadow">
          <h2 className="text-sm font-semibold uppercase text-slate-500 mb-4">
            All Audits
          </h2>

          <div className="divide-y">
            {audits.map((a) => (
              <div
                key={a.audit_id}
                className="py-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{a.file_name}</p>
                  <p className="text-xs text-slate-500">
                    Audit ID: {a.audit_id}
                  </p>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Score</p>
                    <p className="font-semibold">{a.compliance_score}%</p>
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-slate-500">Gaps</p>
                    <p className="font-semibold text-amber-600">
                      {a.gaps_detected}
                    </p>
                  </div>

                  <span className="flex items-center gap-2 text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default AllResults;
