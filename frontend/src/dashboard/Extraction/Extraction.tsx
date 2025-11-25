import React from "react";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 font-sans">
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-4xl font-bold mb-2">Document Intelligence Platform</h1>
        <p className="text-lg text-gray-600">
          Extract, clean, and review data from structured & unstructured files.
        </p>
      </header>

      {/* File Upload Section */}
      <section className="bg-white rounded-2xl shadow p-6 mb-10">
        <h2 className="text-2xl font-semibold mb-4">Upload Files</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 transition">
          <p className="text-gray-500">Drag & drop files here, or click to upload</p>
        </div>
      </section>

      {/* Data Sections */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Raw Data */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-xl font-semibold mb-3">Raw Extracted Data</h3>
          <div className="h-64 overflow-auto bg-gray-100 rounded-md p-4 text-sm text-gray-700">
            {/* Placeholder */}
            <p>Raw extraction preview will appear here...</p>
          </div>
        </div>

        {/* Processed Data */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-xl font-semibold mb-3">Cleaned / Processed Data</h3>
          <div className="h-64 overflow-auto bg-gray-100 rounded-md p-4 text-sm text-gray-700">
            {/* Placeholder */}
            <p>Processed & structured data will appear here...</p>
          </div>
        </div>

        {/* Editor Panel */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-xl font-semibold mb-3">Manual Review</h3>
          <div className="h-64 overflow-auto bg-gray-100 rounded-md p-4 text-sm text-gray-700">
            {/* Placeholder */}
            <p>User-editable fields will appear here...</p>
          </div>
        </div>
      </section>

      {/* Insights Section */}
      <section className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Insights & Metrics</h3>
        <ul className="text-gray-700 space-y-2">
          <li>Total Files Processed: <strong>23</strong></li>
          <li>Data Fields Extracted: <strong>128</strong></li>
          <li>Extraction Accuracy: <strong>92%</strong></li>
          <li>Missing Fields: <strong>4</strong></li>
        </ul>
        <div className="mt-6 h-40 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
          (Chart placeholder)
        </div>
      </section>
    </div>
  );
}
