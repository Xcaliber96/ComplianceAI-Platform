import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchStateRegulations,
  fetchWorkspace,
  toggleRegulation,
  
} from "../../api/client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type RegulationCategory =
  | "Privacy"
  | "Security"
  | "Finance"
  | "Healthcare"
  | "Government";

type Regulation = {
  id: string;
  name: string;
  code?: string;
  region: string;
  category: string;
  risk: string;
  description: string;
  recommended?: boolean;
  workspace_status: "default" | "added" | "removed" | "custom";
};
export interface WorkspaceRegulation {
  id: string;
  user_id: string;
  name: string;
  code?: string;
  region_type: "federal" | "state" | "city" | "global";
  region: string;
  category: string;
  risk: string;
  description: string;
  recommended?: boolean;
  workspace_status: "default" | "added" | "removed" | "custom";
  source?: string;
}
const regions = ["All regions", "EU", "US", "Global"] as const;

const categories: (RegulationCategory | "All categories")[] = [
  "All categories",
  "Privacy",
  "Security",
  "Finance",
  "Healthcare",
  "Government",
];

export default function RegulationsLibraryPage() {
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] =
    useState<(typeof regions)[number]>("All regions");
  const [categoryFilter, setCategoryFilter] =
    useState<(typeof categories)[number]>("All categories");
const [showCustomModal, setShowCustomModal] = useState(false);
  const [activeId, setActiveId] = useState<string>("");

useEffect(() => {
  async function load() {
    const userId = "test-user"; // TODO replace

    // 1. Load user workspace
    const ws = await fetchWorkspace(userId);

    // 2. Load state results
    const stateRegs = await fetchStateRegulations("michigan", "tax");

    // 3. Merge workspace status
    const merged = stateRegs.map((reg) => {
      const match = ws.find((w) => w.id === reg.id);
      return {
        ...reg,
        workspace_status: match ? match.workspace_status : "default",
      };
    });

    setRegulations(merged);

    if (merged.length > 0) setActiveId(merged[0].id);
  }

  load();
}, []);

  const activeRegulation = useMemo(
    () => regulations.find((r) => r.id === activeId) ?? null,
    [regulations, activeId]
  );

  const filtered = useMemo(() => {
    return regulations.filter((reg) => {
      const matchesSearch =
        reg.name.toLowerCase().includes(search.toLowerCase()) ||
        reg.code?.toLowerCase().includes(search.toLowerCase() || "");

      const matchesRegion =
        regionFilter === "All regions" || reg.region === regionFilter;

      const matchesCategory =
        categoryFilter === "All categories" || reg.category === categoryFilter;

      return matchesSearch && matchesRegion && matchesCategory;
    });
  }, [search, regionFilter, categoryFilter, regulations]);

