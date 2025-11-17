import React, { useState } from "react";
import { Box, Typography, Divider } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { TbUsers } from "react-icons/tb";

export default function SidebarSupplierMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <Box
      sx={{ position: "relative", overflow: "visible" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* ICON */}
      <Box
        sx={{
          width: 55,
          height: 55,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#fff",
          fontSize: "22px",
        }}
      >
        <TbUsers size={22} strokeWidth={1.5} />
      </Box>

      {/* ⭐ INVISIBLE HOVER BRIDGE (fixes disappearing menu) */}
      {open && (
        <Box
          sx={{
            position: "absolute",
            left: 55,
            top: -10,
            width: 50,
            height: 120,
            background: "transparent",
            zIndex: 4500,
          }}
        ></Box>
      )}

      {/* FLYOUT MENU */}
      {open && (
        <Box
  sx={{
    position: "absolute",
    left: 65,
    top: -150,
    width: 180,
    background: "#294936",
    boxShadow: "0 6px 22px rgba(0,0,0,0.18)",
    borderRadius: "14px",
    py: 2,
    px: 2,
    zIndex: 5000,

    /* ⭐ Move items left */
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  }}
>

          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "18px",
              color: "#ffffff",
              px: 1,
            }}
          >
            Suppliers
          </Typography>

          <Divider
            sx={{
              my: 1.5,
              borderColor: "rgba(255,255,255,0.25)",
            }}
          />

          {[ 
            { label: "Your Suppliers", path: "/suppliers" },
            { label: "Add Supplier", path: "/suppliers/add" },
            { label: "Audit Suppliers", path: "/suppliers/audit" },
            { label: "Upload Documents", path: "/suppliers/upload" },
            { label: "Risk Overview", path: "/suppliers/risk" },
          ].map((item) => (
            <Box
              key={item.label}
              onClick={() => navigate(item.path)}
              sx={{
                p: "10px 14px",
                mt: "2px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "15px",
                color: "#ffffff",
                fontWeight: 500,
                transition: "0.15s ease",
                "&:hover": {
                  background: "rgba(255,255,255,0.12)",
                },
              }}
            >
              {item.label}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
