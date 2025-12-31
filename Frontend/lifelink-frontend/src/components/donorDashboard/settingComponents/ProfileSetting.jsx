import { useState } from "react";
import profile from "../../../assets/imgs/profile.svg";
import "../../../styles/Dashboard.css";

export default function ProfileSetting() {
    const [profilePicture, setProfilePicture] = useState(null);
    const [formData, setFormData] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        phone: "",
        bloodType: "",
        dateOfBirth: "",
        address: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicture(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = () => {
        setProfilePicture(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form data:', formData);
        // Add save functionality here
    };

    return (
        <div className="settings-form-container">            
            {/* Profile Picture Section */}
            <div className="profile-picture-section">
                <div className="profile-picture-container">
                    <img 
                        src={profilePicture || profile} 
                        alt="Profile" 
                        className="profile-picture"
                    />
                </div>
                <div className="profile-picture-controls">
                    <h3 className="profile-picture-title">Profile Picture</h3>
                    <div>
                        <div className="profile-picture-buttons">
                            <label className="change-photo-button">
                                Change Photo
                                <input 
                                    type="file" 
                                    accept="image/jpeg,image/png,image/gif"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                            </label>
                            <button 
                                className="remove-photo-button"
                                onClick={handleRemovePhoto}
                            >
                                Remove
                            </button>
                        </div>
                        <p className="profile-picture-hint">JPG, PNG or GIF. Max size 2MB</p>
                    </div>
                </div>
            </div>

            {/* Personal Information Section */}
            <div className="personal-information-section">
                <h3 className="personal-information-title">Personal Information</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <div>
                            <label htmlFor="firstName">First Name</label>
                            <input 
                                type="text" 
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="Enter first name"
                            />
                        </div>
                        <div>
                            <label htmlFor="middleName">Middle Name</label>
                            <input 
                                type="text" 
                                id="middleName"
                                name="middleName"
                                value={formData.middleName}
                                onChange={handleChange}
                                placeholder="Enter middle name"
                            />
                        </div>
                        <div>
                            <label htmlFor="lastName">Last Name</label>
                            <input 
                                type="text" 
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Enter last name"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <div>
                            <label htmlFor="email">Email Address</label>
                            <input 
                                type="email" 
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter email address"
                            />
                        </div>
                        <div>
                            <label htmlFor="phone">Phone Number</label>
                            <input 
                                type="tel" 
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Enter phone number"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <div>
                            <label htmlFor="bloodType">Blood Type</label>
                            <input 
                                type="text" 
                                id="bloodType"
                                name="bloodType"
                                value={formData.bloodType}
                                onChange={handleChange}
                                placeholder="Enter blood type"
                            />
                        </div>
                        <div>
                            <label htmlFor="dateOfBirth">Date of Birth</label>
                            <input 
                                type="date" 
                                id="dateOfBirth"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <div style={{ width: '100%' }}>
                            <label htmlFor="address">Address</label>
                            <input 
                                type="text" 
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Enter address"
                            />
                        </div>
                    </div>

                    <div className="settings-form-actions">
                        <button type="submit" className="save-changes-button">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

