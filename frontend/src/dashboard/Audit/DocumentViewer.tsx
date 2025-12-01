import { useState } from "react";
import { FileText, MessageSquare, Table, Download } from "lucide-react";

export default function PremiumDocumentViewer() {
  const [tab, setTab] = useState<"summary" | "chat" | "data">("summary");

  return (
    <div className="h-screen w-full flex flex-col bg-white text-gray-900">

      <header className="h-14 flex items-center justify-between px-6 border-b border-gray-200">
        <h1 className="font-medium text-lg tracking-tight">
          company_policy.pdf
        </h1>

        <button className="px-4 py-1.5 rounded-md bg-black text-white text-sm flex items-center gap-2 hover:bg-gray-900 transition">
          <Download size={14} />
          Download
        </button>
      </header>

      {/* ─── BODY LAYOUT ───────────────────────────────────── */}
      <div className="flex flex-1">

        {/* LEFT SIDE */}
        <main className="flex-1 p-10 overflow-y-auto">
          
          {/* Metadata (Simple + elegant) */}
          <div className="space-y-1 mb-10">
            <p className="text-sm text-gray-500">Type: <span className="text-gray-800">Training</span></p>
            <p className="text-sm text-gray-500">Uploaded: <span className="text-gray-800">Nov 24, 2025 · 7:51 PM</span></p>
          </div>

          {/* PDF Viewer Frame */}
          <div className="rounded-lg border border-gray-200 shadow-sm h-[82vh] flex items-center justify-center bg-gray-50">
            <p className="text-gray-400 text-sm">PDF Viewer Here</p>
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="w-[360px] border-l border-gray-200 flex flex-col">

          {/* Tabs */}
          <nav className="flex border-b border-gray-200 text-sm">
            {[
              { id: "summary", label: "Summary", icon: FileText },
              { id: "chat", label: "Chat", icon: MessageSquare },
              { id: "data", label: "Extracted", icon: Table }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id as any)}
                className={`flex-1 py-3 flex items-center justify-center gap-2 transition ${
                  tab === item.id
                    ? "text-black font-medium"
                    : "text-gray-500 hover:text-black"
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="p-6 text-sm leading-relaxed overflow-y-auto">
            {tab === "summary" && (
              <>
                <h2 className="font-semibold mb-3">Smart Overview</h2>
                <p className="text-gray-700">• File name: company_policy.pdf</p>
                <p className="text-gray-700">• Type: training</p>
                <p className="text-gray-700">• Uploaded: Nov 24, 2025</p>
              </>
            )}

            {tab === "chat" && <p className="text-gray-600">Chat UI Coming…</p>}

            {tab === "data" && <p className="text-gray-600">Extracted Data Here…</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
