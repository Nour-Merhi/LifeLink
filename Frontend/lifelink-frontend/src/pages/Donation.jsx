import Sidebar from "../components/donation/Sidebar";
import "../App.css";
import { Outlet } from "react-router-dom";
import { useState } from "react";
import { FiMenu } from "react-icons/fi";

export default function Donation() {
  const [openSidebar, setOpenSidebar] = useState(false);

  return (
    <div className="donation-layout">
      <Sidebar openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
      <div className="donation-content">
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 4px" }}>
          <button className="sidebar-toggle" onClick={() => setOpenSidebar(!openSidebar)} aria-label="Toggle sidebar">
            <FiMenu className="icon-size" />
          </button>
        </div>
        {/* Nested route content goes here */}
        <Outlet />
      </div>
    </div>
  );
}