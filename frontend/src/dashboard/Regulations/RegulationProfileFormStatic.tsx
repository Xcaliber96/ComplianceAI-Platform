import React, { useState, useEffect} from "react";
import { v4 as uuidv4 } from "uuid";
import { wizardSearch, getLocalPackages,BASE_URL  ,getCfrSection } from "../../api/client";
import { useNavigate } from "react-router-dom";
type SourceType = "government" | "state";
type GovernmentSearchMode = "topic" | "packageId";
type StateSearchMode = "ruleNumber" | "topic";

type Regulation = {
  id: string;
  name: string;
  code?: string | null;
  region?: string | null;
  category?: string | null;
  risk?: string | null;
  description?: string | null;
  source?: string | null;
};

const AddRegulationsPage: React.FC = () => {
  // ===== STATIC FAKE DATA FOR TESTING =====
const FAKE_GOVERNMENT_REGULATIONS: Regulation[] = [
  {
    id: "ecfr-100.1",
    name: "§100.1 Ethical Conduct Requirements",
    code: "5 CFR 100.1",
    region: "Federal",
    category: "Ethics",
    risk: "medium",
    description: "Standards of ethical conduct for federal employees.",
    source: "ECFR"
  },
  {
    id: "ecfr-200.4",
    name: "§200.4 Data Protection Standards",
    code: "5 CFR 200.4",
    region: "Federal",
    category: "Data Protection",
    risk: "high",
    description: "Minimum data security and privacy requirements.",
    source: "ECFR"
  }
];

const FAKE_STATE_REGULATIONS: Regulation[] = [
  {
    id: "mi-r325-1001",
    name: "R 325.1001 – Michigan Health Rule",
    code: "R 325.1001",
    region: "Michigan",
    category: "Health Safety",
    risk: "low",
    description: "Michigan administration rule for public health facilities.",
    source: "Michigan Admin Code"
  },
  {
    id: "mi-r400-20",
    name: "R 400.20 – Child Care Safety Requirements",
    code: "R 400.20",
    region: "Michigan",
    category: "Child Safety",
    risk: "medium",
    description: "Basic requirements for childcare provider safety.",
    source: "Michigan Admin Code"
  }
];

const STATIC_TITLES = [
  {
    number: 12,
    name: "Food & Drugs",
    parts: [
      {
        part_number: "100",
        part_heading: "Labeling Requirements",
        sections: [
          {
            section_number: "100.1",
            heading: "Label definitions",
            text: [
              "This is fake regulation text for demonstration.",
              "Paragraph 1: Lorem ipsum dolor sit amet.",
              "Paragraph 2: Consectetur adipiscing elit."
            ]
          },
          {
            section_number: "100.2",
            heading: "Ingredient labeling",
            text: ["Fake regulation text for 100.2"]
          }
        ]
      },
      {
        part_number: "101",
        part_heading: "Food Labeling",
        sections: [
          {
            section_number: "101.1",
            heading: "Food labeling basics",
            text: ["Example section text 101.1..."]
          }
        ]
      }
    ]
  }
];
const [step, setStep] = useState(1);
// CFR structure wizard state (government only)
const [titleInput, setTitleInput] = useState("");
const [partInput, setPartInput] = useState("");
const [sectionInput, setSectionInput] = useState("");

const [structureError, setStructureError] = useState<string | null>(null);
const [structureLoading, setStructureLoading] = useState(false);
const navigate = useNavigate();

  const [sourceType, setSourceType] = useState<SourceType>("government");
  const [stateValue, setStateValue] = useState("michigan");
  const [govSearchMode, setGovSearchMode] =
    useState<GovernmentSearchMode>("topic");
  const [stateSearchMode, setStateSearchMode] =
    useState<StateSearchMode>("ruleNumber");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Regulation[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const resetResults = () => {
    setResults([]);
    setSelectedIds([]);
    setError(null);
  };

  const handleSourceTypeChange = (value: SourceType) => {
    setSourceType(value);
    setQuery("");
    resetResults();
  };

  const handleGovModeChange = (value: GovernmentSearchMode) => {
    setGovSearchMode(value);
    setQuery("");
    resetResults();
  };

  const handleStateModeChange = (value: StateSearchMode) => {
    setStateSearchMode(value);
    setQuery("");
    resetResults();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === results.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(results.map((r) => r.id));
    }
  };

  
const handleFetch = async () => {
  if (!query.trim()) {
    setError("Please enter a search value.");
    return;
  }

  setIsLoading(true);
  setError(null);
  setResults([]);
  setSelectedIds([]);

  try {
    // Fake delay to show loading animation
    await new Promise((resolve) => setTimeout(resolve, 500));

    let fakeResults: Regulation[] = [];

    if (sourceType === "government") {
      fakeResults = FAKE_GOVERNMENT_REGULATIONS.filter(r =>
        r.name.toLowerCase().includes(query.toLowerCase())
      );
    } else {
      fakeResults = FAKE_STATE_REGULATIONS.filter(r =>
        r.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    setResults(fakeResults);

    if (fakeResults.length === 0) {
      setError("No regulations found for this search.");
    } else if (fakeResults.length === 1) {
      setSelectedIds([fakeResults[0].id]);
    }

  } catch (err: any) {
    setError("Something went wrong.");
  } finally {
    setIsLoading(false);
  }
};

const [packageList, setPackageList] = useState<string[]>([]);

useEffect(() => {
  getLocalPackages().then((res) => {
    setPackageList(res.packages || []);
  });
}, []);

const handleAddSelected = async () => {
  console.log("=== handleAddSelected() CALLED ===");

  if (selectedIds.length === 0) {
    console.log("No selectedIds — aborting");
    setError("Please select at least one regulation.");
    return;
  }

  console.log("Selected IDs:", selectedIds);

  setIsLoading(true);
  setError(null);

  try {
    const selectedRegs = results.filter((r) => selectedIds.includes(r.id));
    console.log("Selected regs:", JSON.stringify(selectedRegs, null, 2));

    const user_uid = localStorage.getItem("user_uid");
    console.log("User UID:", user_uid);

    if (!user_uid) {
      throw new Error("No user UID found — cannot save.");
    }

    // Build the enriched payload
    const enriched = selectedRegs.map((reg) => ({
      ...reg,
      full_text: reg.description || "",
    }));

    console.log("Enriched payload to backend:");
    console.log(JSON.stringify(enriched, null, 2));

    console.log("POST →", `${BASE_URL}/api/regulations/import`);

    const response = await fetch(`${BASE_URL}/api/regulations/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_uid,
        regulations: enriched,
      }),
    });

    console.log("Raw backend response:", response);

    if (!response.ok) {
      const errText = await response.text();
      console.log("Backend non-OK response body:", errText);
      throw new Error(`Failed to save regulations: ${errText}`);
    }

    const json = await response.json();
    console.log("Parsed backend JSON:", json);

    if (!json.ok) {
      throw new Error(json.error || "Backend reported failure saving.");
    }

    resetResults();
    setQuery("");
    navigate("/dashboard/regulations");
  } catch (err) {
    console.error("🔥 SAVE ERROR:", err);
    setError(err.message || "Something went wrong while saving.");
  } finally {
    console.log("=== handleAddSelected() FINISHED ===");
    setIsLoading(false);
  }
};

async function handleSelectTitle(title: any) {
  setSelectedTitle(title);
  setStep(2);

  const res = await fetch(`${BASE_URL}/api/v1/cfr/title/${title.title_number}`);
  const json = await res.json();

  if (json.ok) {
    setParts(json.title.parts);
  }
}
function handleSelectPart(part: any) {
  setSelectedPart(part);


  setStep(3);
}

function handleSelectSection(section: any) {
  setSelectedSection(section);
  setStep(4);
}

const handleConfirmTitle = async () => {
  if (!titleInput.trim()) {
    setStructureError("Please enter a CFR title number (1–50).");
    return;
  }

  const num = parseInt(titleInput.trim(), 10);
  if (Number.isNaN(num) || num < 1 || num > 50) {
    setStructureError("Title must be a number between 1 and 50.");
    return;
  }

  setStructureLoading(true);
  setStructureError(null);

  try {
    const res = await fetch(`${BASE_URL}/api/v1/cfr/title/${num}`);
    if (!res.ok) {
      throw new Error(`Title ${num} not found.`);
    }
    const json = await res.json();
    if (!json.ok || !json.title) {
      throw new Error(json.error || "Failed to load title data.");
    }

    setSelectedTitle(json.title);
    setParts(json.title.parts || []);
    setSelectedPart(null);
    setSelectedSection(null);
    setPartInput("");
    setSectionInput("");
    setStep(2); // move to Part step
  } catch (e: any) {
    setStructureError(e.message || "Failed to load title.");
  } finally {
    setStructureLoading(false);
  }
};

const handleConfirmPart = () => {
  if (!partInput.trim()) {
    setStructureError("Please enter a part number.");
    return;
  }
  const part = parts.find(
    (p: any) => String(p.part_number) === partInput.trim()
  );

  if (!part) {
    setStructureError("Part not found in this title.");
    return;
  }
  console.log("MATCHED PART:", part);

setSelectedPart(part);
setSelectedSection(null);
setSectionInput("");
setStructureError(null);
setStep(3);
};

const handleConfirmSection = async () => {
  if (!sectionInput.trim()) {
    setStructureError("Please enter a section number.");
    return;
  }

  try {
    const res = await getCfrSection(
      selectedTitle.title_number,
      selectedPart.part_number,
      sectionInput.trim()
    );

    console.log("Backend returned:", res);

    if (!res.ok) {
      setStructureError("Section not found.");
      return;
    }

    // Store selected section
    setSelectedSection(res.section);

    // ADD THIS — Populate results panel
    setResults([{
      id: `cfr-${selectedTitle.title_number}-${selectedPart.part_number}-${res.section.section_number}`,
      name: `§${res.section.section_number} ${res.section.heading}`,
      code: `${selectedTitle.title_number} CFR ${selectedPart.part_number}.${res.section.section_number}`,
      region: "Federal",
      category: selectedTitle.title_name,
      description: res.section.regulation_text?.join(" ") || "",
      source: "ECFR"
    }]);

    setSelectedIds([]); // reset selections
    setStructureError(null);
    setStep(4);

  } catch (err) {
    console.error(err);
    setStructureError("Section not found.");
  }
};

const showGovTopic = sourceType === "government" && govSearchMode === "topic";
  const showGovPackage =
    sourceType === "government" && govSearchMode === "packageId";
  const showStateRule =
    sourceType === "state" && stateSearchMode === "ruleNumber";
  const showStateTopic = sourceType === "state" && stateSearchMode === "topic";
const [titles, setTitles] = useState<any[]>([]);
const [parts, setParts] = useState<any[]>([]);

const [selectedTitle, setSelectedTitle] = useState<any>(null);
const [selectedPart, setSelectedPart] = useState<any>(null);
const [selectedSection, setSelectedSection] = useState<any>(null);
useEffect(() => {
  async function fetchTitles() {
    const res = await fetch(`${BASE_URL}/api/v1/cfr/titles`);
    const json = await res.json();
    if (json.ok) {
      setTitles(json.titles);
    }
  }
  fetchTitles();
}, []);

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Add Regulations
            </h1>
            <p className="mt-1 max-w-xl text-sm text-slate-500">
              Choose a source, search by topic, package ID, or rule number, and
              add the regulations you need into your workspace library.
            </p>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
              Regulations Wizard
            </span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr),minmax(260px,1fr)]">
          {/* Main Panel */}
          <main className="space-y-6">
            {/* Step 1: Source Type */}
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                      1
                    </span>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Choose regulation source
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Select whether you want to pull federal/government
                    regulations or state-level regulations.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {/* Government Card */}
                <button
                  type="button"
                  onClick={() => handleSourceTypeChange("government")}
                  className={`flex h-full flex-col rounded-xl border px-4 py-3 text-left transition ${
                    sourceType === "government"
                      ? "border-emerald-500 bg-emerald-50/60 shadow-sm"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Source
                    </span>
                    {sourceType === "government" && (
                      <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-medium text-white">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-900">
                    Government
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Federal / national-level regulations imported by topic or
                    package ID.
                  </p>
                </button>

                {/* State Card */}
                <button
                  type="button"
                  onClick={() => handleSourceTypeChange("state")}
                  className={`flex h-full flex-col rounded-xl border px-4 py-3 text-left transition ${
                    sourceType === "state"
                      ? "border-emerald-500 bg-emerald-50/60 shadow-sm"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Source
                    </span>
                    {sourceType === "state" && (
                      <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-medium text-white">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-900">State</p>
                  <p className="mt-1 text-xs text-slate-500">
                    State-specific administrative codes. Currently supports
                    Michigan.
                  </p>

                  {sourceType === "state" && (
                    <div className="mt-3">
                      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        State
                      </label>
                      <select
                        value={stateValue}
                        onChange={(e) => {
                          setStateValue(e.target.value);
                          resetResults();
                        }}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50"
                      >
                        <option value="michigan">Michigan</option>
                      </select>
                      <p className="mt-1 text-[10px] text-slate-400">
                        Other states coming soon.
                      </p>
                    </div>
                  )}
                </button>
              </div>
            </section>

            {/* Step 2: Search Criteria */}
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                      2
                    </span>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Configure search
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Choose how you want to look up regulations, then enter a
                    topic, package ID, or rule number.
                  </p>
                </div>
              </div>

              {/* Search mode toggles */}
              <div className="mt-4 grid gap-4 md:grid-cols-[1.1fr,2fr]">
                <div className="space-y-4 rounded-xl bg-slate-50 p-4">
{sourceType === "government" && (
  <div className="space-y-4 rounded-xl bg-slate-50 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      Regulation Search Structure
    </p>

    <div className="space-y-2 text-sm">

      {/* STEP 1: TITLE */}
      <label className="flex cursor-default items-start gap-2">
        <input
          type="radio"
          disabled
          checked={step === 1}
          className="mt-[2px] h-3 w-3 accent-emerald-600"
        />
        <div>
          <p className="text-xs font-medium text-slate-900">Title</p>
          <p className="text-[11px] text-slate-500">
            Select or search the regulation Title.
          </p>
        </div>
      </label>

      {/* STEP 2: PART */}
      <label className="flex cursor-default items-start gap-2">
        <input
          type="radio"
          disabled
          checked={step === 2}
          className="mt-[2px] h-3 w-3 accent-emerald-600"
        />
        <div>
          <p className="text-xs font-medium text-slate-900">Part</p>
          <p className="text-[11px] text-slate-500">
            Narrow down into the specific Part within a Title.
          </p>
        </div>
      </label>

      {/* STEP 3: SECTION */}
      <label className="flex cursor-default items-start gap-2">
        <input
          type="radio"
          disabled
          checked={step === 3}
          className="mt-[2px] h-3 w-3 accent-emerald-600"
        />
        <div>
          <p className="text-xs font-medium text-slate-900">Section</p>
          <p className="text-[11px] text-slate-500">
            Select the precise Section within a Part.
          </p>
        </div>
      </label>

      {/* STEP 4: REVIEW */}
      <label className="flex cursor-default items-start gap-2">
        <input
          type="radio"
          disabled
          checked={step === 4}
          className="mt-[2px] h-3 w-3 accent-emerald-600"
        />
        <div>
          <p className="text-xs font-medium text-slate-900">Review</p>
          <p className="text-[11px] text-slate-500">
            Review the selected Title → Part → Section before importing.
          </p>
        </div>
      </label>

    </div>
  </div>
)}

                  {sourceType === "state" && (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        State search mode
                      </p>
                      <div className="space-y-2 text-sm">
                        <label className="flex cursor-pointer items-start gap-2">
                          <input
                            type="radio"
                            className="mt-[2px] h-3 w-3 accent-emerald-600"
                            checked={stateSearchMode === "ruleNumber"}
                            onChange={() => handleStateModeChange("ruleNumber")}
                          />
                          <div>
                            <p className="text-xs font-medium text-slate-900">
                              Rule number
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Look up a single Michigan administrative rule by
                              its number (e.g. R 325.1001).
                            </p>
                          </div>
                        </label>

                        <label className="flex cursor-pointer items-start gap-2">
                          <input
                            type="radio"
                            className="mt-[2px] h-3 w-3 accent-emerald-600"
                            checked={stateSearchMode === "topic"}
                            onChange={() => handleStateModeChange("topic")}
                          />
                          <div>
                            <p className="text-xs font-medium text-slate-900">
                              Topic
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Search across Michigan rules for a relevant
                              keyword or phrase.
                            </p>
                          </div>
                        </label>
                      </div>
                    </>
                  )}
                </div>

<div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
  {sourceType === "government" ? (
    <div className="space-y-4">

      {/* STEP 1: TITLE */}
      {step === 1 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-700">CFR Title (1–50)</label>
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="e.g. 12"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
          />

          {structureError && <p className="text-[11px] text-rose-500">{structureError}</p>}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleConfirmTitle}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
            >
              Confirm title
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PART */}
      {step === 2 && (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-500">
            Title {selectedTitle?.title_number} — {selectedTitle?.title_name}
          </p>

          <label className="text-xs font-medium">Part number</label>
          <input
            type="text"
            value={partInput}
            onChange={(e) => setPartInput(e.target.value)}
            placeholder="e.g. 100"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
          />

          {structureError && <p className="text-[11px] text-rose-500">{structureError}</p>}

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="text-[11px] text-slate-500">
              ← Back
            </button>
            <button
              type="button"
              onClick={handleConfirmPart}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
            >
              Confirm part
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SECTION */}
      {step === 3 && (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-500">
            Title {selectedTitle?.title_number} — {selectedTitle?.title_name} · Part{" "}
            {selectedPart?.part_number}
          </p>

          <label className="text-xs font-medium">Section number</label>
          <input
            type="text"
            value={sectionInput}
            onChange={(e) => setSectionInput(e.target.value)}
            placeholder="e.g. 100.1"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
          />

          {structureError && <p className="text-[11px] text-rose-500">{structureError}</p>}

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="text-[11px] text-slate-500">
              ← Back
            </button>
            <button
              type="button"
              onClick={handleConfirmSection}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
            >
              Confirm section & add
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW */}
      {step === 4 && (
        <div className="space-y-1 text-xs">
          <p className="font-semibold text-slate-900">Review CFR selection</p>
          <p>Title {selectedTitle?.title_number} — {selectedTitle?.title_name}</p>
          <p>Part {selectedPart?.part_number} — {selectedPart?.part_heading}</p>
          <p>Section {selectedSection?.section_number} — {selectedSection?.heading}</p>
        </div>
      )}

    </div>
  ) : (
    // STATE SEARCH (unchanged)
    <>
      <label className="text-xs font-medium text-slate-700">
        {showStateRule && "Michigan rule number"}
        {showStateTopic && "State topic"}
      </label>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
      />

      {error && <p className="text-[11px] text-rose-500">{error}</p>}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleFetch}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
        >
          Fetch regulations
        </button>
      </div>
    </>
  )}
</div>

</div>
</section>

            {/* Step 3: Results */}
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                      3
                    </span>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Review and add to library
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Preview the regulations found, select the ones that apply,
                    and add them into your regulations library.
                  </p>
                </div>
                {results.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                    {results.length} result{results.length !== 1 && "s"}
                  </span>
                )}
              </div>

              {results.length === 0 && !isLoading && !error && (
                <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-xs text-slate-400">
                  No results yet. Run a search above to see regulations from
                  your selected source.
                </div>
              )}

              {results.length > 0 && (
                <div className="mt-4">
                  <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={selectAll}
                        className="text-[11px] font-medium text-emerald-700 hover:underline"
                      >
                        {selectedIds.length === results.length
                          ? "Clear selection"
                          : "Select all"}
                      </button>
                      <span className="text-[11px] text-slate-400">
                        {selectedIds.length} selected
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Scroll to view full list
                    </span>
                  </div>

                  <div className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-2">
                    {results.map((reg) => (
                      <label
                        key={reg.id}
                        className="flex cursor-pointer gap-3 rounded-lg bg-white p-3 text-xs text-slate-700 shadow-sm ring-1 ring-slate-100 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-3 w-3 accent-emerald-600"
                          checked={selectedIds.includes(reg.id)}
                          onChange={() => toggleSelect(reg.id)}
                        />
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[13px] font-medium text-slate-900">
                              {reg.name || "Untitled regulation"}
                            </span>
                            {reg.code && (
                              <span className="rounded-full bg-slate-100 px-2 py-[2px] text-[10px] text-slate-600">
                                {reg.code}
                              </span>
                            )}
                            {reg.region && (
                              <span className="rounded-full bg-emerald-50 px-2 py-[2px] text-[10px] text-emerald-700">
                                {reg.region}
                              </span>
                            )}
                            {reg.category && (
                              <span className="rounded-full bg-slate-100 px-2 py-[2px] text-[10px] text-slate-600">
                                {reg.category}
                              </span>
                            )}
                            {reg.risk && (
                              <span className="rounded-full bg-amber-50 px-2 py-[2px] text-[10px] text-amber-700">
                                {reg.risk} risk
                              </span>
                            )}
                          </div>
                          {reg.description && (
                            <p className="line-clamp-2 text-[11px] text-slate-500">
                              {reg.description}
                            </p>
                          )}
                          {reg.source && (
                            <p className="text-[10px] text-slate-400">
                              Source: {reg.source}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-[11px] text-slate-400">
                      Selected regulations will be added to your Regulations
                      Library and can be managed from there.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddSelected}
                      disabled={selectedIds.length === 0 || isLoading}
                      className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      Add selected to library
                    </button>
                  </div>
                </div>
              )}
            </section>
          </main>

          {/* Side Panel */}
          <aside className="space-y-4">
            <div className="rounded-2xl bg-slate-900 p-5 text-slate-50 shadow-lg">
              <h3 className="text-sm font-semibold">How this works</h3>
              <p className="mt-2 text-xs text-slate-200">
                This wizard pulls regulations from external sources (federal
                datasets or state repositories), normalizes them, and prepares
                them for your workspace library.
              </p>
              <ul className="mt-3 space-y-2 text-[11px] text-slate-200">
                <li>• Pick a source type that matches the jurisdiction.</li>
                <li>• Use topic search for broad discovery.</li>
                <li>• Use package ID or rule number for precise imports.</li>
                <li>• Confirm the list before adding to your library.</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-white p-4 text-xs text-slate-600 shadow-sm ring-1 ring-slate-100">
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Next step
              </h4>
              <p className="mt-2 text-xs">
                Once regulations are added here, they’ll appear in your{" "}
                <span className="font-semibold text-slate-900">
                  Regulations Library
                </span>
                , where you can categorize, tag, and map them to controls.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AddRegulationsPage;
