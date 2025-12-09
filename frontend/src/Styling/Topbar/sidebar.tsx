import "./sidebar.css";
import { FiHome, FiFolder, FiShield, FiSettings } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import SidebarSupplierMenu from "../Menue/SidebarSupplierMenu";

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <div className="sidebar">
      <ul>

        {/* HOME */}
        <li onClick={() => navigate("/")}>
          <FiHome size={20} />
        </li>

        {/* FILES */}
        <li onClick={() => navigate("/files")}>
          <FiFolder size={20} />
        </li>

        {/* SUPPLIER MENU — IMPORTANT: NO onClick HERE */}
        <li style={{ position: "relative" }}>
          <SidebarSupplierMenu />
        </li>

        {/* SHIELD */}
        <li onClick={() => navigate("/security")}>
          <FiShield size={20} />
        </li>

        {/* SETTINGS */}
        <li onClick={() => navigate("/settings")}>
          <FiSettings size={20} />
        </li>

      </ul>
    </div>
  );
}
