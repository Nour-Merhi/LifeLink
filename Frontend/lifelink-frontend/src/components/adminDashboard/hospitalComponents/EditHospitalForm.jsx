import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import MapIntegration from "../../MapIntegration";
import api from "../../../api/axios";

const API_BASE_URL = "http://localhost:8000";

export default function EditHospitalForm({ onClose, onHospitalUpdated, hospitalCode, hospitalData }) {
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [hospitalInfo, setHospitalInfo] = useState(null);
    const [originalData, setOriginalData] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [serviceInput, setServiceInput] = useState("");
    const [urgentNeedInput, setUrgentNeedInput] = useState("");
    
    const [editHospitalData, setEditHospitalData] = useState({
        name: "",
        address: "",
        latitude: null,
        longitude: null,
        phone_nb: "",
        email: "",
        status: "unverified",
        image: null,
        description: "",
        services: [],
        hours: "",
        established: "",
        urgent_needs: [],
    });

    useEffect(() => {
        if (hospitalData) {
            // Use provided hospital data
            const services = Array.isArray(hospitalData.services) ? hospitalData.services : [];
            const urgentNeeds = Array.isArray(hospitalData.urgent_needs) ? hospitalData.urgent_needs : [];
            
            const initialData = {
                name: hospitalData.name || "",
                address: hospitalData.address || "",
                latitude: hospitalData.latitude || null,
                longitude: hospitalData.longitude || null,
                phone_nb: hospitalData.phone_nb || "",
                email: hospitalData.email || "",
                status: hospitalData.status || "unverified",
                image: hospitalData.image || null,
                description: hospitalData.description || "",
                services: services,
                hours: hospitalData.hours || "",
                established: hospitalData.established || "",
                urgent_needs: urgentNeeds,
            };
            
            setEditHospitalData(initialData);
            setOriginalData({ ...initialData });
            setHospitalInfo(hospitalData);
            setServiceInput(services.join(', '));
            setUrgentNeedInput(urgentNeeds.join(', '));
            
            // Set image preview if image exists
            if (hospitalData.image) {
                if (hospitalData.image.startsWith('http') || hospitalData.image.startsWith('data:')) {
                    setImagePreview(hospitalData.image);
                } else {
                    setImagePreview(`${API_BASE_URL}/${hospitalData.image}`);
                }
            }
            
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
            const response = await api.get(
                `/api/admin/dashboard/hospitals/${hospitalCode}`
            );
            
            const hospital = response.data.hospital || response.data;
            setHospitalInfo(hospital);
            
            const services = Array.isArray(hospital.services) ? hospital.services : [];
            const urgentNeeds = Array.isArray(hospital.urgent_needs) ? hospital.urgent_needs : [];
            
            const initialData = {
                name: hospital.name || "",
                address: hospital.address || "",
                latitude: hospital.latitude || null,
                longitude: hospital.longitude || null,
                phone_nb: hospital.phone_nb || "",
                email: hospital.email || "",
                status: hospital.status || "unverified",
                image: hospital.image || null,
                description: hospital.description || "",
                services: services,
                hours: hospital.hours || "",
                established: hospital.established || "",
                urgent_needs: urgentNeeds,
            };
            
            setEditHospitalData(initialData);
            setOriginalData({ ...initialData });
            setServiceInput(services.join(', '));
            setUrgentNeedInput(urgentNeeds.join(', '));
            
            // Set image preview if image exists
            if (hospital.image) {
                if (hospital.image.startsWith('http') || hospital.image.startsWith('data:')) {
                    setImagePreview(hospital.image);
                } else {
                    setImagePreview(`${API_BASE_URL}/${hospital.image}`);
                }
            }
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

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                setErrors({ image: "File size exceeds 5MB limit. Please choose a smaller image." });
                e.target.value = '';
                return;
            }
            
            // Check file type
            if (!file.type.match('image.*')) {
                setErrors({ image: "Please select a valid image file (JPG, PNG, or GIF)." });
                e.target.value = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
                setEditHospitalData(prev => ({
                    ...prev,
                    image: reader.result // Store base64 string
                }));
                setErrors(prev => ({ ...prev, image: undefined }));
            };
            reader.onerror = () => {
                setErrors({ image: "Error reading file. Please try again." });
                e.target.value = '';
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
        setEditHospitalData(prev => ({
            ...prev,
            image: null
        }));
    };

    const handleLocationSelect = (lat, lng) => {
        setEditHospitalData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
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
        if (editHospitalData.image !== originalData.image) {
            changedFields.image = editHospitalData.image;
            hasChanges = true;
        }
        if (editHospitalData.description !== originalData.description) {
            changedFields.description = editHospitalData.description;
            hasChanges = true;
        }
        // Compare arrays
        const servicesChanged = JSON.stringify(editHospitalData.services.sort()) !== JSON.stringify((originalData.services || []).sort());
        if (servicesChanged) {
            changedFields.services = editHospitalData.services;
            hasChanges = true;
        }
        if (editHospitalData.hours !== originalData.hours) {
            changedFields.hours = editHospitalData.hours;
            hasChanges = true;
        }
        if (editHospitalData.established !== originalData.established) {
            changedFields.established = editHospitalData.established;
            hasChanges = true;
        }
        const urgentNeedsChanged = JSON.stringify(editHospitalData.urgent_needs.sort()) !== JSON.stringify((originalData.urgent_needs || []).sort());
        if (urgentNeedsChanged) {
            changedFields.urgent_needs = editHospitalData.urgent_needs;
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
            await api.get("/sanctum/csrf-cookie");
            await api.put(
                `/api/admin/dashboard/hospitals/${hospitalCode}`,
                changedFields
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

                        {/* Image Upload */}
                        <div className="form-group">
                            <div style={{ width: '100%' }}>
                                <label htmlFor="image">Hospital Image</label>
                                {imagePreview ? (
                                    <div style={{ marginBottom: "10px" }}>
                                        <img 
                                            src={imagePreview} 
                                            alt="Preview" 
                                            style={{ 
                                                maxWidth: "200px", 
                                                maxHeight: "200px", 
                                                borderRadius: "5px",
                                                marginBottom: "10px",
                                                display: "block"
                                            }} 
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            style={{
                                                padding: "5px 15px",
                                                backgroundColor: "#f12c31",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "5px",
                                                cursor: "pointer",
                                                marginRight: "10px"
                                            }}
                                        >
                                            Remove Image
                                        </button>
                                        <input
                                            id="image"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            style={{ display: "inline-block" }}
                                        />
                                    </div>
                                ) : (
                                    <input
                                        id="image"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                )}
                                {errors.image && (
                                    <small className="error-text">{errors.image}</small>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <div style={{ width: '100%' }}>
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={editHospitalData.description}
                                    placeholder="Enter hospital description"
                                    onChange={handleChange}
                                    rows="4"
                                />
                                {errors.description && (
                                    <small className="error-text">{errors.description}</small>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <div style={{ width: '100%' }}>
                                <label htmlFor="services">Services (comma-separated)</label>
                                <input
                                    id="services"
                                    type="text"
                                    value={serviceInput}
                                    placeholder="e.g., Blood Donation Center, Organ Transplant Services, Emergency Care"
                                    onChange={(e) => setServiceInput(e.target.value)}
                                    onBlur={(e) => {
                                        const servicesArray = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                                        setEditHospitalData(prev => ({ ...prev, services: servicesArray }));
                                    }}
                                />
                                {editHospitalData.services.length > 0 && (
                                    <small className="muted" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                                        Services: {editHospitalData.services.join(', ')}
                                    </small>
                                )}
                                {errors.services && (
                                    <small className="error-text">{errors.services}</small>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <div>
                                <label htmlFor="hours">Operating Hours</label>
                                <input
                                    id="hours"
                                    name="hours"
                                    type="text"
                                    value={editHospitalData.hours}
                                    placeholder="e.g., Mon-Fri: 8AM-8PM"
                                    onChange={handleChange}
                                />
                                {errors.hours && (
                                    <small className="error-text">{errors.hours}</small>
                                )}
                            </div>
                            <div>
                                <label htmlFor="established">Established Year</label>
                                <input
                                    id="established"
                                    name="established"
                                    type="text"
                                    value={editHospitalData.established}
                                    placeholder="e.g., 1985"
                                    onChange={handleChange}
                                />
                                {errors.established && (
                                    <small className="error-text">{errors.established}</small>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <div style={{ width: '100%' }}>
                                <label htmlFor="urgent_needs">Urgent Blood Type Needs (comma-separated)</label>
                                <input
                                    id="urgent_needs"
                                    type="text"
                                    value={urgentNeedInput}
                                    placeholder="e.g., A+, B-, AB+, O-"
                                    onChange={(e) => setUrgentNeedInput(e.target.value)}
                                    onBlur={(e) => {
                                        const needsArray = e.target.value.split(',').map(n => n.trim()).filter(n => n);
                                        setEditHospitalData(prev => ({ ...prev, urgent_needs: needsArray }));
                                    }}
                                />
                                {editHospitalData.urgent_needs.length > 0 && (
                                    <small className="muted" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                                        Urgent Needs: {editHospitalData.urgent_needs.join(', ')}
                                    </small>
                                )}
                                {errors.urgent_needs && (
                                    <small className="error-text">{errors.urgent_needs}</small>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <div>
                                <label>Hospital Location</label>
                                <MapIntegration
                                    latitude={editHospitalData.latitude}
                                    longitude={editHospitalData.longitude}
                                    onLocationSelect={handleLocationSelect}
                                />

                                {editHospitalData.latitude && editHospitalData.longitude && (
                                    <small className="muted" style={{ fontSize: '12px', display: 'block', marginTop: '4px', color: '#16a34a' }}>
                                        ✓ Selected Location: {parseFloat(editHospitalData.latitude).toFixed(6)}, {parseFloat(editHospitalData.longitude).toFixed(6)}
                                    </small>
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
