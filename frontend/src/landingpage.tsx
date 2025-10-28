import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import FrontPage from "./assets/FrontPage.png"; // adjust path if needed

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ width: "100%", color: "#1a1a1a" }}>
      {/* HERO SECTION with IMAGE */}
      <Box
        sx={{
          position: "relative",
          height: "100vh",
          width: "100%",
          backgroundImage: `url(${FrontPage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "#FFF8E1",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* Navbar */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 6,
            py: 3,
          }}
        >
          <Typography variant="h5" fontWeight={700}>
            NomiAI
          </Typography>
          <Box>
            <Button color="inherit" onClick={() => navigate("/signin")}>
              Sign In
            </Button>
            <Button
              variant="outlined"
              sx={{ ml: 2, borderColor: "#fff", color: "#fff" }}
              onClick={() => navigate("/signup")}
            >
              Get Started
            </Button>
                        <Button color="inherit" onClick={() => navigate("/signin")}>
              Sign In
            </Button>
            <Button
              variant="outlined"
              sx={{ ml: 2, borderColor: "#fff", color: "#fff" }}
              onClick={() => navigate("/LLM")}
            >
             LLM
            </Button>
          </Box>
        </Box>

        {/* Hero Text */}
        <Box sx={{ px: 8, pb: 12, maxWidth: 700 }}>
          <Typography variant="h2" fontWeight={700}>
            Stay Compliant. Stay Ahead.
          </Typography>
          <Typography variant="h6" sx={{ mt: 2, opacity: 0.9 }}>
            Deep expertise. Instant analysis. AI-powered compliance insights.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 3 }}
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </Button>
        </Box>
      </Box>

      {/* SECOND SECTION — plain background */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 6,
          px: 8,
          py: 12,
          backgroundColor: "#fdf8f3",
        }}
      >
        {/* Left Column */}
        <Box sx={{ flex: "1 1 400px", maxWidth: 500 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Welcome to Nomi AI
          </Typography>

          <Typography variant="body1" sx={{ opacity: 0.9, lineHeight: 1.8 }}>
            Nomi AI helps businesses stay compliant in a world that moves fast.
            We connect artificial intelligence with real-world regulations,
            allowing companies to detect compliance risks before they happen.
            Through automation, Nomi continuously monitors documents, policies,
            and operations — helping teams stay aligned with local and
            international standards.
          </Typography>

          <Typography variant="body1" sx={{ mt: 3, opacity: 0.9, lineHeight: 1.8 }}>
            Our platform doesn’t just check boxes — it builds trust. By ensuring
            every part of your business operates transparently and responsibly,
            Nomi gives you the confidence to scale without compliance slowdowns.
          </Typography>

          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 4 }}
            onClick={() => navigate("/employees")}
          >
            employees
          </Button>
        </Box>

        {/* Right Column */}
        <Box sx={{ flex: "1 1 400px", maxWidth: 500 }}>
          <Typography variant="body1" sx={{ opacity: 0.9, lineHeight: 1.8 }}>
            We believe compliance should empower — not limit — innovation.
            That’s why Nomi AI integrates AI-driven analysis, competitor
            benchmarking, and predictive monitoring into one intuitive
            dashboard. Businesses can instantly compare their compliance
            standing, identify red flags, and receive actionable
            recommendations in real time.
          </Typography>

          <Typography variant="body1" sx={{ mt: 3, opacity: 0.9, lineHeight: 1.8 }}>
            Whether you're a startup building credibility or an enterprise
            managing thousands of records, Nomi AI ensures your compliance story
            stays strong, measurable, and future-ready.
          </Typography>


          <Typography variant="h6" sx={{ mt: 4, fontWeight: 600 }}>
            “Stay Compliant. Stay Trusted. Stay Ahead.”
          </Typography>
        </Box> {/* ✅ closes RIGHT COLUMN */}
      </Box>   {/* ✅ closes SECOND SECTION */}

      {/* HOW IT WORKS SECTION */}
      <Box
        sx={{
          textAlign: "center",
          py: 12,
          px: 6,
          backgroundColor: "#f8f6f2",
          color: "#1a1a1a",
        }}
      >
        <Typography variant="h4" fontWeight={700} gutterBottom>
          How Nomi Works
        </Typography>
        <Typography
          variant="body1"
          sx={{
            maxWidth: 700,
            mx: "auto",
            mb: 6,
            opacity: 0.9,
            lineHeight: 1.8,
          }}
        >
          Nomi AI automates compliance from start to finish — helping businesses
          stay secure, transparent, and audit-ready at every stage. Our system
          combines real-time monitoring, intelligent analysis, and continuous
          tracking to ensure you never fall behind on compliance standards.
        </Typography>

        {/* Feature Steps */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          {/* Step 1: Scan */}
          <Box sx={{ maxWidth: 300, textAlign: "center" }}>
            <Typography variant="h3" sx={{ mb: 2 }}>
              🔍
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              Scan
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
              Instantly detect compliance gaps across your internal policies,
              reports, and external documentation using AI-based scanning.
            </Typography>
          </Box>

          {/* Step 2: Analyze */}
          <Box sx={{ maxWidth: 300, textAlign: "center" }}>
            <Typography variant="h3" sx={{ mb: 2 }}>
              ⚙️
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              Analyze
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
              Automatically prioritize risks and generate AI-driven insights
              that highlight what to fix first — saving time and avoiding
              penalties.
            </Typography>
          </Box>

          {/* Step 3: Track */}
          <Box sx={{ maxWidth: 300, textAlign: "center" }}>
            <Typography variant="h3" sx={{ mb: 2 }}>
              📊
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              Track
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
              Monitor your compliance status in real time with a centralized
              dashboard that keeps teams aligned and audit-ready year-round.
            </Typography>
          </Box>
        </Box>
      </Box> {/* ✅ closes HOW IT WORKS */}
      {/* ✅ closes MAIN container */}
      {/* FOOTER SECTION */}
<Box
  sx={{
    backgroundColor: "#fdf8f3",
    color: "#1a1a1a",
    py: 8,
    px: 6,
    borderTop: "1px solid #ddd",
  }}
>
  {/* PLATFORM PREVIEW SECTION */}
<Box
  sx={{
    textAlign: "center",
    py: 12,
    px: 6,
    backgroundColor: "#ffffff",
    color: "#1a1a1a",
  }}
>
  <Typography variant="h4" fontWeight={700} gutterBottom>
    Experience the Nomi AI Dashboard
  </Typography>
  <Typography
    variant="body1"
    sx={{
      maxWidth: 700,
      mx: "auto",
      mb: 6,
      opacity: 0.9,
      lineHeight: 1.8,
    }}
  >
    Nomi AI transforms complex regulations into clear, actionable insights.
    Our dashboard gives you a bird’s-eye view of your compliance posture —
    from internal audits to competitor benchmarks — all in one clean, visual
    interface designed for simplicity and precision.
  </Typography>

  {/* Screenshot / Mockup */}
  <Box
    component="img"
    src="/assets/dashboard-preview.png"
    alt="Nomi AI Dashboard Preview"
    sx={{
      width: "100%",
      maxWidth: 900,
      borderRadius: 4,
      boxShadow: "0 8px 40px rgba(0,0,0,0.1)",
    }}
  />

  <Button
    variant="contained"
    color="primary"
    sx={{ mt: 6 }}
    onClick={() => navigate("/dashboard")}
  >
    Explore the Dashboard
  </Button>
</Box>

  {/* Top Row */}
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 4,
      maxWidth: 1000,
      mx: "auto",
    }}
  >
    {/* Left: Logo + Motto */}
    <Box>
      <Typography variant="h5" fontWeight={700}>
        Nomi AI
      </Typography>
      <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
        Deep expertise, decisive compliance intelligence.
      </Typography>
    </Box>

    {/* Center: Contact Info */}
    <Box>
      <Typography variant="body2">hello@nomiai.com</Typography>
      <Typography variant="body2">(555) 123-4567</Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        123 Innovation Way<br />
        Suite 101<br />
        San Francisco, CA 94105
      </Typography>
    </Box>

    {/* Right: Social Links */}
    <Box>
      <Typography
        variant="body2"
        sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
      >
        LinkedIn
      </Typography>
      <Typography
        variant="body2"
        sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
      >
        Twitter
      </Typography>
      <Typography
        variant="body2"
        sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
      >
        Instagram
      </Typography>
    </Box>
  </Box>

  {/* Bottom Row */}
  <Box sx={{ textAlign: "center", mt: 6 }}>
    <Typography variant="body2" sx={{ opacity: 0.7 }}>
      © 2025 Nomi AI. All rights reserved.
    </Typography>
  </Box>
</Box>

    </Box>   
  );
}