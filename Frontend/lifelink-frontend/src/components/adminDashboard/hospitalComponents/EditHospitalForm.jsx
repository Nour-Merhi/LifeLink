import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import axios from 'axios';

export default function EditHospitalForm({ onClose, onHospitalUpdated, hospitalCode, hospitalData }) {
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [hospitalInfo, setHospitalInfo] = useState(null);
    const [originalData, setOriginalData] = useState(null);
    const [editHospitalData, setEditHospitalData] = useState({
        name: "",
        address: "",
        latitude: null,
        longitude: null,
        phone_nb: "",
        email: "",
        status: "unverified",
    });

    useEffect(() => {
        if (hospitalData) {
            // Use provided hospital data
            const initialData = {
                name: hospitalData.name || "",
                address: hospitalData.address || "",
                latitude: hospitalData.latitude || null,
                longitude: hospitalData.longitude || null,
                phone_nb: hospitalData.phone_nb || "",
                email: hospitalData.email || "",
                status: hospitalData.status || "unverified",
            };
            setEditHospitalData(initialData);
            setOriginalData({ ...initialData });
            setHospitalInfo(hospitalData);
            setFetchLoading(false);
        } else {
            // Fetch hospital data
            fetchHospitalDetails();
        }
    }, [hospitalCode, hospitalData]);


    const fetchHospitalDetails = async () => {
        if (!hospitalCode) {
            setFetchLoading(false);
            return;
        }

        setFetchLoading(true);
        try {
            const response = await axios.get(
                `http://localhost:8000/api/admin/dashboard/hospitals/${hospitalCode}`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            const hospital = response.data.hospital || response.data;
            setHospitalInfo(hospital);
            
            const initialData = {
                name: hospital.name || "",
                address: hospital.address || "",
                latitude: hospital.latitude || null,
                longitude: hospital.longitude || null,
                phone_nb: hospital.phone_nb || "",
                email: hospital.email || "",
                status: hospital.status || "unverified",
            };
            
            setEditHospitalData(initialData);
            setOriginalData({ ...initialData });
        } catch (error) {
            console.error('Error fetching hospital details:', error);
            setErrors({ general: error.response?.data?.message || "Failed to fetch hospital details" });
        } finally {
            setFetchLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditHospitalData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!originalData) {
            setErrors({ general: 'Original hospital data not loaded. Please close and try again.' });
            return;
        }

        // Compare current data with original data and only include changed fields
        const changedFields = {};
        let hasChanges = false;

        if (editHospitalData.name !== originalData.name) {
            changedFields.name = editHospitalData.name;
            hasChanges = true;
        }
        if (editHospitalData.address !== originalData.address) {
            changedFields.address = editHospitalData.address;
            hasChanges = true;
        }
        if (editHospitalData.latitude !== originalData.latitude) {
            changedFields.latitude = editHospitalData.latitude;
            hasChanges = true;
        }
        if (editHospitalData.longitude !== originalData.longitude) {
            changedFields.longitude = editHospitalData.longitude;
            hasChanges = true;
        }
        if (editHospitalData.phone_nb !== originalData.phone_nb) {
            changedFields.phone_nb = editHospitalData.phone_nb;
            hasChanges = true;
        }
        if (editHospitalData.email !== originalData.email) {
            changedFields.email = editHospitalData.email;
            hasChanges = true;
        }
        if (editHospitalData.status !== originalData.status) {
            changedFields.status = editHospitalData.status;
            hasChanges = true;
        }

        if (!hasChanges) {
            setErrors({ general: "No changes detected." });
            setTimeout(onClose, 1000);
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            await axios.put(
                `http://localhost:8000/api/admin/dashboard/hospitals/${hospitalCode}`,
                changedFields,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (onHospitalUpdated) {
                onHospitalUpdated();
            }
            onClose();
        } catch (error) {
            console.error('Error updating hospital:', error);
            if (error.response?.status === 422 && error.response?.data?.errors) {
                const validationErrors = {};
                Object.keys(error.response.data.errors).forEach(key => {
                    validationErrors[key] = error.response.data.errors[key][0];
                });
                setErrors(validationErrors);
            } else {
                setErrors({ 
                    general: error.response?.data?.message || error.message || "Failed to update hospital" 
                });
            }
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading) {
        return (
            <div className="modal-overlay modal-overlay-edit" onClick={onClose}>
                <div className="modal-container modal-container-edit" onClick={(e) => e.stopPropagation()}>
                    <div className="loader">
                        <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />
                        <h3>Loading Hospital Details...</h3>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay modal-overlay-edit" onClick={onClose}>
            <div className="modal-container modal-container-edit" onClick={(e) => e.stopPropagation()}>
                <div className="modal-title">
                    <h2>Edit Hospital</h2>
                    <button onClick={onClose} disabled={loading}>
                        <IoClose />
                    </button>
                </div>
                <div className="modal-form">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <div>
                                <label htmlFor="name">Hospital Name</label>
                                <input
                                    id="name"
                                    type="text"
                                    name="name"
                                    value={editHospitalData.name}
                                    onChange={handleChange}
                                    required
                                />
                                {errors.name && (
                                    <small className="error-text">{errors.name}</small>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <div>
                                <label htmlFor="address">Address</label>
                                <input
                                    id="address"
                                    name="address"
                                    type="text"
                                    value={editHospitalData.address}
                                    onChange={handleChange}
                                    placeholder="Enter hospital address"
                                    required
                                />
                                {errors.address && (
                                    <small className="error-text">{errors.address}</small>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <div>
                                <label htmlFor="phone_nb">Phone Number</label>
                                <input
                                    id="phone_nb"
                                    type="text"
                                    name="phone_nb"
                                    value={editHospitalData.phone_nb}
                                    onChange={handleChange}
                                    required
                                />
                                {errors.phone_nb && (
                                    <small className="error-text">{errors.phone_nb}</small>
                                )}
                            </div>
                            <div>
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={editHospitalData.email}
                                    onChange={handleChange}
                                    required
                                />
                                {errors.email && (
                                    <small className="error-text">{errors.email}</small>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <div>
                                <label htmlFor="status">Status</label>
                                <div className="select-des">
                                    <select
                                        id="status"
                                        name="status"
                                        value={editHospitalData.status}
                                        onChange={handleChange}
                                    >
                                        <option value="unverified">Unverified</option>
                                        <option value="verified">Verified</option>
                                    </select>
                                </div>
                                {errors.status && (
                                    <small className="error-text">{errors.status}</small>
                                )}
                            </div>
                        </div>

                        {errors.general && (
                            <div className="error-message modal-error-container">
                                {errors.general}
                            </div>
                        )}

                        <div className="form-actions form-actions-modal">
                            <button 
                                type="button" 
                                onClick={onClose}
                                disabled={loading}
                                className="btn-cancel"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="submit-btn"
                            >
                                {loading ? (
                                    <>
                                        <SpinnerDotted size={20} thickness={100} speed={100} color="#fff" className="spinner-inline" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Hospital'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

