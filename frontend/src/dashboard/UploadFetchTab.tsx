import React, { useState, useEffect } from "react";
import {
  downloadDriveFile,
  fetchFiles,
  uploadForInternalAudit,
  createObligation,
  getObligations,
  type Obligation,
  getFileHubFiles
} from "../api/client";
import { useFilters } from "../store/filters";

export default function UploadFetchWizard() {
  const filters = useFilters();

  const [message, setMessage] = useState("");
const [selectedBackendFile, setSelectedBackendFile] = useState<string>("");
  // Step states
  const [selectedRegulation, setSelectedRegulation] = useState("GDPR");
  const [daysOffset, setDaysOffset] = useState(90);
const [openDropdown, setOpenDropdown] = useState(false);
  const [newObligation, setNewObligation] = useState({
    description: "",
    regulation: "",
    due_date: "",
  });
  const [obligations, setObligations] = useState<Obligation[]>([]);

  const [source, setSource] = useState("Google");
  const [driveFiles, setDriveFiles] = useState<any[]>([]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Load obligations initially
  useEffect(() => {
    loadObligations();
  }, []);

  // API: load obligations
  const loadObligations = async () => {
    try {
      const res = await getObligations();
      setObligations(res);
    } catch (err) {
      console.error("Failed to load obligations:", err);
    }
  };
useEffect(() => {
  const user_uid = localStorage.getItem("user_uid");
  if (!user_uid) return;

  getFileHubFiles(user_uid).then(setDriveFiles);
}, []);

  // API: auto-generate
  const handleAutoGenerate = async () => {
    try {
      const form = new FormData();
      form.append("regulation", selectedRegulation);
      form.append("due_date_offset_days", daysOffset.toString());

      const res = await fetch("http://127.0.0.1:8000/api/auto_generate_compliance", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (data.status === "success") {
        setMessage(
          `Auto-generated ${data.obligations_created} obligations and ${data.tasks_created} tasks for ${selectedRegulation}.`
        );
        loadObligations();
      } else {
        setMessage(data.error || "Auto-generation failed.");
      }
    } catch {
      setMessage("Auto-generation failed.");
    }
  };

  // API: create obligation manually
  const handleCreateObligation = async () => {
    if (!newObligation.description || !newObligation.regulation || !newObligation.due_date) {
      setMessage("Please fill all obligation fields.");
      return;
    }
    try {
      await createObligation(newObligation);
      setMessage("Obligation created successfully.");
      setNewObligation({ description: "", regulation: "", due_date: "" });
      loadObligations();
    } catch {
      setMessage("Failed to create obligation.");
    }
  };

  // API: fetch drive files
  const handleFetch = async () => {
    const res = await fetchFiles(source);
    setDriveFiles(res?.files ?? []);
  };

  // API: download
  const handleDownload = async (id: string) => {
    const res = await downloadDriveFile(id);
    setMessage(`Downloaded: ${res?.path ?? "unknown path"}`);
  };

  // API: upload for audit
  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const res = await uploadForInternalAudit(selectedFile);
      setMessage(
        `Audit started: ${res?.status ?? "ok"} (${res?.total_requirements ?? 0} requirements)`
      );
    } catch (err) {
      setMessage("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Page Header */}
        <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Compliance & Evidence Wizard</h1>
            <p className="mt-1 max-w-xl text-sm text-slate-500">
              Auto-generate obligations, create manual requirements, fetch cloud files, and run AI audits.
            </p>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
              Compliance Wizard
            </span>
          </div>
        </header>

        {/* 2-column grid (identical to your Add Regulations layout) */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr),minmax(260px,1fr)]">

          {/* LEFT SIDE — ALL FOUR STEPS */}
          <main className="space-y-6">

            {/* -------------------- STEP 1 -------------------- */}
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                  1
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Auto-generate compliance plan
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Automatically create obligations and tasks for common frameworks.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-4">

                {/* Regulation Select */}
                <div>
                  <label className="text-xs font-medium text-slate-700">Select Regulation</label>
                  <select
                    value={selectedRegulation}
                    onChange={(e) => setSelectedRegulation(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  >
                    <option value="GDPR">GDPR</option>
                    <option value="SOX">SOX</option>
                    <option value="SOC2">SOC2</option>
                    <option value="HIPAA">HIPAA</option>
                  </select>
                </div>

                {/* Days offset */}
                <div>
                  <label className="text-xs font-medium text-slate-700">Days Until Due</label>
                  <input
                    type="number"
                    value={daysOffset}
                    onChange={(e) => setDaysOffset(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>

                <button
                  onClick={handleAutoGenerate}
                  className="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
                >
                  Auto-generate plan
                </button>

                {message && (
                  <p className="text-xs text-emerald-600">{message}</p>
                )}
              </div>
            </section>

            {/* -------------------- STEP 2 -------------------- */}
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                  2
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Create a compliance obligation</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Enter a description, regulation name, and due date.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {/* Inputs */}
                <input
                  placeholder="Description"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                  value={newObligation.description}
                  onChange={(e) =>
                    setNewObligation({ ...newObligation, description: e.target.value })
                  }
                />
                <input
                  placeholder="Regulation"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                  value={newObligation.regulation}
                  onChange={(e) =>
                    setNewObligation({ ...newObligation, regulation: e.target.value })
                  }
                />
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                  value={newObligation.due_date}
                  onChange={(e) =>
                    setNewObligation({ ...newObligation, due_date: e.target.value })
                  }
                />

                <button
                  onClick={handleCreateObligation}
                  className="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
                >
                  Create obligation
                </button>

                {obligations.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h3 className="text-xs font-semibold uppercase text-slate-500">
                      Existing obligations ({obligations.length})
                    </h3>

                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {obligations.map((o) => (
                        <div
                          key={o.id}
                          className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-sm"
                        >
                          <p className="font-medium text-slate-900">
                            {o.regulation}: {o.description}
                          </p>
                          <p className="text-slate-500 text-[11px] mt-1">
                            Due: {new Date(o.due_date).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* -------------------- STEP 3 -------------------- */}
{/* -------------------- STEP 3 (BACKEND FILES) -------------------- */}
<section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
  <div className="flex items-start gap-3">
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
      3
    </span>
    <div>
      <h2 className="text-sm font-semibold text-slate-900">
        Fetch files from backend storage
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Using filters — Dept: {filters.department ?? "All"}, Country:{" "}
        {filters.country ?? "All"}, State: {filters.state ?? "All"}.
      </p>
    </div>
  </div>

  <div className="relative mt-4">
  {/* Dropdown Trigger */}
  <button
    onClick={() => setOpenDropdown((prev) => !prev)}
    className="w-full flex justify-between items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
  >
    {selectedBackendFile
      ? driveFiles.find((f) => f.id === selectedBackendFile)?.original_name
      : "Select a file…"}
    <span className="text-slate-500 ml-2">▾</span>
  </button>

  {/* Dropdown Panel */}
  {openDropdown && (
    <div className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl animate-fadeIn">
      {driveFiles.map((f) => (
        <div
          key={f.id}
          onClick={() => {
            setSelectedBackendFile(f.id);
            setOpenDropdown(false); // close after selection
          }}
          className="cursor-pointer px-4 py-3 hover:bg-slate-100 transition flex justify-between items-center"
        >
          <div>
            <p className="text-sm font-medium text-slate-800">{f.original_name}</p>
            <p className="text-xs text-slate-500">
              {f.file_type} • {new Date(f.uploaded_at).toLocaleDateString()}
            </p>
          </div>

          {/* highlight selected */}
          {selectedBackendFile === f.id && (
            <span className="text-emerald-600 text-xs font-semibold">Selected ✓</span>
          )}
        </div>
      ))}
    </div>
  )}
</div>
</section>

            {/* -------------------- STEP 4 -------------------- */}
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                  4
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Upload evidence & run audit
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Upload a PDF to trigger internal AI-based auditing.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 hover:bg-slate-100">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 border border-slate-300">
                    Choose PDF
                  </span>
                  <span className="text-xs text-slate-600">
                    {selectedFile?.name ?? "No file selected"}
                  </span>
                  <input
                    type="file"
                    accept="application/pdf"
                    hidden
                    onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  />
                </label>

                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500"
                >
                  {uploading ? "Uploading..." : "Upload & start audit"}
                </button>
              </div>
            </section>
          </main>

          {/* RIGHT SIDE — PANELS (same style as Add Regulations) */}
          <aside className="space-y-4">

            <div className="rounded-2xl bg-slate-900 p-5 text-slate-50 shadow-lg">
              <h3 className="text-sm font-semibold">How this works</h3>
              <p className="mt-2 text-xs text-slate-200">
                This wizard helps you automate compliance, create obligations,
                gather files, and run AI-based audits.
              </p>
              <ul className="mt-3 space-y-2 text-[11px] text-slate-200">
                <li>• Auto-generate templates for major frameworks.</li>
                <li>• Create obligations manually.</li>
                <li>• Fetch company files from cloud storage.</li>
                <li>• Upload evidence for automated audits.</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-white p-4 text-xs text-slate-600 shadow-sm ring-1 ring-slate-100">
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Next step
              </h4>
              <p className="mt-2 text-xs">
                Once obligations, files, and audit results are generated, you can
                review them in your&nbsp;
                <span className="font-semibold text-slate-900">Compliance Dashboard</span>.
              </p>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}
