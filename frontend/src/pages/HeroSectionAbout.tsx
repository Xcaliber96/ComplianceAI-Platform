import { Box, Typography, Button } from "@mui/material";
import { motion } from "framer-motion";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import heroImg from "../assets/adventure.avif";

export default function AdventureSection() {
  // 🧭 Smooth scroll handler
  const scrollToMission = () => {
    const section = document.getElementById("mission-vision");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Box sx={{ width: "100%", height: "100vh", position: "relative" }}>
      {/* 🧭 Top Navigation */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: { xs: 4, md: 8 },
          py: 3,
          zIndex: 3,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)",
        }}
      >
        <Typography
          sx={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 900,
            color: "#fff",
            fontSize: { xs: "1.4rem", md: "1.7rem" },
            letterSpacing: "-0.5px",
          }}
        >
          NOMIAI
        </Typography>

        <Box sx={{ display: "flex", gap: 3 }}>
          {["Home", "Contact"].map((item) => (
            <Button
              key={item}
              sx={{
                color: "#fff",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "1rem",
                letterSpacing: "-0.2px",
                transition: "all 0.3s ease",
                "&:hover": { color: "#e6e6e6", transform: "translateY(-1px)" },
              }}
            >
              {item}
            </Button>
          ))}
        </Box>
      </Box>

      {/* 🌄 Background Hero Image */}
      <Box
        sx={{
          width: "100%",
          height: "100vh",
          backgroundImage: `url(${heroImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* 🌙 Overlay */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)",
            zIndex: 1,
          }}
        />

        {/* ✨ Text + CTA */}
        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            color: "#fff",
            px: { xs: 3, md: 6 },
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              fontFamily: "'Montserrat', sans-serif",
              mb: 2,
              fontSize: { xs: "2.2rem", md: "3.8rem" },
              letterSpacing: "-0.5px",
              lineHeight: 1.15,
              textShadow: "0px 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            We shape the future of trust.
          </Typography>

          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: "1.1rem", md: "1.35rem" },
              fontWeight: 500,
              color: "rgba(255,255,255,0.92)",
              maxWidth: "680px",
              mx: "auto",
              mb: 5,
              lineHeight: 1.75,
              letterSpacing: "-0.15px",
            }}
          >
            NomiAI combines design thinking with intelligent compliance insights
            to help companies build clarity, precision, and resilience — shaping
            a smarter, safer business future.
          </Typography>

          {/* 🔽 Scroll Button with animation */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          >
            <Button
              onClick={scrollToMission}
              variant="contained"
              endIcon={<KeyboardArrowDownIcon />}
              sx={{
                backgroundColor: "#fff",
                color: "#111",
                fontWeight: 700,
                textTransform: "none",
                px: 5,
                py: 1.8,
                borderRadius: "40px",
                fontSize: "1.05rem",
                letterSpacing: "-0.2px",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                  transform: "translateY(-3px)",
                },
              }}
            >
              Explore Our Mission & Vision
            </Button>
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
}
