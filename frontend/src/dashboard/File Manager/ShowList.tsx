import React from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
} from "@mui/material";
import { Folder, InsertDriveFile, Download } from "@mui/icons-material";

const staticFiles = [
  { name: "Welcome Guide.pdf", size: "1.2 MB", type: "file" },
  { name: "Company Policies.docx", size: "900 KB", type: "file" },
  { name: "Training Videos", type: "folder" },
];

export default function ShowList({ files = [] }) {
  const allFiles = [...staticFiles, ...files];

  return (
    <Box className="min-h-screen bg-slate-100 p-8">
      <Typography variant="h4" fontWeight={700} sx={{ mb: 1, color: "#0f172a" }}>
        File Manager
      </Typography>

      <Typography variant="body1" sx={{ mb: 4, color: "#475569" }}>
        Browse, manage, and download your stored documents.
      </Typography>

      <Grid container spacing={3}>
        {allFiles.map((file, i) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
            <Card
              className="rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200"
            >
              <Box
                className={`p-6 flex items-center justify-center ${
                  file.type === "folder" ? "bg-sky-100" : "bg-slate-200"
                }`}
              >
                {file.type === "folder" ? (
                  <Folder sx={{ fontSize: 48, color: "#0369a1" }} />
                ) : (
                  <InsertDriveFile sx={{ fontSize: 48, color: "#334155" }} />
                )}
              </Box>

              <CardContent>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  className="truncate text-slate-900"
                >
                  {file.name}
                </Typography>

                {file.size && (
                  <Typography variant="body2" className="text-slate-600 mt-1">
                    {file.size}
                  </Typography>
                )}

                <div className="mt-4">
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Download />}
                    sx={{
                      py: 1,
                      backgroundColor: "#0f172a",
                      borderRadius: "12px",
                      fontWeight: 600,
                      textTransform: "none",
                      "&:hover": { backgroundColor: "#020617" },
                    }}
                  >
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}