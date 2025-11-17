import React, { useEffect, useState } from "react";
import { Box, Typography, IconButton, Button, TextField, MenuItem } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";

import { getFileHubFiles, deleteFileHubFile } from "../../api/client";
import "./FileList.css";

export default function FileList() {
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [files, setFiles] = useState([]);
  const [filter, setFilter] = useState("all");
  const user_uid = localStorage.getItem("user_uid");
const [openUploadModal, setOpenUploadModal] = useState(false);
const navigate = useNavigate();
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

  // FILTERED FILES
  const filteredFiles =
    filter === "all"
      ? files
      : files.filter((f: any) => f.file_type === filter);

const handleUploadClick = () => {
  
  setOpenUploadModal(true);
  navigate("/dashboard/AddFile");
};

  return (
   <Box className="nomi-filelist-wrapper">
      <Typography className="nomi-filehub-title">Your Files</Typography>
{files.length === 0 && (
  <Box className="nomi-empty-wrapper">
    <Box className="nomi-empty-card">
      <img
        src="https://cdn-icons-png.flaticon.com/512/748/748113.png"
        width="90"
        style={{ opacity: 0.4 }}
      />

      <Typography className="nomi-empty-title">
        You currently have no uploaded files right here start uploading
      </Typography>

      <Typography className="nomi-empty-sub">
        Upload policies, regulations, evidence, or other materials to begin.
      </Typography>

      <Button
        variant="contained"
        className="nomi-upload-btn"
        sx={{ mt: 2, px: 4, py: 1.2, borderRadius: 2 }}
        onClick={handleUploadClick}
      >
        Start Uploading
      </Button>
    </Box>
  </Box>
)}

      {files.length > 0 && (
        <>
          {/* FILTER AREA */}
          <Box className="nomi-filter-bar">
            <TextField
              select
              label="Filter by Type"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="policy">Policy</MenuItem>
              <MenuItem value="regulation">Regulation</MenuItem>
              <MenuItem value="evidence">Evidence</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>

            <Button
              variant="contained"
              className="nomi-upload-btn"
              onClick={handleUploadClick}
            >
              Add File
            </Button>
          </Box>

          {/* FILE LIST */}
          {filteredFiles.map((file: any) => (
          <Box
  key={file.id}
  className="nomi-file-row"
  onClick={() => navigate(`/dashboard/file/${file.id}`)}
>
              <Box>
                <Typography className="nomi-file-name">
                  {file.original_name}
                </Typography>

                <Typography className="nomi-file-meta">
                  {file.file_type} • {new Date(file.uploaded_at).toLocaleString()}
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
        </>
      )}
    </Box>
  );
}
