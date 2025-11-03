import React from "react";
import { Box, Typography, Card, CardContent, Divider, Grid, Button } from "@mui/material";

export default function PricingPage() {
  return (
    <Box sx={{ maxWidth: 900, mx: "auto", py: 6 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Pricing & Plans
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Flexible and transparent pricing for supply chain compliance & competitive intelligence. Designed to fit small, medium, and growing businesses.
      </Typography>
      <Divider sx={{ my: 3 }} />
      {/* Pricing Tiers */}
      <Grid container spacing={4}>
        {/* Starter Plan */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 4, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Starter
              </Typography>
              <Typography fontWeight={700} variant="h4" color="primary" gutterBottom>
                $2,999/mo
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2">Ideal for small supply chains and new compliance teams.</Typography>
              <ul>
                <li>Up to 10 suppliers tracked</li>
                <li>Basic compliance dashboard</li>
                <li>Automated document retrieval</li>
                <li>Email alerts for key regulation changes</li>
              </ul>
              <Button variant="outlined" color="primary" fullWidth>Get Started</Button>
            </CardContent>
          </Card>
        </Grid>
        {/* Business Plan */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 4, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Business
              </Typography>
              <Typography fontWeight={700} variant="h4" color="primary" gutterBottom>
                $8,499/mo
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2">Best for mid-sized supply chains and proactive compliance monitoring.</Typography>
              <ul>
                <li>Up to 50 suppliers tracked</li>
                <li>Full compliance and audit dashboard</li>
                <li>Evidence completion and risk reporting</li>
                <li>Competitive intelligence alerts</li>
                <li>API integrations (ERP, cloud storage)</li>
              </ul>
              <Button variant="contained" color="primary" fullWidth>Choose Business</Button>
            </CardContent>
          </Card>
        </Grid>
        {/* Enterprise Plan */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 4, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Enterprise
              </Typography>
              <Typography fontWeight={700} variant="h4" color="primary" gutterBottom>
                Custom
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2">For large supply chains with global compliance challenges.</Typography>
              <ul>
                <li>Unlimited suppliers and users</li>
                <li>Region/industry custom dashboards</li>
                <li>Automated audits & remediation workflows</li>
                <li>Dedicated onboarding & support</li>
                <li>Competitive insights across multiple geographies</li>
              </ul>
              <Button variant="outlined" color="primary" fullWidth>Contact Sales</Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Divider sx={{ my: 5 }} />
      <Typography variant="h5" fontWeight={700} gutterBottom>
        All plans include:
      </Typography>
      <ul>
        <li>AI-powered document scanning and compliance comparison</li>
        <li>Access to trend dashboards and risk maps</li>
        <li>Fast onboarding and responsive support</li>
        <li>Ongoing updates as supply chain features expand!</li>
      </ul>
    </Box>
  );
}
