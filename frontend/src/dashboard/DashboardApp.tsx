import React, { useState } from "react";
import { Box, AppBar, Toolbar, Typography, IconButton } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import RegulationProfileFormStatic from "./Regulations/RegulationProfileFormStatic";
import Sidebar from "./styling/sidebar";
import Filelist from "./File Manager/FileList"
// Pages
import RegulationsLibraryPage from "./Regulations/ManageRegulations";
import FrontPage from "./FrontPage";
import DocumentAudit from "./UploadFetchTab";
// import RunAuditTab from "./Audit/RunAuditTab";
import SupplierOnboarding from "./SupplierOnboarding";
import LLM from "./LLM";
import AuditResultsTab from "./AuditResultsTab";
import CompliancePlanner from "./CompliancePlanner";
import CompetitorsPage from "./CompetitorsPage";
import DashboardPage from "./Extraction/Extraction";
import AuditRunner from "./Audit/RunAudit";
import AddFile from "./File Manager/AddFile"
import FileViewer from "./File Manager/FileViewer";
import Onboarding from "./Onboarding/Onboarding";

import RegulationsPage from "./Audit/RegulationsManger"
import ShowList from "./File Manager/ShowList"
import FileExtractPage from "./Extraction/FileExtractPage"
export default function DashboardApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);
const [collapsed, setCollapsed] = useState(false);

const hideLayout =
  location.pathname.toLowerCase().startsWith("/dashboard/onboarding") ||
  location.pathname === "/dashboard" ||
  location.pathname === "/dashboard/";

const handleCollapseChange = (value: boolean) => {
  setCollapsed(value);
};
 return (
  <Box className="nomi-dashboard" sx={{ display: "flex" }}>
    
    {/* SIDEBAR */}
    {!hideLayout && (
      <Box
        className="nomi-sidebar"
        sx={{

          transition: "width 0.25s ease",
        }}
      >
        <Sidebar onCollapseChange={handleCollapseChange} />
      </Box>
    )}

    {/* MAIN CONTENT */}
    <Box
      component="main"
      className="nomi-content"
      sx={{
        flexGrow: 1,
        transition: "margin-left 0.25s ease",
        marginLeft: hideLayout ? 0 : collapsed ? "72px" : "240px",
        padding: "2rem",
      }}
    >
      <Routes>
        <Route path="/" element={<FrontPage />} />
        <Route path="upload" element={<DocumentAudit />} />
        {/* <Route path="auditfiles" element={<RunAuditTab />} /> */}
        <Route path="suppliers" element={<SupplierOnboarding />} />
        <Route path="llm" element={<LLM />} />
        <Route path="results" element={<AuditResultsTab />} />
        <Route path="CompliancePlanner" element={<CompliancePlanner />} />
        <Route path="AuditResultsTab" element={<AuditResultsTab />} />
        <Route path="competitors" element={<CompetitorsPage />} />
        <Route path="AddFile" element={<AddFile />} />
        <Route path="Filelist" element={<Filelist />} />
        <Route path="settings" element={<Typography>Settings coming soon</Typography>} />
        <Route path="file/:id" element={<FileViewer />} />
        <Route path="FileCard" element={<Typography>FileCard</Typography>} />
<Route 
  path="RegulationProfileFormStatic" 
  element={<RegulationProfileFormStatic />} 
/>
  {/* <Route path="regulations" element={<Typography>RegulationsPage</Typography>} /> */}


         <Route path="Onboarding" element={<Onboarding />} />
      
        <Route path="extract/:id" element={<FileExtractPage />} />
         <Route path="ShowList" element={<ShowList />} />
  <Route path="DashboardPage" element={<DashboardPage />} />
  
    <Route path="regulations" element={<RegulationsLibraryPage />} />

<Route path="audit/:id" element={<AuditRunner />} />
      </Routes>
    </Box>

  </Box>
);
}
