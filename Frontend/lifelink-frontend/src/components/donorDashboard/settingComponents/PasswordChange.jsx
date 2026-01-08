import { useState } from "react";
import { IoLockClosed, IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import "../../../styles/Dashboard.css";
import api from "../../../api/axios";

export default function PasswordChange() {
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
        setError("");
        setSuccess(false);
        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        
        // Client-side validation
        const errors = {};
        if (!passwordData.currentPassword) {
            errors.currentPassword = "Current password is required";
        }
        if (!passwordData.newPassword) {
            errors.newPassword = "New password is required";
        } else if (passwordData.newPassword.length < 8) {
            errors.newPassword = "Password must be at least 8 characters";
        }
        if (!passwordData.confirmPassword) {
            errors.confirmPassword = "Please confirm your password";
        } else if (passwordData.newPassword !== passwordData.confirmPassword) {
            errors.confirmPassword = "Passwords do not match";
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess(false);
            setValidationErrors({});

            await api.put("/api/settings/password", {
                current_password: passwordData.currentPassword,
                new_password: passwordData.newPassword,
                new_password_confirmation: passwordData.confirmPassword
            });

            setSuccess(true);
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error("Error updating password:", err);
            const errorMessage = err.response?.data?.message || "Failed to update password";
            setError(errorMessage);
            
            if (err.response?.data?.errors) {
                setValidationErrors(err.response.data.errors);
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
                    Password updated successfully!
                </div>
            )}

            <div className="password-header">
                <IoLockClosed className="password-icon" />
                <h2 className="password-title">Password Change</h2>
            </div>

            <form className="password-form" onSubmit={handlePasswordSubmit}>
                <div className="password-form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <div className="password-input-wrapper">
                        <input 
                            type={showPasswords.current ? "text" : "password"}
                            id="currentPassword"
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            placeholder="Enter current password"
                            required
                        />
                        <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => togglePasswordVisibility('current')}
                        >
                            {showPasswords.current ? <IoEyeOffOutline /> : <IoEyeOutline />}
                        </button>
                    </div>
                    {validationErrors.current_password && (
                        <span style={{ color: "#c33", fontSize: "0.875rem" }}>
                            {validationErrors.current_password[0]}
                        </span>
                    )}
                </div>

                <div className="password-form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <div className="password-input-wrapper">
                        <input 
                            type={showPasswords.new ? "text" : "password"}
                            id="newPassword"
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            placeholder="Enter new password"
                            required
                            minLength={8}
                        />
                        <IoLockClosed className="password-input-icon" />
                    </div>
                    {validationErrors.new_password && (
                        <span style={{ color: "#c33", fontSize: "0.875rem" }}>
                            {validationErrors.new_password[0]}
                        </span>
                    )}
                    {validationErrors.newPassword && (
                        <span style={{ color: "#c33", fontSize: "0.875rem" }}>
                            {validationErrors.newPassword}
                        </span>
                    )}
                </div>

                <div className="password-form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <div className="password-input-wrapper">
                        <input 
                            type={showPasswords.confirm ? "text" : "password"}
                            id="confirmPassword"
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            placeholder="Confirm new password"
                            required
                        />
                        <IoLockClosed className="password-input-icon" />
                    </div>
                    {validationErrors.confirmPassword && (
                        <span style={{ color: "#c33", fontSize: "0.875rem" }}>
                            {validationErrors.confirmPassword}
                        </span>
                    )}
                </div>

                <div className="settings-form-actions">
                    <button type="submit" className="save-changes-button" disabled={saving}>
                        {saving ? "Updating..." : "Update Password"}
                    </button>
                </div>
            </form>
        </div>
    );
}
