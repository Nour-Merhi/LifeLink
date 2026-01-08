import "../../styles/Navbar.css"

import { MdOutlineNotificationsActive } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import AdminProfileDropdown from "./AdminProfileDropdown";

export default function Navbar(){
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

    return(
        <>
            <div  className="navbar">
                <h2>Welcome Back, {getDisplayName()}</h2>
                <div className="nav-info">
                    <MdOutlineNotificationsActive className="admin-icon"/>
                    <div className="admin-info">
                        <AdminProfileDropdown />
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