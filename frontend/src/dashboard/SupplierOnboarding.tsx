import React, { useState, useEffect } from "react";
import {
  Box, Button, TextField, Typography, Table, TableHead, TableRow,
  TableCell, TableBody, Paper, Card, CardContent, Container, Divider,
  Avatar, Fade, Chip, Tooltip, LinearProgress
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import BusinessIcon from "@mui/icons-material/Business";
import AddBusinessIcon from "@mui/icons-material/AddBusiness";
import LanguageIcon from "@mui/icons-material/Language";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import axios from "axios";

interface Supplier {
  id: number;
  name: string;
  email: string;
  industry: string;
  region: string;
  risk_score?: number;
}

export default function SupplierOnboarding() {
  const [form, setForm] = useState({ name: "", email: "", industry: "", region: "" });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // new fields for auto-detect
  const [inputType, setInputType] = useState<"domain" | "name" | "document">("name");
  const [domain, setDomain] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    const { data } = await axios.get("/api/suppliers");
    setSuppliers(data);
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    await axios.post("/api/suppliers", data);
    setForm({ name: "", email: "", industry: "", region: "" });
    fetchSuppliers();
  };

  const handleUpload = async (id: number) => {
    if (!file) return;
    const data = new FormData();
    data.append("file", file);
    await axios.post(`/api/suppliers/${id}/upload`, data);
    setFile(null);
  };

  // auto-detect handler
  const handleAutoDetect = async () => {
    const formData = new FormData();
    if (inputType === "domain") formData.append("domain", domain);
    if (inputType === "name") formData.append("name", businessName);
    if (inputType === "document" && docFile) formData.append("file", docFile);

    const { data } = await axios.post("/api/suppliers/auto-detect", formData);
    setForm({
      name: data.name || "",
      email: data.email || "",
      industry: data.industry || "",
      region: data.region || "",
    });
  };

  return (
    <Fade in={true} timeout={700}>
      <Box
        sx={{
          minHeight: "100vh",
          width: "100%",
          background: "linear-gradient(135deg, #f5f9ff 0%, #e6ecfa 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 8,
        }}
      >
        <Container maxWidth="lg">
          <Card
            elevation={6}
            sx={{
              background: "#fff",
              boxShadow: "0 10px 25px rgba(0, 80, 200, 0.1)",
              p: { xs: 2, md: 4 },
            }}
          >
            <CardContent>
              {/* Header */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  mb: 3,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Avatar sx={{ bgcolor: "#1976d2", mr: 2 }}>
                    <BusinessIcon />
                  </Avatar>
                  <Typography variant="h5" fontWeight={800} color="primary">
                    Supplier Onboarding
                  </Typography>
                </Box>
                <Tooltip title="Add New Supplier">
                  <AddBusinessIcon color="primary" sx={{ fontSize: 30 }} />
                </Tooltip>
              </Box>

              <Typography
                variant="subtitle1"
                sx={{ color: "#555", mb: 4, maxWidth: 600 }}
              >
                Register and manage your supply chain partners. Upload compliance
                files, track risk scores, and maintain transparency with ease.
              </Typography>

              {/* Auto-detect Section */}
              <Card sx={{ mb: 4, p: 2, borderRadius: 3, background: "#f8fbff" }}>
                <Typography variant="h6" fontWeight={700} color="primary" mb={2}>
                  🔍 Discover Supplier Automatically
                </Typography>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  <TextField
                    select
                    label="Input Type"
                    value={inputType}
                    onChange={(e) => setInputType(e.target.value as any)}
                    SelectProps={{ native: true }}
                    sx={{ minWidth: 180 }}
                  >
                    <option value="domain">Domain</option>
                    <option value="name">Business Name</option>
                    <option value="document">Upload Document</option>
                  </TextField>

                  {inputType === "domain" && (
                    <TextField
                      label="Company Domain"
                      placeholder="e.g. panasonic.com"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      sx={{ flex: 1, minWidth: 260 }}
                      InputProps={{ startAdornment: <LanguageIcon sx={{ mr: 1 }} /> }}
                    />
                  )}

                  {inputType === "name" && (
                    <TextField
                      label="Business Name"
                      placeholder="e.g. Panasonic Holdings"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      sx={{ flex: 1, minWidth: 260 }}
                      InputProps={{ startAdornment: <BusinessIcon sx={{ mr: 1 }} /> }}
                    />
                  )}

                  {inputType === "document" && (
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<UploadFileIcon />}
                      sx={{ minWidth: 200 }}
                    >
                      {docFile ? docFile.name : "Choose Document"}
                      <input
                        hidden
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                      />
                    </Button>
                  )}

                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAutoDetect}
                    sx={{ fontWeight: 700 }}
                    disabled={
                      (inputType === "domain" && !domain) ||
                      (inputType === "name" && !businessName) ||
                      (inputType === "document" && !docFile)
                    }
                  >
                    Auto-Detect Supplier
                  </Button>
                </Box>
              </Card>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" },
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <TextField
                    label="Name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                  <TextField
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                  <TextField
                    label="Industry"
                    name="industry"
                    value={form.industry}
                    onChange={handleChange}
                    required
                  />
                  <TextField
                    label="Region"
                    name="region"
                    value={form.region}
                    onChange={handleChange}
                    required
                  />
                </Box>
                <Button
                  variant="contained"
                  type="submit"
                  size="large"
                  startIcon={<AddBusinessIcon />}
                  sx={{
                    fontWeight: 700,
                    bgcolor: "#1976d2",
                    px: 3,
                    "&:hover": { bgcolor: "#1254a2" },
                  }}
                >
                  Add Supplier
                </Button>
              </form>

              <Divider sx={{ my: 4 }} />

              {/* Table Section */}
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ color: "#1976d2", mb: 2 }}
              >
                Supplier Registry
              </Typography>

              {loading && <LinearProgress sx={{ mb: 2 }} />}

              <Paper
                elevation={2}
                sx={{
                  overflow: "hidden",
                  boxShadow: "0 3px 10px rgba(0,0,0,0.05)",
                }}
              >
                <Table>
                  <TableHead sx={{ background: "#f2f6fc" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Industry</TableCell>
                      <TableCell>Region</TableCell>
                      <TableCell align="center">Risk</TableCell>
                      <TableCell align="center">Upload Compliance File</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {suppliers.map((s) => (
                      <TableRow
                        key={s.id}
                        sx={{
                          ":hover": { background: "#f0f6ff" },
                          transition: "background 0.3s ease",
                        }}
                      >
                        <TableCell>{s.name}</TableCell>
                        <TableCell>{s.email}</TableCell>
                        <TableCell>{s.industry}</TableCell>
                        <TableCell>{s.region}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={s.risk_score ? `${s.risk_score}%` : "Pending"}
                            color={
                              s.risk_score
                                ? s.risk_score > 70
                                  ? "error"
                                  : "success"
                                : "default"
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: "center" }}>
                            <input
                              type="file"
                              style={{ display: "none" }}
                              id={`file-upload-${s.id}`}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const selectedFile = e.target.files?.[0] ?? null;
                                setFile(selectedFile);
                              }}
                            />
                            <label htmlFor={`file-upload-${s.id}`}>
                              <Button
                                size="small"
                                variant="outlined"
                                component="span"
                                startIcon={<CloudUploadIcon />}
                              >
                                Select
                              </Button>
                            </label>
                            <Button
                              size="small"
                              variant="contained"
                              disabled={!file}
                              onClick={() => handleUpload(s.id)}
                              sx={{
                                bgcolor: "#1976d2",
                                fontWeight: 600,
                                boxShadow: "none",
                                "&:hover": { bgcolor: "#1254a2" },
                              }}
                            >
                              Upload
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </Fade>
  );
}
