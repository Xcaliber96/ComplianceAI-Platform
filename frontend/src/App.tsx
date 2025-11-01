import { Box, Container, Tab, Tabs, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import GlobalFilters from "./components/GlobalFilters";
import UploadFetchTab from "./tabs/UploadFetchTab";
import RunAuditTab from "./tabs/RunAuditTab";
import AuditResultsTab from "./tabs/AuditResultsTab";
import CompetitorsPage from "./external/CompetitorsPage";
import LandingPage from "./landingpage";
import SignIn from "./forms/SignIn";
import SignUp from "./forms/SignUp";
import Employees from "./employees";
import AICompliance from "./LLM";
import ComplianceDashboard from "./compliance_dashboard";
import HeroSection from "./components/HeroSection";

export default function App() {
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // 👇 hide the top header on the landing page
  const hideHeader = location.pathname === "/";

  return (
    <Box>
      {/* Header */}
      {!hideHeader && (
        <Box
          sx={{
            p: 2,
            borderBottom: "1px solid #eee",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "white",
          }}
        >
          <Typography variant="h5" fontWeight={700}>
            NomiAI
          </Typography>
          <Typography
            onClick={() => navigate("/competitors")}
            sx={{
              cursor: "pointer",
              fontWeight: 500,
              fontSize: 16,
              color: "primary.main",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Competitors
          </Typography>

          <Box>
            <Typography
              onClick={() => navigate("/signin")}
              sx={{
                cursor: "pointer",
                fontWeight: 500,
                fontSize: 16,
                color: "primary.main",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Sign In
            </Typography>
          </Box>
        </Box>
      )}

      {/* Tabs and Routes */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/dashboard"
          element={
            <Container maxWidth="lg" sx={{ pt: 2 }}>
              <GlobalFilters />
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
                <Tab label="Upload & Fetch" />
                <Tab label="Run Audit" />
                <Tab label="Audit Results" />
              </Tabs>

              {tab === 0 && <UploadFetchTab setActiveTab={setTab} />}
              {tab === 1 && <RunAuditTab />}
              {tab === 2 && <AuditResultsTab />}
            </Container>
          }
        />
        <Route path="/competitors" element={<CompetitorsPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/LLM" element={<AICompliance />} /> 
        <Route path="/employees" element={<Employees />} />
        <Route path="/compliance_dashboard" element={<ComplianceDashboard />} />
        <Route path="/HeroSection" element={<HeroSection />} />

        
      </Routes>
    </Box>
  );
}
