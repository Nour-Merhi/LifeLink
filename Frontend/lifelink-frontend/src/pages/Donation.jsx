import Sidebar from "../components/donation/Sidebar";
import "../App.css";
import { Outlet } from "react-router-dom";

export default function Donation() {
  return (
    <div className="donation-layout">
      <Sidebar />
      <div className="donation-content">
        {/* Nested route content goes here */}
        <Outlet />
      </div>
    </div>
  );
}