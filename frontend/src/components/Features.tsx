import { Box, Typography, Button } from "@mui/material";
import CustomButton from "./Button/CustomButton";

export default function FeatureSection() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        backgroundColor: "#4b504d",
        pt: "10vh",
      }}
    >
      {/* 🏙️ Top Image Background Section */}
      <Box
        sx={{
          height: "75vh",
          width: "95%",
          backgroundImage: `url(https://images.unsplash.com/photo-1758391407668-6882230617ee?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=1170)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          mb: "8vh",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ✨ Text Block (left side) */}
        <Box
          sx={{
            position: "absolute",
            top: "65%",
            left: "0%",
            transform: "translateY(-50%)",
            color: "#fff",
            zIndex: 2,
            maxWidth: "1000px",
            px: { xs: 3, md: 6 },
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 400,
              mb: 3,
              lineHeight: 1.15,
              letterSpacing: "-0.5px",
              color: "#ffffff",
              textTransform: "uppercase",
              textShadow: "0 3px 10px rgba(0,0,0,0.7)",
            }}
          >
            Join the new era of AI-powered compliance — built for leaders who
            demand clarity, control, and confidence in every regulatory
            decision.
          </Typography>

          <Typography
            variant="h6"
            sx={{
              mb: 5,
              lineHeight: 1.6,
              color: "#f5f5f5",
              textShadow: "0 2px 6px rgba(255, 255, 255, 0.4)",
            }}
          ></Typography>

          <CustomButton text="Learn More" variant="outlinedText" />
        </Box>
      </Box>

    </Box>
    
  );
}
