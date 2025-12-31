import lifelinkLogoBlack from "../../assets/imgs/LogoAdmin.png";
import { GoHomeFill } from "react-icons/go";
import { IoPerson } from "react-icons/io5";
import { RiSettings5Fill } from "react-icons/ri";
import { FiLogOut } from "react-icons/fi";
import { IoCalendarSharp } from "react-icons/io5";
import { FaRankingStar } from "react-icons/fa6";
import { BiSupport } from "react-icons/bi";
import { MdContactSupport } from "react-icons/md";

import { NavLink, useNavigate } from "react-router-dom";

export default function Sidebar(){
    const navigate = useNavigate();
    
    return (
        <>
        <div className="sidebar layout admin-sidebar ">
            <button onClick={() => navigate("/home")} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }} className="ml-[-52px]">
                <img src={lifelinkLogoBlack} alt="lifelink logo" />
            </button>

            <div className="links">
                <div className="link-item">
                    <GoHomeFill className="icon-size text-gray-600"/>
                    <NavLink to="/donor/home" className="text-gray-800">Home</NavLink>
                </div>
                <div className="link-item">
                    <IoPerson className="icon-size text-gray-600"/>
                    <NavLink to="/donor/my-donations" className="text-gray-800">My Donations</NavLink>
                </div>
                <div className="link-item">
                    <IoCalendarSharp className="icon-size text-gray-600"/>
                    <NavLink to="/donor/my-appointments" className="text-gray-800">Appointments</NavLink>
                </div>    
                <div className="link-item">
                    <FaRankingStar className="icon-size text-gray-600"/>
                    <NavLink to="/donor/rewards" className="text-gray-800">Rewards</NavLink>
                </div>
                <div className="link-item">
                    <RiSettings5Fill className="icon-size text-gray-600"/>
                    <NavLink to="/donor/settings" className="text-gray-800">Settings</NavLink>
                </div>
                <div className="link-item">
                    <MdContactSupport className="icon-size text-gray-600"/>
                    <NavLink to="/support" className="text-gray-800">Support</NavLink>
                </div>
            </div>

            <div className="logout">
                <FiLogOut className="icon-size text-red-500"/>
                <button className="logout-button !text-red-500">Logout</button>
            </div>
        </div>
        </>
    )
}