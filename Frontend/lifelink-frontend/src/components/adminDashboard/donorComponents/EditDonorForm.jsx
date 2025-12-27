import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import axios from "axios"

export default function EditDonorForm({ onClose, onDonorUpdated, donorCode, donorData }) {
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [errors, setErrors] = useState({});
    const [bloodTypes, setBloodTypes] = useState([]);
    const [originalData, setOriginalData] = useState(null); // Store original data for comparison

    const [editDonorData, setEditDonorData] = useState({
        first_name: "",
        middle_name: "",
        last_name: '',
        email: "",
        phone_nb: "",
        blood_type_id: "",
        gender: '',
        date_of_birth: '',
        status: 'active',
    });

    useEffect(() => {
        // Fetch blood types
        axios.get('http://localhost:8000/api/admin/dashboard/get-blood-types')
            .then(res => {
                setBloodTypes(res.data.blood_types || []);
            })
            .catch(err => console.error('Error fetching blood types:', err));

        // Load donor data if provided
        if (donorData) {
            // Format date_of_birth to YYYY-MM-DD format for date input
            const formatDateForInput = (dateString) => {
                if (!dateString) return "";
                try {
                    const date = new Date(dateString);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                } catch {
                    return dateString;
                }
            };

            const initialData = {
                first_name: donorData.user?.first_name || "",
                middle_name: donorData.user?.middle_name || "",
                last_name: donorData.user?.last_name || "",
                email: donorData.user?.email || "",
                phone_nb: donorData.user?.phone_nb || "",
                blood_type_id: donorData.blood_type_id ? String(donorData.blood_type_id) : "",
                gender: donorData.gender || "",
                date_of_birth: formatDateForInput(donorData.date_of_birth),
                status: donorData.status || 'active',
            };
            
            setEditDonorData(initialData);
            setOriginalData({ ...initialData }); // Store original for comparison (create a copy)
        }
    }, [donorData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditDonorData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!originalData) {
            setErrors({ general: 'Original donor data not loaded. Please close and try again.' });
            return;
        }

        // Compare current data with original data and only include changed fields
        const changedFields = {};
        
        if (editDonorData.first_name !== originalData.first_name) {
            changedFields.first_name = editDonorData.first_name;
        }
        if (editDonorData.middle_name !== originalData.middle_name) {
            changedFields.middle_name = editDonorData.middle_name || null; // Handle empty strings
        }
        if (editDonorData.last_name !== originalData.last_name) {
            changedFields.last_name = editDonorData.last_name;
        }
        if (editDonorData.email !== originalData.email) {
            changedFields.email = editDonorData.email;
        }
        if (editDonorData.phone_nb !== originalData.phone_nb) {
            changedFields.phone_nb = editDonorData.phone_nb;
        }
        // Compare blood_type_id as strings since we convert to string in the form
        if (String(editDonorData.blood_type_id) !== String(originalData.blood_type_id)) {
            changedFields.blood_type_id = editDonorData.blood_type_id ? parseInt(editDonorData.blood_type_id) : null;
        }
        if (editDonorData.gender !== originalData.gender) {
            changedFields.gender = editDonorData.gender;
        }
        if (editDonorData.date_of_birth !== originalData.date_of_birth) {
            changedFields.date_of_birth = editDonorData.date_of_birth;
        }
        if (editDonorData.status !== originalData.status) {
            changedFields.status = editDonorData.status;
        }

        // If nothing changed, just close the modal
        if (Object.keys(changedFields).length === 0) {
            onClose();
            return;
        }

        // Client-side validation for changed fields only
        const newErrors = {};
        if (changedFields.first_name !== undefined && !changedFields.first_name.trim()) {
            newErrors.first_name = 'First name is required';
        }
        if (changedFields.last_name !== undefined && !changedFields.last_name.trim()) {
            newErrors.last_name = 'Last name is required';
        }
        if (changedFields.email !== undefined) {
            if (!changedFields.email.trim()) {
                newErrors.email = 'Email is required';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(changedFields.email)) {
                newErrors.email = 'Enter a valid email';
            }
        }
        if (changedFields.phone_nb !== undefined && !changedFields.phone_nb.trim()) {
            newErrors.phone_nb = 'Phone number is required';
        }
        if (changedFields.blood_type_id !== undefined && !changedFields.blood_type_id && changedFields.blood_type_id !== null) {
            newErrors.blood_type_id = 'Blood type is required';
        }
        if (changedFields.gender !== undefined && !changedFields.gender) {
            newErrors.gender = 'Gender is required';
        }
        if (changedFields.date_of_birth !== undefined && !changedFields.date_of_birth) {
            newErrors.date_of_birth = 'Date of birth is required';
        }
        
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        setLoading(true);

        try {
            const response = await axios.put(
                `http://localhost:8000/api/admin/dashboard/donors/${donorCode}`,
                changedFields, // Only send changed fields
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                }
            );
            
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                if (onDonorUpdated) {
                    onDonorUpdated();
                }
                onClose();
            }, 2000);
        } catch (error) {
            console.error("Error updating donor:", error);
            
            if (error.response?.status === 422 && error.response?.data?.errors) {
                const validationErrors = {};
                Object.keys(error.response.data.errors).forEach(key => {
                    validationErrors[key] = error.response.data.errors[key][0];
                });
                setErrors(validationErrors);
            } else {
                setErrors({ 
                    general: error.response?.data?.message || error.message || "Error updating donor" 
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-container">
                {showSuccess && (
                    <div className="success-overlay">
                        <div className="success-check">
                            <svg viewBox="0 0 52 52">
                                <path className="checkmark__circle" d="M26 2c13.255 0 24 10.745 24 24S39.255 50 26 50 2 39.255 2 26 12.745 2 26 2z"/>
                                <path className="checkmark__check" d="M14 27l7 7 17-17"/>
                            </svg>
                            <div className="success-text">Donor updated successfully</div>
                        </div>
                    </div>
                )}
                {!loading ? (
                    <>
                        <div className="modal-title">
                            <h2>Edit Donor</h2>
                            <button onClick={onClose}><IoClose /></button>
                        </div>

                        <div className="modal-form">
                            <form onSubmit={handleSubmit}>
                                {/* First Name, Middle Name, Last Name */}
                                <div className="form-group">
                                    <div>
                                        <label htmlFor="first_name">First Name</label>
                                        <input
                                            id="first_name"
                                            type="text"
                                            name="first_name"
                                            value={editDonorData.first_name}
                                            placeholder="Enter first name"
                                            onChange={handleChange}
                                        />
                                        {errors.first_name && <small className="error-text">{errors.first_name}</small>}
                                    </div>
                                    <div>
                                        <label htmlFor="middle_name">Middle Name</label>
                                        <input
                                            id="middle_name"
                                            type="text"
                                            name="middle_name"
                                            value={editDonorData.middle_name}
                                            placeholder="Enter middle name (optional)"
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="last_name">Last Name</label>
                                        <input
                                            id="last_name"
                                            type="text"
                                            name="last_name"
                                            value={editDonorData.last_name}
                                            placeholder="Enter last name"
                                            onChange={handleChange}
                                        />
                                        {errors.last_name && <small className="error-text">{errors.last_name}</small>}
                                    </div>
                                </div>

                                {/* Email and Phone */}
                                <div className="form-group">
                                    <div>
                                        <label htmlFor="email">Email</label>
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={editDonorData.email}
                                            placeholder="Enter email address"
                                            onChange={handleChange}
                                        />
                                        {errors.email && <small className="error-text">{errors.email}</small>}
                                    </div>
                                    <div>
                                        <label htmlFor="phone_nb">Phone Number</label>
                                        <input
                                            id="phone_nb"
                                            type="tel"
                                            name="phone_nb"
                                            value={editDonorData.phone_nb}
                                            placeholder="Enter phone number"
                                            onChange={handleChange}
                                        />
                                        {errors.phone_nb && <small className="error-text">{errors.phone_nb}</small>}
                                    </div>
                                </div>

                                {/* Gender, Date of Birth, Blood Type */}
                                <div className="form-group">
                                    <div>
                                        <label htmlFor="gender">Gender</label>
                                        <div className="select-des">
                                            <select
                                                id="gender"
                                                name="gender"
                                                value={editDonorData.gender}
                                                onChange={handleChange}
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                            </select>
                                        </div>
                                        {errors.gender && <small className="error-text">{errors.gender}</small>}
                                    </div>
                                    <div>
                                        <label htmlFor="date_of_birth">Date of Birth</label>
                                        <input
                                            id="date_of_birth"
                                            type="date"
                                            name="date_of_birth"
                                            value={editDonorData.date_of_birth}
                                            onChange={handleChange}
                                            max={new Date().toISOString().split('T')[0]}
                                        />
                                        {errors.date_of_birth && <small className="error-text">{errors.date_of_birth}</small>}
                                    </div>
                                    <div>
                                        <label htmlFor="blood_type_id">Blood Type</label>
                                        <div className="select-des">
                                            <select
                                                id="blood_type_id"
                                                name="blood_type_id"
                                                value={editDonorData.blood_type_id}
                                                onChange={handleChange}
                                            >
                                                <option value="">Select Blood Type</option>
                                                {bloodTypes.map(bt => (
                                                    <option key={bt.id} value={bt.id}>
                                                        {bt.type}{bt.rh_factor}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {errors.blood_type_id && <small className="error-text">{errors.blood_type_id}</small>}
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="form-group">
                                    <div>
                                        <label htmlFor="status">Status</label>
                                        <div className="select-des">
                                            <select
                                                id="status"
                                                name="status"
                                                value={editDonorData.status}
                                                onChange={handleChange}
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="blocked">Blocked</option>
                                            </select>
                                        </div>
                                        {errors.status && <small className="error-text">{errors.status}</small>}
                                    </div>
                                </div>

                                {errors.general && <div className="error-message">{errors.general}</div>}

                                {/* Form Actions */}
                                <div className="form-actions">
                                    <button type="button" onClick={onClose} className="btn-cancel">
                                        Cancel
                                    </button>
                                    <button type="submit" className="submit-btn">
                                        Update Donor
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="loader">
                        <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />
                        <h3>Updating Donor...</h3>
                    </div>
                )}
            </div>
        </section>
    );
}

