import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import profile from "../../../assets/imgs/profile.svg";
import "../../../styles/Dashboard.css";
import api from "../../../api/axios";
import { useAuth } from "../../../context/AuthContext";
import { IoClose } from "react-icons/io5";

export default function ProfileSetting({ initialData, bloodTypes: initialBloodTypes, onUpdate }) {
    const navigate = useNavigate();
    const { fetchUser, setUser } = useAuth();
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
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [bloodTypes, setBloodTypes] = useState([]);

    // Delete account (danger zone)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    // Initialize form data from props
    useEffect(() => {
        if (initialData) {
            setFormData({
                firstName: initialData.user?.first_name || "",
                middleName: initialData.user?.middle_name || "",
                lastName: initialData.user?.last_name || "",
                email: initialData.user?.email || "",
                phone: initialData.user?.phone_nb || "",
                bloodType: initialData.donor?.blood_type || "",
                dateOfBirth: initialData.donor?.date_of_birth ? initialData.donor.date_of_birth.split('T')[0] : "",
                address: initialData.donor?.address || initialData.user?.address || ""
            });

            if (initialData.user?.profile_picture) {
                setProfilePicture(initialData.user.profile_picture);
            }
        }

        if (initialBloodTypes && initialBloodTypes.length > 0) {
            setBloodTypes(initialBloodTypes);
        } else {
            // Fallback: fetch blood types if not provided
            const fetchBloodTypes = async () => {
                try {
                    const response = await api.get("/api/blood-types");
                    setBloodTypes(response.data.blood_types || []);
                } catch (err) {
                    console.error("Error fetching blood types:", err);
                }
            };
            fetchBloodTypes();
        }
    }, [initialData, initialBloodTypes]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setSuccess(false);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Check file size (2MB limit)
            if (file.size > 2 * 1024 * 1024) {
                setError("File size exceeds 2MB limit. Please choose a smaller image.");
                e.target.value = ''; // Reset the input
                return;
            }
            
            // Check file type
            if (!file.type.match('image.*')) {
                setError("Please select a valid image file (JPG, PNG, or GIF).");
                e.target.value = ''; // Reset the input
                return;
            }
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicture(reader.result);
                setSuccess(false);
                setError(""); // Clear any previous errors
            };
            reader.onerror = () => {
                setError("Error reading file. Please try again.");
                e.target.value = ''; // Reset the input
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = () => {
        setProfilePicture(null);
        setSuccess(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError("");
            setSuccess(false);

            // Find blood type ID from blood type string
            let bloodTypeId = null;
            if (formData.bloodType) {
                const selectedBloodType = bloodTypes.find(bt => 
                    `${bt.type}${bt.rh_factor}` === formData.bloodType || bt.full_name === formData.bloodType
                );
                bloodTypeId = selectedBloodType?.id || null;
            }

            // Prepare update payload
            const updateData = {
                first_name: formData.firstName,
                middle_name: formData.middleName || null,
                last_name: formData.lastName,
                email: formData.email,
                phone_nb: formData.phone,
                address: formData.address || null,
                profile_picture: profilePicture || null,
            };

            // Add donor-specific fields if blood type or date of birth provided
            if (bloodTypeId) {
                updateData.blood_type_id = bloodTypeId;
            }
            if (formData.dateOfBirth) {
                updateData.date_of_birth = formData.dateOfBirth;
            }
            if (formData.address) {
                updateData.donor_address = formData.address;
            }

            await api.put("/api/settings/profile", updateData);

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            
            // Refresh settings data and user context
            if (onUpdate) {
                onUpdate();
            }
            // Refresh user data in auth context to update navbar profile picture
            if (fetchUser) {
                await fetchUser();
            }
        } catch (err) {
            console.error("Error updating profile:", err);
            setError(err.response?.data?.message || "Failed to update profile");
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
                    Profile updated successfully!
                </div>
            )}

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
                                type="button"
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
                                required
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
                                required
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
                                required
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
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <div>
                            <label htmlFor="bloodType">Blood Type</label>
                            <select
                                id="bloodType"
                                name="bloodType"
                                value={formData.bloodType}
                                onChange={handleChange}
                            >
                                <option value="">Select blood type</option>
                                {bloodTypes.map((bt) => (
                                    <option key={bt.id} value={bt.full_name || `${bt.type}${bt.rh_factor}`}>
                                        {bt.full_name || `${bt.type}${bt.rh_factor}`}
                                    </option>
                                ))}
                            </select>
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
                        <button type="submit" className="save-changes-button" disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Danger zone */}
            <div className="personal-information-section" style={{ padding: "15px", borderRadius: "10px", border: "1px solid #FCA5A5", background: "#FFF5F5" }}>
                <h3 className="personal-information-title" style={{ color: "#B91C1C" }}>Delete My Account</h3>
                <p className="muted" style={{ marginTop: "-6px", marginBottom: "14px" }}>
                    Deleting your account is permanent. This will remove your profile and related data.
                </p>
                <button
                    type="button"
                    onClick={() => {
                        setDeleteError("");
                        setDeleteConfirmText("");
                        setDeleteModalOpen(true);
                    }}
                    style={{
                        padding: "10px 14px",
                        borderRadius: "5px",
                        border: "none",
                        background: "#F12C31",
                        color: "#fff",
                        fontWeight: 700,
                        cursor: "pointer",
                        width: "fit-content"
                    }}
                >
                    Delete Account
                </button>
                {deleteError && (
                    <div style={{ marginTop: "12px", padding: "10px", backgroundColor: "#fee", color: "#c33", borderRadius: "5px" }}>
                        {deleteError}
                    </div>
                )}
            </div>

            {/* Delete confirmation modal */}
            {deleteModalOpen && (
                <div className="modal-overlay" onClick={() => !deleteLoading && setDeleteModalOpen(false)}>
                    <div className="modal-container modal-modern" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-modern-header">
                            <div className="modal-modern-title">
                                <h2>Delete Account</h2>
                                <div className="modal-modern-subtitle">
                                    <span style={{ color: "#B91C1C", fontWeight: 700 }}>
                                        This action cannot be undone.
                                    </span>
                                </div>
                            </div>
                            <button
                                className="modal-icon-btn"
                                onClick={() => !deleteLoading && setDeleteModalOpen(false)}
                                aria-label="Close"
                                disabled={deleteLoading}
                            >
                                <IoClose />
                            </button>
                        </div>

                        <div className="modal-modern-body">
                            <div className="modal-section">
                                <h3 className="modal-section-title">Confirm deletion</h3>
                                <p className="muted" style={{ marginTop: 0 }}>
                                    Type <strong>DELETE</strong> to confirm.
                                </p>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder="Type DELETE"
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "10px",
                                        outline: "none"
                                    }}
                                />
                                {deleteError && (
                                    <div className="error-message modal-error-container" style={{ marginTop: "12px" }}>
                                        {deleteError}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-modern-footer">
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={() => setDeleteModalOpen(false)}
                                disabled={deleteLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="submit-btn btn-delete-submit"
                                disabled={deleteLoading || deleteConfirmText.trim().toUpperCase() !== "DELETE"}
                                onClick={async () => {
                                    setDeleteLoading(true);
                                    setDeleteError("");
                                    try {
                                        await api.get("/sanctum/csrf-cookie");
                                        await api.delete("/api/settings/account");
                                        // Clear auth state and redirect
                                        if (setUser) setUser(null);
                                        window.dispatchEvent(new Event("auth-change"));
                                        navigate("/login", { replace: true });
                                    } catch (err) {
                                        console.error("Error deleting account:", err);
                                        setDeleteError(err.response?.data?.message || err.response?.data?.error || err.message || "Failed to delete account");
                                    } finally {
                                        setDeleteLoading(false);
                                    }
                                }}
                            >
                                {deleteLoading ? "Deleting..." : "Delete Permanently"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
