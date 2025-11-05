import React from "react";
import { Box, Typography, Grid, Card, CardContent, Button, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  CloudUpload,
  Assessment,
  Assignment,
  Group,
  BarChart,
  TrendingUp,
  Shield,
  CompareArrows,
} from "@mui/icons-material";

export default function FrontPage() {
  const navigate = useNavigate();

  const features = [
    {
      title: "Upload & Fetch Files",
      desc: "Start your compliance journey by uploading internal policies or fetching documents from Google Drive or SharePoint.",
      icon: <CloudUpload sx={{ fontSize: 40, color: "#1976d2" }} />,
      path: "/dashboard/upload",
      action: "Go to Uploads",
    },
    {
      title: "Run Audit & Generate Obligations",
      desc: "Use AI-powered RAG analysis to detect compliance gaps and automatically generate new obligations.",
      icon: <Assessment sx={{ fontSize: 40, color: "#0288d1" }} />,
      path: "/dashboard/audit",
      action: "Run Audit",
    },
    {
      title: "Manage Tasks",
      desc: "Create remediation tasks, assign them to employees or suppliers, and track their progress through completion.",
      icon: <Assignment sx={{ fontSize: 40, color: "#2e7d32" }} />,
      path: "/dashboard/audit",
      action: "Manage Tasks",
    },
    {
      title: "Add Suppliers",
      desc: "Onboard and manage your third-party vendors. Link them to obligations and request evidence for compliance verification.",
      icon: <Group sx={{ fontSize: 40, color: "#8e24aa" }} />,
      path: "/dashboard/suppliers",
      action: "Add Supplier",
    },
    {
      title: "Add Competitors",
      desc: "Analyze your competitors’ SEC filings and generate AI-based market insights for benchmarking and strategy.",
      icon: <CompareArrows sx={{ fontSize: 40, color: "#f57c00" }} />,
      path: "/competitors",
      action: "Add Competitors",
    },
    {
      title: "View Results & Reports",
      desc: "Review audit results, compliance metrics, and regional coverage analytics all in one place.",
      icon: <BarChart sx={{ fontSize: 40, color: "#c2185b" }} />,
      path: "/dashboard/results",
      action: "View Results",
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f9fafc",
        px: { xs: 3, md: 8 },
        py: { xs: 6, md: 10 },
      }}
    >
      {/* 🔹 Header */}
      <Box textAlign="center" mb={6}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            fontFamily: "'Montserrat', sans-serif",
            mb: 1,
            color: "#111",
          }}
        >
          Welcome to Your Compliance Hub
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Automate compliance — from document upload to audit results — all in one place.
        </Typography>
      </Box>

      {/* 🔹 Feature Cards */}
      <Grid container spacing={4} justifyContent="center">
        {features.map((item, idx) => (
          <Grid item xs={12} sm={6} md={4} key={idx}>
            <Card
              variant="outlined"
              sx={{
                height: "100%",
                borderRadius: 3,
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                  transform: "translateY(-4px)",
                },
              }}
            >
              <CardContent>
                <Stack spacing={2} alignItems="center" textAlign="center">
                  {item.icon}
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: "#111", mt: 1 }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ minHeight: 60 }}
                  >
                    {item.desc}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => navigate(item.path)}
                    sx={{
                      mt: 1,
                      borderRadius: 2,
                      textTransform: "none",
                      backgroundColor: "#1976d2",
                      "&:hover": { backgroundColor: "#125ea5" },
                    }}
                  >
                    {item.action}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 🔹 Bottom Section */}
      <Box textAlign="center" mt={8}>
        <Typography variant="body2" color="text.secondary">
          <Shield sx={{ fontSize: 18, verticalAlign: "middle", mr: 1 }} />
          Built with trust. Powered by NomiAI.
        </Typography>
      </Box>
    </Box>
  );
}
