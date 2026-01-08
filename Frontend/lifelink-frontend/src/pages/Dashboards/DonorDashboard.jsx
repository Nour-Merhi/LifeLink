import Navbar from "../../components/donorDashboard/Navbar.jsx";
import Sidebar from "../../components/donorDashboard/Sidebar.jsx";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function DonorDashboard(){   
    const { user, loading } = useAuth();

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                fontSize: '18px'
            }}>
                Loading...
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Redirect to login if user is not a donor (case-insensitive check)
    if (user.role?.toLowerCase() !== 'donor') {
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