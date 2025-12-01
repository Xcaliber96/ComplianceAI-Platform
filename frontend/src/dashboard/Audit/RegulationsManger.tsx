import React, { useEffect, useState } from "react";
import { getSampleRegulations } from "../../api/client";

interface SampleRegulation {
  name: string;
  description?: string;
  articles?: any[];
  controls?: any[];
}

export default function RegulationsPage() {
  const [library, setLibrary] = useState<SampleRegulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualName, setManualName] = useState("");
  const [manualRegion, setManualRegion] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchRegulations();
  }, []);

  const fetchRegulations = async () => {
    try {
      setLoading(true);

      // 🚀 Load sample regulations from backend JSON
      const list = await getSampleRegulations();
      setLibrary(list);
    } catch (err) {
      console.error(err);
      setMessage("Error loading regulations.");
    } finally {
      setLoading(false);
    }
  };

  const submitManualRegulation = async () => {
    if (!manualName.trim()) {
      setMessage("Regulation name is required.");
      return;
    }

    // You can later POST to backend — for now just simulate success
    const newReg = {
      name: manualName,
      description: manualDescription,
      region: manualRegion,
    };

    setLibrary((prev) => [...prev, newReg]);

    setMessage("Regulation added successfully!");
    setManualName("");
    setManualRegion("");
    setManualDescription("");
  };

  return (
    <div className="p-8 w-full">
      <h1 className="text-3xl font-bold mb-6">Regulations Manager</h1>

      {message && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded">
          {message}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-lg font-medium">Loading regulations...</div>
      ) : (
        <>
          {/* SECTION 1: Sample regulation templates */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Supported Regulation Templates</h2>

            {library.length === 0 ? (
              <p className="text-gray-500">No regulation templates available.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {library.map((reg, idx) => (
                  <div
                    key={idx}
                    className="p-4 border rounded-lg shadow-sm bg-white"
                  >
                    <h3 className="text-xl font-bold mb-2">{reg.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {reg.description || "No description available."}
                    </p>

                    <button className="text-blue-600 hover:underline">
                      View Details →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SECTION 2: Manual add regulation */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Add Regulation Manually</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
              <input
                type="text"
                placeholder="Regulation Name"
                className="border p-3 rounded"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
              />

              <input
                type="text"
                placeholder="Region (optional)"
                className="border p-3 rounded"
                value={manualRegion}
                onChange={(e) => setManualRegion(e.target.value)}
              />

              <textarea
                placeholder="Description (optional)"
                className="border p-3 rounded md:col-span-2"
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
              />

              <button
                onClick={submitManualRegulation}
                className="md:col-span-2 bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition"
              >
                Add Regulation
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
