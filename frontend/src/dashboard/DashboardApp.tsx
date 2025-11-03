import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Core product features
import ComplianceDashboard from "./compliance_dashboard";
import Employees from "./employees";
import LLM from "./LLM";
import RunAuditTab from "./RunAuditTab";
import UploadFetchTab from "./UploadFetchTab";
import AuditResultsTab from "./AuditResultsTab";
import NomiPulsePage from "./NomiPulsePage";
import CompetitorsPage from "./CompetitorsPage";

// New: Supplier Onboarding
import SupplierOnboarding from "./SupplierOnboarding";

// Optionally: auth/user-related screens
import SignIn from "./SignIn";
import SignUp from "./SignUp";

// SHARED: Example TopBar/DownBar can be added if you want consistent nav across dashboard

export default function DashboardApp() {
  return (
    <>
      {/* <TopBar /> REMOVE THIS LINE TO REMOVE HEADER */}
      <Routes>
        <Route path="" element={<ComplianceDashboard />} />
        <Route path="employees" element={<Employees />} />
        <Route path="llm" element={<LLM />} />
        <Route path="audit" element={<RunAuditTab />} />
        <Route path="upload" element={<UploadFetchTab />} />
        <Route path="results" element={<AuditResultsTab />} />
        <Route path="pulse" element={<NomiPulsePage />} />
        <Route path="competitors" element={<CompetitorsPage />} />
        <Route path="suppliers" element={<SupplierOnboarding />} />
        <Route path="signin" element={<SignIn />} />
        <Route path="signup" element={<SignUp />} />
        <Route path="*" element={<Navigate to="" />} />
      </Routes>
    </>
  );
}
