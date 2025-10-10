🧠 NomiAI Frontend Documentation
📘 Overview

The frontend folder contains the React + TypeScript dashboard for NomiAI (formerly ComplianceAI).
This dashboard serves as the user interface for interacting with all compliance features, including secure document uploads, audit automation, and viewing compliance results.

✨ Key Features

Minimalist, modern UI: Built with Material UI (MUI) featuring a pastel, intuitive layout.

Three main tabs:

Upload & Fetch – Browse, fetch, and upload compliance evidence documents.

Run Audit – Launch standard and AI-powered (RAG) compliance assessments.

Audit Results – View and filter compliance results, verdicts, explanations, and charts.

Global Filters: Filter by department, country, and state across all workflow steps.

Feedback & Charting: Feedback dialog and dynamic compliance/risk charts.

⚙️ Prerequisites

Node.js: v16+ (recommended) → Download here

npm: Comes with Node.js

Backend: FastAPI backend running at http://localhost:8000
 for full functionality

🚀 Getting Started
1️⃣ Navigate to the frontend folder
cd frontend

2️⃣ Install all dependencies
npm install

3️⃣ Start the development server
npm run dev


By default, the dashboard runs at:
👉 http://localhost:5173

API requests are automatically proxied to the backend at:
👉 http://localhost:8000/api

🧩 Main Dependencies

React (TypeScript)

Material UI (MUI)

axios

zustand (state management)

zod (validation)

react-hook-form

react-country-state-city (dynamic country/state selector)

📁 Folder Structure
frontend/
  public/            # Static assets (favicon, etc.)
  src/
    api/             # API clients (axios helpers for backend endpoints)
    components/      # Shared UI (GlobalFilters, FeedbackDialog, Chips, etc.)
    store/           # Global app state (filters)
    tabs/            # Major UI screens (UploadFetchTab, RunAuditTab, AuditResultsTab)
    App.tsx          # Main app shell & tabs
    main.tsx         # Entry point (theme, providers, root render)
  package.json       # Dependency list
  vite.config.ts     # Vite config (dev server & /api proxy)

🛠️ Key Files & Customization

App.tsx – Main app layout, pastel branding, top bar, and tab logic.

main.tsx – Sets up global MUI theme and branding palette.

vite.config.ts – Proxies /api to the backend (prevents CORS issues).

api/client.ts – All backend communication via Axios.

🎨 Customizing the Look

Modify branding or accent colors in main.tsx (createTheme config).

Update header/branding text under:

<Typography variant="h4">NomiAI</Typography>


To add new tabs or workflows, create a file in src/tabs/ and import it in App.tsx.

🚢 Deployment

To build for production:

npm run build


Output is generated in frontend/dist.

Deploy dist/ to:

Vercel

Netlify

AWS S3 + CloudFront

or any static hosting platform.

Ensure your backend API is accessible from the deployed site (update CORS and API domain as needed).

💡 Development Tips

Run both backend (FastAPI) and frontend (npm run dev) locally for full use.

All API routes follow /api/* pattern (see backend docs).

For new filters, update:

components/GlobalFilters.tsx

🧰 Support
For bugs, issues, or feature requests:

Open a GitHub issue

For bugs, issues, or feature requests:

Open a GitHub issue
