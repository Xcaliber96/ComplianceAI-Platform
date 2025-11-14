import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
} from "@mui/material";
import { useState, useEffect } from "react";
import apiClient, {
  downloadDriveFile,
  fetchFiles,
  uploadForInternalAudit,
  createObligation,
  getObligations,
  type Obligation,
} from "../api/client";
import { useFilters } from "../store/filters";

const BG_MAIN = "#fcfcfc";
const CARD_BORDER = "#232323";
const CARD_BG = "#fff";
const HEADING_BLACK = "#151515";

export default function UploadFetchTab() {
  // -- department/owner state must be inside the component (hooks cannot be top-level)
  const [department, setDepartment] = useState<string>("");
  const [owner, setOwner] = useState<string>(localStorage.getItem("email") || "");

  const [tabIndex, setTabIndex] = useState(0);
  const [source, setSource] = useState("Google");
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>("");

  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [newObligation, setNewObligation] = useState({
    description: "",
    regulation: "",
    due_date: "",
  });

  const [selectedRegulation, setSelectedRegulation] = useState("GDPR");
  const [daysOffset, setDaysOffset] = useState(90);

  const filters = useFilters();

  useEffect(() => {
    loadObligations();
    // TODO: replace localStorage owner with session/me API call for canonical user
    const sessEmail = localStorage.getItem("email");
    if (sessEmail) setOwner(sessEmail);
  }, []);

  const loadObligations = async () => {
    try {
      const data = await getObligations();
      setObligations(data);
    } catch (error) {
      console.error("Failed to load obligations:", error);
    }
  };

  const handleFetch = async () => {
    try {
      const res = await fetchFiles(source);
      setDriveFiles(res?.files ?? []);
    } catch (err) {
      console.error("Fetch files failed:", err);
      setMessage("Failed to fetch files from cloud.");
      setDriveFiles([]);
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const res = await downloadDriveFile(id);
      setMessage(`Downloaded: ${res?.path ?? "unknown path"}`);
    } catch (err) {
      console.error("Download failed:", err);
      setMessage("Download failed.");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select a file to upload.");
      return;
    }
    if (!department) {
      setMessage("Please select a department");
      return;
    }

    setUploading(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("department", department);
      formData.append("owner", owner);

      const res = await uploadForInternalAudit(formData);
      setMessage(
        `Audit started: ${res?.status ?? "ok"} (items: ${res?.total_requirements ?? 0})`
      );

      // Optionally clear selected file after upload
      setSelectedFile(null);
    } catch (err: any) {
      console.error("Upload failed:", err?.response ?? err);
      const errMsg =
        err?.response?.data?.error || err?.message || "Upload failed due to server error.";
      setMessage(errMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateObligation = async () => {
    if (
      !newObligation.description ||
      !newObligation.regulation ||
      !newObligation.due_date
    ) {
      setMessage("Please fill all obligation fields");
      return;
    }
    try {
      await createObligation(newObligation);
      setMessage("Obligation created successfully");
      setNewObligation({ description: "", regulation: "", due_date: "" });
      loadObligations();
    } catch (error) {
      setMessage("Failed to create obligation");
      console.error(error);
    }
  };

  const handleAutoGenerate = async () => {
    try {
      const formData = new FormData();
      formData.append("regulation", selectedRegulation);
      formData.append("due_date_offset_days", daysOffset.toString());

      const resp = await apiClient.post("/api/auto_generate_compliance", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const result = resp.data;
      if (result.status === "success") {
        setMessage(
          `Auto-generated ${result.obligations_created} obligations and ${result.tasks_created} tasks for ${selectedRegulation}`
        );
        loadObligations();
      } else {
        setMessage(result.error || "Auto-generation failed");
      }
    } catch (error) {
      console.error("Auto-generate failed:", error);
      setMessage("Auto-generation failed");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        width: "100%",
        bgcolor: BG_MAIN,
        py: 4,
      }}
    >
      <Stack spacing={4} maxWidth="900px" mx="auto" alignItems="stretch">
        <Tabs
          value={tabIndex}
          onChange={(e, v) => setTabIndex(v)}
          indicatorColor="primary"
          textColor="inherit"
          centered
          sx={{
            mb: 3,
            ".MuiTabs-indicator": { bgcolor: HEADING_BLACK, height: 3, borderRadius: 2 },
            ".MuiTab-root": {
              fontWeight: 600,
              fontSize: "1.07rem",
              minWidth: 140,
              textTransform: "none",
              color: HEADING_BLACK,
              "&.Mui-selected": { color: HEADING_BLACK },
            },
          }}
        >
          <Tab label="Auto-Generate" />
          <Tab label="Obligation" />
          <Tab label="Files" />
          <Tab label="Audit" />
        </Tabs>

        {message && (
          <Alert
            severity={
              message.includes("success") ||
              message.includes("started") ||
              message.includes("Auto-generated")
                ? "success"
                : message.includes("failed") || message.includes("Failed")
                ? "error"
                : "info"
            }
            onClose={() => setMessage("")}
            sx={{
              borderRadius: 2,
              boxShadow: "0 2px 18px 0 rgba(35,35,35,0.08)",
              fontSize: "0.93rem",
              bgcolor: "#fff",
              color: HEADING_BLACK,
              border: `1px solid ${CARD_BORDER}`,
            }}
          >
            {message}
          </Alert>
        )}

        {/* Auto-Generate Compliance Plan */}
        {tabIndex === 0 && (
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: `1px solid ${CARD_BORDER}`,
              background: CARD_BG,
              boxShadow: "0 1px 10px 0 rgba(35,35,35,0.04)",
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 4 } }}>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ color: HEADING_BLACK, mb: 1.5, letterSpacing: 0.1 }}
              >
                Auto-Generate Compliance Plan
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mb: 2,
                  color: "#232323",
                  lineHeight: 1.7,
                  opacity: 0.97,
                  fontWeight: 500,
                }}
              >
                Automatically create obligations and tasks from regulation templates.
              </Typography>
              <Divider sx={{ my: 2, borderColor: CARD_BORDER }} />

              <Stack spacing={2}>
                {/* Select Regulation field */}
                <FormControl fullWidth size="small" variant="outlined">
                  <InputLabel
                    id="regulation-select-label"
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.99rem",
                      color: "#232323",
                      backgroundColor: "#fff",
                      px: 0.6,
                      zIndex: 2,
                      left: 8,
                    }}
                  >
                    Select Regulation
                  </InputLabel>
                  <Select
                    labelId="regulation-select-label"
                    id="regulation-select"
                    value={selectedRegulation}
                    onChange={(e) => setSelectedRegulation(e.target.value)}
                    label="Select Regulation"
                    sx={{
                      borderRadius: 4,
                      bgcolor: "#fff",
                      fontWeight: 500,
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: CARD_BORDER,
                      },
                    }}
                  >
                    <MenuItem value="GDPR">GDPR (3 obligations, 6 tasks)</MenuItem>
                    <MenuItem value="SOX">SOX (2 obligations, 4 tasks)</MenuItem>
                    <MenuItem value="SOC2">SOC2 (2 obligations, 4 tasks)</MenuItem>
                    <MenuItem value="HIPAA">HIPAA (2 obligations, 4 tasks)</MenuItem>
                  </Select>
                </FormControl>
                {/* Days Until Due field */}
                <FormControl fullWidth size="small" variant="outlined">
                  <TextField
                    id="days-until-due"
                    label="Days Until Due"
                    type="number"
                    value={daysOffset}
                    onChange={(e) => setDaysOffset(Number(e.target.value))}
                    helperText="Default deadline offset from today"
                    InputLabelProps={{
                      sx: {
                        backgroundColor: "#fff",
                        px: 0.6,
                        zIndex: 2,
                        left: 8,
                      }
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 4,
                        bgcolor: "#fff",
                        border: `1px solid ${CARD_BORDER}`,
                      },
                      "& .MuiFormHelperText-root": {
                        fontSize: "0.85rem",
                        color: "#232323"
                      }
                    }}
                  />
                </FormControl>

                <Button
                  variant="contained"
                  onClick={handleAutoGenerate}
                  fullWidth
                  sx={{
                    py: 1.4,
                    borderRadius: 7,
                    textTransform: "none",
                    fontSize: "1.07rem",
                    fontWeight: 700,
                    background: HEADING_BLACK,
                    boxShadow: "none",
                    color: "#fff",
                    letterSpacing: 0.4,
                    "&:hover": {
                      background: "#232323",
                      opacity: 0.97
                    }
                  }}
                >
                  Auto-Generate Full Compliance Plan
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Obligation Tab */}
        {tabIndex === 1 && (
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: `1px solid ${CARD_BORDER}`,
              background: CARD_BG,
              boxShadow: "0 1px 10px 0 rgba(35,35,35,0.04)",
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 4 } }}>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ color: HEADING_BLACK, mb: 1.5, letterSpacing: 0.1 }}
              >
                Create Compliance Obligation
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mb: 2,
                  color: "#232323",
                  lineHeight: 1.7,
                  fontWeight: 500,
                }}
              >
                Define new compliance requirements and deadlines manually.
              </Typography>
              <Divider sx={{ my: 2, borderColor: CARD_BORDER }} />
              <Stack spacing={2}>
                {/* Description */}
                <FormControl fullWidth size="small" variant="outlined">
                  <TextField
                    id="description-field"
                    label="Description"
                    size="small"
                    value={newObligation.description}
                    onChange={(e) =>
                      setNewObligation({ ...newObligation, description: e.target.value })
                    }
                    placeholder="e.g., Implement GDPR data retention policy"
                    InputLabelProps={{
                      sx: {
                        backgroundColor: "#fff",
                        px: 0.6,
                        zIndex: 2,
                        left: 8,
                      }
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 4,
                        bgcolor: "#fff",
                        border: `1px solid ${CARD_BORDER}`,
                      }
                    }}
                  />
                </FormControl>
                {/* Regulation */}
                <FormControl fullWidth size="small" variant="outlined">
                  <TextField
                    id="regulation-field"
                    label="Regulation"
                    size="small"
                    value={newObligation.regulation}
                    onChange={(e) =>
                      setNewObligation({ ...newObligation, regulation: e.target.value })
                    }
                    placeholder="e.g., GDPR, SOX, SOC2"
                    InputLabelProps={{
                      sx: {
                        backgroundColor: "#fff",
                        px: 0.6,
                        zIndex: 2,
                        left: 8,
                      }
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 4,
                        bgcolor: "#fff",
                        border: `1px solid ${CARD_BORDER}`,
                      }
                    }}
                  />
                </FormControl>
                {/* Due Date */}
                <FormControl fullWidth size="small" variant="outlined">
                  <TextField
                    id="due-date-field"
                    label="Due Date"
                    size="small"
                    type="date"
                    InputLabelProps={{
                      shrink: true,
                      sx: {
                        backgroundColor: "#fff",
                        px: 0.6,
                        zIndex: 2,
                        left: 8,
                      }
                    }}
                    value={newObligation.due_date}
                    onChange={(e) =>
                      setNewObligation({ ...newObligation, due_date: e.target.value })
                    }
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 4,
                        bgcolor: "#fff",
                        border: `1px solid ${CARD_BORDER}`,
                      }
                    }}
                  />
                </FormControl>
                <Button
                  variant="contained"
                  onClick={handleCreateObligation}
                  fullWidth
                  sx={{
                    py: 1.4,
                    borderRadius: 7,
                    textTransform: "none",
                    fontSize: "1.07rem",
                    fontWeight: 700,
                    background: HEADING_BLACK,
                    boxShadow: "none",
                    color: "#fff",
                    letterSpacing: 0.4,
                    "&:hover": {
                      background: "#232323",
                      opacity: 0.97
                    }
                  }}
                >
                  Create Obligation
                </Button>
              </Stack>
              {obligations.length > 0 && (
                <>
                  <Divider sx={{ my: 3, borderColor: CARD_BORDER }} />
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{ mb: 2, color: HEADING_BLACK }}
                  >
                    Existing Obligations ({obligations.length})
                  </Typography>
                  <List dense sx={{ backgroundColor: "#fff", borderRadius: 4, p: 1 }}>
                    {obligations.map((ob: any) => (
                      <ListItem
                        key={ob.id}
                        sx={{
                          borderRadius: 3,
                          mb: 0.7,
                          backgroundColor: "#fff",
                          border: `1px solid ${CARD_BORDER}`,
                          "&:last-child": { mb: 0 }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={{ color: "#232323" }}
                            >
                              {ob.regulation}: {ob.description}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" sx={{ color: "#232323", opacity: 0.7 }}>
                              Due: {new Date(ob.due_date).toLocaleDateString()}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Files Tab */}
        {tabIndex === 2 && (
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: `1px solid ${CARD_BORDER}`,
              background: CARD_BG,
              boxShadow: "0 1px 10px 0 rgba(35,35,35,0.04)",
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 4 } }}>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ color: HEADING_BLACK, mb: 1.5, letterSpacing: 0.1 }}
              >
                Fetch Files from Cloud Storage
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mb: 2,
                  color: "#232323",
                  lineHeight: 1.7,
                  fontWeight: 500,
                }}
              >
                Current Filters — Dept: {filters.department ?? "All"}, Country: {filters.country ?? "All"}, State: {filters.state ?? "All"}
              </Typography>
              <Divider sx={{ my: 2, borderColor: CARD_BORDER }} />
              <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
                {/* Source field */}
                <FormControl fullWidth size="small" variant="outlined">
                  <TextField
                    id="source-field"
                    label="Source"
                    size="small"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    helperText="Use 'Google' for Google Drive"
                    InputLabelProps={{
                      sx: {
                        backgroundColor: "#fff",
                        px: 0.6,
                        zIndex: 2,
                        left: 8,
                      }
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 4,
                        bgcolor: "#fff",
                        border: `1px solid ${CARD_BORDER}`,
                      },
                      "& .MuiFormHelperText-root": { color: "#232323", fontSize: "0.85em" }
                    }}
                  />
                </FormControl>
                <Button
                  variant="outlined"
                  onClick={handleFetch}
                  sx={{
                    py: 1.2,
                    px: 3,
                    borderRadius: 4,
                    fontWeight: 700,
                    borderColor: CARD_BORDER,
                    color: HEADING_BLACK,
                    background: "#fff",
                    "&:hover": {
                      borderColor: "#191919",
                      backgroundColor: "#f1f1f1"
                    }
                  }}
                >
                  Fetch Files
                </Button>
              </Stack>
              {driveFiles.length > 0 && (
                <List dense sx={{ backgroundColor: "#fff", borderRadius: 4, p: 1 }}>
                  {driveFiles.map((f) => (
                    <ListItem
                      key={f.id}
                      sx={{
                        borderRadius: 3,
                        mb: 0.7,
                        backgroundColor: "#fff",
                        border: `1px solid ${CARD_BORDER}`,
                        "&:last-child": { mb: 0 }
                      }}
                      secondaryAction={
                        <Button
                          size="small"
                          onClick={() => handleDownload(f.id)}
                          sx={{
                            textTransform: "none",
                            fontSize: "0.91rem",
                            color: HEADING_BLACK,
                            fontWeight: 700,
                            "&:hover": {
                              backgroundColor: "#e9e9e9"
                            }
                          }}
                        >
                          Download
                        </Button>
                      }
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={700} sx={{ color: "#232323" }}>
                            {f.name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: "#232323", opacity: 0.7 }}>
                            {f.id}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        )}

        {/* Audit Tab (moved department + owner input here) */}
        {tabIndex === 3 && (
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: `1px solid ${CARD_BORDER}`,
              background: CARD_BG,
              boxShadow: "0 1px 10px 0 rgba(35,35,35,0.04)",
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 4 } }}>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ color: HEADING_BLACK, mb: 1.5, letterSpacing: 0.1 }}
              >
                Upload Evidence & Run Audit
              </Typography>
              <Divider sx={{ my: 2, borderColor: CARD_BORDER }} />
              <Stack spacing={2}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 2,
                    backgroundColor: "#fff",
                    borderRadius: 4,
                    border: `1px dashed ${CARD_BORDER}`
                  }}
                >
                  <Button
                    component="label"
                    variant="outlined"
                    sx={{
                      borderRadius: 4,
                      fontSize: "1rem",
                      fontWeight: 700,
                      borderColor: CARD_BORDER,
                      color: HEADING_BLACK,
                      background: "#f6f6f6",
                      "&:hover": {
                        borderColor: "#191919",
                        backgroundColor: "#f1f1f1"
                      }
                    }}
                  >
                    Choose PDF
                    <input
                      type="file"
                      accept="application/pdf"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setSelectedFile(file ?? null);
                      }}
                    />
                  </Button>
                  <Typography
                    variant="body2"
                    sx={{
                      flex: 1,
                      color: selectedFile ? "#232323" : HEADING_BLACK,
                      fontWeight: 700
                    }}
                  >
                    {selectedFile?.name ?? "No file selected"}
                  </Typography>
                </Box>

                {/* Department Selector */}
                <FormControl fullWidth size="small">
                  <InputLabel id="dept-select-label">Department</InputLabel>
                  <Select
                    labelId="dept-select-label"
                    value={department}
                    label="Department"
                    onChange={(e) => setDepartment(e.target.value)}
                    sx={{ borderRadius: 4, bgcolor: "#fff" }}
                  >
                    <MenuItem value="Procurement">Procurement</MenuItem>
                    <MenuItem value="Manufacturing">Manufacturing</MenuItem>
                    <MenuItem value="Logistics">Logistics</MenuItem>
                    <MenuItem value="Warehouse">Warehouse</MenuItem>
                    <MenuItem value="Finance">Finance</MenuItem>
                    <MenuItem value="Legal">Legal</MenuItem>
                  </Select>
                </FormControl>

                {/* Owner (Auto-filled Email) */}
                <TextField
                  label="Owner"
                  size="small"
                  value={owner}
                  disabled
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 4,
                      bgcolor: "#fff"
                    }
                  }}
                />

                <Button
                  variant="contained"
                  disabled={!selectedFile || uploading}
                  onClick={handleUpload}
                  fullWidth
                  sx={{
                    py: 1.4,
                    borderRadius: 7,
                    textTransform: "none",
                    fontSize: "1.07rem",
                    fontWeight: 700,
                    background: HEADING_BLACK,
                    color: "#fff",
                    boxShadow: "none",
                    "&:hover": {
                      background: "#232323",
                      opacity: 0.97
                    },
                    "&:disabled": {
                      backgroundColor: "#ececec",
                      color: "#bdbdbd"
                    }
                  }}
                >
                  {uploading ? "Uploading..." : "Upload & Start Internal Audit"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
