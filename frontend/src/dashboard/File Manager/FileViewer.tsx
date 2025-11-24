import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { getFileHubFiles } from "../../api/client";

export default function FileViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user_uid = localStorage.getItem("user_uid");
console.log("Extracting for user:", user_uid);
  const [file, setFile] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user_uid) return;
      const list = await getFileHubFiles(user_uid);

      const found = list.find((f: any) => f.id === id);
      setFile(found || null);
    }
    fetchData();
  }, [id, user_uid]);

  // 🔥 IMPORTANT FIX: Don't go further when file is null
  if (!file) {
    return <Typography sx={{ mt: 5, textAlign: "center" }}>Loading...</Typography>;
  }

  const BASE =
    import.meta.env.VITE_API_BASE_URL ||
    (window.location.hostname.includes("localhost")
      ? "http://localhost:8000"
      : "https://api.nomioc.com");

  const fileUrl = `${BASE}/api/filehub/${file.id}/direct?user_uid=${user_uid}`;

  const isPDF = file.original_name.toLowerCase().endsWith(".pdf");
  const isImage = /\.(png|jpg|jpeg|gif)$/i.test(file.original_name);


  return (
    <Box sx={{ padding: "2rem" }}>
      {/* HEADER BAR */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "white",
          padding: "1rem 2rem",
          borderRadius: 3,
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          mb: 3,
        }}
      >
        <Button onClick={() => navigate("/dashboard/FileList")}>← Back</Button>
        <Typography variant="h6">{file.original_name}</Typography>

        <Button variant="contained" onClick={() => (window.location.href = fileUrl)}>
          Download
        </Button>
      </Box>
<Button variant="contained" onClick={() => (window.location.href = fileUrl)}>
  Download
</Button>

<Button
  variant="outlined"
  sx={{ ml: 2 }}
  onClick={() => navigate(`/dashboard/extract/${file.id}`)}
>
  Extract Data
</Button>
      {/* FILE METADATA */}
      <Typography sx={{ mb: 1 }}>Type: {file.file_type}</Typography>
      <Typography sx={{ mb: 3 }}>
        Uploaded: {new Date(file.uploaded_at).toLocaleString()}
      </Typography>

      {/* FILE PREVIEW */}
      <Box
        sx={{
          width: "100%",
          height: "80vh",
          borderRadius: 3,
          overflow: "hidden",
          border: "2px dashed #ccc",
        }}
      >
        {isPDF && (
          <iframe
            src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            style={{ width: "100%", height: "100%", border: "none" }}
            title="PDF Preview"
          />
        )}

        {isImage && (
          <img
            src={fileUrl}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
            alt="preview"
          />
        )}

        {!isPDF && !isImage && (
          <Typography sx={{ textAlign: "center", mt: 10, color: "#666" }}>
            Preview not available for this file type.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
