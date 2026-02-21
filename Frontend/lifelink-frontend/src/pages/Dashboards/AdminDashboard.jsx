import Navbar from "../../components/adminDashboard/Navbar";
import Sidebar from "../../components/adminDashboard/sidebar";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "../../styles/Dashboard.css";

export default function AdminDashboard(){
    const { user, loading, fetchUser } = useAuth()
    const [openSidebar, setOpenSidebar] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const didVerifyRef = useRef(false);

    useEffect(() => {
        if (didVerifyRef.current) return;
        if (loading) return;

        didVerifyRef.current = true;

        const verifyAuth = async () => {
            if (user) {
                try {
                    await fetchUser(false, true);
                } catch (_) {
                }
            }
            setVerifying(false);
        };

        verifyAuth();
    }, [loading, fetchUser]); 

    if (loading || verifying){
        return <div>Loading...</div>;
    }

    if (!user){
        return <Navigate to="/login" replace />;
    }

    if (user.role?.toLowerCase() !== "admin"){
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