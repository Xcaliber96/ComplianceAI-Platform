// import {  Button, Link } from "@mui/material";
import {Box, Typography} from "@mui/material";
import { LinkedIn, Twitter, Instagram } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export default function DownBar() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        backgroundColor: "#0d1117", 
        color: "#f1f1f1",
        py: { xs: 8, md: 10 },
        px: { xs: 4, md: 12 },
        width: "100%",
      }}
    >
      {/* 🌐 MAIN FOOTER GRID */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: { xs: 6, md: 10 },
          maxWidth: 1300,
          mx: "auto",
        }}
      >
        {/* 🧭 COLUMN 1 — Brand Overview */}
        <Box sx={{ flex: 1, minWidth: 250 }}>
          <Typography variant="h5" fontWeight={800} sx={{ color: "#ffffff" }}>
            NomiAI
          </Typography>
          <Typography
            variant="body2"
            sx={{
              mt: 2,
              opacity: 0.8,
              color: "#c9d1d9",
              lineHeight: 1.8,
              maxWidth: 320,
            }}
          >
            NomiAI is an intelligent compliance governance platform built for
            startups and enterprises. We combine automation, analytics, and AI
            to help organizations detect, manage, and prevent compliance risks
            before they happen.
          </Typography>


        </Box>

        {/* 📚 COLUMN 2 — Quick Links */}
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Quick Links
          </Typography>
          {[
            { text: "About Us", link: "/about" },
            { text: "Careers", link: "/careers" },
            { text: "Compliance Solutions", link: "/solutions" },
            { text: "Resources", link: "/resources" },
            { text: "Contact", link: "/contact" },
          ].map((item) => (
            <Typography
              key={item.text}
              variant="body2"
              sx={{
                my: 1,
                color: "#c9d1d9",
                cursor: "pointer",
                "&:hover": { color: "#4A90E2" },
              }}
              onClick={() => navigate(item.link)}
            >
              {item.text}
            </Typography>
          ))}
        </Box>

        {/* 📞 COLUMN 3 — Contact Info */}
        <Box sx={{ flex: 1, minWidth: 250 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Contact Us
          </Typography>
          <Typography variant="body2" sx={{ color: "#e6edf3", mb: 1 }}>
            moust1am@cmich.edu
          </Typography>
          <Typography variant="body2" sx={{ color: "#e6edf3", mb: 1 }}>
            (989) 444-4360
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 1, color: "#9ba1a6", lineHeight: 1.7 }}
          >
            410 Brooklyn St, Suite 10 <br />
            Mount Pleasant, MI 48858
          </Typography>

          <Box sx={{ display: "flex", gap: 3, mt: 3 }}>
            <LinkedIn
              sx={{
                cursor: "pointer",
                color: "#f1f1f1",
                transition: "0.3s",
                "&:hover": { color: "#0077B5", transform: "scale(1.2)" },
              }}
            />
            <Twitter
              sx={{
                cursor: "pointer",
                color: "#f1f1f1",
                transition: "0.3s",
                "&:hover": { color: "#1DA1F2", transform: "scale(1.2)" },
              }}
            />
            <Instagram
              sx={{
                cursor: "pointer",
                color: "#f1f1f1",
                transition: "0.3s",
                "&:hover": { color: "#E1306C", transform: "scale(1.2)" },
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* ⚖️ DIVIDER */}
      <Box
        sx={{
          mt: 8,
          borderTop: "1px solid rgba(255,255,255,0.1)",
          width: "100%",
        }}
      />

      {/* 🪪 COPYRIGHT BAR */}
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography variant="body2" sx={{ color: "#9ba1a6" }}>
          © {new Date().getFullYear()} NomiAI. All rights reserved. | Designed
          for compliance leaders and innovators worldwide.
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "#4A90E2", mt: 1, fontSize: "0.9rem" }}
        >
          “Stay Compliant. Stay Trusted. Stay Ahead.”
        </Typography>
      </Box>
    </Box>
  );
}
