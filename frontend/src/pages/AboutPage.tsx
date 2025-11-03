import { Box, Container, Paper, Typography, Divider } from "@mui/material";

export default function AboutPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        px: 0,
        py: 0,
        // Soft subtle blue gradient
        background: "linear-gradient(120deg, #f2f6fc 0%, #fff 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
        <Paper
          elevation={4}
          sx={{
            borderRadius: 5,
            p: { xs: 3, md: 6 },
            background: "#fff",
            backdropFilter: "blur(4px)",
            boxShadow: "0 8px 24px rgba(0,80,160,0.07)",
          }}
        >
          <Typography variant="h4" fontWeight={800} sx={{ mb: 3, textAlign: "center", color: "primary" }}>
            About NomiAI
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="h6" fontWeight={700} sx={{ mt: 2 }}>
            The Mission
          </Typography>
          <Typography paragraph>
            NomiAI exists to make supply chains smarter, safer, and more competitive. Our AI-powered platform empowers businesses to manage regulatory compliance, supplier risk, and competitive intelligence—at every tier of the supply chain, for organizations of all sizes.
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" fontWeight={700}>
            Our Story
          </Typography>
          <Typography paragraph>
            Founded by a global team of entrepreneurs and AI practitioners, NomiAI was inspired by the challenges faced by supply chain operators and compliance managers worldwide...
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" fontWeight={700}>
            Why Supply Chain Compliance?
          </Typography>
          <Typography paragraph>
            Modern supply chains stretch across borders and industries, making regulatory and competitive risks hard to track. A small oversight can lead to lost business, fines, or reputational damage...
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" fontWeight={700}>
            How We Deliver Value
          </Typography>
          <Typography paragraph>
            Our AI engine automates monitoring of supply chain documents, audits, and government regulations...
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" fontWeight={700}>
            Join Us
          </Typography>
          <Typography paragraph>
            Supply chain success starts with compliance and awareness. Partner with NomiAI to build a smarter, safer, and more competitive supply chain—powered by AI.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
