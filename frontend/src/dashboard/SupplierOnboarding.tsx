import React, { useState, useEffect } from "react";
import {
  Box, Button, TextField, Typography, Table, TableHead, TableRow,
  TableCell, TableBody, Paper, Card, CardContent, Container, Divider, Avatar, Fade
} from "@mui/material";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import BusinessIcon from '@mui/icons-material/Business';
import axios from "axios";

export default function SupplierOnboarding() {
  const [form, setForm] = useState({ name: "", email: "", industry: "", region: "" });
  const [suppliers, setSuppliers] = useState([]);
  const [file, setFile] = useState(null);

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    const { data } = await axios.get("/api/suppliers");
    setSuppliers(data);
  };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", form.name);
    data.append("email", form.email);
    data.append("industry", form.industry);
    data.append("region", form.region);
    await axios.post("/api/suppliers", data);
    setForm({ name: "", email: "", industry: "", region: "" });
    fetchSuppliers();
  };

  const handleUpload = async (id) => {
    if (!file) return;
    const data = new FormData();
    data.append("file", file);
    await axios.post(`/api/suppliers/${id}/upload`, data);
    setFile(null);
  };

  return (
    <Fade in={true} timeout={700}>
      <Box
        sx={{
          minHeight: "100vh",
          width: "100vw",
          background: "linear-gradient(120deg, #e5f2ff 0%, #fff 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Container maxWidth="md" sx={{ py: { xs: 6, md: 8 } }}>
          <Card elevation={6} sx={{
            borderRadius: 5,
            background: "#fff",
            boxShadow: "0 8px 28px rgba(0,60,200,0.10)",
          }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar sx={{ bgcolor: "#1976d2", mr: 2 }}>
                  <BusinessIcon />
                </Avatar>
                <Typography variant="h5" fontWeight={800} sx={{ color: "#1976d2" }}>
                  Supplier Onboarding
                </Typography>
              </Box>
              <Typography variant="subtitle1" sx={{ color: "#555", mb: 3 }}>
                Seamlessly onboard supply chain partners. Add and view supplier profiles, and manage compliance file uploads with ease.
              </Typography>
              <form onSubmit={handleSubmit}>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
                  <TextField
                    label="Name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    sx={{ flex: 1, minWidth: 180 }}
                  />
                  <TextField
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    sx={{ flex: 1, minWidth: 180 }}
                  />
                  <TextField
                    label="Industry"
                    name="industry"
                    value={form.industry}
                    onChange={handleChange}
                    required
                    sx={{ flex: 1, minWidth: 140 }}
                  />
                  <TextField
                    label="Region"
                    name="region"
                    value={form.region}
                    onChange={handleChange}
                    required
                    sx={{ flex: 1, minWidth: 120 }}
                  />
                  <Button
                    variant="contained"
                    type="submit"
                    sx={{
                      px: 3,
                      bgcolor: "#1976d2",
                      fontWeight: 700,
                      boxShadow: "0 4px 16px rgba(25, 118, 210, 0.11)",
                      "&:hover": { bgcolor: "#1565c0" }
                    }}
                  >
                    Add Supplier
                  </Button>
                </Box>
              </form>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, color: "#1976d2" }}>
                Supplier Registry
              </Typography>
              <Paper elevation={2} sx={{ borderRadius: 3, mb: 1, overflowX: "auto" }}>
                <Table>
                  <TableHead sx={{ background: "#f2f6fc" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Industry</TableCell>
                      <TableCell>Region</TableCell>
                      <TableCell align="center">Upload Compliance File</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {suppliers.map(s => (
                      <TableRow key={s.id} sx={{ ":hover": { background: "#e5f2ff" } }}>
                        <TableCell>{s.name}</TableCell>
                        <TableCell>{s.email}</TableCell>
                        <TableCell>{s.industry}</TableCell>
                        <TableCell>{s.region}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <input
                              type="file"
                              style={{ display: "none" }}
                              id={`file-upload-${s.id}`}
                              onChange={e => setFile(e.target.files[0])}
                            />
                            <label htmlFor={`file-upload-${s.id}`}>
                              <Button
                                size="small"
                                variant="outlined"
                                component="span"
                                startIcon={<CloudUploadIcon />}
                                sx={{ fontWeight: 500 }}
                              >
                                Select File
                              </Button>
                            </label>
                            <Button
                              size="small"
                              variant="contained"
                              disabled={!file}
                              onClick={() => handleUpload(s.id)}
                              sx={{ bgcolor: "#1976d2", fontWeight: 700, boxShadow: "none" }}
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
