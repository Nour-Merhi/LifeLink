import { useState, useEffect } from "react";
import { MdNotificationsActive } from "react-icons/md";
import "../../../styles/Dashboard.css";
import api from "../../../api/axios";

export default function NotificationSettings({ initialData, onUpdate }) {
    const [notificationSettings, setNotificationSettings] = useState({
        smsNotifications: false,
        appNotifications: false,
        emailNotifications: false,
        appointmentReminders: false,
        emergencyAlerts: false,
        campaignUpdates: false,
        muteNonUrgent: false
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Initialize form data from props
    useEffect(() => {
        if (initialData) {
            // Map backend snake_case to frontend camelCase
            setNotificationSettings({
                smsNotifications: initialData.sms_notifications || false,
                appNotifications: initialData.app_notifications !== false,
                emailNotifications: initialData.email_notifications !== false,
                appointmentReminders: initialData.appointment_reminders !== false,
                emergencyAlerts: initialData.emergency_alerts !== false,
                campaignUpdates: initialData.campaign_updates || false,
                muteNonUrgent: initialData.mute_non_urgent || false
            });
        }
    }, [initialData]);

    const handleNotificationToggle = async (e) => {
        const { name, checked } = e.target;
        const updatedSettings = { ...notificationSettings, [name]: checked };
        setNotificationSettings(updatedSettings);
        setSuccess(false);

        // Auto-save on toggle
        try {
            setSaving(true);
            setError("");

            // Map frontend camelCase to backend snake_case
            const updateData = {
                sms_notifications: updatedSettings.smsNotifications,
                app_notifications: updatedSettings.appNotifications,
                email_notifications: updatedSettings.emailNotifications,
                appointment_reminders: updatedSettings.appointmentReminders,
                emergency_alerts: updatedSettings.emergencyAlerts,
                campaign_updates: updatedSettings.campaignUpdates,
                mute_non_urgent: updatedSettings.muteNonUrgent
            };

            await api.put("/api/settings/notifications", updateData);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
            
            // Refresh settings data
            if (onUpdate) {
                onUpdate();
            }
        } catch (err) {
            console.error("Error updating notification settings:", err);
            setError(err.response?.data?.message || "Failed to update notification settings");
            // Revert the toggle on error
            setNotificationSettings(notificationSettings);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="settings-form-container">
            {error && (
                <div style={{ padding: "10px", marginBottom: "20px", backgroundColor: "#fee", color: "#c33", borderRadius: "5px" }}>
                    {error}
                </div>
            )}
            {success && (
                <div style={{ padding: "10px", marginBottom: "20px", backgroundColor: "#efe", color: "#3c3", borderRadius: "5px" }}>
                    Settings saved!
                </div>
            )}

            <div className="notification-header">
                <MdNotificationsActive className="notification-icon" />
                <h2 className="notification-title">Notification Settings</h2>
            </div>

            {/* Real-time Alerts */}
            <div className="notification-category">
                <h3 className="notification-category-title">Real-time Alerts</h3>
                
                <div className="notification-item">
                    <div className="notification-item-content">
                        <h4 className="notification-item-title">SMS Notifications</h4>
                        <p className="notification-item-description">Receive text messages for urgent updates</p>
                    </div>
                    <label className="toggle-switch">
                        <input 
                            type="checkbox"
                            name="smsNotifications"
                            checked={notificationSettings.smsNotifications}
                            onChange={handleNotificationToggle}
                            disabled={saving}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                <div className="notification-item">
                    <div className="notification-item-content">
                        <h4 className="notification-item-title">App Notifications</h4>
                        <p className="notification-item-description">Push notifications within the LifeLink app</p>
                    </div>
                    <label className="toggle-switch">
                        <input 
                            type="checkbox"
                            name="appNotifications"
                            checked={notificationSettings.appNotifications}
                            onChange={handleNotificationToggle}
                            disabled={saving}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                <div className="notification-item">
                    <div className="notification-item-content">
                        <h4 className="notification-item-title">Email Notifications</h4>
                        <p className="notification-item-description">Receive detailed email updates</p>
                    </div>
                    <label className="toggle-switch">
                        <input 
                            type="checkbox"
                            name="emailNotifications"
                            checked={notificationSettings.emailNotifications}
                            onChange={handleNotificationToggle}
                            disabled={saving}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
            </div>

            {/* Appointment Reminders */}
            <div className="notification-category">
                <h3 className="notification-category-title">Appointment Reminders</h3>
                
                <div className="notification-item">
                    <div className="notification-item-content">
                        <h4 className="notification-item-title">Appointment Reminders</h4>
                        <p className="notification-item-description">Get reminded about upcoming donation appointments</p>
                    </div>
                    <label className="toggle-switch">
                        <input 
                            type="checkbox"
                            name="appointmentReminders"
                            checked={notificationSettings.appointmentReminders}
                            onChange={handleNotificationToggle}
                            disabled={saving}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                <div className="notification-item">
                    <div className="notification-item-content">
                        <h4 className="notification-item-title">Emergency Alerts</h4>
                        <p className="notification-item-description">Critical blood shortage alerts in your area</p>
                    </div>
                    <label className="toggle-switch">
                        <input 
                            type="checkbox"
                            name="emergencyAlerts"
                            checked={notificationSettings.emergencyAlerts}
                            onChange={handleNotificationToggle}
                            disabled={saving}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
            </div>

            {/* Optional Notifications */}
            <div className="notification-category">
                <h3 className="notification-category-title">Optional Notifications</h3>
                
                <div className="notification-item">
                    <div className="notification-item-content">
                        <h4 className="notification-item-title">Campaign Updates</h4>
                        <p className="notification-item-description">Information about donation drives and events</p>
                    </div>
                    <label className="toggle-switch">
                        <input 
                            type="checkbox"
                            name="campaignUpdates"
                            checked={notificationSettings.campaignUpdates}
                            onChange={handleNotificationToggle}
                            disabled={saving}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                <div className="notification-item">
                    <div className="notification-item-content">
                        <h4 className="notification-item-title">Mute Non-urgent Updates</h4>
                        <p className="notification-item-description">Disable all non-critical notifications</p>
                    </div>
                    <label className="toggle-switch">
                        <input 
                            type="checkbox"
                            name="muteNonUrgent"
                            checked={notificationSettings.muteNonUrgent}
                            onChange={handleNotificationToggle}
                            disabled={saving}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
            </div>
        </div>
    );
}
