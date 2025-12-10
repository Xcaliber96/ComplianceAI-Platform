import React, { useState, useEffect} from "react";
import { v4 as uuidv4 } from "uuid";
import { wizardSearch, getLocalPackages,BASE_URL  ,getRegulationText } from "../../api/client";
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
    let payload: any = {
      sourceType,
      query,
    };

    if (sourceType === "government") {
      payload.mode = govSearchMode;         // "topic" | "packageId"
    }

    if (sourceType === "state") {
      payload.mode = stateSearchMode;       // "ruleNumber" | "topic"
      payload.state = stateValue;           // currently "michigan"
    }

    console.log("Sending search payload:", payload);

   const data = (await wizardSearch(payload)) || [];
   if (!Array.isArray(data)) {
      setError("Invalid response from server.");
      setIsLoading(false);
      return;
    }
    if (!data || data.length === 0) {
      setError("No regulations found for this search.");
      setResults([]);
    } else {
      setResults(data);

      if (data.length === 1) {
        setSelectedIds([data[0].id]); // auto select single result
      }
    }
  } catch (err: any) {
    console.error(err);
    setError(err.message || "Something went wrong while fetching.");
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
  if (selectedIds.length === 0) {
    setError("Please select at least one regulation to add.");
    return;
  }

  setIsLoading(true);
  setError(null);

  try {
    const selectedRegs = results.filter((r) => selectedIds.includes(r.id));
const user_uid = localStorage.getItem("user_uid");

if (!user_uid) {
  console.error("❌ No user_uid found in localStorage");
  return;
}

    // 1️⃣ FETCH FULL TEXT BEFORE SENDING TO BACKEND
    const enriched = await Promise.all(
      selectedRegs.map(async (reg) => {
        const full = await getRegulationText(reg.id); // ← retrieves parsed .txt
        return {
          ...reg,
          full_text: full.text, // ← store the full text in dataset
        };
      })
    );

    // 2️⃣ SEND THE DATA TO BACKEND (using BASE_URL)
    const response = await fetch(`${BASE_URL}/api/regulations/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_uid,
        regulations: enriched,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to add regulations.");
    }

    resetResults();
    setQuery("");

  } catch (err: any) {
    console.error(err);
    setError(err.message || "Something went wrong.");
  } finally {
    setIsLoading(false);
  }
};


  const showGovTopic = sourceType === "government" && govSearchMode === "topic";
  const showGovPackage =
    sourceType === "government" && govSearchMode === "packageId";
  const showStateRule =
    sourceType === "state" && stateSearchMode === "ruleNumber";
  const showStateTopic = sourceType === "state" && stateSearchMode === "topic";

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
                    <>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Government search mode
                      </p>
                      <div className="space-y-2 text-sm">
                        <label className="flex cursor-pointer items-start gap-2">
                          <input
                            type="radio"
                            className="mt-[2px] h-3 w-3 accent-emerald-600"
                            checked={govSearchMode === "topic"}
                            onChange={() => handleGovModeChange("topic")}
                          />
                          <div>
                            <p className="text-xs font-medium text-slate-900">
                              Topic
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Search for frameworks by high-level topic such as
                              data privacy or financial reporting.
                            </p>
                          </div>
                        </label>

                        <label className="flex cursor-pointer items-start gap-2">
                          <input
                            type="radio"
                            className="mt-[2px] h-3 w-3 accent-emerald-600"
                            checked={govSearchMode === "packageId"}
                            onChange={() => handleGovModeChange("packageId")}
                          />
                          <div>
                            <p className="text-xs font-medium text-slate-900">
                              Package ID
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Use an exact package or framework identifier when
                              you already know the precise set to import.
                            </p>
                          </div>
                        </label>
                      </div>
                    </>
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

                {/* Query input */}
                <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
               <div className="space-y-2">
  {/* LABEL */}
  <label className="text-xs font-medium text-slate-700">
    {showGovTopic && "Government topic"}
    {showGovPackage && "Package ID"}
    {showStateRule && "Michigan rule number"}
    {showStateTopic && "State topic"}
  </label>

  {/* GOVERNMENT TOPIC MODE (normal text input) */}
  {showGovTopic && (
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="e.g. data privacy, cybersecurity, financial reporting"
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
    />
  )}

  {/* GOVERNMENT PACKAGE ID MODE (dropdown + manual override) */}
  {showGovPackage && (
    <>
      <select
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      >
        <option value="">Select a Package ID</option>
        {packageList.map((pkg) => (
          <option key={pkg} value={pkg}>
            {pkg}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Or type a Package ID (e.g. FR-2025-11-25)"
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
      />
    </>
  )}

  {/* STATE RULE MODE */}
  {showStateRule && (
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="e.g. R 325.1001"
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
    />
  )}

  {/* STATE TOPIC MODE */}
  {showStateTopic && (
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="e.g. food safety, fire protection"
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
    />
  )}

  <p className="text-[11px] text-slate-400">
    Press “Fetch regulations” to preview and select the frameworks you want to import.
  </p>
</div>


                  <div className="flex items-center justify-between gap-3">
                    {error && (
                      <p className="text-[11px] text-rose-500">{error}</p>
                    )}
                    <div className="flex flex-1 justify-end">
                      <button
                        type="button"
                        onClick={handleFetch}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                      >
                        {isLoading ? "Fetching…" : "Fetch regulations"}
                      </button>
                    </div>
                  </div>
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
