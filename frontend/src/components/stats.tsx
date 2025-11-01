import { Box, Typography, Button } from "@mui/material";

export default function ComplianceStatsPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f9fafc", // ✅ clean white background with soft gray tone
        color: "#111",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        py: { xs: 10, md: 14 },
        px: { xs: 3, md: 8 },
      }}
    >
      {/* 🧭 Title Section */}
      <Box sx={{ textAlign: "center", mb: 10, mt: 4 }}>
        <Typography
          variant="h2"
          sx={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            color: "#111",
            mb: 3,
            letterSpacing: "-0.5px",
          }}
        >
          Compliance by the Numbers
        </Typography>

        {/* 🔵 Accent Line */}
        <Box
          sx={{
            width: "20px",
            height: "4px",
            background:
              "linear-gradient(90deg, #ffffffff 0%, #00B0FF 50%, #66CCFF 100%)",
            borderRadius: "4px",
            mx: "auto",
            mb: 6,
          }}
        />

        <Typography
          sx={{
            color: "#444",
            maxWidth: "850px",
            mx: "auto",
            fontSize: { xs: "1rem", md: "1.2rem" },
            lineHeight: 1.8,
          }}
        >
          NomiAI transforms compliance from a cost center into a source of
          confidence. Our platform tracks millions of regulatory changes,
          automates controls, and gives enterprises visibility — across every
          market, every day.
        </Typography>
      </Box>

      {/* 📊 Stats Grid */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-evenly",
          alignItems: "center",
          gap: { xs: 6, md: 0 },
          width: "100%",
          maxWidth: "1200px",
          textAlign: "center",
          mb: 10,
        }}
      >
        {[
          {
            number: "2.3M+",
            label: "Regulatory Documents Analyzed Yearly",
            color: "#007BFF",
            bg: "#E3F2FD",
          },
          {
            number: "120+",
            label: "Countries Monitored for Compliance",
            color: "#0288D1",
            bg: "#E1F5FE",
          },
          {
            number: "99.9%",
            label: "Data Accuracy Across Reports",
            color: "#5E35B1",
            bg: "#EDE7F6",
          },
          {
            number: "15K+",
            label: "Automated Alerts Processed Daily",
            color: "#00796B",
            bg: "#E0F2F1",
          },
        ].map((stat, i) => (
          <Box
            key={i}
            sx={{
              backgroundColor: stat.bg,
              borderRadius: "16px",
              p: { xs: 4, md: 5 },
              width: { xs: "85%", md: "23%" },
              transition: "all 0.35s ease",
              border: "1px solid transparent",
              "&:hover": {
                transform: "translateY(-8px)",
                border: `1px solid ${stat.color}`,
                boxShadow: `0 12px 30px ${stat.color}44`,
              },
            }}
          >
            <Typography
              variant="h2"
              sx={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: { xs: "2.8rem", md: "4rem" },
                color: stat.color,
                mb: 1,
                lineHeight: 1.1,
              }}
            >
              {stat.number}
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: "1rem", md: "1.15rem" },
                fontWeight: 500,
                color: "#222",
                maxWidth: "300px",
                mx: "auto",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                lineHeight: 1.5,
              }}
            >
              {stat.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* 🚀 CTA Section */}
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography
          variant="h5"
          sx={{
            fontFamily: "'Montserrat', sans-serif",
            color: "#333",
            mb: 3,
            letterSpacing: "0.3px",
          }}
        >
        
        </Typography>

        <Button
          variant="outlined"
          sx={{
            border: "2px solid #007BFF",
            color: "#007BFF",
            px: 6,
            py: 1.6,
            fontSize: "1.05rem",
            fontWeight: 600,
            borderRadius: "40px",
            textTransform: "uppercase",
            background: "transparent",
            transition: "all 0.35s ease",
            "&:hover": {
              background:
                "linear-gradient(90deg, rgba(0,123,255,0.1) 0%, rgba(0,176,255,0.15) 100%)",
              boxShadow: "0 0 25px rgba(0,123,255,0.2)",
              borderColor: "transparent",
              color: "#fff",
            },
          }}
        >
         Request A Demo
        </Button>
      </Box>

      {/* 💠 Bottom Divider Line */}
      <Box
        sx={{
          width: "60%",
          height: "2px",
          background:
            "linear-gradient(90deg, transparent, #007BFF55, transparent)",
          borderRadius: "2px",
          mt: 8,
        }}
      />
    </Box>
  );
}
