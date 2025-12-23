import React, { useState } from "react";
import { Drawer, Box, List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import {
  FiFilePlus,
  FiChevronLeft,
  FiChevronRight,
  FiHome,
  FiCpu,
  FiFolder,
  FiBriefcase,
  FiBarChart2,
  FiSettings,
} from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import "./sidebar.css";

export default function Sidebar({ onCollapseChange }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggle = () => {
    const newValue = !collapsed;
    setCollapsed(newValue);
    onCollapseChange?.(newValue);
  };

  const items = [
    { label: "Dashboard", path: "/dashboard/results", icon: <FiHome /> },
    { label: "File Management", path: "/dashboard/FileList", icon: <FiFilePlus /> },
    { label: "Regulations", path: "/dashboard/regulations", icon: <FiFilePlus /> },
    { label: "Dashboard", path: "/dashboard/results", icon: <FiFilePlus /> },
    { label: "Audit", path: "/dashboard/upload", icon: <FiBarChart2 /> },
    { label: "Settings", path: "/dashboard/onboarding", icon: <FiSettings /> },
  ];

  return (
    <Drawer
      variant="permanent"
      className={`nomi-sidebar ${collapsed ? "collapsed" : ""}`}
    >
      <Box className="nomi-sidebar-brand">
        {!collapsed ? "NomiAI" : "N"}
      </Box>

      <List>
        {items.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname.startsWith(item.path)}
            className="nomi-nav-item"
            onClick={() => navigate(item.path)}
          >
            <ListItemIcon className="nomi-icon">
              {item.icon}
            </ListItemIcon>

            {!collapsed && <ListItemText primary={item.label} />}
          </ListItemButton>
        ))}

        <ListItemButton
          onClick={toggle}
          className="nomi-collapse-btn"
        >
          <ListItemIcon className="nomi-icon">
            {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </ListItemIcon>

          {!collapsed && <ListItemText primary="Collapse" />}
        </ListItemButton>
      </List>
    </Drawer>
  );
}
