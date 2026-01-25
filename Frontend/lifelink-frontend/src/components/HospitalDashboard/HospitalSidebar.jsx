import lifelinkLogo from "../../assets/imgs/Logo.png";
import { IoPeople } from "react-icons/io5";
import { IoCalendar, IoSettings } from "react-icons/io5";
import { PiHeartbeatFill } from "react-icons/pi";
import { MdNotificationsActive } from "react-icons/md";
import { FiLogOut } from "react-icons/fi";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { BiSolidShieldPlus } from "react-icons/bi";
import { FaUserNurse } from "react-icons/fa";
import { IoAnalytics } from "react-icons/io5";

import { useState } from "react";
import { NavLink } from "react-router-dom";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { useSystemSettings } from "../../context/SystemSettingsContext";

export default function HospitalSidebar({openSidebar, setOpenSidebar}){
    const [openMenuBlood, setOpenMenuBlood] = useState(false);
    const [openMenuOrgan, setOpenMenuOrgan] = useState(false);
    const navigate = useNavigate();
    const { systemLogo, platformName } = useSystemSettings();

    const toggleBloodMenu = () => {
        setOpenMenuBlood((prev) => !prev);
    };

    const toggleOrganMenu = () => {
        setOpenMenuOrgan((prev) => !prev);
    };
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
        {openSidebar && <div className="sidebar-backdrop" onClick={() => setOpenSidebar(false)}></div>}
        <div className={`sidebar linear-hospital layout admin-sidebar ${openSidebar ? "open" : ""}`}>
            
            <img onClick={() => navigate("/home")} cursor="pointer" src={systemLogo || lifelinkLogo} alt={`${platformName || "LifeLink"} logo`} />

            <div className="links text-white">
                <div className="link-item" onClick = {
                    () => (
                        setOpenMenuBlood(false),
                        setOpenMenuOrgan(false)
                    )
                }>
                    <IoAnalytics className="icon-size text-white"/>
                    <NavLink to="/hospital/analytics">Analytics</NavLink>
                </div>

                <div className="link-item" onClick = {
                    () => (
                        setOpenMenuBlood(false),
                        setOpenMenuOrgan(false)
                    )
                }>
                    <IoPeople className="icon-size text-white"/>
                    <NavLink to="/hospital/donors">Donor Management</NavLink>
                </div>

                <div className="link-item" onClick = {
                    () => (
                        setOpenMenuBlood(false),
                        setOpenMenuOrgan(false)
                    )
                }>
                    <FaUserNurse className="icon-size text-white"/>
                    <NavLink to="/hospital/phlebotomists">Phlebotomists</NavLink>
                </div>

                <div className="link-item" style={{ position: 'relative', flexDirection: 'column', alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <IoCalendar className="icon-size text-white"/>
                        <div 
                            className="drop-down-title" 
                            onClick={
                                ()=> (
                                    toggleBloodMenu(),
                                    setOpenMenuOrgan(false)
                                )}
                            style={{ cursor: 'pointer', userSelect: 'none', flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}
                        >
                            Blood Coordination 
                            {openMenuBlood ? <IoIosArrowUp className="text-[18px] text-white" /> : <IoIosArrowDown className="txet-[20px] text-white" />}
                        </div>
                    </div>
                    {openMenuBlood && (
                        <div className="drop-down-list" style={{ 
                            position: 'relative',
                          
                        }}>
                            <div className="drop-down-items" style={{ display: 'flex', flexDirection: 'column' }}>
                                <div className="link-item appointments-link">
                                    <NavLink to="/hospital/appointments">
                                         Regular Requests
                                    </NavLink>
                                </div>
                                <div className="link-item appointments-link">
                                    <NavLink 
                                        to="/hospital/urgent-requests"
                                    >
                                        Urgent Requests
                                    </NavLink>
                                </div>
                                <div className="link-item appointments-link">
                                    <NavLink 
                                        to="/hospital/home-visits"
                                    >
                                        Home Appointments
                                    </NavLink>
                                </div>
                                <div className="link-item appointments-link">
                                    <NavLink 
                                        to="/hospital/hospital-app"
                                    >
                                        Hospital Appointments
                                    </NavLink>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
               
                <div className="link-item" style={{ position: 'relative', flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BiSolidShieldPlus className="icon-size text-white"/>
                        <div 
                            className="drop-down-title" 
                            onClick={
                                ()=> (
                                    toggleOrganMenu(),
                                    setOpenMenuBlood(false)
                                )}
                            style={{ cursor: 'pointer', userSelect: 'none', flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}
                        >
                            Organ Coordination 
                            {openMenuOrgan ? <IoIosArrowUp className="text-[18px] text-white" /> : <IoIosArrowDown className="txet-[20px] text-white" />}
                        </div>
                    </div>
                    {openMenuOrgan && (
                        <div className="drop-down-list" style={{ 
                            position: 'relative'}}
                        >
                            <div className="drop-down-items" style={{ display: 'flex', flexDirection: 'column' }}>
                                <div className="link-item appointments-link">
                                    <NavLink to="/hospital/organ-coordination/living-donors">
                                        Living Donors
                                    </NavLink>
                                </div>
                                <div className="link-item appointments-link">
                                    <NavLink to="/hospital/organ-coordination/after-death-pledges">
                                        After Death Pledges
                                    </NavLink>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="link-item" onClick = {
                    () => (
                        setOpenMenuBlood(false),
                        setOpenMenuOrgan(false)
                    )
                }>
                    <PiHeartbeatFill className="icon-size text-white"/>
                    <NavLink to="/hospital/inventory">Inventory</NavLink>
                </div>

                <div className="link-item" onClick = {
                    () => (
                        setOpenMenuBlood(false),
                        setOpenMenuOrgan(false)
                    )
                }>
                    <MdNotificationsActive className="icon-size text-white"/>
                    <NavLink to="/hospital/notifications">Message Center</NavLink>
                </div>
                
                <div className="link-item" onClick = {
                    () => (
                        setOpenMenuBlood(false),
                        setOpenMenuOrgan(false)
                    )
                }>
                    <IoSettings className="icon-size text-white"/>
                    <NavLink to="/hospital/settings">Hospital Settings</NavLink>
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

