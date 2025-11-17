import React, { useState } from "react";
import { Box, Typography, Button, TextField, MenuItem } from "@mui/material";
import { uploadToFileHub } from "../../api/client";
import "./AddFile.css";
import { useNavigate } from "react-router-dom";

export default function AddFile({ onClose }: { onClose: () => void }) {
  const [fileType, setFileType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const user_uid = localStorage.getItem("user_uid");

  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!file || !fileType) {
      alert("Choose file & type first.");
      return;
    }

    try {
      await uploadToFileHub(file, user_uid!, fileType, "general_upload");
navigate("/dashboard/FileList");
      onClose(); 


    } catch (err) {
      console.error("Upload failed:", err);
    }
  };
    const leave = async () => {


    try {
     
navigate("/dashboard/FileList");
      onClose(); 


    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  return (
    <div className="addfile-modal-overlay">
      <Box className="addfile-modal">

        {/* Exit Button */}
        <button className="addfile-exit" onClick={leave}>
          
        </button>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <Typography className="addfile-step-title" variant="h5">
              1 — Select File Type
            </Typography>

            <TextField
              select
              fullWidth
              label="File Type"
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
            >
              <MenuItem value="policy">Policy</MenuItem>
              <MenuItem value="regulation">Regulation</MenuItem>
              <MenuItem value="evidence">Evidence</MenuItem>
              <MenuItem value="training">Training Material</MenuItem>
              <MenuItem value="contract">Contract</MenuItem>
              <MenuItem value="financial">Financial Record</MenuItem>
              <MenuItem value="hr">HR Document</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>

            <Button className="addfile-btn" onClick={() => setStep(2)}>
              Next →
            </Button>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <Typography className="addfile-title">
              2 — Choose File
            </Typography>

            <Button
              variant="contained"
              component="label"
              className="addfile-btn file-upload-btn"
            >
              Choose File
              <input
                type="file"
                hidden
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </Button>

            {file && (
              <Typography className="addfile-selected">
                Selected: {file.name}
              </Typography>
            )}

            <Box className="addfile-nav-row">
              <Button className="addfile-btn next-btn" onClick={() => setStep(3)}>
                Next →
              </Button>

              <Button className="addfile-back" onClick={() => setStep(1)}>
                ← Back
              </Button>
            </Box>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <Typography className="addfile-step-title" variant="h5">
              3 — Confirm Upload
            </Typography>

            <Typography>You chose: {fileType}</Typography>
            <Typography>{file?.name}</Typography>

            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
              <Button onClick={() => setStep(2)}>← Back</Button>
              <Button className="addfile-btn" onClick={handleUpload}>
                Finish Upload
              </Button>
            </Box>
          </>
        )}

      </Box>
    </div>
  );
}
