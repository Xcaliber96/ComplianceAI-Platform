import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { FiChevronDown } from "react-icons/fi";

export default function SupplierNavigation({ active }) {
  const navigate = useNavigate();

  const tabs = [
    { key: "your", label: "Your Suppliers", path: "/suppliers" },
    { key: "add", label: "Add Supplier", path: "/suppliers/add" },
    { key: "audit", label: "Audit", path: "/suppliers/audit" },
    { key: "upload", label: "Upload Docs", path: "/suppliers/upload" },
    { key: "risk", label: "Risk Overview", path: "/suppliers/risk" },
  ];

  return (
    <Box
      sx={{
        width: "260px",
        p: 3,
        mt: -10,
        borderRadius: "14px",
        background: "rgba(255,255,255,0.75)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.4)",
        
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* Title */}
      <Typography
        sx={{
          fontSize: "18px",
          fontWeight: 700,
          color: "#1a1a1a",
          mb: 1,
          textAlign: "center",
        }}
      >
        Supplier Navigation
      </Typography>

      {/* Vertical List */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {tabs.map((tab) => (
          <Box
            key={tab.key}
            onClick={() => navigate(tab.path)}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
              p: "16px 14px",
              borderRadius: "12px",
              background:
                active === tab.key
                  ? "linear-gradient(135deg, #0A84FF 0%, #60AFFF 100%)"
                  : "rgba(255,255,255,0.45)",
              color: active === tab.key ? "#fff" : "#1a1a1a",
              fontWeight: active === tab.key ? 600 : 500,
              transition: "0.25s",
              "&:hover": {
                background:
                  active === tab.key
                    ? "linear-gradient(135deg, #0A84FF 0%, #60AFFF 100%)"
                    : "rgba(255,255,255,0.7)",
              },
            }}
          >
            {/* Text */}
            <Typography sx={{ fontSize: "15px", mb: "6px" }}>
              {tab.label}
            </Typography>

            {/* Arrow BELOW the text */}
            <FiChevronDown
              size={20}
              color={active === tab.key ? "#fff" : "#6c6c6c"}
              style={{
                transition: "0.25s",
                transform: active === tab.key ? "rotate(180deg)" : "none",
              }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
