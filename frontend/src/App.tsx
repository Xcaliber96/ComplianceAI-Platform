import { Box, Container, Tab, Tabs, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import GlobalFilters from "./components/GlobalFilters";
import UploadFetchTab from "./tabs/UploadFetchTab";
import RunAuditTab from "./tabs/RunAuditTab";
import AuditResultsTab from "./tabs/AuditResultsTab";
import CompetitorsPage from "./external/CompetitorsPage"

import SignIn from "./forms/SignIn";
import SignUp from "./forms/SignUp";

export default function App() {
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();


  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid #eee",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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

      {/* Tabs and Routes */}
      <Routes>
        <Route
          path="/"
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
      </Routes>
    </Box>
  );
}
