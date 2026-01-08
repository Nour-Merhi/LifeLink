import Navbar from "../../components/adminDashboard/Navbar";
import Sidebar from "../../components/adminDashboard/sidebar";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function AdminDashboard(){
    const { user, loading } = useAuth()

    if (loading){
        return <div>Loading...</div>;
    }

    if (!user){
        return <Navigate to="/login" replace />;
    }

    if (user.role.toLowerCase() !== "admin"){
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