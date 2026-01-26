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
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io"
import { MdWorkspacePremium, MdQuiz } from "react-icons/md";
import { MdManageAccounts } from "react-icons/md";
import { IoCalendar } from "react-icons/io5";


import { NavLink, useNavigate } from "react-router-dom";
import {  useState } from "react";
import api from "../../api/axios";
import { useSystemSettings } from "../../context/SystemSettingsContext";

export default function Sidebar({ openSidebar = false, setOpenSidebar = () => {} } = {}){
    const navigate = useNavigate();
    const [openManageUsers, setOpenManageUsers] = useState(false);
    const [openApp, setOpenApp] = useState(false);
    
    const { systemLogo, platformName } = useSystemSettings();

    const toggleManageUsers = () => {
        setOpenManageUsers((prev) => !prev);
        closeSidebar();
    };

    const toggleAppointments = () => {
        setOpenApp((prev) => !prev);
        closeSidebar();
    }

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

            <div className="links text-white overflow-sidebar">
                <NavLink to="/admin/dashboard" className="link-item" onClick={closeSidebar}>
                    <IoAnalytics className="icon-size text-white"/>
                    <span>Dashboard</span>
                </NavLink>
 

                <div className="link-item" style={{ position: 'relative', flexDirection: 'column', alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <MdManageAccounts className="icon-size text-white"/>
                        <div 
                            className="drop-down-title"
                            onClick={
                                () => {
                                    setOpenApp(false);
                                    toggleManageUsers();
                                    closeSidebar(); 
                            }}    
                            style={{ cursor: 'pointer', userSelect: 'none', flex: 1, display: 'flex', alignItems: 'center', gap: 'p5x' }}
                        >
                            Manage Users
                            {openManageUsers ? <IoIosArrowUp className="text-[18px] text-white"/> : <IoIosArrowDown className="text-[18px] text-white" />}
                        </div>
                    </div>
                    {openManageUsers && <>
                       <div className="drop-down-list" style={{position: 'relative'}}>
                            <div className="link-item appointments-link" onClick ={closeSidebar}>
                                <IoPeople className="icon-size text-white"/>
                                <NavLink to="/admin/donors">Donors</NavLink>
                            </div>
                            <div className="link-item appoitments-link" onClick = {closeSidebar}>
                                <FaUserNurse className="icon-size text-white"/>
                                <NavLink to="/admin/phlebotomists">Phlebotomists</NavLink>
                            </div>
                            <div className="link-item appointments-link" onClick = {closeSidebar}>
                                <FaHospital className="icon-size text-white"/>
                                <NavLink to="/admin/hospitals">Hospitals</NavLink>
                            </div>
                       </div>
                    
                    </>}
                </div>
                
                
                <div className="link-item" style={{ position: 'relative', flexDirection: 'column', alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <IoCalendar className="icon-size text-white"/>
                        <div 
                            className="drop-down-title" 
                            onClick={
                                ()=> {
                                    setOpenManageUsers(false);
                                    toggleAppointments();
                                    closeSidebar();
                                }}
                            style={{ cursor: 'pointer', userSelect: 'none', flex: 1, display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                            Manage Appointments 
                            {openApp ? <IoIosArrowUp className="text-[18px] text-white" /> : <IoIosArrowDown className="txet-[18px] text-white" />}
                        </div>
                    </div>
                    {openApp && (
                        <div className="drop-down-list" style={{ 
                            position: 'relative',
                          
                        }}>
                            <div className="link-item" onClick={() => {
                                closeSidebar
                            }}>
                                <MdAddHomeWork className="icon-size text-white"/>
                                <NavLink to="/admin/home-visits">Home Visits</NavLink>
                            </div>
                            <div className="link-item" onClick={() => {
                                closeSidebar
                            }}>
                                <MdLocalHospital className="icon-size text-white"/>
                                <NavLink to="/admin/hospital-appointments">Hospital Appointments</NavLink>
                            </div>
                            <div className="link-item" onClick={() => {
                                closeSidebar
                            }}>
                                <BiSolidShieldPlus className="icon-size text-white"/>
                                <NavLink to="/admin/organ-pledges">Organ Coordination</NavLink>
                            </div>
                        </div>
                    )}
                </div>


                <div className="link-item" onClick={() => {
                    setOpenManageUsers(false);
                    setOpenApp(false);
                    closeSidebar
                }}>
                    <BiSolidBadgeDollar className="icon-size text-white"/>
                    <NavLink to="/admin/financials">Financials</NavLink>
                </div>
                <div className="link-item" onClick={() => {
                    setOpenManageUsers(false);
                    setOpenApp(false);
                    closeSidebar
                }}>
                    <RiArticleFill className="icon-size text-white"/>
                    <NavLink to="/admin/articles">Articles</NavLink>
                </div>
                <div className="link-item" onClick={() => {
                    setOpenManageUsers(false);
                    setOpenApp(false);
                    closeSidebar
                }}>
                    <FiGift className="icon-size text-white"/>
                    <NavLink to="/admin/reward-shop">Reward Shop</NavLink>
                </div>
                <div className="link-item" onClick={() => {
                    setOpenManageUsers(false);
                    setOpenApp(false);
                    closeSidebar
                }}>
                    <MdWorkspacePremium className="icon-size text-white"/>
                    <NavLink to="/admin/certificates">Certificates</NavLink>
                </div>
                <div className="link-item" onClick={() => {
                    setOpenManageUsers(false);
                    setOpenApp(false);
                    closeSidebar
                }}>
                    <MdQuiz className="icon-size text-white"/>
                    <NavLink to="/admin/quiz-management">Quiz Management</NavLink>
                </div>
                <div className="link-item" onClick={() => {
                    setOpenManageUsers(false);
                    setOpenApp(false);
                    closeSidebar
                }}>
                    <MdNotificationsActive className="icon-size text-white"/>
                    <NavLink to="/admin/notifications">Notifications</NavLink>
                </div>
                
                <div className="link-item" onClick={() => {
                    setOpenManageUsers(false);
                    setOpenApp(false);
                    closeSidebar
                }}>
                    <IoSettings className="icon-size text-white"/>
                    <NavLink to="/admin/platform-settings">Settings</NavLink>
                </div>
                <div className="link-item" onClick={() => {
                    setOpenManageUsers(false);
                    setOpenApp(false);
                    closeSidebar
                }}>
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