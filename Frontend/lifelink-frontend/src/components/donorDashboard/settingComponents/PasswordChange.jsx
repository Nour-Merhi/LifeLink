import { useState } from "react";
import { IoLockClosed, IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import "../../../styles/Dashboard.css";

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

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        console.log('Password data:', passwordData);
        // Add password update functionality here
    };

    return (
        <div className="settings-form-container">
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
                        />
                        <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => togglePasswordVisibility('current')}
                        >
                            {showPasswords.current ? <IoEyeOffOutline /> : <IoEyeOutline />}
                        </button>
                    </div>
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
                        />
                        <IoLockClosed className="password-input-icon" />
                    </div>
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
                        />
                        <IoLockClosed className="password-input-icon" />
                    </div>
                </div>

                <div className="settings-form-actions">
                    <button type="submit" className="save-changes-button">
                        Update Password
                    </button>
                </div>
            </form>
        </div>
    );
}

