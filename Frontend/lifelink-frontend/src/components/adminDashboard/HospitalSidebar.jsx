import lifelinkLogoBlack from "../../assets/imgs/LogoAdmin.png";
import { GoHomeFill } from "react-icons/go";
import { IoPerson } from "react-icons/io5";
import { IoCalendarOutline } from "react-icons/io5";
import { FiAlertCircle } from "react-icons/fi";
import { BiSolidBuildingHouse } from "react-icons/bi";
import { LiaUserNurseSolid } from "react-icons/lia";
import { MdOutlineHealthAndSafety } from "react-icons/md";
import { PiHeartbeatFill } from "react-icons/pi";
import { FiBarChart2 } from "react-icons/fi";
import { MdNotificationsActive } from "react-icons/md";
import { RiSettings5Fill } from "react-icons/ri";
import { FiLogOut } from "react-icons/fi";

import { NavLink } from "react-router-dom";

export default function HospitalSidebar(){
    return (
        <>
        <div className="sidebar linear-hospital layout admin-sidebar ">
            <img src={lifelinkLogoBlack} alt="lifelink logo" />

            <div className="links text-white">
                <div className="link-item">
                    <GoHomeFill className="icon-size text-white"/>
                    <NavLink to="/hospital/dashboard">Dashboard</NavLink>
                </div>
                <div className="link-item">
                    <IoPerson className="icon-size text-white"/>
                    <NavLink to="/hospital/donors">Donor Management</NavLink>
                </div>
                <div className="link-item">
                    <IoCalendarOutline className="icon-size text-white"/>
                    <NavLink to="/hospital/appointments">Appointments</NavLink>
                </div>
                <div className="link-item">
                    <FiAlertCircle className="icon-size text-white"/>
                    <NavLink to="/hospital/urgent-requests">Urgent Requests</NavLink>
                </div>
                <div className="link-item">
                    <BiSolidBuildingHouse className="icon-size text-white"/>
                    <NavLink to="/hospital/home-visits">Home Visits</NavLink>
                </div>
                <div className="link-item">
                    <LiaUserNurseSolid className="icon-size text-white"/>
                    <NavLink to="/hospital/phlebotomists">Phlebotomists</NavLink>
                </div>
                <div className="link-item">
                    <MdOutlineHealthAndSafety className="icon-size text-white"/>
                    <NavLink to="/hospital/organ-coordination">Organ Coordination</NavLink>
                </div>
                <div className="link-item">
                    <PiHeartbeatFill className="icon-size text-white"/>
                    <NavLink to="/hospital/inventory">Inventory</NavLink>
                </div>
                <div className="link-item">
                    <FiBarChart2 className="icon-size text-white"/>
                    <NavLink to="/hospital/analytics">Analytics & Reports</NavLink>
                </div>
                <div className="link-item">
                    <MdNotificationsActive className="icon-size text-white"/>
                    <NavLink to="/hospital/notifications">Notifications</NavLink>
                </div>
                <div className="link-item">
                    <RiSettings5Fill className="icon-size text-white"/>
                    <NavLink to="/hospital/settings">Settings</NavLink>
                </div>
            </div>

            <div className="logout">
                <FiLogOut className="icon-size text-white"/>
                <button className="logout-button">Logout</button>
            </div>
        </div>
        </>
    )
}

