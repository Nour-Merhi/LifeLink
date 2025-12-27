import lifelinkLogoBlack from "../../assets/imgs/LifeLinkLogoBlack.svg";
import nurse from "../../assets/imgs/nurse.svg";
import { GoHomeFill } from "react-icons/go";
import { IoPerson } from "react-icons/io5";
import { FaHospital } from "react-icons/fa";
import { BiSolidBuildingHouse } from "react-icons/bi";
import { PiHeartbeatFill } from "react-icons/pi";
import { BiSolidBadgeDollar } from "react-icons/bi";
import { MdNotificationsActive } from "react-icons/md";
import { RiSettings5Fill } from "react-icons/ri";
import { FiLogOut } from "react-icons/fi";

import { NavLink } from "react-router-dom";

export default function Sidebar(){
    return (
        <>
        <div className="sidebar linear-red layout admin-sidebar ">
            <img src={lifelinkLogoBlack} alt="lifelink logo" />

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
                    <BiSolidBuildingHouse className="icon-size text-white"/>
                    <NavLink to="/admin/home-visits">Home Visits</NavLink>
                </div>
                <div className="link-item">
                    <FaHospital className="icon-size text-white"/>
                    <NavLink to="/admin/hospital-appointments">Hospital Appointments</NavLink>
                </div>
                <div className="link-item">
                    <img src={nurse} alt="nurse" width="23px" height="23px"/>
                    <NavLink to="/admin/phlebotomists">Phlebotomists</NavLink>
                </div>
                <div className="link-item">
                    <PiHeartbeatFill className="icon-size text-white"/>
                    <NavLink to="/admin/organ-pledges">Organ Pledges</NavLink>
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
                    <RiSettings5Fill className="icon-size text-white"/>
                    <NavLink to="/admin/settings">Settings</NavLink>
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