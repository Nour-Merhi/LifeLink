import { useState } from "react";
import { IoChatbubbleOutline } from "react-icons/io5";
import "../../../styles/Dashboard.css";

export default function CommunicationPreferences() {
    const [communicationPreferences, setCommunicationPreferences] = useState({
        preferredChannel: "sms", // "sms", "email", "both"
        hospitalUpdates: false,
        donationCampaigns: false
    });

    const handleCommunicationChannelChange = (channel) => {
        setCommunicationPreferences(prev => ({ ...prev, preferredChannel: channel }));
    };

    const handleCommunicationToggle = (e) => {
        const { name, checked } = e.target;
        setCommunicationPreferences(prev => ({ ...prev, [name]: checked }));
    };

    const handleCommunicationSubmit = (e) => {
        e.preventDefault();
        console.log('Communication preferences:', communicationPreferences);
        // Add save functionality here
    };

    return (
        <div className="settings-form-container">
            <div className="communication-header">
                <IoChatbubbleOutline className="communication-icon" />
                <h2 className="communication-title">Communication Preferences</h2>
            </div>

            <form onSubmit={handleCommunicationSubmit} className="communication-form">
                {/* Preferred Communication Channel */}
                <div className="communication-section">
                    <h3 className="communication-section-title">Preferred Communication Channel</h3>
                    <div className="communication-channel-options">
                        <button
                            type="button"
                            className={`communication-channel-card ${communicationPreferences.preferredChannel === "sms" ? "selected" : ""}`}
                            onClick={() => handleCommunicationChannelChange("sms")}
                        >
                            <h4 className="channel-card-title">SMS Only</h4>
                            <p className="channel-card-description">Text messages only</p>
                        </button>
                        <button
                            type="button"
                            className={`communication-channel-card ${communicationPreferences.preferredChannel === "email" ? "selected" : ""}`}
                            onClick={() => handleCommunicationChannelChange("email")}
                        >
                            <h4 className="channel-card-title">Email Only</h4>
                            <p className="channel-card-description">Text messages only</p>
                        </button>
                        <button
                            type="button"
                            className={`communication-channel-card ${communicationPreferences.preferredChannel === "both" ? "selected" : ""}`}
                            onClick={() => handleCommunicationChannelChange("both")}
                        >
                            <h4 className="channel-card-title">Both Two</h4>
                            <p className="channel-card-description">Text messages only</p>
                        </button>
                    </div>
                </div>

                {/* Communication Consent */}
                <div className="communication-section">
                    <h3 className="communication-section-title">Communication Consent</h3>
                    
                    <div className="notification-item">
                        <div className="notification-item-content">
                            <h4 className="notification-item-title">Hospital Updates</h4>
                            <p className="notification-item-description">Receive updates from hospitals about your donations</p>
                        </div>
                        <label className="toggle-switch">
                            <input 
                                type="checkbox"
                                name="hospitalUpdates"
                                checked={communicationPreferences.hospitalUpdates}
                                onChange={handleCommunicationToggle}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="notification-item">
                        <div className="notification-item-content">
                            <h4 className="notification-item-title">Donation Campaigns</h4>
                            <p className="notification-item-description">Receive information about special donation drives</p>
                        </div>
                        <label className="toggle-switch">
                            <input 
                                type="checkbox"
                                name="donationCampaigns"
                                checked={communicationPreferences.donationCampaigns}
                                onChange={handleCommunicationToggle}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <div className="settings-form-actions">
                    <button type="submit" className="save-changes-button">
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}

