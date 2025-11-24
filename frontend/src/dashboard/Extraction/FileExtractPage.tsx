import React, { useEffect, useState } from "react";
import { Box, Typography, Button, CircularProgress, Grid, Paper } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";

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
  const [extraction, setExtraction] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function extractData() {
      try {
        setLoading(true);

const res = await fetch(
  `${BASE_URL}/api/filehub/${id}/extract?user_uid=${user_uid}`
);
localStorage.getItem("user_uid")

        const data = await res.json();
        if (data.status !== "success") {
          setError("Extraction failed");
          setLoading(false);
          return;
        }

        setExtraction(data.extraction);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Server error");
        setLoading(false);
      }
    }

    extractData();
  }, [id, user_uid]);

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

  const handleConfirm = () => {
    navigate(`/dashboard/audit/${id}`, {
      state: { extraction },
    });
  };

  return (
    <Box sx={{ padding: "2rem" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5">Extracted Metadata</Typography>
        <Button onClick={() => navigate(-1)}>← Back</Button>
      </Box>

      <Grid container spacing={3}>
        {Object.entries(extraction).map(([key, value]) => (
          <Grid item xs={12} md={6} key={key}>
            <Paper sx={{ padding: "1rem" }} elevation={2}>
              <Typography variant="subtitle2" sx={{ mb: 1, textTransform: "capitalize" }}>
                {key.replace(/_/g, " ")}
              </Typography>

              <Typography sx={{ whiteSpace: "pre-wrap", color: "#444" }}>
                {typeof value === "string"
                  ? value
                  : JSON.stringify(value, null, 2)}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ textAlign: "right", mt: 4 }}>
        <Button variant="contained" color="primary" size="large" onClick={handleConfirm}>
          Confirm & Run Audit
        </Button>
      </Box>
    </Box>
  );
}
