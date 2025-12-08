import React, { useState } from "react";
import {
  Box, Button, TextField, Typography, Table, TableHead, TableRow,
  TableCell, TableBody, Paper, Card, CardContent, Container, Divider,
  Avatar, Fade, Chip, Tooltip, LinearProgress
} from "@mui/material";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import BusinessIcon from "@mui/icons-material/Business";
import AddBusinessIcon from "@mui/icons-material/AddBusiness";

const CARD_BORDER = "#232323";
const CARD_BG = "#fff";
const HEADING_BLACK = "#151515";

export default function SupplierOnboarding_Static() {

  // Static list of suppliers (mock data)
  const [suppliers] = useState([
    {
      id: 1,
      name: "Panasonic Holdings",
      email: "info@panasonic.com",
      industry: "Electronics",
      region: "Japan",
      risk_score: 42,
    },
    {
      id: 2,
      name: "Ford Mobility",
      email: "contact@ford.com",
      industry: "Automotive",
      region: "USA",
      risk_score: 75,
    },
    {
      id: 3,
      name: "Siemens AG",
      email: "support@siemens.com",
      industry: "Manufacturing",
      region: "Germany",
      risk_score: null,
    },
  ]);

  const [form, setForm] = useState({ name: "", email: "", industry: "", region: "" });
  const [loading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert("Form submitted (static mode). No backend connected.");
    setForm({ name: "", email: "", industry: "", region: "" });
  };

  return (
    <Fade in={true} timeout={700}>
      <Box
        sx={{
          minHeight: "100vh",
          width: "100%",
          bgcolor: "#FFFFFF",
         
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Container maxWidth="lg">

          {}
          <Box
            sx={{
              background: "#E5F6FD",
              border: "1px solid #72C8E6",
              borderRadius: 2,
              p: 2,
              mb: 2,
              display: "flex",
              
              width: "80%",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography fontWeight={600}>
              Add your first supplier to get started.
            </Typography>

            <Button
              variant="contained"
              size="small"
              sx={{
                background: "#315E7F",
                "&:hover": { background: "#264A63" },
                textTransform: "none",
              }}
            >
            </Button>
          </Box>

          {}
          <Box
            sx={{
              background: "#E5F6FD",
              border: "1px solid #72C8E6",
              borderRadius: 2,
              p: 2,
              mb: 4
            }}
          >
            <Typography fontWeight={600}>
              Explore the other features in your template{" "}
              <span style={{ color: "#0288D1", cursor: "pointer", marginLeft: 8 }}>
                See what’s been set up
              </span>
            </Typography>
          </Box>

          {}
          <Card
            elevation={6}
            sx={{
              background: CARD_BG,
              borderRadius: 4,
              p: { xs: 2, md: 4 }
            }}
          >
            <CardContent>

              {}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  mb: 3
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Avatar sx={{ bgcolor: HEADING_BLACK, mr: 2 }}>
                    <BusinessIcon style={{ color: "#fff" }} />
                  </Avatar>
                  <Typography variant="h5" fontWeight={800} sx={{ color: HEADING_BLACK }}>
                    Supplier Onboarding (Static Demo)
                  </Typography>
                </Box>
                <Tooltip title="Add New Supplier (Mock)">
                  <AddBusinessIcon sx={{ fontSize: 30, color: HEADING_BLACK }} />
                </Tooltip>
              </Box>

              <Typography
                variant="subtitle1"
                sx={{ mb: 4, maxWidth: 600 }}
              >
                This is a static demo version. No data is saved, and no backend calls are made.
                Useful for UI showcase or frontend preview.
              </Typography>

              {/* -------------------- FORM -------------------- */}
              <form onSubmit={handleSubmit}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" },
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <TextField label="Name" name="name" value={form.name} onChange={handleChange} required />
                  <TextField label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
                  <TextField label="Industry" name="industry" value={form.industry} onChange={handleChange} required />
                  <TextField label="Region" name="region" value={form.region} onChange={handleChange} required />
                </Box>

                <Button
                  variant="contained"
                  type="submit"
                  size="large"
                  startIcon={<AddBusinessIcon />}
                  sx={{ fontWeight: 700, px: 3, "&:hover": { bgcolor: "#232323" } }}
                >
                  Add Supplier (Static)
                </Button>
              </form>

              <Divider sx={{ my: 4, borderColor: CARD_BORDER }} />

              {/* -------------------- TABLE -------------------- */}
              <Typography variant="h6" fontWeight={700}>
                Supplier Registry (Mock Data)
              </Typography>

              {loading && <LinearProgress sx={{ mb: 2 }} />}

              <Paper elevation={2} sx={{ overflow: "hidden" }}>
                <Table>
                  <TableHead sx={{ background: "#f7f7f7" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Industry</TableCell>
                      <TableCell>Region</TableCell>
                      <TableCell align="center">Risk</TableCell>
                      <TableCell align="center">Upload</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {suppliers.map((s) => (
                      <TableRow
                        key={s.id}
                        sx={{
                          ":hover": { background: "#f1f1f1" },
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
                            sx={{
                              background: s.risk_score && s.risk_score > 70 ? "#d32f2f" : "#232323",
                              color: "#fff",
                              fontWeight: 600
                            }}
                            size="small"
                          />
                        </TableCell>

                        <TableCell align="center">
                          <Button
                            variant="outlined"
                            startIcon={<CloudUploadIcon />}
                            sx={{ borderColor: CARD_BORDER, color: CARD_BORDER }}
                          >
                            Upload
                          </Button>
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
