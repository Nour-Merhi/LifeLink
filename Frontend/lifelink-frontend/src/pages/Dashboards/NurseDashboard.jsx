import Navbar from "../../components/nurseDashboard/Navbar.jsx";
import Sidebar from "../../components/nurseDashboard/Sidebar.jsx";
import { Outlet } from "react-router-dom";

export default function NurseDashboard(){   
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