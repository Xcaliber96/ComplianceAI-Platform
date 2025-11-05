import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";

export default function MissionVisionValuesSection() {
  return (
    <Box
      sx={{
        background: "linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)",
        color: "#000000",
        px: { xs: 4, md: 12 },
        py: { xs: 10, md: 14 },
        display: "flex",
        flexDirection: "column",
        gap: { xs: 10, md: 14 },
      }}
    >
      {[
        {
          title: "Our Mission",
          text: `We redefine how organizations achieve trust. NomiAI turns compliance into a strategic strength — giving leaders the clarity, foresight, and precision to act with confidence in every decision.`,
        },
        {
          title: "Our Vision",
          text: `To make integrity the most valuable currency in the world. We envision a future where intelligent compliance systems empower innovation, safeguard reputation, and elevate global standards of trust.`,
        },
        {
          title: "Our Values",
          text: `Integrity is our foundation. We lead with transparency, act with precision, and innovate with purpose — driving progress that earns trust and builds lasting impact.`,
        },
      ].map((section, index) => (
        <Box
          key={section.title}
          component={motion.div}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.15 }}
          viewport={{ once: true }}
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "flex-start",
            justifyContent: "space-between",
            borderLeft: "4px solid #111",
            pl: { xs: 3, md: 4 },
          }}
        >
          <Typography
            sx={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: "#111",
              mb: { xs: 3, md: 0 },
              flex: "0 0 25%",
            }}
          >
            {section.title}
          </Typography>

          <Typography
            sx={{
              flex: "0 0 70%",
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 400,
              lineHeight: 1.7,
              letterSpacing: "0.2px",
              color: "rgba(17,17,17,0.9)",
              fontSize: { xs: "1.2rem", md: "1.5rem" },
              maxWidth: "800px",
            }}
          >
            {section.text}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
