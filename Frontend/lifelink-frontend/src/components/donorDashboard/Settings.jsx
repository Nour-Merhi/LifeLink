import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { IoPerson } from "react-icons/io5";
import { FaHeartbeat } from "react-icons/fa";
import { MdNotificationsActive } from "react-icons/md";
import { IoLockClosed } from "react-icons/io5";
import { IoChatbubbleOutline } from "react-icons/io5";
import "../../styles/Dashboard.css";
import ProfileSetting from "./settingComponents/ProfileSetting";
import NotificationSettings from "./settingComponents/NotificationSettings";
import PasswordChange from "./settingComponents/PasswordChange";
import CommunicationPreferences from "./settingComponents/CommunicationPreferences";
import MedicalInformation from "./settingComponents/MedicalInformation";

export default function Settings(){
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState("profile");

    const settingsMenuItems = [
        { id: "profile", label: "Profile Setting", icon: IoPerson },
        { id: "medical", label: "Medical Information", icon: FaHeartbeat },
        { id: "notification", label: "Notification Settings", icon: MdNotificationsActive },
        { id: "password", label: "Password", icon: IoLockClosed },
        { id: "communication", label: "Communication", icon: IoChatbubbleOutline }
    ];

    return (
        <div className="settings-page">
            {/* Header */}
            <div className="settings-header">
                <button className="back-btn " onClick={() => navigate(-1)}>
                    <IoArrowBack />
                    <h1 className="settings-title !ml-2">Settings</h1>
                </button>
            </div>

            <div className="settings-container">
                {/* Sidebar Navigation */}
                <div className="settings-sidebar">
                    {settingsMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                className={`settings-menu-item ${activeSection === item.id ? 'active' : ''}`}
                                onClick={() => setActiveSection(item.id)}
                            >
                                <Icon className="settings-menu-icon" />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Main Content */}
                <div className="settings-content">
                    {activeSection === "profile" && <ProfileSetting />}
                    {activeSection === "medical" && <MedicalInformation />}
                    {activeSection === "notification" && <NotificationSettings />}
                    {activeSection === "password" && <PasswordChange />}
                    {activeSection === "communication" && <CommunicationPreferences />}
                </div>
            </div>
        </div>
    );
}

