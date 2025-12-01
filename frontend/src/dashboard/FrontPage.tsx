import React from "react";
import { useNavigate } from "react-router-dom";
import {
  CloudUpload,
  Assessment,
  Assignment,
  Group,
  BarChart,
  Shield,
  CompareArrows,
} from "@mui/icons-material";

export default function FrontPage() {
  const navigate = useNavigate();

  const features = [
    {
      title: "Upload & Retrieve Files",
      desc: "Import policies and compliance documents instantly.",
      icon: <CloudUpload className="text-emerald-700" style={{ fontSize: 34 }} />,
      path: "/dashboard/upload",
      action: "Open Tools",
    },
    {
      title: "Run AI Audit",
      desc: "AI finds gaps, obligations, and compliance risks.",
      icon: <Assessment className="text-emerald-700" style={{ fontSize: 34 }} />,
      path: "/dashboard/audit",
      action: "Start Audit",
    },
    {
      title: "Manage Tasks",
      desc: "Track obligations, assign owners, and resolve gaps.",
      icon: <Assignment className="text-emerald-700" style={{ fontSize: 34 }} />,
      path: "/dashboard/tasks",
      action: "View Tasks",
    },
    {
      title: "Manage Suppliers",
      desc: "Onboard, score, and monitor vendors continuously.",
      icon: <Group className="text-emerald-700" style={{ fontSize: 34 }} />,
      path: "/dashboard/suppliers",
      action: "Manage Suppliers",
    },
    {
      title: "Analyze Competitors",
      desc: "Review filings and generate AI-powered insights.",
      icon: <CompareArrows className="text-emerald-700" style={{ fontSize: 34 }} />,
      path: "/dashboard/competitors",
      action: "Analyze",
    },
    {
      title: "View Reports",
      desc: "Access analytics, metrics, and compliance summaries.",
      icon: <BarChart className="text-emerald-700" style={{ fontSize: 34 }} />,
      path: "/dashboard/results",
      action: "Open Reports",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FB] px-6 md:px-14 py-12 animate-fadeIn">
      {/* HEADER */}
      <header className="text-center mb-14">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          NomiAI Compliance Dashboard
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto mt-3 text-[15px]">
          AI-powered compliance automation for fast, audit-ready organizations.
        </p>
      </header>

      {/* FEATURE GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 max-w-7xl mx-auto">
        {features.map((f, i) => (
          <div
            key={i}
            onClick={() => navigate(f.path)}
            className="
              rounded-3xl 
              bg-white/70 
              backdrop-blur-sm
              border border-slate-50 
              shadow-[0_1px_4px_rgba(0,0,0,0.02)]
              p-6 cursor-pointer 
              transition-all duration-300
              hover:-translate-y-1 
              hover:shadow-[0_4px_14px_rgba(0,0,0,0.04)]
            "
          >
            <div className="flex flex-col items-center text-center space-y-4">
              {/* ICON BUBBLE */}
              <div className="w-14 h-14 rounded-2xl bg-emerald-50/80 flex items-center justify-center shadow-sm">
                {f.icon}
              </div>

              <h3 className="text-lg font-semibold text-slate-900">
                {f.title}
              </h3>

              <p className="text-sm text-slate-500 leading-relaxed min-h-[55px]">
                {f.desc}
              </p>

              <button
                className="
                  mt-2 px-4 py-2 rounded-lg 
                  bg-emerald-600 text-white 
                  text-sm font-medium 
                  transition 
                  hover:bg-emerald-700
                "
              >
                {f.action}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <footer className="text-center mt-16 text-slate-600 text-sm flex items-center justify-center gap-1">
        <Shield className="text-emerald-600" style={{ fontSize: 18 }} />
        Built for trust. Powered by NomiAI.
      </footer>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      `}</style>
    </div>
  );
}
