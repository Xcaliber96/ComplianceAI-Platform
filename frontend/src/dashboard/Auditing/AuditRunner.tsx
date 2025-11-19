import React, { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, Button, Card } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { BASE_URL } from "../../api/client";

export default function AuditRunner() {
  const { id } = useParams();
  const user_uid = localStorage.getItem("user_uid");
  const navigate = useNavigate();

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // CALL BACKEND
  async function runAudit(fileId: string, uid: string) {
    const res = await fetch(
      `${BASE_URL}/api/audit/run/${fileId}?user_uid=${uid}`
    );

    if (!res.ok) throw new Error("Audit failed on server");
    return res.json();
  }

  useEffect(() => {
    if (!id || !user_uid) return;

    runAudit(id, user_uid)
      .then((data) => {
        setResults(data.results || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id, user_uid]);

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Running audit…</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Button onClick={() => navigate("/dashboard/FileList")}>← Back</Button>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Audit Results for File #{id}
      </Typography>

      {results.map((r, i) => (
        <Card key={i} sx={{ p: 2, mb: 2, borderLeft: r.Is_Compliant ? "5px solid green" : "5px solid red" }}>
          <Typography variant="h6">
            {r.Reg_ID} — {r.Is_Compliant ? "Compliant" : "Gap Detected"}
          </Typography>

          <Typography>Score: {r.Compliance_Score.toFixed(2)}%</Typography>
          <Typography>Risk Rating: {r.Risk_Rating}</Typography>

          {!r.Is_Compliant && (
            <>
              <Typography sx={{ mt: 1 }}><b>Narrative Gap:</b> {r.Narrative_Gap}</Typography>
              <Typography sx={{ mt: 1, opacity: 0.7 }}>
                <b>Evidence:</b> {r.Evidence_Chunk.slice(0, 200)}…
              </Typography>

              {/* Optional: Link to remediation */}
              <Button
                variant="outlined"
                sx={{ mt: 1 }}
                onClick={() => navigate("/dashboard/CompliancePlanner")}
              >
                Create Remediation Task
              </Button>
            </>
          )}
        </Card>
      ))}
    </Box>
  );
}
