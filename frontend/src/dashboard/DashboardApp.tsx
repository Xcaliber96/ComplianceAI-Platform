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
import DocumentAudit from "./UploadFetchTab";
import RunAuditTab from "./RunAuditTab";
import SupplierOnboarding from "./SupplierOnboarding";
import LLM from "./LLM";
import AuditResultsTab from "./AuditResultsTab";
import CompliancePlanner from "./CompliancePlanner";
import CompetitorsPage from "./CompetitorsPage";

const drawerWidth = 240;
const collapsedWidth = 72;
const appBarHeight = 50;

export default function DashboardApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);

  const hideLayout =
    location.pathname === "/dashboard" ||
    location.pathname === "/dashboard/";

  const menuItems = [
    { text: "Dashboard", icon: <Dashboard />, path: "/dashboard" },
    { text: "Document Audit", icon: <Assignment />, path: "/dashboard/upload" },
    { text: "Audit & Tasks", icon: <BarChart />, path: "/dashboard/audit" },
    { text: "Suppliers", icon: <Group />, path: "/dashboard/suppliers" },
    { text: "AI Assistant", icon: <Chat />, path: "/dashboard/llm" },
    { text: "Competitors", icon: <BarChart />, path: "/dashboard/competitors" },
    { text: "Files", icon: <Settings />, path: "/dashboard/FileManager" },
    { text: "Settings", icon: <Settings />, path: "/dashboard/settings" },
  ];

  return (
    <Box sx={{ display: "flex", width: "100%", height: "100vh", overflow: "hidden" }}>
      {!hideLayout && (
        <>
          {/* 🔹 Sidebar */}
          <Drawer
            variant="permanent"
            sx={{
              width: open ? drawerWidth : collapsedWidth,
              flexShrink: 0,
              whiteSpace: "nowrap",
              overflow: "visible",
              "& .MuiDrawer-paper": {
                width: open ? drawerWidth : collapsedWidth,
                background: "#190E4F",
                color: "#FFFFFF",
                border: "none",
                transition: "width 0.3s ease",
                overflowX: "hidden",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                height: "100vh",
                borderTopRightRadius: "36px",
                zIndex: 1202,
              },
            }}
          >
            {/* 🔹 Brand Text Only */}
{/* 🔹 Brand Text Only */}
<Box
  sx={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    py: 3,
    cursor: "pointer",
    overflow: "hidden",
  }}
  onClick={() => navigate("/dashboard")}
>
  <Typography
    variant="h6"
    sx={{
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 700,
      fontSize: "1.25rem",
      color: "#FFFFFF",
      letterSpacing: "0.5px",
      textAlign: "center",
      transition: "all 0.3s ease",
      opacity: open ? 1 : 0,          // 👈 fade out text
      width: open ? "auto" : 0,       // 👈 shrink smoothly
    }}
  >
    NomiAI
  </Typography>
</Box>
            {/* 🔹 Menu Items */}
            <List sx={{ flexGrow: 1, mt: 1, width: "100%" }}>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
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
                          px: open ? 2.5 : 0,
                          mx: 1,
                          my: 0.5,
                          borderRadius: "12px",
                          backgroundColor: isActive ? "rgba(255,255,255,0.15)" : "transparent",
                          color: isActive ? "#E8EAF6" : "rgba(255,255,255,0.6)",
                          overflow: "hidden",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            backgroundColor: "rgba(255,255,255,0.1)",
                            color: "#FFFFFF",
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            color: isActive ? "#8AB4F8" : "#FFFFFFCC",
                            minWidth: 0,
                            justifyContent: "center",
                            mr: open ? 2 : 0,
                            transform: isActive ? "scale(1.1)" : "scale(1)",
                            transition: "all 0.25s ease",
                          }}
                        >
                          {React.cloneElement(item.icon, { fontSize: "medium" })}
                        </ListItemIcon>

                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontFamily: "'Montserrat', sans-serif",
                            fontWeight: isActive ? 600 : 500,
                            color: "#FFFFFF",
                          }}
                          sx={{
                            opacity: open ? 1 : 0,
                            minWidth: open ? 120 : 0,
                            ml: open ? 0 : -4,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            transition: "opacity 0.3s ease, min-width 0.3s ease, margin 0.3s ease",
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  </Tooltip>
                );
              })}
            </List>

            {/* ✅ Footer */}
            <Box
              sx={{
                p: 2,
                borderTop: "1px solid rgba(255,255,255,0.15)",
                textAlign: open ? "left" : "center",
                fontSize: "0.8rem",
                color: "rgba(255,255,255,0.5)",
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              © {new Date().getFullYear()} NomiAI
            </Box>
          </Drawer>

          {/* 🔹 Top Bar */}
          <AppBar
            position="fixed"
            sx={{
              background: "#190E4F",
              color: "#FFFFFF",
              width: `calc(100% - ${open ? drawerWidth : collapsedWidth}px)`,
              ml: `${open ? drawerWidth : collapsedWidth}px`,
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
              transition: "all 0.3s ease",
              height: `${appBarHeight}px`,
              zIndex: 1201,
            }}
          >
            <Toolbar sx={{ justifyContent: "space-between", px: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <IconButton
                  onClick={() => setOpen((prev) => !prev)}
                  edge="start"
                  color="inherit"
                  sx={{
                 
                    borderRadius: "8px",

                  }}
                >
                  {open ? <CloseIcon /> : <MenuIcon />}
                </IconButton>
              </Box>

              <Typography
                sx={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: "0.9rem",
                  fontWeight: 400,
                  opacity: 0.9,
                }}
              >
                Welcome, Akram 👋
              </Typography>
            </Toolbar>
          </AppBar>
        </>
      )}

      {/* 🔹 Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "#F6F7F9",
          p: hideLayout ? 0 : 4,
          mt: hideLayout ? 0 : `${appBarHeight}px`,
          ml: !hideLayout
            ? open
              ? `${drawerWidth}px`
              : `${collapsedWidth}px`
            : 0,
          transition: "all 0.3s ease",
          overflowY: "auto",
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
