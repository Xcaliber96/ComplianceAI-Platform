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
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!file) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
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

  // --- AI handlers (stubbed, ready for backend integration) ---
  const handleAskAI = () => {
    if (!aiInput.trim()) return;

    const userMessage = { role: "user" as const, content: aiInput.trim() };

    // Optimistically update UI
    setAiMessages((prev) => [...prev, userMessage]);

    // TODO: Replace this with a real API call to your AI backend.
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

  // Basic “auto-summary” placeholder (for UI)
  const simpleSummary = [
    `File name: ${file.original_name}`,
    `Type: ${file.file_type || "Unknown"}`,
    `Uploaded on: ${new Date(file.uploaded_at).toLocaleString()}`,
  ];

  return (
    <Box sx={{ p: 3, height: "100%", boxSizing: "border-box" }}>
      {/* HEADER BAR */}
      <Card
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          mb: 3,
          borderRadius: 3,
          boxShadow: "0 6px 24px rgba(15,23,42,0.08)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton onClick={() => navigate("/dashboard/FileList")}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              File Viewer
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {file.original_name}
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<TableChartIcon />}
            onClick={() => navigate(`/dashboard/extract/${file.id}`)}
          >
            Extract Data
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => (window.location.href = fileUrl)}
          >
            Download
          </Button>
        </Stack>
      </Card>

      {/* MAIN LAYOUT: viewer + AI side panel */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          height: "calc(100vh - 160px)",
          minHeight: 400,
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        {/* LEFT: FILE VIEWER + METADATA */}
        <Box sx={{ flex: { xs: "0 0 auto", md: 2 }, minHeight: 300 }}>
          {/* Metadata / quick info */}
          <Card sx={{ mb: 2, borderRadius: 3 }}>
            <CardContent
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                flexDirection: { xs: "column", sm: "row" },
                gap: 1.5,
              }}
            >
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Document details
                </Typography>
                <Typography sx={{ mt: 0.5 }}>
                  <strong>Type:</strong> {file.file_type || "Unknown"}
                </Typography>
                <Typography>
                  <strong>Uploaded:</strong>{" "}
                  {new Date(file.uploaded_at).toLocaleString()}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  size="small"
                  label={isPDF ? "PDF" : isImage ? "Image" : "Other"}
                />
                {file.file_size && (
                  <Chip
                    size="small"
                    label={`${(file.file_size / 1024 / 1024).toFixed(2)} MB`}
                  />
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* File preview */}
          <Card sx={{ height: "100%", borderRadius: 3 }}>
            <Box
              sx={{
                width: "100%",
                height: { xs: "60vh", md: "100%" },
                borderRadius: 3,
                overflow: "hidden",
                backgroundColor: "#fafafa",
                border: "1px solid rgba(148,163,184,0.4)",
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
                <Box
                  sx={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    px: 4,
                  }}
                >
                  <Box>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      No live preview available
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      This file type cannot be rendered in the browser, but you
                      can still download it or use AI tools on it.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={() => (window.location.href = fileUrl)}
                    >
                      Download file
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          </Card>
        </Box>

        {/* RIGHT: AI PANEL */}
        <Box
          sx={{
            flex: { xs: "0 0 auto", md: 1.2 },
            minWidth: { md: 340 },
            minHeight: 280,
          }}
        >
          <Card sx={{ height: "100%", borderRadius: 3, display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ pb: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ChatBubbleOutlineIcon fontSize="small" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    AI Document Assistant
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  color="primary"
                  label="Beta"
                  sx={{ fontSize: "0.7rem" }}
                />
              </Box>

              <Typography variant="body2" color="text.secondary">
                Ask questions, get summaries, and extract key data from this file.
              </Typography>
            </CardContent>

            <Tabs
              value={aiTab}
              onChange={(_, v) => setAiTab(v)}
              variant="fullWidth"
              sx={{ borderBottom: "1px solid rgba(148,163,184,0.4)" }}
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

            {/* Tab content */}
            <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {/* SUMMARY TAB */}
              {aiTab === 0 && (
                <Box sx={{ p: 2, overflowY: "auto" }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Smart overview
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    This is a simple placeholder summary. You can replace it with a real
                    AI-generated summary from your backend.
                  </Typography>
                  <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
                    {simpleSummary.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: "0.4rem" }}>
                        <Typography variant="body2">{item}</Typography>
                      </li>
                    ))}
                  </ul>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Quick AI actions
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip
                      icon={<SummarizeIcon fontSize="small" />}
                      label="Summarize document"
                      variant="outlined"
                      onClick={() =>
                        setAiInput("Give me a concise summary of this document.")
                      }
                    />
                    <Chip
                      icon={<SearchIcon fontSize="small" />}
                      label="Find key numbers"
                      variant="outlined"
                      onClick={() =>
                        setAiInput(
                          "List the important numbers, dates, and amounts in this document."
                        )
                      }
                    />
                    <Chip
                      icon={<TableChartIcon fontSize="small" />}
                      label="Extract tables"
                      variant="outlined"
                      onClick={() =>
                        setAiInput(
                          "Extract all tables and present them as structured data."
                        )
                      }
                    />
                  </Stack>
                </Box>
              )}

              {/* CHAT TAB */}
              {aiTab === 1 && (
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    p: 2,
                    gap: 1,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      flex: 1,
                      overflowY: "auto",
                      mb: 1,
                      pr: 1,
                      borderRadius: 2,
                      border: "1px solid rgba(148,163,184,0.4)",
                      p: 1,
                      backgroundColor: "#f8fafc",
                    }}
                  >
                    {aiMessages.length === 0 && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ p: 1.5 }}
                      >
                        Ask anything about this file. For example:
                        <br />• “What is this document about?”
                        <br />• “What are the main obligations or dates?”
                        <br />• “Extract all totals and due dates.”
                      </Typography>
                    )}

                    {aiMessages.map((m, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: "flex",
                          justifyContent:
                            m.role === "user" ? "flex-end" : "flex-start",
                          mb: 1,
                        }}
                      >
                        <Box
                          sx={{
                            maxWidth: "85%",
                            px: 1.5,
                            py: 1,
                            borderRadius: 2,
                            backgroundColor:
                              m.role === "user" ? "#2563eb" : "white",
                            color: m.role === "user" ? "white" : "inherit",
                            boxShadow:
                              m.role === "assistant"
                                ? "0 2px 10px rgba(15,23,42,0.08)"
                                : "none",
                            fontSize: "0.875rem",
                          }}
                        >
                          {m.content}
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  <Box
                    sx={{
                      borderTop: "1px solid rgba(148,163,184,0.4)",
                      pt: 1,
                    }}
                  >
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      maxRows={4}
                      placeholder="Ask a question about this document..."
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mt: 1,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >{`AI is using this file's content (once you hook up your backend).`}</Typography>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={handleAskAI}
                        startIcon={<ChatBubbleOutlineIcon />}
                      >
                        Ask
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* DATA TAB */}
              {aiTab === 2 && (
                <Box sx={{ p: 2, overflowY: "auto" }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Structured data & context
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Show key-value pairs and data you care about. You can populate this
                    from your extraction pipeline.
                  </Typography>

                  <Stack spacing={1.2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        File name
                      </Typography>
                      <Typography variant="body2">{file.original_name}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Type
                      </Typography>
                      <Typography variant="body2">
                        {file.file_type || "Unknown"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Uploaded at
                      </Typography>
                      <Typography variant="body2">
                        {new Date(file.uploaded_at).toLocaleString()}
                      </Typography>
                    </Box>
                    {file.file_size && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          File size
                        </Typography>
                        <Typography variant="body2">
                          {(file.file_size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                      </Box>
                    )}
                  </Stack>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Next steps
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<TableChartIcon />}
                      onClick={() => navigate(`/dashboard/extract/${file.id}`)}
                    >
                      Open extraction view
                    </Button>
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<DownloadIcon />}
                      onClick={() => (window.location.href = fileUrl)}
                    >
                      Download as original
                    </Button>
                  </Stack>
                </Box>
              )}
            </Box>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
