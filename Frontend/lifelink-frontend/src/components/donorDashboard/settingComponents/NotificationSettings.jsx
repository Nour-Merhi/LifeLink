import { useState } from "react";
import { MdNotificationsActive } from "react-icons/md";
import "../../../styles/Dashboard.css";

export default function NotificationSettings() {
    const [notificationSettings, setNotificationSettings] = useState({
        smsNotifications: false,
        appNotifications: false,
        emailNotifications: false,
        appointmentReminders: false,
        emergencyAlerts: false,
        campaignUpdates: false,
        muteNonUrgent: false
    });

    const handleNotificationToggle = (e) => {
        const { name, checked } = e.target;
        setNotificationSettings(prev => ({ ...prev, [name]: checked }));
    };

    return (
        <div className="settings-form-container">
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
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
            </div>
        </div>
    );
}

