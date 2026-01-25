import { useState, useEffect } from "react";
import { RiSettings5Fill } from "react-icons/ri";
import { FaHeartbeat, FaHospital, FaClock, FaGlobe, FaEnvelope, FaPhone, FaImage } from "react-icons/fa";
import { BsDropletFill } from "react-icons/bs";
import "../../styles/Dashboard.css";
import api from "../../api/axios";

export default function Settings() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [hasChanges, setHasChanges] = useState(false);

    // General System Settings
    const [generalSettings, setGeneralSettings] = useState({
        platform_name: "LifeLink",
        system_logo: null,
        system_logo_preview: null,
        system_email: "",
        contact_phone: "",
        default_language: "en",
        timezone: "UTC",
    });

    // Donation & Medical Settings
    const [medicalSettings, setMedicalSettings] = useState({
        min_days_between_donations: 56,
        allowed_blood_types: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
        emergency_request_expiry: "24h",
        donor_age_min: 16,
        donor_age_max: 65,
    });

    // Languages and timezones options
    const languages = [
        { value: "en", label: "English" },
        { value: "ar", label: "Arabic" },
        { value: "fr", label: "French" }
    ];

    const timezones = [
        { value: "UTC", label: "UTC (Coordinated Universal Time)" },
        { value: "America/New_York", label: "Eastern Time (ET)" },
        { value: "Europe/London", label: "London (GMT)" },
        { value: "Asia/Dubai", label: "Dubai (GST)" },
        { value: "Asia/Riyadh", label: "Riyadh (AST)" }
    ];

    const expiryOptions = [
        { value: "6h", label: "6 Hours" },
        { value: "12h", label: "12 Hours" },
        { value: "24h", label: "24 Hours" },
        { value: "48h", label: "48 Hours" }
    ];

    const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    // Track initial values to detect changes
    const [initialGeneral, setInitialGeneral] = useState(null);
    const [initialMedical, setInitialMedical] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get("/api/admin/dashboard/settings");
            const data = response.data;

            setGeneralSettings({
                ...generalSettings,
                ...data.general
            });
            setMedicalSettings({
                ...medicalSettings,
                ...data.medical
            });
            setInitialGeneral(JSON.parse(JSON.stringify(data.general || generalSettings)));
            setInitialMedical(JSON.parse(JSON.stringify(data.medical || medicalSettings)));
        } catch (err) {
            console.error("Error fetching settings:", err);
            const hint = err.response?.data?.hint ? ` (${err.response.data.hint})` : "";
            setError((err.response?.data?.message || "Failed to load settings") + hint);
        } finally {
            setLoading(false);
        }
    };

    // Check for changes
    useEffect(() => {
        if (initialGeneral && initialMedical) {
            const generalChanged = JSON.stringify(generalSettings) !== JSON.stringify(initialGeneral);
            const medicalChanged = JSON.stringify(medicalSettings) !== JSON.stringify(initialMedical);
            setHasChanges(generalChanged || medicalChanged);
        }
    }, [generalSettings, medicalSettings, initialGeneral, initialMedical]);

    const handleGeneralChange = (field, value) => {
        setGeneralSettings(prev => ({
            ...prev,
            [field]: value
        }));
        setError("");
        setSuccess(false);
    };

    const handleMedicalChange = (field, value) => {
        setMedicalSettings(prev => ({
            ...prev,
            [field]: value
        }));
        setError("");
        setSuccess(false);
    };

    const handleLogoUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Check file size (2MB limit)
            if (file.size > 2 * 1024 * 1024) {
                setError("File size exceeds 2MB limit. Please choose a smaller image.");
                e.target.value = '';
                return;
            }
            
            // Check file type
            if (!file.type.match('image.*')) {
                setError("Please select a valid image file (JPG, PNG, or GIF).");
                e.target.value = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onloadend = () => {
                handleGeneralChange('system_logo_preview', reader.result);
                handleGeneralChange('system_logo', reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        handleGeneralChange('system_logo', null);
        handleGeneralChange('system_logo_preview', null);
    };

    const handleBloodTypeToggle = (bloodType) => {
        const currentTypes = medicalSettings.allowed_blood_types;
        const newTypes = currentTypes.includes(bloodType)
            ? currentTypes.filter(bt => bt !== bloodType)
            : [...currentTypes, bloodType];
        handleMedicalChange('allowed_blood_types', newTypes);
    };

    const handleSaveGeneral = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess(false);

        try {
            // Validate required fields
            if (!generalSettings.platform_name.trim()) {
                setError("Platform name is required");
                setSaving(false);
                return;
            }

            if (!generalSettings.system_email.trim()) {
                setError("System email is required");
                setSaving(false);
                return;
            }

            await api.put("/api/admin/dashboard/settings/general", generalSettings);

            setSuccess(true);
            setInitialGeneral(JSON.parse(JSON.stringify(generalSettings)));
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error("Error saving general settings:", err);
            const hint = err.response?.data?.hint ? ` (${err.response.data.hint})` : "";
            setError((err.response?.data?.message || "Failed to save general settings") + hint);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveMedical = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess(false);

        try {
            // Validate required fields
            if (medicalSettings.min_days_between_donations < 1) {
                setError("Minimum days between donations must be at least 1");
                setSaving(false);
                return;
            }

            if (medicalSettings.donor_age_min < 16|| medicalSettings.donor_age_max > 100) {
                setError("Donor age must be between 16 and 100");
                setSaving(false);
                return;
            }

            if (medicalSettings.donor_age_min >= medicalSettings.donor_age_max) {
                setError("Minimum age must be less than maximum age");
                setSaving(false);
                return;
            }

            if (medicalSettings.allowed_blood_types.length === 0) {
                setError("At least one blood type must be selected");
                setSaving(false);
                return;
            }

            await api.put("/api/admin/dashboard/settings/medical", medicalSettings);

            setSuccess(true);
            setInitialMedical(JSON.parse(JSON.stringify(medicalSettings)));
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error("Error saving medical settings:", err);
            const hint = err.response?.data?.hint ? ` (${err.response.data.hint})` : "";
            setError((err.response?.data?.message || "Failed to save medical settings") + hint);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <section className="financial-section">
                <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>
                    <p>Loading settings...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="financial-section">
            {/* Header */}
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <RiSettings5Fill className="icon-size"/>
                        <h2>System Settings</h2>
                    </div>
                    <p>Configure platform settings and medical donation rules</p>
                </div>
            </div>

            {/* General System Settings Section */}
            <div className="settings-card" style={{ marginBottom: '30px' }}>
                <div className="settings-section-header">
                    <div className="icon-title">
                        <h3>General System Settings</h3>
                    </div>
                </div>

                <form onSubmit={handleSaveGeneral}>
                    <div className="form-group">
                        <div>
                            <label htmlFor="platform_name">
                                <FaGlobe style={{ marginRight: '8px', color: '#F12C31' }} />
                                Platform Name *
                            </label>
                            <input
                                id="platform_name"
                                type="text"
                                value={generalSettings.platform_name}
                                onChange={(e) => handleGeneralChange('platform_name', e.target.value)}
                                placeholder="Enter platform name"
                                required
                            />
                            <small className="muted">The name displayed throughout the platform</small>
                        </div>
                    </div>

                    <div className="form-group">
                        <div>
                            <label htmlFor="system_logo">
                                <FaImage style={{ marginRight: '8px', color: '#F12C31' }} />
                                System Logo
                            </label>
                            {generalSettings.system_logo_preview ? (
                                <div style={{ marginBottom: '10px' }}>
                                    <img 
                                        src={generalSettings.system_logo_preview} 
                                        alt="Logo preview" 
                                        style={{ 
                                            maxWidth: '200px', 
                                            maxHeight: '100px', 
                                            borderRadius: '5px',
                                            marginBottom: '10px',
                                            display: 'block',
                                            objectFit: 'contain'
                                        }} 
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemoveLogo}
                                        style={{
                                            padding: "5px 15px",
                                            backgroundColor: "#f12c31",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "5px",
                                            cursor: "pointer",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Remove Logo
                                    </button>
                                </div>
                            ) : (
                                <input
                                    id="system_logo"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                />
                            )}
                            <small className="muted">Upload your platform logo (max 2MB, JPG/PNG/GIF)</small>
                        </div>
                    </div>

                    <div className="form-group">
                        <div>
                            <label htmlFor="system_email">
                                <FaEnvelope style={{ marginRight: '8px', color: '#F12C31' }} />
                                System Email *
                            </label>
                            <input
                                id="system_email"
                                type="email"
                                value={generalSettings.system_email}
                                onChange={(e) => handleGeneralChange('system_email', e.target.value)}
                                placeholder="admin@lifelink.com"
                                required
                            />
                            <small className="muted">Primary contact email for system notifications</small>
                        </div>
                        <div>
                            <label htmlFor="contact_phone">
                                <FaPhone style={{ marginRight: '8px', color: '#F12C31' }} />
                                Contact Phone
                            </label>
                            <input
                                id="contact_phone"
                                type="text"
                                value={generalSettings.contact_phone}
                                onChange={(e) => handleGeneralChange('contact_phone', e.target.value)}
                                placeholder="+1 234 567 8900"
                            />
                            <small className="muted">Primary contact phone number</small>
                        </div>
                    </div>

                    <div className="form-group">
                        <div>
                            <label htmlFor="default_language">
                                <FaGlobe style={{ marginRight: '8px', color: '#F12C31' }} />
                                Default Language
                            </label>
                            <div className="select-des">
                                <select
                                    id="default_language"
                                    value={generalSettings.default_language}
                                    onChange={(e) => handleGeneralChange('default_language', e.target.value)}
                                >
                                    {languages.map(lang => (
                                        <option key={lang.value} value={lang.value}>
                                            {lang.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <small className="muted">Default language for the platform</small>
                        </div>
                        <div>
                            <label htmlFor="timezone">
                                <FaClock style={{ marginRight: '8px', color: '#F12C31' }} />
                                Timezone
                            </label>
                            <div className="select-des">
                                <select
                                    id="timezone"
                                    value={generalSettings.timezone}
                                    onChange={(e) => handleGeneralChange('timezone', e.target.value)}
                                >
                                    {timezones.map(tz => (
                                        <option key={tz.value} value={tz.value}>
                                            {tz.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <small className="muted">System timezone for scheduling and timestamps</small>
                        </div>
                    </div>

                    {error && (
                        <div style={{ padding: "10px", marginBottom: "20px", backgroundColor: "#fee", color: "#c33", borderRadius: "5px" }}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div style={{ padding: "10px", marginBottom: "20px", backgroundColor: "#efe", color: "#3c3", borderRadius: "5px" }}>
                            General settings saved successfully!
                        </div>
                    )}

                    <div className="form-submit-btn">
                        <button 
                            type="submit" 
                            className="submit-btn" 
                            disabled={saving || !hasChanges}
                            style={{ opacity: (!hasChanges || saving) ? 0.6 : 1, cursor: (!hasChanges || saving) ? 'not-allowed' : 'pointer' }}
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Donation & Medical Settings Section */}
            <div className="settings-card">
                <div className="settings-section-header">
                    <div className="icon-title">
                        <h3>Donation & Medical Settings</h3>
                    </div>
                </div>

                <form onSubmit={handleSaveMedical}>
                    <div className="form-group">
                        <div>
                            <label htmlFor="min_days_between_donations">
                                <BsDropletFill style={{ marginRight: '8px', color: '#F12C31' }} />
                                Minimum Days Between Blood Donations *
                            </label>
                            <input
                                id="min_days_between_donations"
                                type="number"
                                min="1"
                                value={medicalSettings.min_days_between_donations}
                                onChange={(e) => handleMedicalChange('min_days_between_donations', parseInt(e.target.value) || 0)}
                                required
                            />
                            <small className="muted">Minimum waiting period between blood donations (recommended: 56 days)</small>
                        </div>
                    </div>

                    <div className="form-group">
                        <div>
                            <label>
                                <BsDropletFill style={{ marginRight: '8px', color: '#F12C31' }} />
                                Allowed Blood Types *
                            </label>
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(4, 1fr)', 
                                gap: '10px',
                                marginTop: '10px',
                                padding: '15px',
                                border: '2px solid #B3B3B3',
                                borderRadius: '5px',
                                backgroundColor: '#f9f9f9'
                            }}
                            
                            className="blood-type-selection"
                            >
                                {bloodTypes.map(bloodType => (
                                    <label 
                                        key={bloodType}
                                        style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '8px',
                                            cursor: 'pointer',
                                            padding: '8px',
                                            borderRadius: '5px',
                                            backgroundColor: medicalSettings.allowed_blood_types.includes(bloodType) ? '#ffe5e5' : 'transparent',
                                            transition: 'background-color 0.2s'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={medicalSettings.allowed_blood_types.includes(bloodType)}
                                            onChange={() => handleBloodTypeToggle(bloodType)}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <span>{bloodType}</span>
                                    </label>
                                ))}
                            </div>
                            <small className="muted">Select which blood types are accepted for donations</small>
                        </div>
                    </div>

                    <div className="form-group">
                        <div>
                            <label htmlFor="emergency_request_expiry">
                                <FaClock style={{ marginRight: '8px', color: '#F12C31' }} />
                                Emergency Request Expiry Time
                            </label>
                            <div className="select-des">
                                <select
                                    id="emergency_request_expiry"
                                    value={medicalSettings.emergency_request_expiry}
                                    onChange={(e) => handleMedicalChange('emergency_request_expiry', e.target.value)}
                                >
                                    {expiryOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <small className="muted">Time after which emergency blood requests expire</small>
                        </div>
                    </div>

                    <div className="form-group">
                        <div>
                            <label htmlFor="donor_age_min">
                                <FaHeartbeat style={{ marginRight: '8px', color: '#F12C31' }} />
                                Minimum Donor Age *
                            </label>
                            <input
                                id="donor_age_min"
                                type="number"
                                min="16"
                                max="100"
                                value={medicalSettings.donor_age_min}
                                onChange={(e) => handleMedicalChange('donor_age_min', parseInt(e.target.value) || 18)}
                                required
                            />
                            <small className="muted">Minimum age required to become a donor (typically 18 years)</small>
                        </div>
                        <div>
                            <label htmlFor="donor_age_max">
                                <FaHeartbeat style={{ marginRight: '8px', color: '#F12C31' }} />
                                Maximum Donor Age *
                            </label>
                            <input
                                id="donor_age_max"
                                type="number"
                                min="16"
                                max="100"
                                value={medicalSettings.donor_age_max}
                                onChange={(e) => handleMedicalChange('donor_age_max', parseInt(e.target.value) || 65)}
                                required
                            />
                            <small className="muted">Maximum age allowed for donors (typically 65 years)</small>
                        </div>
                    </div>

                    {error && (
                        <div style={{ padding: "10px", marginBottom: "20px", backgroundColor: "#fee", color: "#c33", borderRadius: "5px" }}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div style={{ padding: "10px", marginBottom: "20px", backgroundColor: "#efe", color: "#3c3", borderRadius: "5px" }}>
                            Medical settings saved successfully!
                        </div>
                    )}

                    <div className="form-submit-btn">
                        <button 
                            type="submit" 
                            className="submit-btn" 
                            disabled={saving || !hasChanges}
                            style={{ opacity: (!hasChanges || saving) ? 0.6 : 1, cursor: (!hasChanges || saving) ? 'not-allowed' : 'pointer' }}
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}

