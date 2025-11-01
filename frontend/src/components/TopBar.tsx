import { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { motion, useAnimation } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function TopBar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const controls = useAnimation(); // 🔹 motion controller

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY > 100) {
        setScrolled(true);
        controls.start({ y: -100, opacity: 0 }); // 🔹 slide up + fade out
      } else {
        setScrolled(false);
        controls.start({ y: 0, opacity: 1 }); // 🔹 reappear at top
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [controls]);

  return (
    <Box
      component={motion.div}
      animate={controls}
      initial={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        px: { xs: 4, md: 10 },
        py: 2,
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 100,
        backgroundColor: scrolled ? "rgba(255, 255, 255, 0.9)" : "#1976d2",
        color: scrolled ? "#0a192f" : "#fff",
        boxShadow: scrolled ? "0 4px 20px rgba(0,0,0,0.15)" : "none",
        backdropFilter: "blur(8px)",
        transition: "all 0.4s ease",
      }}
    >
      {/* Logo */}
      <Typography
        variant="h6"
        fontWeight={700}
        sx={{
          cursor: "pointer",
          "&:hover": { opacity: 0.8 },
        }}
        onClick={() => navigate("/")}
      >
        NomiAI
      </Typography>

      {/* Navigation Buttons */}
      <Box sx={{ display: "flex", gap: 2 }}>
        {["Features", "Pricing", "About"].map((label) => (
          <Button
            key={label}
            sx={{
              color: scrolled ? "#0a192f" : "#fff",
              fontWeight: 500,
              textTransform: "none",
              "&:hover": { opacity: 0.8 },
            }}
          >
            {label}
          </Button>
        ))}

        {/* ✅ Sign In Button */}
        <Button
          variant="contained"
          sx={{
            background: "linear-gradient(90deg, #1976d2, #0d47a1)",
            textTransform: "none",
            fontWeight: 600,
            boxShadow: "0 4px 14px rgba(25,118,210,0.3)",
            "&:hover": {
              background: "linear-gradient(90deg, #1565c0, #0d47a1)",
              transform: "translateY(-2px)",
            },
            transition: "all 0.3s ease",
          }}
          onClick={() => navigate("/signin")}
        >
          Sign In
        </Button>
      </Box>
    </Box>
  );
}
