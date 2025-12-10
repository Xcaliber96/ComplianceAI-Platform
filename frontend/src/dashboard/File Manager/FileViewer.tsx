import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  TextField,
  IconButton,
  Tabs,
  Tab,
  Chip,
  Stack,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import SummarizeIcon from "@mui/icons-material/Summarize";
import TableChartIcon from "@mui/icons-material/TableChart";
import SearchIcon from "@mui/icons-material/Search";
import { useParams, useNavigate } from "react-router-dom";
import { getFileHubFiles } from "../../api/client";

export default function FileViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user_uid = localStorage.getItem("user_uid");

  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [aiTab, setAiTab] = useState<number>(0);
  const [aiInput, setAiInput] = useState<string>("");
  const [aiMessages, setAiMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);

  useEffect(() => {
    async function fetchData() {
      try {
        if (!user_uid) {
          setLoading(false);
          return;
        }
        const list = await getFileHubFiles(user_uid);
        const found = list.find((f: any) => f.id === id);
        setFile(found || null);
      } catch (e) {
        console.error("Error loading file:", e);
        setFile(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, user_uid]);

  if (loading) {
    return (
      <Box
        sx={{
          height: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F5F7FB",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!file) {
    return (
      <Box sx={{ p: 4, textAlign: "center", background: "#F5F7FB" }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          File not found
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/dashboard/FileList")}
        >
          Go back to files
        </Button>
      </Box>
    );
  }

  const BASE =
    import.meta.env.VITE_API_BASE_URL ||
    (window.location.hostname.includes("localhost")
      ? "http://localhost:8000"
      : "https://api.nomioc.com");

  const fileUrl = `${BASE}/api/filehub/${file.id}/direct?user_uid=${user_uid}`;

  const isPDF = file.original_name.toLowerCase().endsWith(".pdf");
  const isImage = /\.(png|jpg|jpeg|gif)$/i.test(file.original_name);

  // AI handlers
  const handleAskAI = () => {
    if (!aiInput.trim()) return;

    const userMessage = { role: "user" as const, content: aiInput.trim() };

    setAiMessages((prev) => [...prev, userMessage]);

    const fakeAssistantMessage = {
      role: "assistant" as const,
      content:
        "This is a placeholder AI response. Hook this up to your backend to answer questions using the file content.",
    };

    setAiMessages((prev) => [...prev, fakeAssistantMessage]);
    setAiInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAskAI();
    }
  };

  const simpleSummary = [
    `File name: ${file.original_name}`,
    `Type: ${file.file_type || "Unknown"}`,
    `Uploaded on: ${new Date(file.uploaded_at).toLocaleString()}`,
  ];

  return (
    <Box
      sx={{
        p: 3,
        minHeight: "100vh",
        background: "#F5F7FB",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}
      <Card
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          mb: 3,
          borderRadius: "20px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          background: "white",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <IconButton
            onClick={() => navigate("/dashboard/FileList")}
            sx={{
              background: "#F1F5F9",
              "&:hover": { background: "#E2E8F0" },
              borderRadius: "12px",
            }}
          >
            <ArrowBackIcon />
          </IconButton>

          <Box>
            <Typography variant="body2" color="text.secondary">
              File Viewer
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {file.original_name}
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<TableChartIcon />}
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 600,
            }}
            onClick={() => navigate(`/dashboard/upload`)}
          >
             Start Auditing
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 600,
            }}
            onClick={() => (window.location.href = fileUrl)}
          >
            Download
          </Button>
        </Stack>
      </Card>

      {/* MAIN GRID */}
      <Box
        sx={{
          display: "flex",
          gap: 3,
          height: "calc(100vh - 180px)",
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        {/* LEFT SIDE */}
        <Box sx={{ flex: 2, overflow: "hidden" }}>
          {/* Document Details */}
          <Card
            sx={{
              mb: 2,
              borderRadius: "20px",
              p: 2,
              boxShadow: "0 3px 14px rgba(0,0,0,0.05)",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Document details
            </Typography>

            <Box sx={{ mt: 1.5 }}>
              <Typography>
                <strong>Type:</strong> {file.file_type || "Unknown"}
              </Typography>
              <Typography>
                <strong>Uploaded:</strong>{" "}
                {new Date(file.uploaded_at).toLocaleString()}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
              <Chip
                label={isPDF ? "PDF" : isImage ? "Image" : "Other"}
                size="small"
              />
              {file.file_size && (
                <Chip
                  label={`${(file.file_size / 1024 / 1024).toFixed(2)} MB`}
                  size="small"
                />
              )}
            </Stack>
          </Card>

          {/* File Preview */}
          <Card
            sx={{
              height: "100%",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
            }}
          >
            <Box
              sx={{
                width: "100%",
                height: "100%",
                background: "#F8FAFC",
              }}
            >
              {isPDF && (
                <iframe
                  src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                  }}
                />
              )}

              {isImage && (
                <img
                  src={fileUrl}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              )}

              {!isPDF && !isImage && (
                <Box
                  sx={{
                    p: 3,
                    display: "flex",
                    height: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                  }}
                >
                  <Box>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      No preview available
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      This file cannot be rendered in the browser.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={() => (window.location.href = fileUrl)}
                      sx={{ borderRadius: "12px" }}
                    >
                      Download file
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          </Card>
        </Box>

        {/* RIGHT SIDE — AI ASSISTANT */}
        <Box sx={{ flex: 1.2, minWidth: 340 }}>
          <Card
            sx={{
              height: "100%",
              borderRadius: "20px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
            }}
          >
            <CardContent sx={{ pb: 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <ChatBubbleOutlineIcon fontSize="small" />
                  <Typography sx={{ fontWeight: 600 }}>
                    AI Document Assistant
                  </Typography>
                </Box>
                <Chip label="Beta" size="small" color="primary" />
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Ask questions, summarize, and extract key insights.
              </Typography>
            </CardContent>

            {/* Tabs */}
            <Tabs
              value={aiTab}
              onChange={(_, v) => setAiTab(v)}
              variant="fullWidth"
              sx={{
                borderBottom: "1px solid #E2E8F0",
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                },
                "& .Mui-selected": {
                  color: "#0F172A",
                },
              }}
            >
              <Tab
                icon={<SummarizeIcon fontSize="small" />}
                iconPosition="start"
                label="Summary"
              />
              <Tab
                icon={<ChatBubbleOutlineIcon fontSize="small" />}
                iconPosition="start"
                label="Chat"
              />
              <Tab
                icon={<TableChartIcon fontSize="small" />}
                iconPosition="start"
                label="Data"
              />
            </Tabs>

            {/* Tab Bodies */}
            <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
              {aiTab === 0 && (
                <>
                  <Typography sx={{ fontWeight: 600 }}>Smart overview</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    This is a placeholder summary.
                  </Typography>
                  {simpleSummary.map((s, i) => (
                    <Typography key={i} sx={{ mb: 1 }}>
                      • {s}
                    </Typography>
                  ))}
                </>
              )}

              {aiTab === 1 && (
                <>
                  <Box
                    sx={{
                      flex: 1,
                      overflowY: "auto",
                      mb: 2,
                      borderRadius: "12px",
                      p: 2,
                      background: "#F1F5F9",
                      border: "1px solid #E2E8F0",
                      maxHeight: "45vh",
                    }}
                  >
                    {aiMessages.length === 0 && (
                      <Typography color="text.secondary">
                        Ask anything about this file.
                      </Typography>
                    )}

                    {aiMessages.map((m, i) => (
                      <Box
                        key={i}
                        sx={{
                          display: "flex",
                          justifyContent:
                            m.role === "user" ? "flex-end" : "flex-start",
                          mb: 1,
                        }}
                      >
                        <Box
                          sx={{
                            p: 1.2,
                            px: 1.8,
                            borderRadius: "12px",
                            maxWidth: "75%",
                            background:
                              m.role === "user" ? "#2563EB" : "white",
                            color: m.role === "user" ? "white" : "#0F172A",
                            boxShadow:
                              m.role === "assistant"
                                ? "0 2px 10px rgba(0,0,0,0.08)"
                                : "none",
                          }}
                        >
                          {m.content}
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  <TextField
                    fullWidth
                    multiline
                    placeholder="Ask something…"
                    minRows={2}
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    sx={{
                      background: "white",
                      borderRadius: "12px",
                    }}
                  />
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 1, borderRadius: "12px" }}
                    onClick={handleAskAI}
                  >
                    Ask
                  </Button>
                </>
              )}

              {aiTab === 2 && (
                <>
                  <Typography sx={{ fontWeight: 600 }}>Structured Data</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Key metadata from this file.
                  </Typography>

                  <Stack spacing={1}>
                    <Box>
                      <Typography variant="caption">File name</Typography>
                      <Typography>{file.original_name}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption">Type</Typography>
                      <Typography>{file.file_type || "Unknown"}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption">Uploaded</Typography>
                      <Typography>
                        {new Date(file.uploaded_at).toLocaleString()}
                      </Typography>
                    </Box>
                    {file.file_size && (
                      <Box>
                        <Typography variant="caption">Size</Typography>
                        <Typography>
                          {(file.file_size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </>
              )}
            </Box>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
