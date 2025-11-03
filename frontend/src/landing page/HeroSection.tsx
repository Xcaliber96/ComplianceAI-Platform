import { Box, Typography, Button } from "@mui/material";
import { motion } from "framer-motion";
import DashboardPreview from "../assets/ScreenShot1.png";

export default function HeroSection() {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100vh", // Full screen height
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: { xs: 4, md: 10 },
        background: "linear-gradient(180deg, #ffffff 0%, #f5f8ff 100%)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ✅ Elegant Gradient Glow (artistic lighting) */}
      <Box
        sx={{
          position: "absolute",
          top: "10%",
          left: "60%",
          width: "500px",
          height: "500px",
          background:
            "radial-gradient(circle at center, rgba(25,118,210,0.25), transparent 70%)",
          filter: "blur(120px)",
          zIndex: 0,
        }}
      />

      {/* 🔹 Left Section: Headline + Text */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        style={{ zIndex: 2 }}
      >
        <Box sx={{ maxWidth: 550 }}>
          <Typography
            variant="h2"
            fontWeight={800}
            sx={{
              lineHeight: 1.1,
              color: "#0a192f",
              fontSize: { xs: "2.4rem", md: "3.5rem" },
            }}
          >
            NomiAI — The future of <br />
            <Box component="span" sx={{ color: "#1976d2" }}>
              compliance & risk
            </Box>{" "}
            management
          </Typography>

          <Typography
            variant="body1"
            sx={{
              mt: 3,
              mb: 5,
              color: "rgba(0,0,0,0.7)",
              maxWidth: 480,
              fontSize: "1.1rem",
              lineHeight: 1.8,
            }}
          >
            Don’t just “check the box”  gain real-time visibility into your
            compliance posture and make smarter, faster, data-driven decisions
            powered by AI.
          </Typography>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {/* Primary button */}
            <Button
              variant="contained"
              sx={{
                px: 5,
                py: 1.5,
                fontSize: "1.05rem",
                borderRadius: "12px",
                background: "linear-gradient(90deg, #1976d2, #0d47a1)",
                boxShadow: "0 10px 25px rgba(25,118,210,0.3)",
                textTransform: "none",
                fontWeight: 600,
                "&:hover": {
                  background: "linear-gradient(90deg, #1565c0, #0d47a1)",
                  transform: "translateY(-2px)",
                  transition: "all 0.3s ease",
                },
              }}
            >
              Learn More
            </Button>

            {/* Secondary button */}
            <Button
              variant="outlined"
              sx={{
                px: 5,
                py: 1.5,
                fontSize: "1.05rem",
                borderRadius: "12px",
                borderColor: "#1976d2",
                color: "#1976d2",
                fontWeight: 600,
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "rgba(25, 118, 210, 0.08)",
                  borderColor: "#0d47a1",
                  transform: "translateY(-2px)",
                  transition: "all 0.3s ease",
                },
              }}
            >
              Get Started
            </Button>
          </Box>

          
        </Box>
      </motion.div>

      {/* 🔹 Right Section: Dashboard Preview */}
      <motion.div
        initial={{ opacity: 0, x: 80 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
        style={{ zIndex: 2 }}
      >
        <Box
          sx={{
            position: "relative",
            width: { xs: "90%", md: "48vw" },
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Floating MacBook image */}
          <motion.img
            src={DashboardPreview}
            alt="Dashboard Preview"
            style={{
              width: "100%",
              height: "auto",
              objectFit: "contain",
              transform: "scale(1.25)",
              filter:
                "contrast(1.2) brightness(1.05) drop-shadow(0px 40px 60px rgba(0,0,0,0.25))",
            }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 1.2,
              ease: "easeOut",
            }}
          />

          {/* Soft bottom light reflection */}
          <Box
            sx={{
              position: "absolute",
              bottom: "-10%",
              width: "100%",
              height: "150px",
              background:
                "radial-gradient(ellipse at center, rgba(25,118,210,0.1), transparent 70%)",
              filter: "blur(80px)",
              zIndex: 1,
            }}
          />
        </Box>
      </motion.div>
    </Box>
  );
}
