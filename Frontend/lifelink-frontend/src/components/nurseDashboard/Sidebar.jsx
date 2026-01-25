import lifelinkLogoBlack from "../../assets/imgs/LogoAdmin.png";
import { GoHomeFill } from "react-icons/go";
import { IoCalendarSharp } from "react-icons/io5";
import { FaHospital } from "react-icons/fa";
import { FaTrophy } from "react-icons/fa";
import { RiSettings5Fill } from "react-icons/ri";
import { IoMdArrowForward } from "react-icons/io";
import { FaUserMd } from "react-icons/fa";
import { FaHouseUser } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";


import { NavLink, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useSystemSettings } from "../../context/SystemSettingsContext";

export default function Sidebar({ openSidebar = false, setOpenSidebar = () => {} } = {}){
    const navigate = useNavigate();
    const { systemLogo, platformName } = useSystemSettings();

    const handleLogout = async () => {
        try {
          await api.post("/api/logout");
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
        <div className={`sidebar layout admin-sidebar linear-light-blue ${openSidebar ? "open" : ""}`}>
            <button onClick={() => navigate("/home")} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <img src={systemLogo || lifelinkLogoBlack} alt={`${platformName || "LifeLink"} logo`} />
            </button>

            <div className="links text-white">
                <div className="link-item" onClick={closeSidebar}>
                    <GoHomeFill className="icon-size text-white"/>
                    <NavLink to="/nurse/home" className="text-white">Home</NavLink>
                </div>
                <div className="link-item" onClick={closeSidebar}>
                    <IoCalendarSharp className="icon-size text-white"/>
                    <NavLink to="/nurse/my-appointments" className="text-white">My Appointments</NavLink>
                </div>
                <div className="link-item" onClick={closeSidebar}>
                    <FaHouseUser className="icon-size text-white"/>
                    <NavLink to="/nurse/donor-requests" className="text-white">Donor Requests</NavLink>
                </div>
                <div className="link-item" onClick={closeSidebar}>
                    <FaHospital className="icon-size text-white"/>
                    <NavLink to="/nurse/hospital-info" className="text-white">Hospital Info</NavLink>
                </div>
                <div className="link-item" onClick={closeSidebar}>
                    <FaUserMd className="icon-size text-white"/>
                    <NavLink to="/nurse/manager-contact" className="text-white">Manager Contact</NavLink>
                </div>
                <div className="link-item" onClick={closeSidebar}>
                    <FaTrophy className="icon-size text-white"/>
                    <NavLink to="/nurse/leaderboard" className="text-white">Leaderboard</NavLink>
                </div>
                <div className="link-item" onClick={closeSidebar}>
                    <RiSettings5Fill className="icon-size text-white"/>
                    <NavLink to="/nurse/settings" className="text-white">Profile Settings</NavLink>
                </div>
            </div>

            <div className="logout">
                <FiLogOut className="icon-size text-white"/>
                <button className="logout-button text-white" onClick={handleLogout}>Logout</button>
            </div>
        </div>
        </>
    )
}
