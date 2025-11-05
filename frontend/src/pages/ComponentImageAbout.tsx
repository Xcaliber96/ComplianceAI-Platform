import React from "react";
import { Box, Typography, Grid } from "@mui/material";
import monitorImg from "../assets/monitor.avif"; // adjust path if needed

const MonitoringSection: React.FC = () => {
  return (
    <>
      <Box
        sx={{
          position: "relative",
          width: "85%",
          mx: "auto",
          my: { xs: 8, md: 10 },
          overflow: "hidden",
        }}
      >
        {/* 🔹 Background Container */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: `url(${monitorImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            zIndex: 0,
          }}
        />

        {/* 🔹 Dark overlay for contrast */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.85) 100%)",
            zIndex: 1,
          }}
        />

        {/* 🔹 Text content stays the same */}
        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            maxWidth: "750px",
            color: "#fff",
            py: { xs: 10, md: 14 },
            px: { xs: 4, md: 8 },
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 800,
              mb: 3,
              fontSize: { xs: "2rem", md: "2.5rem" },
            }}
          >
            We Monitor
          </Typography>

          <Typography
            variant="body1"
            sx={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: "1.1rem",
              lineHeight: 1.8,
              mb: 3,
              color: "rgba(255,255,255,0.9)",
            }}
          >
            NomiAI constantly monitors regulatory frameworks, corporate policies,
            and competitor actions across the globe. From evolving financial
            standards to new data protection rules, we track every change that
            can impact your business.
          </Typography>

          {/* 🔹 Stats Grid */}
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {[
              { number: "195+", label: "Countries Tracked" },
              { number: "10K+", label: "Regulatory Sources Monitored" },
              { number: "500+", label: "Competitor Datasets Analyzed" },
            ].map((stat, index) => (
              <Grid item xs={12} sm={4} key={index}>
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 800,
                    color: "#fff",
                    mb: 1,
                  }}
                >
                  {stat.number}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "'Montserrat', sans-serif",
                    color: "rgba(255,255,255,0.85)",
                    letterSpacing: "0.5px",
                  }}
                >
                  {stat.label}
                </Typography>
              </Grid>
            ))}
          </Grid>

          <Typography
            variant="body1"
            sx={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: "1rem",
              lineHeight: 1.8,
              mt: 4,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            Our intelligent systems transform global compliance signals into clear,
            actionable insights — so you can anticipate changes, stay ahead of risks,
            and lead with integrity.
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          background: "linear-gradient(180deg, #ffffffff 0%, #ffffffff 100%)",
          color: "#fff",
        }}
      />
    </>
  );
};

export default MonitoringSection;
