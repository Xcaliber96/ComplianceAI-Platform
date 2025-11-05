import React, { useState } from "react";
import DownBar from "../components/DownBar";
import TopBar from "../components/TopBar";
import {
  Box,
  Typography,
  Grid,
  Button,
  Card,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const plans = [
    {
      name: "Essential",
      price: billingCycle === "monthly" ? 2999 : 2999 * 12 * 0.8,
      description: "Ideal for small supply chains and new compliance teams.",
      features: [
        "Up to 10 suppliers tracked",
        "Basic compliance dashboard",
        "Automated document retrieval",
        "Email alerts for key regulation changes",
      ],
      highlighted: false,
    },
    {
      name: "Perform",
      price: billingCycle === "monthly" ? 8499 : 8499 * 12 * 0.8,
      description: "Best for mid-sized supply chains and proactive compliance monitoring.",
      features: [
        "Up to 50 suppliers tracked",
        "Full compliance and audit dashboard",
        "Evidence completion and risk reporting",
        "Competitive intelligence alerts",
        "API integrations (ERP, cloud storage)",
      ],
      highlighted: true,
      label: "Most Popular",
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large supply chains with global compliance challenges.",
      features: [
        "Unlimited suppliers and users",
        "Region/industry custom dashboards",
        "Automated audits & remediation workflows",
        "Dedicated onboarding & support",
        "Competitive insights across multiple geographies",
      ],
      highlighted: false,
    },
  ];

  const comparison = [
    {
      feature: "Suppliers Tracked",
      Essential: "Up to 10",
      Perform: "Up to 50",
      Enterprise: "Unlimited",
    },
    {
      feature: "Compliance Dashboard",
      Essential: "Basic",
      Perform: "Full",
      Enterprise: "Custom",
    },
    {
      feature: "Automated Document Retrieval",
      Essential: true,
      Perform: true,
      Enterprise: true,
    },
    {
      feature: "Risk & Evidence Reporting",
      Essential: false,
      Perform: true,
      Enterprise: true,
    },
    {
      feature: "Competitor Intelligence Alerts",
      Essential: false,
      Perform: true,
      Enterprise: true,
    },
    {
      feature: "API Integrations (ERP, Cloud)",
      Essential: false,
      Perform: true,
      Enterprise: true,
    },
    {
      feature: "Custom Dashboards",
      Essential: false,
      Perform: false,
      Enterprise: true,
    },
    {
      feature: "Dedicated Support",
      Essential: false,
      Perform: true,
      Enterprise: true,
    },
  ];

  return (
    <>
      {/* 🔹 Pricing Section */}
      <TopBar/>
      <Box
      
        sx={{
          backgroundColor: "#f9fafc",
          minHeight: "100vh",
          py: { xs: 10, md: 14 },
          px: { xs: 3, md: 10 },
        }}
      >
        {/* Header */}
        <Box textAlign="center" mb={6}>
          <Typography
            variant="h4"
            sx={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 800,
              mb: 1,
            }}
          >
            Pricing & Plans
          </Typography>
          <Typography
            sx={{
              fontFamily: "'Montserrat', sans-serif",
              color: "rgba(0,0,0,0.7)",
              maxWidth: "600px",
              mx: "auto",
              mb: 4,
            }}
          >
            Flexible and transparent pricing — pay monthly or yearly and save 20%.
          </Typography>

          {/* Toggle buttons */}
          <Box
            sx={{
              display: "inline-flex",
              backgroundColor: "#fff",
              borderRadius: "30px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            }}
          >
            <Button
              onClick={() => setBillingCycle("yearly")}
              sx={{
                px: 3,
                py: 1,
                borderRadius: "30px",
                color: billingCycle === "yearly" ? "#fff" : "#333",
                backgroundColor:
                  billingCycle === "yearly" ? "#111" : "transparent",
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Yearly <Typography ml={1} sx={{ opacity: 0.7 }}>–20%</Typography>
            </Button>
            <Button
              onClick={() => setBillingCycle("monthly")}
              sx={{
                px: 3,
                py: 1,
                borderRadius: "30px",
                color: billingCycle === "monthly" ? "#fff" : "#333",
                backgroundColor:
                  billingCycle === "monthly" ? "#111" : "transparent",
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Monthly
            </Button>
          </Box>
        </Box>

        {/* Pricing Cards */}
        <Grid container spacing={4} justifyContent="center">
          {plans.map((plan) => (
            <Grid item xs={12} sm={6} md={4} key={plan.name}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: "20px",
                  boxShadow: plan.highlighted
                    ? "0 8px 30px rgba(0,0,0,0.15)"
                    : "0 4px 15px rgba(0,0,0,0.05)",
                  backgroundColor: plan.highlighted ? "#0b0b0b" : "#fff",
                  color: plan.highlighted ? "#fff" : "#111",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
                  },
                }}
              >
                {plan.label && (
                  <Chip
                    label={plan.label}
                    color="success"
                    sx={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      backgroundColor: "#00c853",
                      color: "#fff",
                    }}
                  />
                )}

                <Box sx={{ p: 4 }}>
                  <Typography variant="h6" fontWeight={700} mb={1}>
                    {plan.name}
                  </Typography>

                  {/* Price */}
                  <Typography variant="h4" fontWeight={800} mb={1}>
                    {typeof plan.price === "number"
                      ? `$${plan.price.toLocaleString()}`
                      : plan.price}
                    {typeof plan.price === "number" && (
                      <Typography
                        component="span"
                        sx={{
                          fontSize: "1rem",
                          fontWeight: 400,
                          ml: 0.5,
                        }}
                      >
                        /mo
                      </Typography>
                    )}
                  </Typography>

                  <Typography
                    sx={{
                      color: plan.highlighted
                        ? "rgba(255,255,255,0.8)"
                        : "rgba(0,0,0,0.6)",
                      mb: 2,
                      fontSize: "0.95rem",
                    }}
                  >
                    {plan.description}
                  </Typography>

                  <Button
                    variant="contained"
                    fullWidth
                    sx={{
                      backgroundColor: "#4f46e5",
                      color: "#fff",
                      fontWeight: 600,
                      textTransform: "none",
                      borderRadius: "10px",
                      py: 1.2,
                      mb: 3,
                      "&:hover": { backgroundColor: "#4338ca" },
                    }}
                  >
                    {plan.name === "Enterprise" ? "Contact Sales" : "Purchase Plan"}
                  </Button>

                  <Divider sx={{ mb: 2 }} />

                  <Typography variant="subtitle2" mb={1.5} fontWeight={600}>
                    Includes:
                  </Typography>
                  {plan.features.map((feature, i) => (
                    <Box key={i} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <CheckCircleIcon
                        sx={{
                          fontSize: "1.1rem",
                          mr: 1,
                          color: plan.highlighted ? "#4ade80" : "#22c55e",
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: "0.95rem",
                          color: plan.highlighted
                            ? "rgba(255,255,255,0.85)"
                            : "rgba(0,0,0,0.75)",
                        }}
                      >
                        {feature}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Comparison Table */}
        <Box mt={10}>
          <Typography
            variant="h5"
            textAlign="center"
            fontWeight={800}
            fontFamily="'Montserrat', sans-serif"
            mb={3}
          >
            Compare Plans
          </Typography>
          <Box sx={{ overflowX: "auto", backgroundColor: "#fff", borderRadius: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Feature</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Essential</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Perform</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Enterprise</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comparison.map((row) => (
                  <TableRow key={row.feature}>
                    <TableCell sx={{ fontWeight: 600 }}>{row.feature}</TableCell>
                    {["Essential", "Perform", "Enterprise"].map((col) => (
                      <TableCell key={col} align="center">
                        {typeof row[col as keyof typeof row] === "boolean" ? (
                          row[col as keyof typeof row] ? (
                            <CheckCircleIcon sx={{ color: "#22c55e" }} />
                          ) : (
                            <CloseIcon sx={{ color: "rgba(0,0,0,0.3)" }} />
                          )
                        ) : (
                          <Typography sx={{ fontWeight: 500 }}>
                            {row[col as keyof typeof row]}
                          </Typography>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Box>
      </Box>

      {/* 🔹 Footer */}
      <DownBar />
    </>
  );
}
