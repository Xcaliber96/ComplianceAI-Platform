import React from "react";
import { Box, Typography, List, ListItem, Divider } from "@mui/material";

export default function FeaturesPage() {
  return (
    <Box sx={{ maxWidth: 800, mx: "auto", py: 6 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        NomiAI Supply Chain Features
      </Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        AI-powered Compliance and Competitive Intelligence for Modern Supply Chains
      </Typography>
      <Typography variant="body1" paragraph>
        Nomi is an AI-powered Compliance and Competitive Intelligence Platform designed to help supply chain businesses and teams of all sizes stay compliant, informed, and competitive while managing global supplier complexities.
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Core Supply Chain Capabilities:
      </Typography>
      <List>
        <ListItem>
          <b>All-in-One Smart Dashboard</b>: One unified view for all regulatory requirements, supplier risk profiles, audits, and competitive moves—across every region and supplier tier.
        </ListItem>
        <ListItem>
          <b>Built for Complex, Multi-Tier Supply Chains</b>: Nomi simplifies compliance monitoring, automates evidence collection, and adapts to dynamic supplier relationships—ideal for manufacturers, retailers, and logistics networks.
        </ListItem>
        <ListItem>
          <b>Visualize Everything, End-to-End</b>: Instantly see all regulations, supplier risks, incident history, audit results, and progress across your supply chain with interactive dashboards and maps.
        </ListItem>
      </List>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Why Two-Way Compliance is Critical for Supply Chains:
      </Typography>
      <List>
        <ListItem>
          <b>Regulatory Compliance Risks</b>: Suppliers (especially in different regions) may fail to meet changing regulatory standards, putting your company at risk.
        </ListItem>
        <ListItem>
          <b>Competitive Intelligence Gaps</b>: Nomi tracks your competitors’ certifications, filings, and regulatory actions. You get early alerts on market trends and competitor risks—vital for procurement and strategy.
        </ListItem>
      </List>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" fontWeight={600} gutterBottom>
        How NomiAI Works for Supply Chain Teams:
      </Typography>
      <List>
        <ListItem>
          <b>Smart Document Retrieval</b>: Automatically aggregates supplier documents (policies, certifications, contracts) from cloud sources, ERP systems, or procurement platforms.
        </ListItem>
        <ListItem>
          <b>AI Keyword & Regulation Matching</b>: Nomi scans every supply chain file, extracts key terms, and links them to the correct government or industry regulations.
        </ListItem>
        <ListItem>
          <b>Regulation Fetch & Comparison</b>: Finds official standards by country, state, and industry for each supplier, then compares to your documentation for compliance gaps.
        </ListItem>
        <ListItem>
          <b>Automated Risk Alerts & Recommendations</b>: If any supplier or region falls out of compliance, Nomi notifies responsible managers and suggests targeted remediation steps.
        </ListItem>
      </List>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Competitive Intelligence in the Supply Chain Context:
      </Typography>
      <List>
        <ListItem>
          <b>Monitor Competitor Compliance Actions</b>: See when key competitors update certifications, regulatory filings, or enter new markets  get actionable alerts before risks or opportunities escalate.
        </ListItem>
        <ListItem>
          <b>Trend Analysis & Growth Opportunities</b>: Spot emerging risks, supplier network trends, or industry changes that give your company an edge (or early warning).
        </ListItem>
      </List>
      <Divider sx={{ my: 2 }} />
      <Typography variant="body1" paragraph>
        <b>In Summary:</b> NomiAI protects supply chain organizations from regulatory failures and competitive neglect—helping you stay compliant, informed, and ahead in a fast-moving global market.
      </Typography>
    </Box>
  );
}
