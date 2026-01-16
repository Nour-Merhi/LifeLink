import lifelinkLogoBlack from "../../assets/imgs/LogoAdmin.png";
import nurse from "../../assets/imgs/nurse.svg";
import { GoHomeFill } from "react-icons/go";
import { IoPerson, IoPersonCircle } from "react-icons/io5";
import { FaHospital } from "react-icons/fa";
import { BiSolidBuildingHouse } from "react-icons/bi";
import { PiHeartbeatFill } from "react-icons/pi";
import { BiSolidBadgeDollar } from "react-icons/bi";
import { MdNotificationsActive } from "react-icons/md";
import { RiSettings5Fill } from "react-icons/ri";
import { RiArticleLine } from "react-icons/ri";
import { FiLogOut } from "react-icons/fi";

import { NavLink, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useSystemSettings } from "../../context/SystemSettingsContext";

export default function Sidebar(){
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

    return (
        <>
        <div className="sidebar linear-red layout admin-sidebar ">
            <button onClick={() => navigate("/home")}>
                <img src={lifelinkLogoBlack} alt={`${platformName || "LifeLink"} logo`} />
            </button>

            <div className="links text-white">
                <div className="link-item">
                    <GoHomeFill className="icon-size text-white"/>
                    <NavLink to="/admin/dashboard">Dashboard</NavLink>
                </div>
                <div className="link-item">
                    <IoPerson className="icon-size text-white"/>
                    <NavLink to="/admin/donors">Donors</NavLink>
                </div>
                <div className="link-item">
                    <FaHospital className="icon-size text-white"/>
                    <NavLink to="/admin/hospitals">Hospitals</NavLink>
                </div>
                <div className="link-item">
                    <img src={nurse} alt="nurse" width="23px" height="23px"/>
                    <NavLink to="/admin/phlebotomists">Phlebotomists</NavLink>
                </div>
                <div className="link-item">
                    <BiSolidBuildingHouse className="icon-size text-white"/>
                    <NavLink to="/admin/home-visits">Home Visits</NavLink>
                </div>
                <div className="link-item">
                    <FaHospital className="icon-size text-white"/>
                    <NavLink to="/admin/hospital-appointments">Hospital Appointments</NavLink>
                </div>
                <div className="link-item">
                    <PiHeartbeatFill className="icon-size text-white"/>
                    <NavLink to="/admin/organ-pledges">Organ Coordination</NavLink>
                </div>
                <div className="link-item">
                    <BiSolidBadgeDollar className="icon-size text-white"/>
                    <NavLink to="/admin/financials">Financials</NavLink>
                </div>
                <div className="link-item">
                    <MdNotificationsActive className="icon-size text-white"/>
                    <NavLink to="/admin/notifications">Notifications</NavLink>
                </div>
                <div className="link-item">
                    <RiArticleLine className="icon-size text-white"/>
                    <NavLink to="/admin/articles">Articles</NavLink>
                </div>
                <div className="link-item">
                    <RiSettings5Fill className="icon-size text-white"/>
                    <NavLink to="/admin/platform-settings">Settings</NavLink>
                </div>
                <div className="link-item">
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