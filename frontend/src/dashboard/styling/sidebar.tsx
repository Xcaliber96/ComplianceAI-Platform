import "./sidebar_fixed.css";
import React, { useState } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";

import { useNavigate, useLocation } from "react-router-dom";
import {
  FiChevronLeft,
  FiChevronRight,
  FiHome,
  FiCpu,
  FiFolder,
  FiBriefcase,
  FiBarChart2,
  FiSettings,
} from "react-icons/fi";
import "react-pro-sidebar/dist/css/styles.css";
export default function Sidebar({ onCollapseChange }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggle = () => {
    const newValue = !collapsed;
    setCollapsed(newValue);
    onCollapseChange?.(newValue);
    
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 9999 }}>
      <ProSidebar
        collapsed={collapsed}
        breakPoint="md"
        width="240px"
        collapsedWidth="72px"
      >
        <div className="sidebar-brand">
          {!collapsed ? "NomiAI" : "N"}
        </div>

        <Menu iconShape="circle">
          <MenuItem  active={location.pathname === "/dashboard"} icon={<FiHome />} onClick={() => navigate("/dashboard")}>
            Dashboard
          </MenuItem>

          <MenuItem  active={location.pathname === "/dashboard"} icon={<FiCpu />} onClick={() => navigate("/dashboard/llm")}>
            AI Assistant
          </MenuItem>

          <MenuItem active={location.pathname.startsWith("/dashboard/filemanager")} icon={<FiFolder />} onClick={() => navigate("/dashboard/filemanager")}>
            File Manager
          </MenuItem>

          <MenuItem  active={location.pathname.startsWith("/dashboard/competitors")} icon={<FiBriefcase />} onClick={() => navigate("/dashboard/competitors")}>
            Competitors
          </MenuItem>

          <MenuItem active={location.pathname.startsWith("/dashboard/audit")} icon={<FiBarChart2 />} onClick={() => navigate("/dashboard/audit")}>
            Audit
            
          </MenuItem>

          <MenuItem active={location.pathname.startsWith("/dashboard/settings")} icon={<FiSettings />} onClick={() => navigate("/dashboard/settings")}>
            Settings
          </MenuItem>


          <MenuItem active={location.pathname.startsWith("/dashboard/NomiFileHub")} icon={<FiSettings />} onClick={() => navigate("/dashboard/NomiFileHub")}>
            NomiFileHub
          </MenuItem>
          
          <MenuItem active={location.pathname.startsWith("/dashboard/FileList")} icon={<FiSettings />} onClick={() => navigate("/dashboard/FileList")}>
            Files list
          </MenuItem>
                    <MenuItem active={location.pathname.startsWith("/dashboard/AddFile")} icon={<FiSettings />} onClick={() => navigate("/dashboard/AddFile")}>
            Files list
          </MenuItem>

          <MenuItem
            className="collapse-button"
            onClick={toggle}
            icon={collapsed ? <FiChevronRight /> : <FiChevronLeft />}
          >
            {!collapsed && "Collapse"}
          </MenuItem>
        </Menu>
      </ProSidebar>
    </div>
  );
}
