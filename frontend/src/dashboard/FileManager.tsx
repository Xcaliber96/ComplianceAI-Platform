import {
  Box, Button, Card, CardContent, Divider, Stack,
  TextField, Typography, List, ListItem, ListItemText, Alert
} from "@mui/material";
import { useState } from "react";
import { fetchFiles, downloadDriveFile, uploadForInternalAudit } from "../api/client";
import { useFilters } from "../store/filters";

export default function FileManager() {
  const [source, setSource] = useState("Google");
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const filters = useFilters();

  const handleFetch = async () => {
    const res = await fetchFiles(source);
    setDriveFiles(res?.files ?? []);
  };

  const handleDownload = async (id: string) => {
    const res = await downloadDriveFile(id);
    setMessage(`Downloaded: ${res?.path ?? "unknown path"}`);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const res = await uploadForInternalAudit(selectedFile);
      setMessage(`Audit started: ${res?.status ?? "ok"} (items: ${res?.total_requirements ?? 0})`);
    } catch {
      setMessage("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
<Box
  sx={{
    backgroundColor: "#FFFFFF",
    minHeight: "100vh",
    px: { xs: 2, md: 6 },
    py: { xs: 4, md: 6 },
  }}
>
  <Typography
    variant="h5"
    fontWeight={700}
    sx={{ mb: 3, color: "#1B1211", textAlign: "center" }}
  >
    File Management & Internal Audit
  </Typography>

  <Typography
    variant="body2"
    color="text.secondary"
    sx={{ mb: 5, textAlign: "center", maxWidth: 600, mx: "auto" }}
  >
    Fetch compliance documents from your connected drives or upload new
    evidence to initiate internal audits.
  </Typography>

  <Stack spacing={4} alignItems="center">
    {/* ☁️ Fetch Files */}
    <Card
      variant="outlined"
      sx={{
        width: "100%",
        maxWidth: 800,
        borderRadius: 3,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        p: 2,
      }}
    >
      <CardContent>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
          ☁️ Fetch Files from Cloud
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Current Filters — Dept: All, Country: All
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Source"
            size="small"
            value="Google"
            sx={{ width: 200 }}
          />
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#7F2458",
              "&:hover": { backgroundColor: "#641a46" },
            }}
          >
            Fetch Files
          </Button>
        </Stack>
      </CardContent>
    </Card>

    {/* 📄 Upload Evidence */}
    <Card
      variant="outlined"
      sx={{
        width: "100%",
        maxWidth: 800,
        borderRadius: 3,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        p: 2,
      }}
    >
      <CardContent>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          📑 Upload Evidence & Run Audit
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            component="label"
            variant="contained"
            sx={{
              backgroundColor: "#7F2458",
              "&:hover": { backgroundColor: "#641a46" },
            }}
          >
            Choose PDF
            <input type="file" hidden accept="application/pdf" />
          </Button>

          <Typography variant="body2">No file selected</Typography>

          <Button variant="outlined" disabled>
            Upload & Start Audit
          </Button>
        </Stack>
      </CardContent>
    </Card>
  </Stack>
</Box>

  );
}
