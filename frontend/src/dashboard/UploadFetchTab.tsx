import React, { useState, useEffect } from "react";
import {
  downloadDriveFile,
  fetchFiles,
  uploadForInternalAudit,
  createObligation,
  getObligations,
  type Obligation,
  getFileHubFiles,
  BASE_URL,
  fetchWorkspace 
} from "../api/client";
import { useFilters } from "../store/filters";

export default function UploadFetchWizard() {
  const filters = useFilters();

  const user_uid = localStorage.getItem("user_uid");  
  const [message, setMessage] = useState("");
const [selectedBackendFile, setSelectedBackendFile] = useState<string>("");
  // Step states
  const [selectedRegulation, setSelectedRegulation] = useState("GDPR");
  const [daysOffset, setDaysOffset] = useState(90);
const [openDropdown, setOpenDropdown] = useState(false);
const [selectedGranuleText, setSelectedGranuleText] = useState("");
const [selectedGranuleObligations, setSelectedGranuleObligations] = useState([]);
  const [newObligation, setNewObligation] = useState({
    description: "",
    regulation: "",
    due_date: "",
  });
  const [obligations, setObligations] = useState<Obligation[]>([]);
const [workspaceRegulations, setWorkspaceRegulations] = useState([]);
const importRegulationAndExtract = async (reg) => {
  const user_uid = localStorage.getItem("user_uid");
  if (!user_uid) {
    console.error("❌ No user_uid found");
    return;
  }

  const full = await fetch(`${BASE_URL}/api/regulation/${reg.id}`).then(r => r.json());

  const enriched = {
    ...reg,
    full_text: full.text,
  };

  const response = await fetch(`${BASE_URL}/api/regulations/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_uid,
      regulations: [enriched],
    }),
  });

  if (!response.ok) throw new Error("Import failed.");

  const imported = await response.json();
  return imported;
};
useEffect(() => {
  if (!user_uid) return;

  async function loadRegulations() {
    const regs = await fetchWorkspace(user_uid);
    setWorkspaceRegulations(regs);
  }

  loadRegulations();
}, [user_uid]);
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
  console.log("USER UID:", user_uid);
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
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                  >
                    <option value="">Select Regulation</option>

                    {workspaceRegulations.map((reg) => (
                      <option key={reg.id} value={reg.name}>
                        {reg.name} {reg.code ? `(${reg.code})` : ""}
                      </option>
                    ))}
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
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
      2
    </span>
    <div>
      <h2 className="text-sm font-semibold text-slate-900">
        Create Obligation Instance
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Select a regulation section from your workspace, then extract obligations automatically.
      </p>
    </div>
  </div>

  {/* Regulation Picker */}
  <div className="relative mt-4">
    <button
      onClick={() => setOpenDropdown(prev => !prev)}
      className="w-full flex justify-between items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
    >
      {workspaceRegulations.find(r => r.id === selectedBackendFile)?.name || "Select a regulation…"}
      <span className="text-slate-500 ml-2">▾</span>
    </button>

    {openDropdown && (
      <div className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
        {workspaceRegulations.map(reg => (
          <div
            key={reg.id}
            onClick={() => {
              setSelectedBackendFile(reg.id);
              setSelectedGranuleObligations([]);
              setOpenDropdown(false);
              setMessage("");
            }}
            className="cursor-pointer px-4 py-3 hover:bg-slate-100 transition"
          >
            <p className="text-sm font-medium text-slate-800">
              {reg.name}
            </p>
            <p className="text-[11px] text-slate-400">
              ID: {reg.id} {reg.code ? `(${reg.code})` : ""}
            </p>

            {selectedBackendFile === reg.id && (
              <span className="text-emerald-600 text-xs font-semibold">Selected ✓</span>
            )}
          </div>
        ))}
      </div>
    )}
  </div>

  {/* Extract Button */}
  <button
    onClick={async () => {
      if (!selectedBackendFile) {
        setMessage("Please select a regulation first.");
        return;
      }

      const reg = workspaceRegulations.find(r => r.id === selectedBackendFile);
      if (!reg) {
        setMessage("Could not find regulation.");
        return;
      }

      setMessage("Extracting obligations…");

      try {
        const full = await fetch(`${BASE_URL}/api/regulation/${reg.id}`).then(r => r.json());
        const obligations = full.ingested?.obligations || full.obligations || [];

        setSelectedGranuleText(full.text || "");
        setSelectedGranuleObligations(obligations);

        setMessage(`Extracted ${obligations.length} obligations.`);
      } catch (err) {
        console.error(err);
        setMessage("Failed to extract obligations.");
      }
    }}
    className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
  >
    Extract Obligations
  </button>

  {/* Status Message */}
  {message && (
    <p className="mt-3 text-xs text-slate-600 text-center">{message}</p>
  )}
  {selectedBackendFile && selectedGranuleObligations.length > 0 && (
  <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
    <h3 className="text-xs font-semibold uppercase text-slate-500 mb-3">
      Extracted Obligations ({selectedGranuleObligations.length})
    </h3>

    <div className="max-h-96 overflow-y-auto space-y-4">
      {selectedGranuleObligations.map((o, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2 hover:bg-slate-50 transition"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">
              {o.obligation_id}
            </span>
            <span className="rounded-full bg-emerald-50 px-2 py-[2px] text-[10px] text-emerald-700">
              {o.deontic}
            </span>
          </div>

          {/* Text */}
          <p className="text-sm font-medium text-slate-900">{o.text}</p>

          {/* Details */}
          <div className="text-[11px] text-slate-600 mt-2 grid grid-cols-2 gap-y-1">
            <p><span className="font-semibold">Subject:</span> {o.subject}</p>
            <p><span className="font-semibold">Action:</span> {o.action}</p>
            {o.object && (
              <p><span className="font-semibold">Object:</span> {o.object}</p>
            )}
            {o.condition && (
              <p><span className="font-semibold">Condition:</span> {o.condition}</p>
            )}
            <p><span className="font-semibold">Confidence:</span> {Math.round(o.confidence * 100)}%</p>
          </div>

          {/* Footer */}
          <div className="border-t pt-2 mt-2 text-[10px] text-slate-400">
            <p>Source doc: {o.source_doc}</p>
            <p>Created: {new Date(o.created_at).toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
)}
</section>

            {/* -------------------- STEP 2 -------------------- */}
            {/* <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                  3
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Create a compliance obligation</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Enter a description, regulation name, and due date.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-4">

                <input
                  placeholder="Description"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                  value={newObligation.description}
                  onChange={(e) =>
                    setNewObligation({ ...newObligation, description: e.target.value })
                  }
                />
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                value={newObligation.regulation}
                onChange={(e) =>
                  setNewObligation({ ...newObligation, regulation: e.target.value })
                }
              >
                <option value="">Select Regulation</option>

                {workspaceRegulations.map((reg) => (
                  <option key={reg.id} value={reg.name}>
                    {reg.name} {reg.code ? `(${reg.code})` : ""}
                  </option>
                ))}
              </select>
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

              </div>
            </section>
            {}
{selectedBackendFile && selectedGranuleObligations.length > 0 && (
  <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
    <h3 className="text-xs font-semibold uppercase text-slate-500 mb-3">
      Extracted Obligations ({selectedGranuleObligations.length})
    </h3>

    <div className="max-h-96 overflow-y-auto space-y-4">
      {selectedGranuleObligations.map((o, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2 hover:bg-slate-50 transition"
        >

          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">
              {o.obligation_id}
            </span>
            <span className="rounded-full bg-emerald-50 px-2 py-[2px] text-[10px] text-emerald-700">
              {o.deontic}
            </span>
          </div>

          <p className="text-sm font-medium text-slate-900">
            {o.text}
          </p>
          <div className="text-[11px] text-slate-600 mt-2 grid grid-cols-2 gap-y-1">
            <p><span className="font-semibold">Subject:</span> {o.subject}</p>
            <p><span className="font-semibold">Action:</span> {o.action}</p>
            {o.object && (
              <p><span className="font-semibold">Object:</span> {o.object}</p>
            )}
            {o.condition && (
              <p><span className="font-semibold">Condition:</span> {o.condition}</p>
            )}
            <p><span className="font-semibold">Confidence:</span> {Math.round(o.confidence * 100)}%</p>
          </div>

          <div className="border-t pt-2 mt-2 text-[10px] text-slate-400">
            <p>Source doc: {o.source_doc}</p>
            <p>Created: {new Date(o.created_at).toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
)} */}



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

          {}
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
