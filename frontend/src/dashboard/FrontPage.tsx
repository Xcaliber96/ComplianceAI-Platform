import React from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Stack,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import {
  CloudUpload,
  Assessment,
  Assignment,
  Group,
  BarChart,
  Shield,
  CompareArrows,
} from "@mui/icons-material";

export default function FrontPage() {
  const navigate = useNavigate();
  const theme = useTheme();

  const features = [
    {
      title: "Upload & Retrieve Files",
      desc: "Import internal policies and compliance documents from your device, Google Drive, or SharePoint.",
      icon: <CloudUpload sx={{ fontSize: 34 }} />,
      path: "/dashboard/upload",
      action: "Open Tools",
    },
    {
      title: "Run AI Audit",
      desc: "Analyze policies using AI to detect compliance gaps and automatically generate obligations.",
      icon: <Assessment sx={{ fontSize: 34 }} />,
      path: "/dashboard/audit",
      action: "Start Audit",
    },
    {
      title: "Manage Tasks",
      desc: "Assign obligations, track progress, and coordinate remediation workflows across teams.",
      icon: <Assignment sx={{ fontSize: 34 }} />,
      path: "/dashboard/tasks",
      action: "View Tasks",
    },
    {
      title: "Manage Suppliers",
      desc: "Onboard and verify third-party vendors. Link suppliers to compliance evidence and obligations.",
      icon: <Group sx={{ fontSize: 34 }} />,
      path: "/dashboard/suppliers",
      action: "Manage Suppliers",
    },
    {
      title: "Analyze Competitors",
      desc: "Review competitors’ regulatory filings and generate AI-powered market insights.",
      icon: <CompareArrows sx={{ fontSize: 34 }} />,
      path: "/dashboard/competitors",
      action: "Analyze",
    },
    {
      title: "View Reports",
      desc: "Access audit summaries, compliance metrics, and organizational analytics.",
      icon: <BarChart sx={{ fontSize: 34 }} />,
      path: "/dashboard/results",
      action: "Open Reports",
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: { xs: 3, md: 8 },
        py: { xs: 6, md: 10 },
        animation: "fadeIn 0.6s ease",
      }}
    >
      {/* Header Section */}
      <Box textAlign="center" mb={8}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            mb: 1,
            color: theme.palette.text.primary,
            letterSpacing: "0.5px",
          }}
        >
          NomiAI Compliance Dashboard
        </Typography>

        <Typography
          variant="subtitle1"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: "15px",
            maxWidth: "620px",
            margin: "0 auto",
          }}
        >
          AI-powered compliance automation built for modern, audit-ready
          organizations.
        </Typography>
      </Box>

      {/* Feature Cards */}
      <Grid container spacing={4} justifyContent="center">
        {features.map((item, idx) => (
          <Grid item xs={12} sm={6} md={4} key={idx}>
            <Card
              sx={{
                height: "100%",
                borderRadius: "16px",
                background: theme.palette.background.paper,
                border: `1px solid ${theme.palette.grey[300]}`,
                boxShadow: "0px 4px 20px rgba(0,0,0,0.05)",
                cursor: "pointer",
                transition: "all 0.35s ease",
                "&:hover": {
                  transform: "translateY(-6px) scale(1.015)",
                  boxShadow: "0px 10px 30px rgba(0,0,0,0.08)",
                },
              }}
              onClick={() => navigate(item.path)}
            >
              <CardContent>
                <Stack spacing={2.5} alignItems="center" textAlign="center">
                  {/* Icon bubble */}
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      backgroundColor: theme.palette.primary.light,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#0f172a",
                      mb: 1,
                    }}
                  >
                    {item.icon}
                  </Box>

                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color:"#0f172a",
                    }}
                  >
                    {item.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      lineHeight: 1.5,
                      minHeight: 55,
                    }}
                  >
                    {item.desc}
                  </Typography>

                  <Button
                    variant="contained"
                    sx={{
                      mt: 1,
                      borderRadius: "8px",
                      textTransform: "none",
                      backgroundColor: "#0f172a",
                      px: 3,
                      py: 1,
                      fontWeight: 600,
                      "&:hover": {
                        backgroundColor: theme.palette.primary.dark,
                      },
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

      {/* Footer */}
      <Box textAlign="center" mt={10}>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          <Shield sx={{ fontSize: 18, verticalAlign: "middle", mr: 1 }} />
          Built for trust. Powered by NomiAI.
        </Typography>
      </Box>

      {/* Fade In Animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0px); }
        }
      `}</style>
    </Box>
  );
}
