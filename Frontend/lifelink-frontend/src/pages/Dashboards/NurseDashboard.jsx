import Navbar from "../../components/nurseDashboard/Navbar.jsx";
import Sidebar from "../../components/nurseDashboard/Sidebar.jsx";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function NurseDashboard(){   
    const { user, loading } = useAuth()

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
            <Sidebar />
            <Navbar />
            <div className="admin-content">
                <Outlet />
            </div>
        </div>
    )
}