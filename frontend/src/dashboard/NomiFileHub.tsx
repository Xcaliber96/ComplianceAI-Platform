import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  IconButton,
  MenuItem,
  TextField,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";

import "./styling/NomiFileHub.css";

import {
  uploadToFileHub,
  getFileHubFiles,
  deleteFileHubFile,
} from "../api/client";

export default function NomiFileHub() {
  const [files, setFiles] = useState([]);
  const [fileType, setFileType] = useState("");
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  const user_uid = localStorage.getItem("user_uid");

  const fetchFiles = async () => {
    if (!user_uid) return;
    try {
      const fileList = await getFileHubFiles(user_uid);
      setFiles(fileList || []);
    } catch (err) {
      console.error("File fetch error:", err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleConfirmUpload = async () => {
    if (!previewFile || !fileType) {
      alert("Please choose file and file type.");
      return;
    }

    const usedFor = "general_upload";

    try {
      await uploadToFileHub(previewFile, user_uid!, fileType, usedFor,  "general");
      setPreviewFile(null);
      await fetchFiles();
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  return (
<Box className="nomi-filehub-page">
    <div className="nomi-info-banners">

  <div className="nomi-info-banner">
    <span className="nomi-info-text">
      1 invited teammate hasn’t set up their account yet
    </span>

    <div className="nomi-info-actions">
      <button className="nomi-info-button">Review invites</button>
      <span className="nomi-info-close">✕</span>
    </div>
  </div>

  <div className="nomi-info-banner">
    <span className="nomi-info-text">
      Explore the other features in your template
    </span>

    <a className="nomi-info-link" href="#">
      See what’s been set up
    </a>
  </div>

</div>
    <Box className="nomi-filehub-container">
      {/* TITLE */}
      <Typography className="nomi-filehub-title">
        Nomi File Hub
      </Typography>

      {/* UPLOAD AREA */}
      <Box className="nomi-upload-box">
        <Typography sx={{ fontWeight: 600, mb: 2 }}>
          Upload a File
        </Typography>

        <TextField
          select
          label="File Type"
          value={fileType}
          onChange={(e) => setFileType(e.target.value)}
          sx={{ minWidth: 250, mb: 2 }}
        >
          <MenuItem value="regulation">Regulation</MenuItem>
          <MenuItem value="policy">Policy</MenuItem>
          <MenuItem value="evidence">Evidence</MenuItem>
          <MenuItem value="other">Other</MenuItem>
        </TextField>

        {/* HIDDEN FILE INPUT */}
        <input
          id="filehub-upload"
          type="file"
          style={{ display: "none" }}
          onChange={(e) => setPreviewFile(e.target.files?.[0] || null)}
        />

        <Button
          className="nomi-upload-btn"
          onClick={() => document.getElementById("filehub-upload")?.click()}
        >
          Choose File
        </Button>
      </Box>

      {/* PREVIEW CARD */}
      {previewFile && (
        <Box className="nomi-preview-card">
          <Typography className="nomi-preview-title">
            Selected file: {previewFile.name}
          </Typography>

          <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              color="success"
              sx={{ textTransform: "none", borderRadius: 2 }}
              onClick={handleConfirmUpload}
            >
              Upload
            </Button>

            <Button
              variant="outlined"
              color="error"
              sx={{ textTransform: "none", borderRadius: 2 }}
              onClick={() => setPreviewFile(null)}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      )}

      {/* FILE LIST */}
      <Typography className="nomi-filehub-section-title">
        Your Files
      </Typography>

      {files.length === 0 && (
        <Typography sx={{ opacity: 0.6 }}>No files uploaded yet.</Typography>
      )}

      {files.map((file: any) => (
        <Box key={file.id} className="nomi-file-row">
          <Box>
            <Typography className="nomi-file-name">
              {file.original_name}
            </Typography>
            <Typography className="nomi-file-meta">
              {file.file_type} •{" "}
              {new Date(file.uploaded_at).toLocaleString()}
            </Typography>
          </Box>

          <Box className="nomi-file-actions">
            <IconButton
              className="nomi-icon-btn"
              onClick={() =>
                (window.location.href = `/api/filehub/${file.id}/download?user_uid=${user_uid}`)
              }
            >
              <DownloadIcon />
            </IconButton>

            <IconButton
              className="nomi-icon-btn"
              onClick={async () => {
                await deleteFileHubFile(file.id, user_uid!);
                fetchFiles();
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
        
      ))}
      </Box>
    </Box>

  );
}
