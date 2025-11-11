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

// ✅ Import logo
import NomiLogo from "../assets/logo.png";

const drawerWidth = 240;
const collapsedWidth = 72;
const appBarHeight = 64;

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
              "& .MuiDrawer-paper": {
                width: open ? drawerWidth : collapsedWidth,
                background: "#190E4F",
                color: "#FFFFFF",
                boxSizing: "border-box",
                border: "none",
                transition: "width 0.3s ease, background 0.3s ease",
                overflowX: "hidden",
                height: "100vh",
             
                borderTopRightRadius: "36px",
                boxShadow: "6px 0 20px rgba(0,0,0,0.2)",
                display: "flex",
                flexDirection: "column",
                paddingTop: `${appBarHeight}px`,
                zIndex: 1202, 
      
              },
     

            }}
          >
            {/* 🔹 Logo + Brand */}
            <Toolbar
              sx={{
                justifyContent: open ? "flex-start" : "center",
                alignItems: "center",
                py: 2,
                px: open ? 3 : 0,
                borderBottom: "1px solid rgba(255,255,255,0.15)",
                transition: "all 0.3s ease",
                gap: 1,
              }}
            >
              <Box
                component="img"
                src={NomiLogo}
                alt="NomiAI Logo"
                sx={{
                  width: open ? 36 : 42,
                  height: open ? 36 : 42,
                  transition: "all 0.3s ease",
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                  cursor: "pointer",
                }}
                onClick={() => navigate("/dashboard")}
              />

              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  color: "#fff",
                  transition: "opacity 0.3s ease, transform 0.3s ease",
                  opacity: open ? 1 : 0,
                  transform: open ? "translateX(0)" : "translateX(-10px)",
                  whiteSpace: "nowrap",
                }}
              >
                NomiAI
              </Typography>
            </Toolbar>

            {/* ✅ Menu List */}
            <List sx={{ flexGrow: 1, mt: 1 }}>
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
                          px: 2.5,
                          mx: 1,
                          my: 0.5,
                          borderRadius: "12px",
                          color: isActive ? "#fff" : "rgba(255,255,255,0.8)",
                          backgroundColor: isActive
                            ? "rgba(255,255,255,0.15)"
                            : "transparent",
                          backdropFilter: isActive ? "blur(6px)" : "none",
                          "&:hover": {
                            backgroundColor: "rgba(255,255,255,0.2)",
                            boxShadow: "0 0 6px rgba(255,255,255,0.15)",
                          },
                          transition: "all 0.3s ease",
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            color: "#fff",
                            minWidth: 0,
                            mr: open ? 2 : "auto",
                            justifyContent: "center",
                            opacity: isActive ? 1 : 0.8,
                            transform: isActive ? "scale(1.1)" : "scale(1)",
                            transition: "all 0.25s ease",
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontFamily: "'Montserrat', sans-serif",
                            fontWeight: 500,
                          }}
                          sx={{
                            opacity: open ? 1 : 0,
                            whiteSpace: "nowrap",
                            transition: "opacity 0.3s ease",
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
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.25)" },
                    transition: "all 0.3s ease",
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
