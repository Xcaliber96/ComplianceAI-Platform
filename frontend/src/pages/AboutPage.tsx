import { Box, Container, Paper, Typography, Divider } from "@mui/material";
import DownBar from "../components/DownBar";

export default function AboutPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        background: "linear-gradient(120deg, #f2f6fc 0%, #fff 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Main content */}
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
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{ mb: 3, textAlign: "center", color: "primary" }}
          >
            About NomiAI
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="h6" fontWeight={700} sx={{ mt: 2 }}>
            The Mission
          </Typography>
          <Typography paragraph>
            NomiAI exists to make supply chains smarter, safer, and more competitive. 
            Our AI-powered platform empowers businesses to manage regulatory compliance, 
            supplier risk, and competitive intelligence—at every tier of the supply chain, 
            for organizations of all sizes.
          </Typography>
          {/* ... rest of your content */}
        </Paper>
      </Container>

      {/* 👇 Full-width footer */}
      <Box
        sx={{
          width: "100%",
          mt: "auto",
        }}
      >
        <DownBar />
      </Box>
    </Box>
  );
}