const handleToggle = async (regId: string) => {
  const userId = "test-user"; // TODO: replace with real user.uid

  await toggleRegulation(userId, regId);

  // Reload workspace
  const ws = await fetchWorkspace(userId);

  // Merge workspace data into state regulations
  const merged = regulations.map((reg) => {
    const match = ws.find((w) => w.id === reg.id);
    return {
      ...reg,
      workspace_status: match ? match.workspace_status : "default",
    };
  });

  setRegulations(merged);
};

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans">
      <main className="flex-1 p-10 flex flex-col gap-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              Regulations Library
            </h1>
            <p className="text-gray-600 mt-2 max-w-xl">
              Discover and add regulatory frameworks that apply to your
              organization. Use filters to quickly find what matters.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl">
              Export overview
            </Button>
            <Button
              onClick={() => setShowCustomModal(true)}
              className="bg-green-700 hover:bg-green-800 text-white px-5 rounded-xl shadow-md"
            >
              Add custom regulation
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-none shadow-md rounded-2xl">
          <CardContent className="p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 flex items-center gap-3">
              <div className="relative w-full md:w-80">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or code (e.g. GDPR, HIPAA)..."
                  className="h-11 pl-3 pr-3 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {/* Region filter */}
              <select
                value={regionFilter}
                onChange={(e) =>
                  setRegionFilter(e.target.value as (typeof regions)[number])
                }
                className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r === "All regions" ? "All regions" : r}
                  </option>
                ))}
              </select>

              {/* Category filter */}
              <select
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(
                    e.target.value as (typeof categories)[number]
                  )
                }
                className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "All categories" ? "All categories" : c}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Main content layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6">
          {/* Left: list */}
          <Card className="border-none shadow-md rounded-2xl overflow-hidden flex flex-col">
            <CardHeader className="px-6 pt-5 pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  All regulations
                </CardTitle>
                <CardDescription className="text-gray-500 text-sm">
                  {filtered.length} frameworks match your filters.
                </CardDescription>
              </div>
            </CardHeader>
            <Separator />
            <ScrollArea className="flex-1">
              <div className="divide-y divide-gray-100">
                {filtered.map((reg) => {
                  const isAdded = reg.workspace_status === "added";
                 const isActive = activeRegulation && activeRegulation.id === reg.id;

                  return (
                    <motion.button
                      key={reg.id}
                      type="button"
                      onClick={() => setActiveId(reg.id)}
                      whileHover={{ backgroundColor: "rgba(249,250,251,1)" }}
                      className={`w-full text-left px-6 py-4 flex items-center gap-4 transition-colors ${
                        isActive ? "bg-gray-50" : "bg-white"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">
                            {reg.name}
                          </span>
                          {reg.code && (
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              {reg.code}
                            </span>
                          )}
                          {reg.recommended && (
                            <span className="text-[11px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                              Recommended
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span>{reg.region}</span>
                          <span className="h-1 w-1 rounded-full bg-gray-300" />
                          <span>{reg.category}</span>
                          <span className="h-1 w-1 rounded-full bg-gray-300" />
                          <span
                            className={
                              reg.risk === "High"
                                ? "text-red-600"
                                : reg.risk === "Medium"
                                ? "text-orange-500"
                                : "text-emerald-600"
                            }
                          >
                            {reg.risk} risk
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Button
                          size="sm"
                          variant={isAdded ? "outline" : "default"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggle(reg.id);
                          }}
                          className={`rounded-xl px-3 text-xs ${
                            isAdded
                              ? "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                              : "bg-green-700 hover:bg-green-800 text-white shadow-sm"
                          }`}
                        >
                          {isAdded ? "Remove" : "Add"}
                        </Button>
                        <span className="text-[11px] text-gray-400">
                          {isAdded ? "In your workspace" : "Not added yet"}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}

                {filtered.length === 0 && (
                  <div className="px-6 py-10 text-center text-sm text-gray-500">
                    No regulations match your filters. Try adjusting your search
                    or filters above.
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* Right: details */}
          {activeRegulation && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRegulation?.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              <Card className="border-none shadow-md rounded-2xl h-full flex flex-col">
                <CardHeader className="px-6 pt-5 pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    {activeRegulation?.name}
                    {activeRegulation?.code && (
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {activeRegulation.code}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-gray-500 text-sm">
                    High-level overview, applicability, and risk profile.
                  </CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="p-6 flex-1 flex flex-col gap-5">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">
                      {activeRegulation?.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.12em] text-gray-400">
                        Region
                      </p>
                      <p className="text-gray-800 font-medium">
                        {activeRegulation?.region}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.12em] text-gray-400">
                        Category
                      </p>
                      <p className="text-gray-800 font-medium">
                        {activeRegulation?.category}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.12em] text-gray-400">
                        Risk level
                      </p>
                      <p
                        className={`font-semibold ${
                          activeRegulation?.risk === "High"
                            ? "text-red-600"
                            : activeRegulation?.risk === "Medium"
                            ? "text-orange-500"
                            : "text-emerald-600"
                        }`}
                      >
                        {activeRegulation?.risk}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.12em] text-gray-400">
                        Recommendation
                      </p>
                      <p className="text-gray-800 font-medium">
                        {activeRegulation?.recommended
                          ? "Strongly recommended based on your profile"
                          : "Optional, depending on your industry and data"}
                      </p>
                    </div>
                  </div>

                  <Separator className="my-2" />

                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.12em] text-gray-400">
                      Next steps
                    </p>
                    <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
                      <li>Review applicability to your products and regions.</li>
                      <li>
                        Map required controls to your existing security and
                        privacy programs.
                      </li>
                      <li>
                        Assign an internal owner and define review cadence.
                      </li>
                      <li>
                        Attach evidence (policies, procedures, system diagrams)
                        as you implement controls.
                      </li>
                    </ul>
                  </div>

                  <div className="mt-auto pt-4 flex items-center justify-between gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs"
                    >
                      View official documentation
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => activeRegulation && handleToggle(activeRegulation.id)}
                      className={`rounded-xl px-4 text-xs ${
                        activeRegulation.workspace_status === "added"
                          ? "bg-gray-900 hover:bg-black text-white"
                          : "bg-green-700 hover:bg-green-800 text-white"
                      }`}
                    >
                      {activeRegulation.workspace_status === "added"
                        ? "Remove from workspace"
                        : "Add to workspace"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
          )}
        </div>
      </main>{showCustomModal && (
  <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-xl shadow-xl w-[400px]">
      <h2 className="text-lg font-semibold mb-4">Add Custom Regulation</h2>

      <Input
        placeholder="Regulation name"
        className="mb-3"
        // store local form state later
      />

      <div className="flex justify-end gap-3 mt-4">
        <Button variant="outline" onClick={() => setShowCustomModal(false)}>
          Cancel
        </Button>
        <Button className="bg-green-700 text-white">Save</Button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
