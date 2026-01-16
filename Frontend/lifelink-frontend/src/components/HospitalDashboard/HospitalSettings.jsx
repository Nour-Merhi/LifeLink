import { useState, useEffect } from "react";
import { RiSettings5Fill } from "react-icons/ri";
import { FiSave } from "react-icons/fi";
import axios from "axios";

export default function HospitalSettings() {
    const [settings, setSettings] = useState({
        hospitalName: "",
        address: "",
        phone: "",
        email: "",
        operatingHours: "",
        emergencyContact: "",
        bloodBankCapacity: "",
        autoReorderThreshold: ""
    });
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = () => {
        setLoading(true);
        // In production: axios.get("/api/hospital/settings")
        setTimeout(() => {
            setSettings({
                hospitalName: "City General Hospital",
                address: "123 Medical Center Drive",
                phone: "+1 234-567-8900",
                email: "info@citygeneral.com",
                operatingHours: "24/7",
                emergencyContact: "+1 234-567-8901",
                bloodBankCapacity: "500",
                autoReorderThreshold: "15"
            });
            setLoading(false);
        }, 500);
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
        // In production: axios.put("/api/hospital/settings", settings)
        setTimeout(() => {
            setLoading(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }, 500);
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
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Auto-Reorder Threshold</label>
                        <input
                            type="number"
                            name="autoReorderThreshold"
                            value={settings.autoReorderThreshold}
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

