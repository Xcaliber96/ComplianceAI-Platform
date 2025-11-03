import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function WhyNomiSection() {
  const navigate = useNavigate();

  return (
    <>
      {/* 🌟 CONTAINER WRAPPER */}
      <Box
        sx={{
          width: "100%",
          backgroundColor: "#fff",
          display: "flex",
          justifyContent: "center", // centers inner content
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column-reverse", md: "row" },
            alignItems: "center",
            justifyContent: "center",
            gap: { xs: 2, md: 6 },
            width: "100%",
            maxWidth: "1200px", // ✅ container width limit
            minHeight: "70vh",
            px: { xs: 3, md: 6 }, // ✅ padding inside the container
            position: "relative",
          }}
        >
          {/* LEFT COLUMN */}
          <Box
            sx={{
              flex: 1,
              px: { xs: 0, md: 3 },
              py: { xs: 6, md: 10 },
              maxWidth: 550,
              zIndex: 2,
            }}
          >
            <Typography
              variant="h4"
              fontWeight={1000}
              sx={{ color: "#2d2d2d", lineHeight: 1.3, mb: 3 }}
            >
              Why Nomi AI?
              <br />
              Empowering compliance with intelligence and clarity.
            </Typography>

            <Typography
              variant="body1"
              sx={{ color: "#555", lineHeight: 1.8, mb: 4 }}
            >
              Nomi AI helps businesses stay compliant in a world that moves
              fast. We connect artificial intelligence with real-world
              regulations, allowing companies to detect compliance risks before
              they happen. Through automation, Nomi continuously monitors
              documents, policies, and operations — helping teams stay aligned
              with global standards.
            </Typography>

            <Button
              variant="contained"
              sx={{
                backgroundColor: "#0d728d",
                color: "#fff",
                px: 4,
                py: 1.2,
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                borderRadius: 0,
                ":hover": { backgroundColor: "#095e73" },
                mt: 5,
              }}
              onClick={() => navigate("/employees")}
            >
              Read More
            </Button>
          </Box>

          {/* RIGHT COLUMN – IMAGE */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              width: "100%",
              maxWidth: 600,
              position: "relative",
            }}
          >
            <Box
              component="img"
              src="https://images.unsplash.com/photo-1694398794208-dc4f244fe99e?auto=format&fit=crop&q=60&w=600"
              alt="Compliance AI visualization"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                maxHeight: { xs: 300, md: "70vh" },
                transition: "transform 0.3s ease",
              }}
            />
          </Box>

          {/* 🌐 OVERLAPPING BAR */}
          <Box
            sx={{
              position: "absolute",
              bottom: { xs: "-30px", md: "-40px" },
              left: { xs: "55%", md: "57%" },
              transform: "translateX(-50%)",
              width: { xs: "90%", md: "80%" },
              maxWidth: "950px",
              backgroundColor: "#f7f9fa",
              px: { xs: 2, md: 5 },
              py: 2,
              boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              zIndex: 3,
              borderRadius: 2,
            }}
          >
            {[
              "Example Article One: Understanding Compliance Risk in 2025",
              "Example Article Two: How AI is Shaping Global Regulations",
              "Example Article Three: Nomi AI’s 2025 Outlook",
            ].map((text, i) => (
              <Box key={i} sx={{ flex: 1, px: 2, minWidth: 220 }}>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{
                    fontSize: { xs: "0.85rem", md: "0.95rem" },
                    color: "#333",
                  }}
                >
                  {text}
                </Typography>
                {i === 0 && (
                  <Box
                    sx={{
                      mt: 1,
                      height: 3,
                      width: 40,
                      backgroundColor: "#0d728d",
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </>
  );
}
