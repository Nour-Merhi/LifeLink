import "../../styles/Navbar.css"

import { MdOutlineNotificationsActive } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import { FiMenu } from "react-icons/fi";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { LuMessageCircleMore } from "react-icons/lu";

export default function Navbar({openSidebar, setOpenSidebar}){
    const { user } = useAuth();
    const navigate = useNavigate();
    const [messageCount, setMessageCount] = useState(0);


    const getUserName = () => {
        if (!user) return "Manager";
        const firstName = user.first_name || "";
        const lastName = user.last_name || "";
        return `${firstName} ${lastName}`.trim() || "Manager";
    };

    const getDisplayName = () => {
        if (!user) return "Manager";
        const firstName = user.first_name || "";
        return firstName || "Manager";
    };

    const toggleSidebar = () => {
        setOpenSidebar(!openSidebar);
    }

    useEffect(() => {
        let intervalId = null;
        let cancelled = false;

        const fetchMessageCount = async () => {
            try {
                // Only for logged-in hospital managers
                if (!user || (user.role || "").toLowerCase() !== "manager") return;

                const res = await api.get("/api/hospital/dashboard/messages/phlebotomists-unread-count");
                const incoming = Number(res.data?.unread_count || 0);
                if (!cancelled) setMessageCount(incoming);
            } catch (e) {
                // Don't block UI if this fails
                if (!cancelled) setMessageCount(0);
            }
        };

        fetchMessageCount();
        intervalId = setInterval(fetchMessageCount, 30000);

        return () => {
            cancelled = true;
            if (intervalId) clearInterval(intervalId);
        };
    }, [user]);

    const handleOpenMessages = async () => {
        try {
            await api.post("/api/hospital/dashboard/messages/phlebotomists-mark-read");
        } catch (e) {
            // ignore
        } finally {
            setMessageCount(0);
            navigate("/hospital/notifications");
        }
    };

    return(
        <>
            <div  className="navbar">
                <div className="flex flex-row items-center gap-5">
                    <button onClick={toggleSidebar} className="sidebar-toggle">
                        <FiMenu className="icon-size" />
                    </button>
    
                    <h2>Welcome Back, {getDisplayName()}</h2>
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
                        <div className="admin-name">
                            <h3>{getUserName()}</h3>
                            <small>Hospital Manager</small>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}