import React, { useState } from "react";
import { Box, AppBar, Toolbar, Typography, IconButton } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

import Sidebar from "./styling/sidebar";

// Pages
import FrontPage from "./FrontPage";
import FileManager from "./FileManager";
import DocumentAudit from "./UploadFetchTab";
import RunAuditTab from "./RunAuditTab";
import SupplierOnboarding from "./SupplierOnboarding";
import LLM from "./LLM";
import AuditResultsTab from "./AuditResultsTab";
import CompliancePlanner from "./CompliancePlanner";
import CompetitorsPage from "./CompetitorsPage";
import NomiFileHub from "./NomiFileHub"
import FileList from "./File Manager/FileList"
import AddFile from "./File Manager/AddFile"
import FileViewer from "./File Manager/FileViewer"
export default function DashboardApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);
const [collapsed, setCollapsed] = useState(false);
  const hideLayout =
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
          width: collapsed ? "72px" : "240px",
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
        <Route path="audit" element={<RunAuditTab />} />
        <Route path="suppliers" element={<SupplierOnboarding />} />
        <Route path="llm" element={<LLM />} />
        <Route path="results" element={<AuditResultsTab />} />
        <Route path="CompliancePlanner" element={<CompliancePlanner />} />
        <Route path="AuditResultsTab" element={<AuditResultsTab />} />
        <Route path="FileManager" element={<FileManager />} />
        <Route path="competitors" element={<CompetitorsPage />} />
        <Route path="FileList" element={<FileList />} />
        <Route path="AddFile" element={<AddFile />} />
        <Route path="settings" element={<Typography>Settings coming soon</Typography>} />
        <Route path="file/:id" element={<FileViewer />} />
      </Routes>
    </Box>

  </Box>
);
}
