import { useState, useEffect } from "react";
import { RiSettings5Fill } from "react-icons/ri";
import { FiSave } from "react-icons/fi";
import api from "../../api/axios";

export default function HospitalSettings() {
    const [settings, setSettings] = useState({
        hospitalName: "",
        address: "",
        phone: "",
        email: "",
        operatingHours: "",
        emergencyContact: "",
        bloodBankCapacity: "",
        threshold: ""
    });
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = () => {
        setLoading(true);
        setError("");
        api.get("/api/hospital/dashboard/settings")
            .then((res) => {
                setSettings((prev) => ({
                    ...prev,
                    ...(res.data?.settings || {}),
                }));
            })
            .catch((err) => {
                console.error("Error fetching hospital settings:", err);
                setError(err.response?.data?.message || "Failed to fetch hospital settings");
            })
            .finally(() => setLoading(false));
    };

    const handleChange = (e) => {
        setSettings({
            ...settings,
            [e.target.name]: e.target.value
        });
        setSaved(false);
    };

    const handleSave = () => {
        setLoading(true);
        setError("");
        api.put("/api/hospital/dashboard/settings", {
            ...settings,
            // Ensure numeric fields are sent as numbers when possible
            bloodBankCapacity: settings.bloodBankCapacity === "" ? null : Number(settings.bloodBankCapacity),
            autoReorderThreshold: settings.autoReorderThreshold === "" ? null : Number(settings.autoReorderThreshold),
        })
            .then((res) => {
                if (res.data?.settings) {
                    setSettings((prev) => ({ ...prev, ...res.data.settings }));
                }
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            })
            .catch((err) => {
                console.error("Error saving hospital settings:", err);
                setError(err.response?.data?.message || "Failed to save hospital settings");
            })
            .finally(() => setLoading(false));
    };

    return (
        <section className="settings-section">
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <RiSettings5Fill className="icon-size" />
                        <h2>Hospital Settings</h2>
                    </div>
                    <p>Configure hospital information and operational preferences</p>
                </div>
                <div className="add-btn">
                    <button type="button" onClick={handleSave} disabled={loading}>
                        <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {saved && (
                <div className="control-panel" style={{ background: '#e8f9ef', color: '#16a34a', marginBottom: '20px' }}>
                    Settings saved successfully!
                </div>
            )}
            {error && (
                <div className="control-panel" style={{ background: '#fee', color: '#c33', marginBottom: '20px' }}>
                    <strong>Error:</strong> {error}
                    <button
                        onClick={fetchSettings}
                        style={{ marginLeft: '10px', padding: '5px 10px', cursor: 'pointer' }}
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* General Information */}
            <div className="control-panel">
                <h3 className="control-panel-title">General Information</h3>
                <div className="info-grid">
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Hospital Name</label>
                        <input
                            type="text"
                            name="hospitalName"
                            value={settings.hospitalName}
                            onChange={handleChange}
                            className="filters"
                            style={{ width: '100%', padding: '8px' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Address</label>
                        <input
                            type="text"
                            name="address"
                            value={settings.address}
                            onChange={handleChange}
                            className="filters"
                            style={{ width: '100%', padding: '8px' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Phone</label>
                        <input
                            type="text"
                            name="phone"
                            value={settings.phone}
                            onChange={handleChange}
                            className="filters"
                            style={{ width: '100%', padding: '8px' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={settings.email}
                            onChange={handleChange}
                            className="filters"
                            style={{ width: '100%', padding: '8px' }}
                        />
                    </div>
                </div>
            </div>

            {/* Operational Settings */}
            <div className="control-panel" style={{ marginTop: '20px' }}>
                <h3 className="control-panel-title">Operational Settings</h3>
                <div className="info-grid">
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Operating Hours</label>
                        <input
                            type="text"
                            name="operatingHours"
                            value={settings.operatingHours}
                            onChange={handleChange}
                            className="filters"
                            style={{ width: '100%', padding: '8px' }}
                            placeholder="e.g., 24/7 or 8:00 AM - 6:00 PM"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Emergency Contact</label>
                        <input
                            type="text"
                            name="emergencyContact"
                            value={settings.emergencyContact}
                            onChange={handleChange}
                            className="filters"
                            style={{ width: '100%', padding: '8px' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Blood Bank Capacity</label>
                        <input
                            type="number"
                            name="bloodBankCapacity"
                            value={settings.bloodBankCapacity}
                            onChange={handleChange}
                            className="filters"
                            style={{ width: '100%', padding: '8px' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Threshold</label>
                        <input
                            type="number"
                            name="autoReorderThreshold"
                            value={settings.threshold}
                            onChange={handleChange}
                            className="filters"
                            style={{ width: '100%', padding: '8px' }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

