import Navbar from "../../components/nurseDashboard/Navbar.jsx";
import Sidebar from "../../components/nurseDashboard/Sidebar.jsx";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";
import { useState } from "react";

export default function NurseDashboard(){   
    const { user, loading } = useAuth()
    const [openSidebar, setOpenSidebar] = useState(false);

    if (loading){
        return <div>Loading...</div>;
    }

    if (!user){
        return <Navigate to="/login" replace />;
    }

    if (user.role?.toLowerCase() !== "phlebotomist"){
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="admin-layout">
            <Sidebar openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
            <Navbar openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
            <div className="admin-content">
                <Outlet />
            </div>
        </div>
    )
}