import lifelinkLogoBlack from "../../assets/imgs/LogoAdmin.png";
import { GoHomeFill } from "react-icons/go";
import { FiLogOut } from "react-icons/fi";
import { MdContactSupport } from "react-icons/md";
import { FaGamepad } from "react-icons/fa";
import { IoCalendar, IoHeart, IoGift, IoSettings } from "react-icons/io5";


import { NavLink, useNavigate } from "react-router-dom";
import { useSystemSettings } from "../../context/SystemSettingsContext";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar({ openSidebar = false, setOpenSidebar = () => {} } = {}){
    const navigate = useNavigate();
    const { systemLogo, platformName } = useSystemSettings();
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
          await logout();
          // Trigger auth change to update context
          window.dispatchEvent(new Event('auth-change'));
          navigate("/home");
        } catch (error) {
          console.error('Logout error:', error);
          // Trigger auth change anyway
          window.dispatchEvent(new Event('auth-change'));
          navigate("/home");
        }
      };

    const closeSidebar = () => {
        try { setOpenSidebar(false); } catch (_) {}
    };
    
    return (
        <>
        {openSidebar && <div className="sidebar-backdrop" onClick={closeSidebar}></div>}
        <div className={`sidebar layout admin-sidebar ${openSidebar ? "open" : ""}`} id="sidebar-donor">
            <button onClick={() => navigate("/home")} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <img src={systemLogo || lifelinkLogoBlack} alt={`${platformName || "LifeLink"} logo`} />
            </button>

            <div className="links">
                <div className="link-item" onClick={closeSidebar}>
                    <GoHomeFill className="icon-size text-gray-600"/>
                    <NavLink to="/donor/home" className="text-gray-800">Home</NavLink>
                </div>
                <div className="link-item" onClick={closeSidebar}>
                    <IoHeart className="icon-size text-gray-600"/>
                    <NavLink to="/donor/my-donations" className="text-gray-800">My Donations</NavLink>
                </div>
                <div className="link-item" onClick={closeSidebar}>
                    <IoCalendar className="icon-size text-gray-600"/>
                    <NavLink to="/donor/my-appointments" className="text-gray-800">Appointments</NavLink>
                </div>    
                <div className="link-item" onClick={closeSidebar}>
                    <IoGift className="icon-size text-gray-600"/>
                    <NavLink to="/donor/rewards" className="text-gray-800">Rewards</NavLink>
                </div>
                <div className="link-item" onClick={closeSidebar}>
                    <FaGamepad className="icon-size text-gray-600"/>
                    <NavLink to="/donor/quiz" className="text-gray-800">Quiz</NavLink>
                </div>
                <div className="link-item" onClick={closeSidebar}>
                    <IoSettings className="icon-size text-gray-600"/>
                    <NavLink to="/donor/settings" className="text-gray-800">Profile Settings</NavLink>
                </div>
                <div className="link-item" onClick={closeSidebar}>
                    <MdContactSupport className="icon-size text-gray-600"/>
                    <NavLink to="/support" className="text-gray-800">Support</NavLink>
                </div>
            </div>

            <div className="logout">
                <FiLogOut className="icon-size text-red-500"/>
                <button className="logout-button !text-red-500" onClick={handleLogout}>Logout</button>
            </div>
        </div>
        </>
    )
}