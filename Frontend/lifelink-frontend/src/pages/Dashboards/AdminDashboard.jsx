import Navbar from "../../components/adminDashboard/Navbar";
import Sidebar from "../../components/adminDashboard/sidebar";
import { Outlet } from "react-router-dom";

export default function AdminDashboard(){
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