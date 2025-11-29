// RegulationExplorer.tsx
import React, { useEffect, useState } from "react";
import {
  localGranuleSearch,
  getLocalPackages,
  getGranulesForPackage,
  toggleRegulation,
  fetchWorkspace
} from "../../api/client";

interface Granule {
  granuleId: string;
  title: string;
  summary?: string;
  agencyNames?: string[];
  publicationDate?: string;
  type?: string;
  cfrCitation?: string;
}

export default function RegulationExplorer({ user_uid }: { user_uid: string }) {
  const [query, setQuery] = useState("");

  // DATES / PACKAGES
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // GRANULES (DATE VIEW)
  const [granules, setGranules] = useState<Granule[]>([]);

  // WORKSPACE
  const [workspace, setWorkspace] = useState<any[]>([]);

  // SEARCH MODE
  const [searchMode, setSearchMode] = useState(false);
  const [results, setResults] = useState<Granule[]>([]);
  const [showAll, setShowAll] = useState(false);

  // Load on mount
  useEffect(() => {
    loadDates();
    loadWorkspace();
  }, []);

  const loadWorkspace = async () => {
    const data = await fetchWorkspace(user_uid);
    setWorkspace(data);
  };

  const loadDates = async () => {
    const data = await getLocalPackages();
    const sorted = data.packages.sort().reverse(); // newest first
    setDates(sorted);
  };

  const loadGranules = async (pkg: string) => {
    setSearchMode(false); // exit search view
    setSelectedDate(pkg);

    const data = await getGranulesForPackage(pkg);
    setGranules(data.granules || []);
  };

  const runSearch = async () => {
    const res = await localGranuleSearch(query);

    setResults(res.results || []);
    setShowAll(false);
    setSearchMode(true);
    setSelectedDate(null); // hide date view
  };

  const isAdded = (id: string) =>
    workspace.some((w) => w.id === id && w.workspace_status === "added");

  const toggle = async (regId: string) => {
    await toggleRegulation(user_uid, regId);
    await loadWorkspace();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Federal Register — Last 7 Days</h1>

      {/* 🔍 Search Bar */}
      <div className="flex gap-2 mb-6">
        <input
          className="border rounded p-2 flex-1"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search all cached regulations…"
        />
        <button
          onClick={runSearch}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Search
        </button>
      </div>

      {/* 📅 Horizontal Date Selector */}
      <div className="flex gap-3 overflow-x-auto pb-2 mb-6 border-b">
        {dates.map((d) => (
          <button
            key={d}
            onClick={() => loadGranules(d)}
            className={`px-4 py-2 rounded border ${
              selectedDate === d ? "bg-blue-600 text-white" : "bg-white"
            }`}
          >
            {d.replace("FR-", "")}
          </button>
        ))}
      </div>

      {/* 🔍 SEARCH RESULTS MODE */}
{/* 📅 DATE VIEW (only if NOT searching) */}
{!searchMode && selectedDate && (
  <div>
    <h2 className="text-2xl font-semibold mb-4">
      Regulations for {selectedDate.replace("FR-", "")}
    </h2>

    {granules.length === 0 && <p>No regulations found for this date.</p>}

    {granules.map((g) => (
      <div
        key={g.granuleId}
        className="border rounded p-4 mb-4 shadow-sm hover:shadow-md transition"
      >
        <h3 className="text-lg font-bold">{g.title}</h3>
        <p className="text-sm text-gray-600 mb-2">{g.summary}</p>

        <p className="text-sm text-gray-500 mb-1">
          <strong>Agency:</strong> {g.agencyNames?.join(", ")}
        </p>

        {g.cfrCitation && (
          <p className="text-sm text-gray-500">
            <strong>CFR:</strong> {g.cfrCitation}
          </p>
        )}

        <button
          onClick={() => toggle(g.granuleId)}
          className={`mt-3 px-3 py-1 rounded ${
            isAdded(g.granuleId)
              ? "bg-red-500 text-white"
              : "bg-green-600 text-white"
          }`}
        >
          {isAdded(g.granuleId)
            ? "Remove from Workspace"
            : "Add to Workspace"}
        </button>
      </div>
    ))}
  </div>
)}

      {/* 📅 DATE VIEW MODE */}
      {selectedDate && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            Regulations for {selectedDate.replace("FR-", "")}
          </h2>

          {granules.length === 0 && <p>No regulations found for this date.</p>}

          {granules.map((g) => (
            <div
              key={g.granuleId}
              className="border rounded p-4 mb-4 shadow-sm hover:shadow-md transition"
            >
              <h3 className="text-lg font-bold">{g.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{g.summary}</p>

              <p className="text-sm text-gray-500 mb-1">
                <strong>Agency:</strong> {g.agencyNames?.join(", ")}
              </p>
              {g.cfrCitation && (
                <p className="text-sm text-gray-500">
                  <strong>CFR:</strong> {g.cfrCitation}
                </p>
              )}

              <button
                onClick={() => toggle(g.granuleId)}
                className={`mt-3 px-3 py-1 rounded ${
                  isAdded(g.granuleId)
                    ? "bg-red-500 text-white"
                    : "bg-green-600 text-white"
                }`}
              >
                {isAdded(g.granuleId)
                  ? "Remove from Workspace"
                  : "Add to Workspace"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
