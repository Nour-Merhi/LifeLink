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

export default function Sidebar(){
    const navigate = useNavigate();

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
        <div className="sidebar layout admin-sidebar linear-light-blue">
            <button onClick={() => navigate("/home")} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <img src={lifelinkLogoBlack} alt="lifelink logo" />
            </button>

            <div className="links text-white">
                <div className="link-item">
                    <GoHomeFill className="icon-size text-white"/>
                    <NavLink to="/nurse/home" className="text-white">Home</NavLink>
                </div>
                <div className="link-item">
                    <IoCalendarSharp className="icon-size text-white"/>
                    <NavLink to="/nurse/my-appointments" className="text-white">My Appointments</NavLink>
                </div>
                <div className="link-item">
                    <FaHouseUser className="icon-size text-white"/>
                    <NavLink to="/nurse/donor-requests" className="text-white">Donor Requests</NavLink>
                </div>
                <div className="link-item">
                    <FaHospital className="icon-size text-white"/>
                    <NavLink to="/nurse/hospital-info" className="text-white">Hospital Info</NavLink>
                </div>
                <div className="link-item">
                    <FaUserMd className="icon-size text-white"/>
                    <NavLink to="/nurse/manager-contact" className="text-white">Manager Contact</NavLink>
                </div>
                <div className="link-item">
                    <FaTrophy className="icon-size text-white"/>
                    <NavLink to="/nurse/leaderboard" className="text-white">Leaderboard</NavLink>
                </div>
                <div className="link-item">
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
