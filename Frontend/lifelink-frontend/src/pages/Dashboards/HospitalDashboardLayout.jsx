import Navbar from "../../components/HospitalDashboard/Navbar";
import HospitalSidebar from "../../components/HospitalDashboard/HospitalSidebar";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";

export default function HospitalDashboardLayout(){
    const { user, loading } = useAuth();
    const [openSidebar, setOpenSidebar] = useState(false);

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
        console.warn('Hospital Dashboard: No user found');
        return <Navigate to="/login" replace />;
    }

    // Debug: Log user object to see what we're getting
    console.log('Hospital Dashboard: User object', { 
        user, 
        role: user.role, 
        hasHealthCenterManager: !!user.health_center_manager 
    });

    // Redirect to login if user is not a manager (case-insensitive check)
    const userRole = user.role?.toLowerCase() || '';
    if (userRole !== 'manager') {
        console.warn('Hospital Dashboard: User role is not manager', { 
            role: user.role, 
            userRole,
            userId: user.id,
            userEmail: user.email
        });
        return <Navigate to="/login" replace />;
    }
    return (
        <div className="admin-layout">
            <HospitalSidebar openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
            <Navbar openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
            <div className="admin-content">
                <Outlet />
            </div>
        </div>
    )
}

