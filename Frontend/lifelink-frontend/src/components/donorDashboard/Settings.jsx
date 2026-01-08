import { useState, useEffect } from "react";
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
import api from "../../api/axios";

export default function Settings(){
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState("profile");
    const [settingsData, setSettingsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Fetch all settings data once on mount
    useEffect(() => {
        const fetchAllSettings = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await api.get("/api/settings/all");
                setSettingsData(response.data);
            } catch (err) {
                console.error("Error fetching settings:", err);
                setError(err.response?.data?.message || "Failed to load settings");
            } finally {
                setLoading(false);
            }
        };

        fetchAllSettings();
    }, []);

    const settingsMenuItems = [
        { id: "profile", label: "Profile Setting", icon: IoPerson },
        { id: "medical", label: "Medical Information", icon: FaHeartbeat },
        { id: "notification", label: "Notification Settings", icon: MdNotificationsActive },
        { id: "password", label: "Password", icon: IoLockClosed },
        { id: "communication", label: "Communication", icon: IoChatbubbleOutline }
    ];

    // Callback to refresh settings data after updates
    const handleSettingsUpdate = async () => {
        try {
            const response = await api.get("/api/settings/all");
            setSettingsData(response.data);
        } catch (err) {
            console.error("Error refreshing settings:", err);
        }
    };

    if (loading) {
        return (
            <div className="settings-page">
                <div className="settings-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <IoArrowBack />
                        <h1 className="settings-title !ml-2">Settings</h1>
                    </button>
                </div>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading settings...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="settings-page">
                <div className="settings-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <IoArrowBack />
                        <h1 className="settings-title !ml-2">Settings</h1>
                    </button>
                </div>
                <div className="flex items-center justify-center h-64">
                    <p className="text-red-500">Error: {error}</p>
                </div>
            </div>
        );
    }

    if (!settingsData) {
        return (
            <div className="settings-page">
                <div className="settings-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <IoArrowBack />
                        <h1 className="settings-title !ml-2">Settings</h1>
                    </button>
                </div>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">No settings data available</p>
                </div>
            </div>
        );
    }

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
                    {activeSection === "profile" && (
                        <ProfileSetting 
                            initialData={settingsData.profile} 
                            bloodTypes={settingsData.blood_types}
                            onUpdate={handleSettingsUpdate}
                        />
                    )}
                    {activeSection === "medical" && (
                        <MedicalInformation 
                            initialData={settingsData.medical}
                            bloodTypes={settingsData.blood_types}
                            onUpdate={handleSettingsUpdate}
                        />
                    )}
                    {activeSection === "notification" && (
                        <NotificationSettings 
                            initialData={settingsData.notifications}
                            onUpdate={handleSettingsUpdate}
                        />
                    )}
                    {activeSection === "password" && <PasswordChange />}
                    {activeSection === "communication" && (
                        <CommunicationPreferences 
                            initialData={settingsData.communication}
                            onUpdate={handleSettingsUpdate}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
