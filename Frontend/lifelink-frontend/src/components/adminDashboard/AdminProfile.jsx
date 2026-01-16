import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { IoPerson, IoLockClosed, IoTime, IoShieldCheckmark } from "react-icons/io5";
import { FaUserShield, FaCheckCircle } from "react-icons/fa";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import profile from "../../assets/imgs/profile.svg";
import "../../styles/Dashboard.css";
import api from "../../api/axios";

const API_BASE_URL = "http://localhost:8000";

export default function AdminProfile() {
    const { user, fetchUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [error, setError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [hasChanges, setHasChanges] = useState(false);
    const [profilePicture, setProfilePicture] = useState(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState(null);

    // Personal Information
    const [personalInfo, setPersonalInfo] = useState({
        first_name: "",
        middle_name: "",
        last_name: "",
        email: "",
        phone_nb: "",
        role: ""
    });

    // Password Change
    const [passwordData, setPasswordData] = useState({
        current_password: "",
        new_password: "",
        confirm_password: ""
    });

    const [passwordChecks, setPasswordChecks] = useState({
        length: false,
        upper: false,
        lower: false,
        number: false,
        special: false
    });

    // Password visibility toggles
    const [showPasswords, setShowPasswords] = useState({
        current_password: false,
        new_password: false,
        confirm_password: false
    });

    // Account Activity
    const [accountActivity, setAccountActivity] = useState({
        last_login: null,
        last_ip: null,
        created_at: null,
        recent_logins: []
    });

    // Track initial values
    const [initialPersonalInfo, setInitialPersonalInfo] = useState(null);

    useEffect(() => {
        if (user) {
            loadAdminData();
        }
    }, [user]);

    const loadAdminData = async () => {
        try {
            setLoading(true);
            
            // Set personal info from user context
            const personalData = {
                first_name: user.first_name || "",
                middle_name: user.middle_name || "",
                last_name: user.last_name || "",
                email: user.email || "",
                phone_nb: user.phone_nb || "",
                role: user.role || "Admin"
            };

            setPersonalInfo(personalData);
            setInitialPersonalInfo(JSON.parse(JSON.stringify(personalData)));

            // Set profile picture
            if (user.profile_picture) {
                const imageSrc = user.profile_picture.startsWith('http')
                    ? user.profile_picture
                    : `${API_BASE_URL}/${user.profile_picture}`;
                setProfilePicturePreview(imageSrc);
            }

            // TODO: Fetch account activity from API
            // const activityResponse = await api.get("/api/admin/dashboard/profile/activity");
            // setAccountActivity(activityResponse.data);

            // For now, use mock data
            setAccountActivity({
                last_login: new Date().toISOString(),
                created_at: user.created_at || new Date().toISOString(),
                recent_logins: [
                    { date: new Date().toISOString(), ip: "192.168.1.1", location: "Local" },
                    { date: new Date(Date.now() - 86400000).toISOString(), ip: "192.168.1.2", location: "Local" },
                    { date: new Date(Date.now() - 172800000).toISOString(), ip: "192.168.1.3", location: "Local" }
                ]
            });
        } catch (err) {
            console.error("Error loading admin data:", err);
            setError("Failed to load profile data");
        } finally {
            setLoading(false);
        }
    };

    // Check for changes
    useEffect(() => {
        if (initialPersonalInfo) {
            const changed = JSON.stringify(personalInfo) !== JSON.stringify(initialPersonalInfo) || profilePicture !== null;
            setHasChanges(changed);
        }
    }, [personalInfo, profilePicture, initialPersonalInfo]);

    const handlePersonalInfoChange = (field, value) => {
        setPersonalInfo(prev => ({
            ...prev,
            [field]: value
        }));
        setError("");
        setSuccess(false);
    };

    const handleProfilePictureChange = (e) => {
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
                setProfilePicturePreview(reader.result);
                setProfilePicture(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveProfilePicture = () => {
        setProfilePicture(null);
        setProfilePicturePreview(user?.profile_picture 
            ? (user.profile_picture.startsWith('http') 
                ? user.profile_picture 
                : `${API_BASE_URL}/${user.profile_picture}`)
            : profile);
    };

    const checkPassword = (passwordValue) => {
        const checks = {
            length: passwordValue.length >= 8,
            upper: /[A-Z]/.test(passwordValue),
            lower: /[a-z]/.test(passwordValue),
            number: /[0-9]/.test(passwordValue),
            special: /[^A-Za-z0-9]/.test(passwordValue),
        };
        setPasswordChecks(checks);
    };

    const handlePasswordChange = (field, value) => {
        setPasswordData(prev => ({
            ...prev,
            [field]: value
        }));
        
        if (field === 'new_password') {
            checkPassword(value);
        }
        
        setPasswordError("");
        setPasswordSuccess(false);
    };

    const handleSavePersonalInfo = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess(false);

        try {
            // Validate required fields
            if (!personalInfo.first_name.trim() || !personalInfo.last_name.trim()) {
                setError("First name and last name are required");
                setSaving(false);
                return;
            }

            await api.get("/sanctum/csrf-cookie");
            
            const updateData = {
                first_name: personalInfo.first_name,
                middle_name: personalInfo.middle_name || null,
                last_name: personalInfo.last_name,
                phone_nb: personalInfo.phone_nb || null,
                profile_picture: profilePicture || null
            };

            await api.put("/api/settings/profile", updateData);

            setSuccess(true);
            setProfilePicture(null); // Reset after successful save
            setInitialPersonalInfo(JSON.parse(JSON.stringify(personalInfo)));
            
            // Refresh user data in auth context
            if (fetchUser) {
                await fetchUser();
            }

            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error("Error saving personal info:", err);
            setError(err.response?.data?.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordSaving(true);
        setPasswordError("");
        setPasswordSuccess(false);

        try {
            // Validate password strength
            const isStrong = Object.values(passwordChecks).every(Boolean);
            if (!isStrong) {
                setPasswordError("Password must meet all requirements");
                setPasswordSaving(false);
                return;
            }

            // Validate passwords match
            if (passwordData.new_password !== passwordData.confirm_password) {
                setPasswordError("New password and confirm password do not match");
                setPasswordSaving(false);
                return;
            }

            await api.get("/sanctum/csrf-cookie");
            await api.put("/api/settings/password", {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password,
                new_password_confirmation: passwordData.confirm_password
            });

            setPasswordSuccess(true);
            setPasswordData({
                current_password: "",
                new_password: "",
                confirm_password: ""
            });
            setPasswordChecks({
                length: false,
                upper: false,
                lower: false,
                number: false,
                special: false
            });

            setTimeout(() => setPasswordSuccess(false), 3000);
        } catch (err) {
            console.error("Error changing password:", err);
            setPasswordError(err.response?.data?.message || "Failed to change password");
        } finally {
            setPasswordSaving(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getFullName = () => {
        const parts = [
            personalInfo.first_name,
            personalInfo.middle_name,
            personalInfo.last_name
        ].filter(Boolean);
        return parts.join(' ') || "Admin";
    };

    if (loading) {
        return (
            <section className="financial-section">
                <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>
                    <p>Loading profile...</p>
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
                        <IoPerson className="icon-size"/>
                        <h2>Admin Profile</h2>
                    </div>
                    <p>Manage your personal account information and security settings</p>
                </div>
            </div>

            {/* Profile Overview Card */}
            <div className="settings-card" style={{ marginBottom: '30px' }}>
                <div className="settings-section-header">
                    <div className="icon-title">
                        <h3>Profile Overview</h3>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                        <img 
                            src={profilePicturePreview || profile} 
                            alt="Profile" 
                            style={{ 
                                width: '120px', 
                                height: '120px', 
                                borderRadius: '50%', 
                                objectFit: 'cover',
                                border: '4px solid #F12C31'
                            }} 
                        />
                        <label
                            htmlFor="profile-picture-upload"
                            style={{
                                position: 'absolute',
                                bottom: '0',
                                right: '0',
                                backgroundColor: '#F12C31',
                                color: 'white',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                border: '3px solid white',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}
                        >
                            <FaUserShield style={{ fontSize: '16px' }} />
                            <input
                                id="profile-picture-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePictureChange}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>

                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#252E32', marginBottom: '10px' }}>
                            {getFullName()}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <span className="badge badge-success" style={{ fontSize: '12px', padding: '4px 12px' }}>
                                {personalInfo.role || 'Admin'}
                            </span>
                            <span className="badge" style={{ 
                                backgroundColor: '#E8F5E9', 
                                color: '#2E7D32', 
                                fontSize: '12px', 
                                padding: '4px 12px' 
                            }}>
                                Active
                            </span>
                        </div>
                        <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                            This account has administrative access
                        </p>
                    </div>
                </div>
            </div>

            {/* Personal Information Card */}
            <div className="settings-card" style={{ marginBottom: '30px' }}>
                <div className="settings-section-header">
                    <div className="icon-title">
                        <h3>Personal Information</h3>
                    </div>
                </div>

                <form onSubmit={handleSavePersonalInfo}>
                    <div className="form-group">
                        <div>
                            <label htmlFor="first_name">First Name *</label>
                            <input
                                id="first_name"
                                type="text"
                                value={personalInfo.first_name}
                                onChange={(e) => handlePersonalInfoChange('first_name', e.target.value)}
                                placeholder="Enter first name"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="middle_name">Middle Name</label>
                            <input
                                id="middle_name"
                                type="text"
                                value={personalInfo.middle_name}
                                onChange={(e) => handlePersonalInfoChange('middle_name', e.target.value)}
                                placeholder="Enter middle name (optional)"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <div>
                            <label htmlFor="last_name">Last Name *</label>
                            <input
                                id="last_name"
                                type="text"
                                value={personalInfo.last_name}
                                onChange={(e) => handlePersonalInfoChange('last_name', e.target.value)}
                                placeholder="Enter last name"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="email">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                value={personalInfo.email}
                                disabled
                                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                            />
                            <small className="muted">Email cannot be changed</small>
                        </div>
                    </div>

                    <div className="form-group">
                        <div>
                            <label htmlFor="phone_nb">Phone Number</label>
                            <input
                                id="phone_nb"
                                type="text"
                                value={personalInfo.phone_nb}
                                onChange={(e) => handlePersonalInfoChange('phone_nb', e.target.value)}
                                placeholder="+1 234 567 8900"
                            />
                        </div>
                        <div>
                            <label htmlFor="role">Role</label>
                            <input
                                id="role"
                                type="text"
                                value={personalInfo.role || 'Admin'}
                                disabled
                                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                            />
                            <small className="muted">Role cannot be changed</small>
                        </div>
                    </div>

                    {error && (
                        <div style={{ padding: "10px", marginBottom: "20px", backgroundColor: "#fee", color: "#c33", borderRadius: "5px" }}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div style={{ padding: "10px", marginBottom: "20px", backgroundColor: "#efe", color: "#3c3", borderRadius: "5px" }}>
                            Profile updated successfully!
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

            {/* Security Card */}
            <div className="settings-card" style={{ marginBottom: '30px' }}>
                <div className="settings-section-header">
                    <div className="icon-title">
                        <IoLockClosed className="icon-size" />
                        <h3>Security</h3>
                    </div>
                </div>

                <form onSubmit={handleChangePassword}>
                    <div className="form-group">
                        <div style={{ position: 'relative' }}>
                            <label htmlFor="current_password">Current Password *</label>
                            <input
                                id="current_password"
                                type={showPasswords.current_password ? "text" : "password"}
                                value={passwordData.current_password}
                                onChange={(e) => handlePasswordChange('current_password', e.target.value)}
                                placeholder="Enter current password"
                                required
                                style={{ paddingRight: '40px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({ ...prev, current_password: !prev.current_password }))}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '40px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#666',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '5px',
                                    zIndex: 10
                                }}
                                tabIndex={-1}
                            >
                                {showPasswords.current_password ? (
                                    <AiOutlineEyeInvisible size={20} />
                                ) : (
                                    <AiOutlineEye size={20} />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <div style={{ position: 'relative' }}>
                            <label htmlFor="new_password">New Password *</label>
                            <input
                                id="new_password"
                                type={showPasswords.new_password ? "text" : "password"}
                                value={passwordData.new_password}
                                onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                                placeholder="Enter new password"
                                required
                                style={{ paddingRight: '40px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({ ...prev, new_password: !prev.new_password }))}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '40px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#666',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '5px',
                                    zIndex: 10
                                }}
                                tabIndex={-1}
                            >
                                {showPasswords.new_password ? (
                                    <AiOutlineEyeInvisible size={20} />
                                ) : (
                                    <AiOutlineEye size={20} />
                                )}
                            </button>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <label htmlFor="confirm_password">Confirm New Password *</label>
                            <input
                                id="confirm_password"
                                type={showPasswords.confirm_password ? "text" : "password"}
                                value={passwordData.confirm_password}
                                onChange={(e) => handlePasswordChange('confirm_password', e.target.value)}
                                placeholder="Confirm new password"
                                required
                                style={{ paddingRight: '40px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({ ...prev, confirm_password: !prev.confirm_password }))}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '40px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#666',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '5px',
                                    zIndex: 10
                                }}
                                tabIndex={-1}
                            >
                                {showPasswords.confirm_password ? (
                                    <AiOutlineEyeInvisible size={20} />
                                ) : (
                                    <AiOutlineEye size={20} />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Password Strength Indicator */}
                    {passwordData.new_password && (
                        <div style={{ 
                            marginBottom: '20px', 
                            padding: '15px', 
                            backgroundColor: '#f9f9f9', 
                            borderRadius: '5px',
                            border: '1px solid #e0e0e0'
                        }}>
                            <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '10px', display: 'block' }}>
                                Password Requirements:
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                    <span style={{ color: passwordChecks.length ? '#4CAF50' : '#999' }}>
                                        {passwordChecks.length ? '✓' : '○'}
                                    </span>
                                    <span style={{ color: passwordChecks.length ? '#4CAF50' : '#666' }}>
                                        At least 8 characters
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                    <span style={{ color: passwordChecks.upper ? '#4CAF50' : '#999' }}>
                                        {passwordChecks.upper ? '✓' : '○'}
                                    </span>
                                    <span style={{ color: passwordChecks.upper ? '#4CAF50' : '#666' }}>
                                        One uppercase letter
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                    <span style={{ color: passwordChecks.lower ? '#4CAF50' : '#999' }}>
                                        {passwordChecks.lower ? '✓' : '○'}
                                    </span>
                                    <span style={{ color: passwordChecks.lower ? '#4CAF50' : '#666' }}>
                                        One lowercase letter
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                    <span style={{ color: passwordChecks.number ? '#4CAF50' : '#999' }}>
                                        {passwordChecks.number ? '✓' : '○'}
                                    </span>
                                    <span style={{ color: passwordChecks.number ? '#4CAF50' : '#666' }}>
                                        One number
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                    <span style={{ color: passwordChecks.special ? '#4CAF50' : '#999' }}>
                                        {passwordChecks.special ? '✓' : '○'}
                                    </span>
                                    <span style={{ color: passwordChecks.special ? '#4CAF50' : '#666' }}>
                                        One special character
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {passwordError && (
                        <div style={{ padding: "10px", marginBottom: "20px", backgroundColor: "#fee", color: "#c33", borderRadius: "5px" }}>
                            {passwordError}
                        </div>
                    )}

                    {passwordSuccess && (
                        <div style={{ padding: "10px", marginBottom: "20px", backgroundColor: "#efe", color: "#3c3", borderRadius: "5px" }}>
                            Password changed successfully!
                        </div>
                    )}

                    <div className="form-submit-btn">
                        <button 
                            type="submit" 
                            className="submit-btn" 
                            disabled={passwordSaving || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
                            style={{ 
                                opacity: (passwordSaving || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) ? 0.6 : 1, 
                                cursor: (passwordSaving || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) ? 'not-allowed' : 'pointer' 
                            }}
                        >
                            {passwordSaving ? "Updating..." : "Update Password"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Account Activity Card */}
            <div className="settings-card">
                <div className="settings-section-header">
                    <div className="icon-title">
                        <IoTime className="icon-size" />
                        <h3>Account Activity</h3>
                    </div>
                </div>

                <div className="form-group">
                    <div>
                        <label>Last Login</label>
                        <div style={{ 
                            padding: '12px', 
                            backgroundColor: '#f9f9f9', 
                            borderRadius: '5px',
                            border: '2px solid #e0e0e0'
                        }}>
                            <strong>{formatDate(accountActivity.last_login)}</strong>
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <div>
                        <label>Account Created</label>
                        <div style={{ 
                            padding: '12px', 
                            backgroundColor: '#f9f9f9', 
                            borderRadius: '5px',
                            border: '2px solid #e0e0e0'
                        }}>
                            <strong>{formatDate(accountActivity.created_at)}</strong>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '10px', display: 'block' }}>
                        Recent Login Activity
                    </label>
                    <div style={{ 
                        border: '2px solid #e0e0e0', 
                        borderRadius: '5px',
                        overflow: 'hidden'
                    }}>
                        {accountActivity.recent_logins && accountActivity.recent_logins.length > 0 ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', borderBottom: '2px solid #e0e0e0' }}>
                                            Date & Time
                                        </th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', borderBottom: '2px solid #e0e0e0' }}>
                                            IP Address
                                        </th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', borderBottom: '2px solid #e0e0e0' }}>
                                            Location
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accountActivity.recent_logins.map((login, index) => (
                                        <tr key={index} style={{ borderBottom: index < accountActivity.recent_logins.length - 1 ? '1px solid #e0e0e0' : 'none' }}>
                                            <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>
                                                {formatDate(login.date)}
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>
                                                {login.ip}
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>
                                                {login.location}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                                No recent login activity
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

