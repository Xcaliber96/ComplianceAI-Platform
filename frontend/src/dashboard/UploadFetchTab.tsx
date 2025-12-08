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
  fetchWorkspace,
  runCompliance,
} from "../api/client";
import { useFilters } from "../store/filters";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";

type StepCardProps = {
  step: number | string;
  title: string;
  description: string;
  children: React.ReactNode;
};

function StepCard({ step, title, description, children }: StepCardProps) {
  return (
    <section className="relative overflow-visible rounded-2xl bg-white/90 p-5 shadow-sm ring-1 ring-slate-100">
      {/* soft emerald accent bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-200 via-emerald-300 to-emerald-100" />

      <div className="mt-2 flex items-start gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
          {step}
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
      </div>

      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export default function UploadFetchWizard() {
  const navigate = useNavigate();   
  const [runningAudit, setRunningAudit] = useState(false);
  const filters = useFilters(); // still here so behavior/backends remain unchanged

  const [selectedEvidenceFileId, setSelectedEvidenceFileId] =
    useState<string>("");
  const [selectedRegulationIds, setSelectedRegulationIds] = useState<any[]>([]);

  const user_uid = localStorage.getItem("user_uid");
const [extracting, setExtracting] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedRegulation, setSelectedRegulation] = useState("GDPR");
  const [daysOffset, setDaysOffset] = useState(90);

  const [openRegDropdown, setOpenRegDropdown] = useState(false);
  const [openFileDropdown, setOpenFileDropdown] = useState(false);

  const [selectedGranuleText, setSelectedGranuleText] = useState("");
  const [selectedGranuleObligations, setSelectedGranuleObligations] =
    useState<any[]>([]);

  const [newObligation, setNewObligation] = useState({
    description: "",
    regulation: "",
    due_date: "",
  });

  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [workspaceRegulations, setWorkspaceRegulations] = useState<any[]>([]);

  const [source, setSource] = useState("Google");
  const [driveFiles, setDriveFiles] = useState<any[]>([]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Helper kept in place (no backend changes)
  const importRegulationAndExtract = async (reg: any) => {
    const user_uid = localStorage.getItem("user_uid");
    if (!user_uid) {
      console.error("❌ No user_uid found");
      return;
    }

    const full = await fetch(`${BASE_URL}/api/regulation/${reg.id}`).then((r) =>
      r.json()
    );

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
const regDropdownRef = useRef<HTMLDivElement | null>(null);
const fileDropdownRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    // Regulation dropdown
    if (
      openRegDropdown &&
      regDropdownRef.current &&
      !regDropdownRef.current.contains(event.target as Node)
    ) {
      setOpenRegDropdown(false);
    }

    // File dropdown
    if (
      openFileDropdown &&
      fileDropdownRef.current &&
      !fileDropdownRef.current.contains(event.target as Node)
    ) {
      setOpenFileDropdown(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [openRegDropdown, openFileDropdown]);


  const loadObligations = async () => {
    try {
      const res = await getObligations();
      setObligations(res);
    } catch (err) {
      console.error("Failed to load obligations:", err);
    }
  };

  useEffect(() => {
    loadObligations();
  }, []);

  // Load workspace regulations
  useEffect(() => {
    if (!user_uid) return;

    async function loadRegulations() {
      const regs = await fetchWorkspace(user_uid);
      setWorkspaceRegulations(regs);
    }

    loadRegulations();
  }, [user_uid]);

  // Load FileHub files
  useEffect(() => {
    const user_uid = localStorage.getItem("user_uid");
    console.log("USER UID:", user_uid);
    if (!user_uid) return;

    getFileHubFiles(user_uid).then(setDriveFiles);
  }, []);

const handleRunCompliance = async () => {
  if (!user_uid) {
    setMessage("Missing user session.");
    return;
  }

  if (!selectedEvidenceFileId) {
    setMessage("Select an evidence file first.");
    return;
  }

  if (selectedRegulationIds.length === 0) {
    setMessage("Select at least one regulation.");
    return;
  }

  setRunningAudit(true);   

  try {
    const auditData = await runCompliance(
      user_uid,
      selectedEvidenceFileId,
      selectedRegulationIds,
      
    );
    
await new Promise(res => setTimeout(res, 150));  

navigate("/dashboard/results", { state: auditData });

    navigate("/dashboard/results", { state: auditData });
  } catch (err) {
    console.error(err);
    setMessage("RAG compliance check failed.");
  } finally {
    setRunningAudit(false);  
  }
};
  // API: auto-generate obligations
  const handleAutoGenerate = async () => {
    try {
      const form = new FormData();
      form.append("regulation", selectedRegulation);
      form.append("due_date_offset_days", daysOffset.toString());

      const res = await fetch(
        "http://127.0.0.1:8000/api/auto_generate_compliance",
        {
          method: "POST",
          body: form,
        }
      );

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

  // API: create obligation manually (API kept)
  const handleCreateObligation = async () => {
    if (
      !newObligation.description ||
      !newObligation.regulation ||
      !newObligation.due_date
    ) {
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

  // API: fetch drive files from external source (kept)
  const handleFetch = async () => {
    const res = await fetchFiles(source);
    setDriveFiles(res?.files ?? []);
  };

  // API: download (kept)
  const handleDownload = async (id: string) => {
    const res = await downloadDriveFile(id);
    setMessage(`Downloaded: ${res?.path ?? "unknown path"}`);
  };

  // API: upload for audit (kept)
  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const res = await uploadForInternalAudit(selectedFile);
      setMessage(
        `Audit started: ${res?.status ?? "ok"} (${
          res?.total_requirements ?? 0
        } requirements)`
      );
    } catch (err) {
      setMessage("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // Extract obligations for selected regulation
  const handleExtractObligations = async () => {
    if (selectedRegulationIds.length === 0) {
      setMessage("Please select at least one regulation first.");
      return;
    }

    const regId = selectedRegulationIds[0];
    const reg = workspaceRegulations.find((r) => r.id === regId);

    if (!reg) {
      setMessage("Could not find the selected regulation.");
      return;
    }
  setExtracting(true);             


    try {
      const full = await fetch(`${BASE_URL}/api/regulation/${reg.id}`).then(
        (r) => r.json()
      );
      const obligations =
        full.ingested?.obligations || full.obligations || [];

      setSelectedGranuleText(full.text || "");
      setSelectedGranuleObligations(obligations);

      setMessage(`Extracted ${obligations.length} obligations.`);
    } catch (err) {
      console.error(err);
      setMessage("Failed to extract obligations.");
    }
  };

  const selectedEvidenceFile = driveFiles.find(
    (f) => f.id === selectedEvidenceFileId
  );

  return (
    <div className="min-h-screen ">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Compliance Workspace
            </div>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900">
              Compliance & Evidence Wizard
            </h1>
            <p className="mt-1 max-w-xl text-sm text-slate-500">
              Guide your compliance flow step-by-step: generate obligations,
              extract requirements from regulations, select evidence files, and
              run AI-based compliance checks.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-xs text-slate-400">
            <span className="rounded-full bg-emerald-100/70 px-3 py-1 font-medium text-emerald-700">
              Soft Green Mode
            </span>
            {user_uid && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-500">
                User: <span className="font-mono">{user_uid}</span>
              </span>
            )}
          </div>
        </header>

        {/* 2-column layout */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr),minmax(260px,1fr)]">
          {/* LEFT SIDE — STEPS */}
          <main className="space-y-6">
            {/* STEP 1: Auto-generate compliance plan */}
            <StepCard
              step={1}
              title="Auto-generate compliance plan"
              description="Automatically create obligations and tasks for common frameworks based on a base regulation and due date offset."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-700">
                    Select Regulation
                  </label>
                  <select
                    value={selectedRegulation}
                    onChange={(e) => setSelectedRegulation(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  >
                    <option value="">Select Regulation</option>
                    {workspaceRegulations.map((reg) => (
                      <option key={reg.id} value={reg.name}>
                        {reg.name} {reg.code ? `(${reg.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Days Until Due
                  </label>
                  <input
                    type="number"
                    value={daysOffset}
                    onChange={(e) => setDaysOffset(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    onClick={handleAutoGenerate}
                    className="mt-1 w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  >
                    Auto-generate plan
                  </button>
                </div>
              </div>
            </StepCard>

            {/* STEP 2: Extract obligations from regulation */}
            <StepCard
              step={2}
              title="Extract obligations from regulations"
              description="Choose one or more regulations in your workspace and automatically extract their obligations."
            >
              {/* Regulation multiselect */}
              <div className="relative">
                <label className="text-xs font-medium text-slate-700">
                  Workspace Regulations
                </label>
                <button
                  type="button"
                  onClick={() => setOpenRegDropdown((prev) => !prev)}
                  className="mt-1 flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  {selectedRegulationIds.length > 0
                    ? `${selectedRegulationIds.length} regulation(s) selected`
                    : "Select regulation(s)…"}
                  <span className="ml-2 text-slate-400">▾</span>
                </button>

                {openRegDropdown && (
                  <div   ref={regDropdownRef} className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur">
                   
                    {workspaceRegulations.length === 0 && (
                      <p className="p-4 text-center text-xs text-slate-500">
                        No regulations found for this workspace.
                      </p>
                    )}

                    {workspaceRegulations.map((reg) => {
                      const isSelected = selectedRegulationIds.includes(reg.id);
                      return (
                        <div
                          key={reg.id}
                          onClick={() => {
                            setSelectedRegulationIds((prev) =>
                              prev.includes(reg.id)
                                ? prev.filter((id) => id !== reg.id)
                                : [...prev, reg.id]
                            );
                              setOpenRegDropdown(false);
                          }}
                          className={`cursor-pointer px-4 py-3 text-sm transition ${
                            isSelected
                              ? "bg-emerald-50 text-emerald-800"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium">
                              {reg.name}
                              {reg.code ? (
                                <span className="ml-1 text-[11px] text-slate-400">
                                  ({reg.code})
                                </span>
                              ) : null}
                            </p>
                            {isSelected && (
                              <span className="rounded-full bg-emerald-100 px-2 py-[2px] text-[10px] font-semibold text-emerald-700">
                                Selected
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-slate-400">
                            ID: {reg.id}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={handleExtractObligations}
                disabled={extracting}
                className={`w-full rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition
                  ${extracting ? "bg-slate-300 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-600"}
                `}
              >
                {extracting ? "Extracting…" : "Extract obligations"}
              </button>

              {selectedGranuleObligations.length > 0 && (
                <div className="rounded-lg bg-emerald-50/70 p-3 text-xs text-emerald-800 ring-1 ring-emerald-100">
                  Extracted{" "}
                  <span className="font-semibold">
                    {selectedGranuleObligations.length}
                  </span>{" "}
                  obligation
                  {selectedGranuleObligations.length === 1 ? "" : "s"} from the
                  selected regulation.
                </div>
              )}
            </StepCard>

            {/* Extracted Obligations List (if any) */}
            {selectedGranuleObligations.length > 0 && (
              <section className="rounded-2xl bg-white/90 p-5 shadow-sm ring-1 ring-slate-100">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Extracted obligations (
                    {selectedGranuleObligations.length})
                  </h3>
                  <span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] text-slate-400">
                    Scroll to review
                  </span>
                </div>

                <div className="max-h-96 space-y-4 overflow-y-auto pr-1">
                  {selectedGranuleObligations.map((o: any, idx: number) => (
                    <div
                      key={idx}
                      className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm transition hover:border-emerald-200 hover:bg-white"
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

                      <div className="mt-2 grid grid-cols-2 gap-y-1 text-[11px] text-slate-600">
                        <p>
                          <span className="font-semibold">Subject:</span>{" "}
                          {o.subject}
                        </p>
                        <p>
                          <span className="font-semibold">Action:</span>{" "}
                          {o.action}
                        </p>
                        {o.object && (
                          <p>
                            <span className="font-semibold">Object:</span>{" "}
                            {o.object}
                          </p>
                        )}
                        {o.condition && (
                          <p>
                            <span className="font-semibold">Condition:</span>{" "}
                            {o.condition}
                          </p>
                        )}
                        <p>
                          <span className="font-semibold">Confidence:</span>{" "}
                          {Math.round((o.confidence ?? 0) * 100)}%
                        </p>
                      </div>

                      <div className="mt-2 border-t pt-2 text-[10px] text-slate-400">
                        <p>Source doc: {o.source_doc}</p>
                        {o.created_at && (
                          <p>
                            Created:{" "}
                            {new Date(o.created_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* STEP 3: Select evidence file */}
            <StepCard
              step={3}
              title="Select evidence file"
              description="Pick a FileHub document to use as evidence in your compliance run."
            >
              <div className="relative">
                <label className="text-xs font-medium text-slate-700">
                  FileHub files
                </label>
                <button
                  type="button"
                  onClick={() => setOpenFileDropdown((prev) => !prev)}
                  className="mt-1 flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  {selectedEvidenceFile
                    ? selectedEvidenceFile.original_name
                    : "Select a file from FileHub…"}
                  <span className="ml-2 text-slate-400">▾</span>
                </button>

                {openFileDropdown && (
                  <div ref={fileDropdownRef} className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur">
                    {driveFiles.length === 0 && (
                      <p className="p-4 text-center text-xs text-slate-500">
                        No files available.
                      </p>
                    )}

                    {driveFiles.map((f) => {
                      const isSelected = selectedEvidenceFileId === f.id;
                      return (
                        <div
                          key={f.id}
                          onClick={() => {
                            setSelectedEvidenceFileId(f.id);
                            setOpenFileDropdown(false);
                            setMessage(`Selected file: ${f.original_name}`);
                          }}
                          className={`cursor-pointer px-4 py-3 text-sm transition ${
                            isSelected
                              ? "bg-emerald-50 text-emerald-800"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <p className="font-medium">{f.original_name}</p>
       
                          {isSelected && (
                            <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-[2px] text-[10px] font-semibold text-emerald-700">
                              Selected ✓
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedEvidenceFile && (
                <div className="rounded-lg bg-emerald-50/70 p-3 text-xs text-emerald-800 ring-1 ring-emerald-100">
                  <p className="font-semibold text-emerald-900">
                    Evidence ready
                  </p>
                  <p className="mt-1 truncate">
                    <span className="font-medium">Name:</span>{" "}
                    {selectedEvidenceFile.original_name}
                  </p>
                  <p className="truncate text-[11px]">
                    <span className="font-medium">ID:</span>{" "}
                    {selectedEvidenceFile.id}
                  </p>
                </div>
              )}
            </StepCard>

            {/* STEP 4: Run compliance check */}
            <StepCard
              step={4}
              title="Run compliance check"
              description="We’ll analyze the selected evidence file against your chosen regulations using AI-based retrieval and reasoning."
            ><button
  onClick={handleRunCompliance}
  disabled={
    runningAudit ||
    !selectedEvidenceFileId ||
    selectedRegulationIds.length === 0
  }
  className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
>
  {runningAudit ? "Running audit…" : "Run compliance check"}
</button>

{runningAudit && (
  <div className="flex items-center gap-2 mt-2 text-xs text-emerald-700">
    <div className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
    Running compliance audit…
  </div>
)}

              {message && (
                <p className="text-xs text-slate-600">{message}</p>
              )}
            </StepCard>
          </main>

          {/* RIGHT SIDE — INFO / HELP */}
          <aside className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-slate-50 shadow-lg">
              <div className="pointer-events-none absolute inset-x-6 top-0 h-24 rounded-b-full bg-emerald-400/20 blur-3xl" />
              <div className="relative p-5">
                <h3 className="text-sm font-semibold">How this wizard works</h3>
                <p className="mt-2 text-xs text-slate-200">
                  You’re building a soft, guided flow that supports compliance
                  teams through structured steps. Each step feeds into the next:
                </p>
                <ul className="mt-3 space-y-2 text-[11px] text-slate-200">
                  <li>• Generate obligations and tasks for a framework.</li>
                  <li>• Extract obligations from specific regulations.</li>
                  <li>• Choose an evidence file from FileHub.</li>
                  <li>• Run AI-based checks on that evidence.</li>
                </ul>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 text-xs text-slate-600 shadow-sm ring-1 ring-slate-100">
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Next step
              </h4>
              <p className="mt-2 text-xs">
                After generating obligations, extracting regulatory duties, and
                running compliance checks, you can review every result inside
                your{" "}
                <span className="font-semibold text-slate-900">
                  Compliance Dashboard
                </span>
                .
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
