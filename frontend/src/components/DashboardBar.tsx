import React, { useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Tooltip,
} from "@mui/material";
import {
  Home,
  Settings,
  BarChart,
  Group,
  Menu as MenuIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

const drawerWidth = 240;
const collapsedWidth = 72;

export default function HubLayout({ children }) {
  const [open, setOpen] = useState(true);

  const menuItems = [
    { text: "Home", icon: <Home /> },
    { text: "Analytics", icon: <BarChart /> },
    { text: "Teams", icon: <Group /> },
    { text: "Settings", icon: <Settings /> },
  ];

  return (
    <Box sx={{ display: "flex", height: "100vh", backgroundColor: "#f6f7f9" }}>
      {/* 🔹 Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: open ? drawerWidth : collapsedWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: open ? drawerWidth : collapsedWidth,
            background: "linear-gradient(180deg, #3B003B 0%, #5C005C 100%)",
            color: "#fff",
            borderRight: "none",
            boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
            transition: "width 0.3s ease",
            overflowX: "hidden",
          },
        }}
      >
        <Toolbar sx={{ justifyContent: open ? "space-between" : "center" }}>
          {open && (
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontFamily: "'Montserrat', sans-serif",
                ml: 1,
              }}
            >
              Nomi
            </Typography>
          )}
        </Toolbar>

        <List>
          {menuItems.map((item, index) => (
            <Tooltip key={index} title={!open ? item.text : ""} placement="right">
              <ListItemButton
                sx={{
                  px: open ? 3 : 2,
                  borderRadius: "12px",
                  mx: 1,
                  my: 0.5,
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                }}
              >
                <ListItemIcon sx={{ color: "white", minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                {open && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 500,
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          ))}
        </List>
      </Drawer>

      {/* 🔹 Top Bar */}
      <AppBar
        position="fixed"
        sx={{
          background: "linear-gradient(90deg, #5C005C 0%, #3B003B 100%)",
          color: "#FFFFFF",
          width: `calc(100% - ${open ? drawerWidth : collapsedWidth}px)`,
          ml: `${open ? drawerWidth : collapsedWidth}px`,
          borderBottomLeftRadius: "20px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
          transition: "all 0.3s ease",
          zIndex: 1201,
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              color="inherit"
              onClick={() => setOpen(!open)}
              sx={{
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: "8px",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
              }}
            >
              {open ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontFamily: "'Montserrat', sans-serif",
                opacity: open ? 1 : 0,
                transition: "opacity 0.3s ease",
              }}
            >
              Nomi Dashboard
            </Typography>
          </Box>

          <Typography
            sx={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: "0.9rem",
            }}
          >
            Welcome, Akram 👋
          </Typography>
        </Toolbar>
      </AppBar>

      {/* 🔹 Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          mt: "80px",
          ml: open ? `${drawerWidth}px` : `${collapsedWidth}px`,
          transition: "all 0.3s ease",
          overflowY: "auto",
        }}
      >
        {children || (
          <Box
            sx={{
              mt: 10,
              textAlign: "center",
              color: "#2d2d2d",
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            <Typography variant="h5" fontWeight={700}>
              Welcome to HubLayout Demo
            </Typography>
            <Typography variant="body1" mt={1}>
              Try toggling the sidebar and see how the top bar resizes dynamically.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
