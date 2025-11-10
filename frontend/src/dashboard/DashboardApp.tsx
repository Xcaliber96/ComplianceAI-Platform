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
  Tooltip,
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

// 🧩 Import pages
import FrontPage from "./FrontPage";
import FileManager from "./FileManager";
import TestHubLayout from "./TestHubLayout";
import DocumentAudit from "./UploadFetchTab";
import RunAuditTab from "./RunAuditTab";
import SupplierOnboarding from "./SupplierOnboarding";
import LLM from "./LLM";
import AuditResultsTab from "./AuditResultsTab";
import CompliancePlanner from "./CompliancePlanner";
import CompetitorsPage from "./CompetitorsPage";


const drawerWidth = 240;
const collapsedWidth = 72;

export default function DashboardApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);

  const hideLayout =
    location.pathname === "/dashboard" || location.pathname === "/dashboard/";
     location.pathname === "/TestHubLayout" || location.pathname === "/TestHubLayout/";

  const menuItems = [
    { text: "Dashboard", icon: <Dashboard />, path: "/dashboard" },
    { text: "DocumentAudit", icon: <Assignment />, path: "/dashboard/upload" },
    { text: "Audit & Tasks", icon: <BarChart />, path: "/dashboard/audit" },
    { text: "Suppliers", icon: <Group />, path: "/dashboard/suppliers" },
    { text: "AI Assistant", icon: <Chat />, path: "/dashboard/llm" },
    { text: "Settings", icon: <Settings />, path: "/dashboard/settings" },
    { text: "Competitors", icon: <BarChart />, path: "/dashboard/competitors" },
      { text: "Manage your files", icon: <Settings />, path: "/dashboard/FileManager" },
      { text: "Manage your files", icon: <Settings />, path: "/dashboard/page" },
        { text: "Manage your files", icon: <Settings />, path: "/dashboard/TestHubLayout" },


    {
      text: "AuditResultsTab",
      icon: <Settings />,
      path: "/dashboard/AuditResultsTab",
    },
  ];

  return (
    <Box sx={{ display: "flex", width: "100%", height: "100vh", margin: 0 }}>
      {!hideLayout && (
        <>
          {/* 🔹 Top Bar */}
          <AppBar
            position="fixed"
            sx={{
              backgroundColor: "#000000ff",
              color: "#FFFFFF",
              borderRadius: "50px",
              boxShadow: "none",
              border: "none",
              transition: "all 0.3s ease",
              width: `calc(100% - ${open ? drawerWidth : collapsedWidth}px)`,
              ml: `${open ? drawerWidth : collapsedWidth}px`,
            }}
          >
            <Toolbar sx={{ justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <IconButton
                  onClick={() => setOpen(!open)}
                  edge="start"
                  color="inherit"
                >
                  {open ? <CloseIcon /> : <MenuIcon />}
                </IconButton>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    transition: "opacity 0.3s",
                    opacity: open ? 1 : 0,
                  }}
                >
                  NomiAI
                </Typography>
              </Box>
              {open && (
                <Typography variant="body2" sx={{ color: "#FFFFFF" }}>
                  Welcome, Akram 👋
                </Typography>
              )}
            </Toolbar>
          </AppBar>

          {}
          <Drawer
            variant="permanent"
            sx={{
              width: open ? drawerWidth : collapsedWidth,
              flexShrink: 0,
              whiteSpace: "nowrap",
              [`& .MuiDrawer-paper`]: {
                width: open ? drawerWidth : collapsedWidth,
                backgroundColor: "#a8a8a8ff",
                color: "#FFFFFF",
                boxSizing: "border-box",
                borderRight: "99",
                borderRadius: 0,
                transition: "width 0.3s ease",
                overflowX: "hidden",
                top: 0,
                height: "100vh",
              },
            }}
          >
            <Toolbar sx={{ minHeight: 64, borderRadius: "20px", }} />
            <List>
              {menuItems.map((item) => (
                <Tooltip
                  key={item.text}
                  title={!open ? item.text : ""}
                  placement="right"
                  arrow
                >
                  <ListItem disablePadding sx={{ display: "block" }}>
                    <ListItemButton
                      onClick={() => navigate(item.path)}
                      sx={{
                        minHeight: 48,
                        justifyContent: open ? "initial" : "center",
                        px: 2.5,
                        
                        "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                        
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: "#FFFFFF",
                          minWidth: 0,
                          mr: open ? 2 : "auto",
                          justifyContent: "center",
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        sx={{
                          opacity: open ? 1 : 0,
                          whiteSpace: "nowrap",
                          transition: "opacity 0.2s ease",
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                </Tooltip>
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
          bgcolor: "#FFFFFF", // ✅ unified full-page background color
          p: hideLayout ? 0 : 3,
          mt: hideLayout ? 0 : "64px",
          ml: !hideLayout
            ? open
              ? `${drawerWidth}px`
              : `${collapsedWidth}px`
            : 0,
          transition: "all 0.3s ease",
          overflow: "auto",
          height: "100vh", // ensures full viewport height
        }}
      >
        <Routes>
          <Route path="/" element={<FrontPage />} />
          <Route path="upload" element={<DocumentAudit />} />
          <Route path="audit" element={<RunAuditTab />} />
          <Route path="suppliers" element={<SupplierOnboarding />} />
          <Route path="llm" element={<LLM />} />
          <Route path="results" element={<AuditResultsTab />} />
          <Route path="CompliancePlanner" element={<CompliancePlanner />} />
          <Route path="AuditResultsTab" element={<AuditResultsTab />} />
          <Route path="FileManager" element={<FileManager />} />
          <Route path="competitors" element={<CompetitorsPage />} />
<Route path="TestHubLayout" element={<TestHubLayout />} />

          <Route
            path="settings"
            element={
              <Typography sx={{ p: 4 }}>
                ⚙️ Settings Page Coming Soon
              </Typography>
            }
          />
        </Routes>
      </Box>
    </Box>
  );
}
