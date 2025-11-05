import React, { useState } from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  ListItemButton,
} from "@mui/material";
import {
  Dashboard,
  Group,
  BarChart,
  Assignment,
  Chat,
  Settings,
  Menu as MenuIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

// 🧩 Import dashboard pages
import FrontPage from "./FrontPage";
import ComplianceDashboard from "./compliance_dashboard";
import UploadFetchTab from "./UploadFetchTab";
import RunAuditTab from "./RunAuditTab";
import SupplierOnboarding from "./SupplierOnboarding";
import LLM from "./LLM";
import AuditResultsTab from "./AuditResultsTab";

const drawerWidth = 240;

export default function DashboardApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);

  // 👇 Hide sidebar & topbar on the front page
  const hideLayout = location.pathname === "/dashboard" || location.pathname === "/dashboard/";

  const menuItems = [
    { text: "Dashboard", icon: <Dashboard />, path: "/dashboard" },
    { text: "Upload Files", icon: <Assignment />, path: "/dashboard/upload" },
    { text: "Audit & Tasks", icon: <BarChart />, path: "/dashboard/audit" },
    { text: "Suppliers", icon: <Group />, path: "/dashboard/suppliers" },
    { text: "AI Assistant", icon: <Chat />, path: "/dashboard/llm" },
    { text: "Settings", icon: <Settings />, path: "/dashboard/settings" },
  ];

  return (
    <Box sx={{ display: "flex" }}>
      {/* 🔹 Only show TopBar + Sidebar if not front page */}
      {!hideLayout && (
        <>
          {/* 🔹 Top Bar */}
        <AppBar
  position="fixed"
  sx={{
    width: open ? `calc(100% - ${drawerWidth}px)` : "100%",
    ml: open ? `${drawerWidth}px` : 0,
    backgroundColor: "#ffffff",
    color: "#000",
    boxShadow: "none",
    borderBottom: "1px solid #e0e0e0",
    transition: "all 0.3s ease",
  }}
>
  <Toolbar sx={{ justifyContent: "space-between" }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {/* Toggle Sidebar Button */}
      <IconButton onClick={() => setOpen(!open)} edge="start">
        {open ? <CloseIcon /> : <MenuIcon />}
      </IconButton>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        NomiAI
      </Typography>
    </Box>

    {/* 🔹 Right Section with Welcome + Back to Dashboard Button */}
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Typography variant="body2" sx={{ color: "#666" }}>
        Welcome, Akram 👋
      </Typography>
      <IconButton
        onClick={() => navigate("/dashboard")}
        sx={{
          backgroundColor: "#1976d2",
          color: "white",
          borderRadius: "8px",
          px: 2,
          py: 0.5,
          "&:hover": { backgroundColor: "#1565c0" },
        }}
      >
        <Dashboard sx={{ mr: 1 }} />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Back to Dashboard
        </Typography>
      </IconButton>
    </Box>
  </Toolbar>
</AppBar>
          {/* 🔹 Sidebar Drawer */}
          <Drawer
            variant="persistent"
            open={open}
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: {
                width: open ? drawerWidth : 0,
                boxSizing: "border-box",
                backgroundColor: "#f9fafc",
                borderRight: "1px solid #e0e0e0",
                overflowX: "hidden",
                transition: "width 0.3s ease",
              },
            }}
          >
            <Toolbar />
            <List>
              {menuItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    sx={{
                      "&:hover": { backgroundColor: "#e3f2fd" },
                      color: "#333",
                      borderRadius: "8px",
                      m: 1,
                    }}
                  >
                    <ListItemIcon sx={{ color: "#1976d2" }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Drawer>
        </>
      )}

      {/* 🔹 Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "#fafafa",
          p: hideLayout ? 0 : 3,
          mt: hideLayout ? 0 : 8,
          minHeight: "100vh",
          transition: "margin 0.3s ease",
        }}
      >
        
        <Routes>
          <Route path="/" element={<FrontPage />} />
          <Route path="upload" element={<UploadFetchTab />} />
          <Route path="audit" element={<RunAuditTab />} />
          <Route path="suppliers" element={<SupplierOnboarding />} />
          <Route path="llm" element={<LLM />} />
          <Route path="results" element={<AuditResultsTab />} />
          <Route
            path="settings"
            element={<Typography sx={{ p: 4 }}>⚙️ Settings Page Coming Soon</Typography>}
          />
        </Routes>
      </Box>
    </Box>
  );
}
