import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Grid,
  TextField,
  Card,
  Paper,
} from "@mui/material";

export default function FileExtractPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user_uid = localStorage.getItem("user_uid");

  const BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    (window.location.hostname.includes("localhost")
      ? "http://localhost:8000"
      : "https://api.nomioc.com");

  const [loading, setLoading] = useState(true);
  const [extraction, setExtraction] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function extractData() {
      try {
        setLoading(true);
        const res = await fetch(
          `${BASE_URL}/api/filehub/${id}/extract?user_uid=${user_uid}`
        );
        const data = await res.json();

        if (data.status !== "success") {
          setError("Extraction failed");
          setLoading(false);
          return;
        }

        setExtraction(data.extraction);
        setLoading(false);
      } catch (err) {
        setError("Server error");
        setLoading(false);
      }
    }

    extractData();
  }, [id, user_uid]);

  const handleConfirm = () => {
   navigate(`/dashboard/audit/${id}`);
  };

  if (loading) {
    return (
      <Box sx={{ mt: 20, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Analyzing document…</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 20, textAlign: "center" }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const SECTION_TITLES = {
    metadata: "Mandatory Metadata",
    clauses: "Compliance Clauses",
    risks: "Risks & Obligations",
    deadlines: "Enforcement Deadlines",
  };

  return (
    <Box sx={{ p: 4, background: "#f8fafc", minHeight: "100vh" }}>
      {/* HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
        <Typography variant="h4" fontWeight="700">
          Review Extracted Metadata
        </Typography>
        <Button onClick={() => navigate(-1)}>← Back</Button>
      </Box>

      {/* GROUPED SECTIONS */}
{Object.entries(extraction)
  .filter(([key, value]) => {
    if (value === null) return false;
    if (value === "null") return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === "object" && Object.keys(value).length === 0) return false;
    return true;
  })
  .map(([key, value]) => (
        <Card
          key={key}
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 3,
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            background: "white",
          }}
        >
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
            {SECTION_TITLES[key] || key.toUpperCase()}
          </Typography>

          <Grid container spacing={3}>
            {Object.entries(value).map(([fieldKey, value]) => (
              <Grid item xs={12} md={6} key={fieldKey}>
                <Typography
                  sx={{ mb: 1, color: "#475569", fontSize: 14, fontWeight: 500 }}
                >
                  {fieldKey.replace(/_/g, " ").toUpperCase()}
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  minRows={1}
                  maxRows={6}
                  defaultValue={
                    typeof value === "string"
                      ? value
                      : JSON.stringify(value, null, 2)
                  }
                  sx={{
                    background: "white",
                    "& fieldset": { borderColor: "#e2e8f0" },
                    "&:hover fieldset": { borderColor: "#cbd5e1" },
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Card>
      ))}

      {/* RAW JSON */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Raw JSON (Preview)
        </Typography>
        <Paper
          sx={{
            p: 3,
            whiteSpace: "pre-wrap",
            background: "#f1f5f9",
            borderRadius: 2,
            border: "1px solid #e2e8f0",
            maxHeight: "300px",
            overflowY: "auto",
            fontSize: 13,
          }}
        >
          {JSON.stringify(extraction, null, 2)}
        </Paper>
      </Box>

      {/* CONFIRM CTA */}
      <Box sx={{ textAlign: "right", mt: 4 }}>
        <Button
          variant="contained"
          size="large"
          sx={{
            borderRadius: 2,
            px: 4,
            py: 1.5,
            background: "#2563eb",
            ":hover": { background: "#1e40af" },
          }}
          onClick={handleConfirm}
        >
          Confirm & Run Audit
        </Button>
      </Box>
    </Box>
  );
}
