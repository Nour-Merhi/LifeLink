import Navbar from "../../components/donorDashboard/Navbar.jsx";
import Sidebar from "../../components/donorDashboard/Sidebar.jsx";
import { Outlet } from "react-router-dom";

export default function DonorDashboard(){   
    return (
        <div className="admin-layout">
            <Sidebar />
            <Navbar />
            <div className="admin-content">
                <Outlet />
            </div>
        </div>
    )
}