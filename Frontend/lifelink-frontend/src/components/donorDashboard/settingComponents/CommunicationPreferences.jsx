import { useState, useEffect } from "react";
import { IoChatbubbleOutline } from "react-icons/io5";
import "../../../styles/Dashboard.css";
import api from "../../../api/axios";

export default function CommunicationPreferences({ initialData, onUpdate }) {
    const [communicationPreferences, setCommunicationPreferences] = useState({
        preferredChannel: "both", // "sms", "email", "both"
        hospitalUpdates: true,
        donationCampaigns: false
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Initialize form data from props
    useEffect(() => {
        if (initialData) {
            setCommunicationPreferences({
                preferredChannel: initialData.preferred_channel || "both",
                hospitalUpdates: initialData.hospital_updates !== false,
                donationCampaigns: initialData.donation_campaigns || false
            });
        }
    }, [initialData]);

    const handleCommunicationChannelChange = (channel) => {
        setCommunicationPreferences(prev => ({ ...prev, preferredChannel: channel }));
        setSuccess(false);
    };

    const handleCommunicationToggle = (e) => {
        const { name, checked } = e.target;
        setCommunicationPreferences(prev => ({ ...prev, [name]: checked }));
        setSuccess(false);
    };

    const handleCommunicationSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError("");
            setSuccess(false);

            // Map frontend camelCase to backend snake_case
            const updateData = {
                preferred_channel: communicationPreferences.preferredChannel,
                hospital_updates: communicationPreferences.hospitalUpdates,
                donation_campaigns: communicationPreferences.donationCampaigns
            };

            await api.put("/api/settings/communication", updateData);

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            
            // Refresh settings data
            if (onUpdate) {
                onUpdate();
            }
        } catch (err) {
            console.error("Error updating communication preferences:", err);
            setError(err.response?.data?.message || "Failed to update communication preferences");
            if (err.response?.data?.errors) {
                const errorMessages = Object.values(err.response.data.errors).flat();
                setError(errorMessages.join(", "));
            }
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
                    Communication preferences updated successfully!
                </div>
            )}

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
                            <p className="channel-card-description">Email messages only</p>
                        </button>
                        <button
                            type="button"
                            className={`communication-channel-card ${communicationPreferences.preferredChannel === "both" ? "selected" : ""}`}
                            onClick={() => handleCommunicationChannelChange("both")}
                        >
                            <h4 className="channel-card-title">Both</h4>
                            <p className="channel-card-description">SMS and email</p>
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
                    <button type="submit" className="save-changes-button" disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}
