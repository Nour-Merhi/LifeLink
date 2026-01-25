import "../../styles/Navbar.css"

import { MdOutlineNotificationsActive } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import AdminProfileDropdown from "./AdminProfileDropdown";
import { FiMenu } from "react-icons/fi";

export default function Navbar({ openSidebar = false, setOpenSidebar = () => {} }){
    const { user } = useAuth();

    const getUserName = () => {
        if (!user) return "Admin";
        const firstName = user.first_name || "";
        const lastName = user.last_name || "";
        return `${firstName} ${lastName}`.trim() || "Admin";
    };

    const getDisplayName = () => {
        if (!user) return "Admin";
        const firstName = user.first_name || "";
        return firstName || "Admin";
    };

    const toggleSidebar = () => {
        setOpenSidebar(!openSidebar);
    }

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
                    <MdOutlineNotificationsActive className="admin-icon"/>
                    <div className="admin-info">
                        <div className="admin-name">
                            <h3>{getUserName()}</h3>
                            <small>Administrator</small>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}