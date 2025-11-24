import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Paper,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { uploadToFileHub } from "../../api/client";
import { useNavigate } from "react-router-dom";

export default function AddFile({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [fileType, setFileType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [department, setDepartment] = useState("");
  const user_uid = localStorage.getItem("user_uid");

  const GREEN = "#1B873F";
  const GREEN_HOVER = "#166E33";
  const GREEN_FAINT = "rgba(27, 135, 63, 0.08)";

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        navigate("/dashboard/FileList");
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleUpload = async () => {
    if (!file || !fileType || !department) {
      alert("Please select file type, department, and a file.");
      return;
    }

    try {
      await uploadToFileHub(
        file,
        user_uid!,
        fileType,
        "general_upload",
        department
      );
      navigate("/dashboard/FileList");
      onClose();
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const leave = () => {
    onClose();
    navigate("/dashboard/FileList");
  };

  const steps = ["Details", "File", "Confirm"];

  return (
    <Box
      onClick={leave}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        bgcolor: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      <Paper
        elevation={8}
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: "100%",
          maxWidth: 540,
          borderRadius: 4,
          p: 3,
          pt: 2,
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Upload a file
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add a new document to your file hub.
            </Typography>
          </Box>
          <IconButton onClick={leave} size="small" sx={{ color: GREEN }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Stepper */}
        <Stepper
          activeStep={step - 1}
          alternativeLabel
          sx={{ mb: 3 }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>
                <Typography variant="caption">{label}</Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* STEP 1 */}
        {step === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              File details
            </Typography>

            <TextField
              select
              fullWidth
              label="File type"
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              size="small"
            >
              <MenuItem value="policy">Policy</MenuItem>
              <MenuItem value="regulation">Regulation</MenuItem>
              <MenuItem value="evidence">Evidence</MenuItem>
              <MenuItem value="training">Training material</MenuItem>
              <MenuItem value="contract">Contract</MenuItem>
              <MenuItem value="financial">Financial record</MenuItem>
              <MenuItem value="hr">HR document</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>

            <TextField
              select
              fullWidth
              label="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              size="small"
            >
              <MenuItem value="HR">HR</MenuItem>
              <MenuItem value="Finance">Finance</MenuItem>
              <MenuItem value="Compliance">Compliance</MenuItem>
              <MenuItem value="Operations">Operations</MenuItem>
              <MenuItem value="IT">IT</MenuItem>
              <MenuItem value="Legal">Legal</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>

            {/* Step 1 Buttons */}
            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <Button
                onClick={leave}
                sx={{
                  color: GREEN,
                  "&:hover": { backgroundColor: GREEN_FAINT },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={() => setStep(2)}
                disabled={!fileType || !department}
                sx={{
                  bgcolor: GREEN,
                  "&:hover": { bgcolor: GREEN_HOVER },
                }}
              >
                Next
              </Button>
            </Box>
          </Box>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              Choose a file
            </Typography>

            <Box
              onClick={() =>
                document.getElementById("addfile-input")?.click()
              }
              sx={{
                borderRadius: 3,
                border: "1px dashed",
                borderColor: "divider",
                p: 4,
                textAlign: "center",
                cursor: "pointer",
                "&:hover": {
                  borderColor: GREEN,
                  bgcolor: GREEN_FAINT,
                },
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 40, color: GREEN, mb: 1 }} />
              <Typography variant="body2" sx={{ color: GREEN }}>
                Click to select a file or drag & drop here
              </Typography>
            </Box>

            <input
              id="addfile-input"
              type="file"
              hidden
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            {file && (
              <Box
                sx={{
                  mt: 1,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: GREEN_FAINT,
                }}
              >
                <Typography variant="body2">
                  Selected file: <strong>{file.name}</strong>
                </Typography>
              </Box>
            )}

            {/* Step 2 Buttons */}
            <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => setStep(1)}
                sx={{
                  color: GREEN,
                  "&:hover": { backgroundColor: GREEN_FAINT },
                }}
              >
                Back
              </Button>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  onClick={leave}
                  sx={{
                    color: GREEN,
                    "&:hover": { backgroundColor: GREEN_FAINT },
                  }}
                >
                  Cancel
                </Button>

                <Button
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => setStep(3)}
                  disabled={!file}
                  sx={{
                    bgcolor: GREEN,
                    "&:hover": { bgcolor: GREEN_HOVER },
                  }}
                >
                  Next
                </Button>
              </Box>
            </Box>
          </Box>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              Confirm upload
            </Typography>

            <Box sx={{ borderRadius: 2, bgcolor: GREEN_FAINT, p: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>File type:</strong> {fileType}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Department:</strong> {department}
              </Typography>
              <Typography variant="body2">
                <strong>File name:</strong> {file?.name}
              </Typography>
            </Box>

            {/* Step 3 Buttons */}
            <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => setStep(2)}
                sx={{
                  color: GREEN,
                  "&:hover": { backgroundColor: GREEN_FAINT },
                }}
              >
                Back
              </Button>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  onClick={leave}
                  sx={{
                    color: GREEN,
                    "&:hover": { backgroundColor: GREEN_FAINT },
                  }}
                >
                  Cancel
                </Button>

                <Button
                  variant="contained"
                  onClick={handleUpload}
                  sx={{
                    bgcolor: GREEN,
                    "&:hover": { bgcolor: GREEN_HOVER },
                  }}
                >
                  Finish upload
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
