import "../../styles/Navbar.css"

import profile from "../../assets/imgs/profile.svg"
import { MdOutlineNotificationsActive } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";

export default function Navbar(){
    const { user } = useAuth();

    const getUserName = () => {
        if (!user) return "Donor";
        const firstName = user.first_name || "";
        const lastName = user.last_name || "";
        return `${firstName} ${lastName}`.trim() || "Donor";
    };

    const getDisplayName = () => {
        if (!user) return "Donor";
        const firstName = user.first_name || "";
        return firstName || "Donor";
    };

    // Get profile picture or fallback to default
    const profileImageSrc = user?.profile_picture || profile;

    return(
        <>
            <div  className="navbar">
                <h2>Welcome Back, {getDisplayName()}</h2>
                <div className="nav-info">
                    <MdOutlineNotificationsActive className="admin-icon"/>
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
                            <small>Donor</small>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}