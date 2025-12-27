import Navbar from "../../components/adminDashboard/Navbar";
import HospitalSidebar from "../../components/adminDashboard/HospitalSidebar";
import { Outlet } from "react-router-dom";

export default function HospitalDashboardLayout(){
    return (
        <div className="admin-layout">
            <HospitalSidebar />
            <Navbar />
            <div className="admin-content">
                <Outlet />
            </div>
        </div>
    )
}

