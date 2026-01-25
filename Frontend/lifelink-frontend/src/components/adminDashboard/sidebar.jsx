import lifelinkLogoBlack from "../../assets/imgs/LogoAdmin.png";
import { IoPersonCircle } from "react-icons/io5";
import { FaHospital } from "react-icons/fa";
import { BiSolidBadgeDollar } from "react-icons/bi";
import { MdNotificationsActive } from "react-icons/md";
import { IoSettings } from "react-icons/io5";
import { FiLogOut } from "react-icons/fi";
import { IoAnalytics } from "react-icons/io5";
import { IoPeople } from "react-icons/io5";
import { FaUserNurse } from "react-icons/fa";
import { BiSolidShieldPlus } from "react-icons/bi";
import { MdAddHomeWork } from "react-icons/md";
import { MdLocalHospital } from "react-icons/md";
import { RiArticleFill } from "react-icons/ri";
import { FiGift } from "react-icons/fi";
import { MdWorkspacePremium, MdQuiz } from "react-icons/md";


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
        <div className={`sidebar linear-red layout admin-sidebar ${openSidebar ? "open" : ""}`}>
            <button onClick={() => navigate("/home")}>
                <img src={lifelinkLogoBlack} alt={`${platformName || "LifeLink"} logo`} />
            </button>

            <div className="links text-white">
                <NavLink to="/admin/dashboard" className="link-item" onClick={closeSidebar}>
                    <IoAnalytics className="icon-size text-white"/>
                    <span>Dashboard</span>
                </NavLink>
                <div className="link-item" onClick={closeSidebar}>
                    <IoPeople className="icon-size text-white"/>
                    <NavLink to="/admin/donors">Donors</NavLink>
                </div>
                <div className="link-item" onClick={closeSidebar}>
                    <FaUserNurse className="icon-size text-white"/>
                    <NavLink to="/admin/phlebotomists">Phlebotomists</NavLink>
                </div>
                <div className="link-item" onClick={closeSidebar}>
                    <FaHospital className="icon-size text-white"/>
                    <NavLink to="/admin/hospitals">Hospitals</NavLink>
                </div>
                
                <div className="link-item" onClick={closeSidebar}>
                    <MdAddHomeWork className="icon-size text-white"/>
                    <NavLink to="/admin/home-visits">Home Visits</NavLink>
                </div>
                <div className="link-item" onClick={closeSidebar}>
                    <MdLocalHospital className="icon-size text-white"/>
                    <NavLink to="/admin/hospital-appointments">Hospital Appointments</NavLink>
                </div>
                <div className="link-item" onClick={closeSidebar}>
                    <BiSolidShieldPlus className="icon-size text-white"/>
                    <NavLink to="/admin/organ-pledges">Organ Coordination</NavLink>
                </div>
                <div className="link-item" onClick={closeSidebar}>
                    <BiSolidBadgeDollar className="icon-size text-white"/>
                    <NavLink to="/admin/financials">Financials</NavLink>
                </div>
                <div className="link-item" onClick={closeSidebar}>
                    <RiArticleFill className="icon-size text-white"/>
                    <NavLink to="/admin/articles">Articles</NavLink>
                </div>
                <div className="link-item" onClick={closeSidebar}>
                    <FiGift className="icon-size text-white"/>
                    <NavLink to="/admin/reward-shop">Reward Shop</NavLink>
                </div>
                <div className="link-item" onClick={closeSidebar}>
                    <MdWorkspacePremium className="icon-size text-white"/>
                    <NavLink to="/admin/certificates">Certificates</NavLink>
                </div>
                <div className="link-item" onClick={closeSidebar}>
                    <MdQuiz className="icon-size text-white"/>
                    <NavLink to="/admin/quiz-management">Quiz Management</NavLink>
                </div>
                <div className="link-item" onClick={closeSidebar}>
                    <MdNotificationsActive className="icon-size text-white"/>
                    <NavLink to="/admin/notifications">Notifications</NavLink>
                </div>
                
                <div className="link-item" onClick={closeSidebar}>
                    <IoSettings className="icon-size text-white"/>
                    <NavLink to="/admin/platform-settings">Settings</NavLink>
                </div>
                <div className="link-item" onClick={closeSidebar}>
                    <IoPersonCircle className="icon-size text-white"/>
                    <NavLink to="/admin/profile">Profile</NavLink>
                </div>
            </div>

            <div className="logout">
                <FiLogOut className="icon-size text-white"/>
                <button className="logout-button" onClick={handleLogout}>Logout</button>
            </div>
        </div>
        </>
    )
}