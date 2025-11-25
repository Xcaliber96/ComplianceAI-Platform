import React, { useEffect, useState } from "react";
import { Box, Typography, IconButton, Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import { BASE_URL, getBasicUserInfo } from "../../api/client";
import { getDirectFileUrl } from "../../api/client";

import HubspotFilterBar from "./HubspotFilterBar";
import { getFileHubFiles, deleteFileHubFile } from "../../api/client";
import "./FileList.css";

export default function FileList() {
  const [files, setFiles] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  const user_uid = localStorage.getItem("user_uid");
  const navigate = useNavigate();

  // FETCH FILES
  const fetchFiles = async () => {
  if (!user_uid) return;

  const fileList = await getFileHubFiles(user_uid);

  // Fetch uploader info for each file
  const filesWithUser = await Promise.all(
    fileList.map(async (f: any) => {
      const userInfo = await getBasicUserInfo(f.user_uid);
      return {
        ...f,
        uploader: userInfo.display_name || "Unknown"
      };
    })
  );

  setFiles(filesWithUser);
};

  useEffect(() => {
    fetchFiles();
  }, []);

  const filteredFiles = files
    .filter((f: any) =>
      filter === "all" ? true : f.file_type === filter
    )
    .filter((f: any) =>
      f.original_name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "newest")
        return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
      if (sort === "oldest")
        return new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime();
      if (sort === "az") return a.original_name.localeCompare(b.original_name);
      if (sort === "za") return b.original_name.localeCompare(a.original_name);
      return 0;
    });

  return (
    <Box
      className="nomi-filelist-wrapper"
      sx={{ display: "flex", flexDirection: "column", gap: 3 }}
    >
      <Typography className="nomi-filehub-title">Your Files</Typography>

      <HubspotFilterBar
        onSearch={(val: string) => setSearch(val)}
        onFilterType={(val: string) => setFilter(val)}
        onSort={(val: string) => setSort(val)}
        onOpenAdvancedFilters={() => console.log("Advanced filters opened")}
        onAddFile={() => navigate("/dashboard/AddFile")}
      />

      {/* EMPTY STATE */}
      {files.length === 0 && (
        <Box className="nomi-empty-wrapper">
          <Box className="nomi-empty-card">
            <img
              src="https://cdn-icons-png.flaticon.com/512/748/748113.png"
              width="90"
              style={{ opacity: 0.4 }}
            />

            <Typography className="nomi-empty-title">
              You currently have no uploaded files.
            </Typography>

            <Typography className="nomi-empty-sub">
              Upload policies, regulations, evidence, or other documents to begin.
            </Typography>

            <Button
              variant="contained"
              className="nomi-upload-btn"
              sx={{ mt: 2 }}
              onClick={() => navigate("/dashboard/AddFile")}
            >
              Start Uploading
            </Button>
          </Box>
        </Box>
      )}

  {/* TABLE VIEW */}
{files.length > 0 && (
  <table className="file-table">
<thead>
  <tr>
    <th>File Name</th>
    <th>Type</th>
    <th>Uploader</th>
    <th>Department</th>  {/* 👈 NEW */}
    <th>Uploaded</th>
    <th style={{ textAlign: "center" }}>Actions</th>
  </tr>
</thead>

    <tbody>
      {filteredFiles.map((file: any) => (
        <tr
          key={file.id}
          className="file-row"
          onClick={() => navigate(`/dashboard/file/${file.id}`)}
        >
          <td>{file.original_name}</td>
          <td>{file.file_type}</td>
          <td>{file.uploader}</td>
          <td>{file.department || "—"}</td>
          <td>{new Date(file.uploaded_at).toLocaleDateString()}</td>

          <td className="actions">
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/api/filehub/${file.id}/download?user_uid=${user_uid}`;
              }}
            >
              <DownloadIcon />
            </IconButton>

            <IconButton
              onClick={async (e) => {
                e.stopPropagation();
                await deleteFileHubFile(file.id, user_uid!);
                fetchFiles();
              }}
            >
              <DeleteIcon />
            </IconButton>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)}
   
    </Box>
  );
}
