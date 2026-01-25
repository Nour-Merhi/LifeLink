import "../../styles/Navbar.css"

import profile from "../../assets/imgs/profile.svg"
import { useAuth } from "../../context/AuthContext";
import { FiMenu } from "react-icons/fi";
import { LuMessageCircleMore } from "react-icons/lu";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function Navbar({ openSidebar = false, setOpenSidebar = () => {} }){
    const { user } = useAuth();
    const navigate = useNavigate();
    const [messageCount, setMessageCount] = useState(0);

    const getUserName = () => {
        if (!user) return "Nurse";
        const firstName = user.first_name || "";
        const lastName = user.last_name || "";
        return `${firstName} ${lastName}`.trim() || "Nurse";
    };

    const getDisplayName = () => {
        if (!user) return "Nurse";
        const firstName = user.first_name || "";
        return firstName || "Nurse";
    };

    // Get profile picture or fallback to default
    const profileImageSrc = user?.profile_picture || profile;

    const toggleSidebar = () => {
        setOpenSidebar(!openSidebar);
    }

    useEffect(() => {
        let intervalId = null;
        let cancelled = false;

        const fetchUnreadCount = async () => {
            try {
                if (!user || (user.role || "").toLowerCase() !== "phlebotomist") return;
                const res = await api.get("/api/nurse/messages-unread-count");
                const unread = Number(res.data?.unread_count || 0);
                if (!cancelled) setMessageCount(unread);
            } catch {
                if (!cancelled) setMessageCount(0);
            }
        };

        fetchUnreadCount();
        intervalId = setInterval(fetchUnreadCount, 30000);

        return () => {
            cancelled = true;
            if (intervalId) clearInterval(intervalId);
        };
    }, [user]);

    const handleOpenMessages = async () => {
        try {
            await api.post("/api/nurse/messages-mark-read");
        } catch {
            // ignore
        } finally {
            setMessageCount(0);
            navigate("/nurse/manager-contact");
        }
    };

    return(
        <>
            <div className="navbar">
                <div className="flex flex-row items-center gap-5">
                    <button onClick={toggleSidebar} className="sidebar-toggle">
                        <FiMenu className="icon-size" />
                    </button>
                    <h2>Welcome Back, {getDisplayName()}!</h2>
                </div>
                <div className="nav-info">
                    <div
                        style={{ position: "relative", cursor: "pointer" }}
                        onClick={handleOpenMessages}
                        title="Messages"
                        role="button"
                    >
                        <LuMessageCircleMore className="admin-icon"/>
                        {messageCount > 0 && (
                            <span
                                style={{
                                    position: "absolute",
                                    top: "-6px",
                                    right: "-6px",
                                    background: "#E92C30",
                                    color: "white",
                                    borderRadius: "999px",
                                    minWidth: "18px",
                                    height: "18px",
                                    padding: "0 6px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    lineHeight: 1,
                                }}
                            >
                                {messageCount > 99 ? "99+" : messageCount}
                            </span>
                        )}
                    </div>
                    <div className="admin-info">
                        <img 
                            src={profileImageSrc} 
                            alt="profile" 
                            width="40px" 
                            height="40px" 
                            style={{ borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div className="admin-name">
                            <h3>{getUserName()}</h3>
                            <small>Mobile Phlebotomist</small>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
