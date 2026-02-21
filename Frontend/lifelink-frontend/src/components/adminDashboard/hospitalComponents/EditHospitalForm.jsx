import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import MapIntegration from "../../MapIntegration";
import api from "../../../api/axios";
import { getApiBaseUrl } from "../../../config/api";

const API_BASE_URL = getApiBaseUrl();
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function EditHospitalForm({ onClose, onHospitalUpdated, hospitalCode, hospitalData }) {
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [hospitalInfo, setHospitalInfo] = useState(null);
    const [originalData, setOriginalData] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [serviceInput, setServiceInput] = useState("");
    const [urgentNeedInput, setUrgentNeedInput] = useState("");
    const [activeTab, setActiveTab] = useState("hospital"); // hospital | manager

    // Manager edit state
    const [managerFullName, setManagerFullName] = useState("");
    const [managerWorkingDates, setManagerWorkingDates] = useState([]);
    const [editManagerData, setEditManagerData] = useState({
        first_name: "",
        middle_name: "",
        last_name: "",
        phone_nb: "",
        email: "",
        password: "",
        start_time: "",
        end_time: "",
        working_dates: [],
        position: "",
        office_location: "",
    });
    const [originalManagerData, setOriginalManagerData] = useState(null);
    
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

    const normalizeWorkingDates = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                // fall back: comma-separated string
                return value.split(',').map(v => v.trim()).filter(Boolean);
            }
        }
        return [];
    };

    // Function to parse full name into first, middle, and last name
    const parseFullName = (fullNameString) => {
        const nameParts = String(fullNameString || "").trim().split(/\s+/).filter(part => part.length > 0);

        if (nameParts.length === 0) {
            return { first_name: "", middle_name: "", last_name: "" };
        } else if (nameParts.length === 1) {
            return { first_name: nameParts[0], middle_name: "", last_name: "" };
        } else if (nameParts.length === 2) {
            return { first_name: nameParts[0], middle_name: "", last_name: nameParts[1] };
        } else {
            const first_name = nameParts[0];
            const last_name = nameParts[nameParts.length - 1];
            const middle_name = nameParts.slice(1, -1).join(" ");
            return { first_name, middle_name, last_name };
        }
    };

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

            // Manager data (relationship may be snake_case or camelCase)
            const managerRel = hospitalData.health_center_manager || hospitalData.healthCenterManager || hospitalData.health_center_manager;
            const managerUser = managerRel?.user || {};
            const workingDates = normalizeWorkingDates(managerRel?.working_dates);

            const managerInitial = {
                first_name: managerUser.first_name || "",
                middle_name: managerUser.middle_name || "",
                last_name: managerUser.last_name || "",
                phone_nb: managerUser.phone_nb || "",
                email: managerUser.email || "",
                password: "",
                start_time: managerRel?.start_time || "",
                end_time: managerRel?.end_time || "",
                working_dates: workingDates,
                position: managerRel?.position || "",
                office_location: managerRel?.office_location || "",
            };
            setEditManagerData(managerInitial);
            setOriginalManagerData({ ...managerInitial });
            setManagerWorkingDates(workingDates);
            const fullName = [managerInitial.first_name, managerInitial.middle_name, managerInitial.last_name].filter(Boolean).join(" ").trim();
            setManagerFullName(fullName);
            
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

            // Manager data
            const managerRel = hospital.health_center_manager || hospital.healthCenterManager || hospital.health_center_manager;
            const managerUser = managerRel?.user || {};
            const workingDates = normalizeWorkingDates(managerRel?.working_dates);
            const managerInitial = {
                first_name: managerUser.first_name || "",
                middle_name: managerUser.middle_name || "",
                last_name: managerUser.last_name || "",
                phone_nb: managerUser.phone_nb || "",
                email: managerUser.email || "",
                password: "",
                start_time: managerRel?.start_time || "",
                end_time: managerRel?.end_time || "",
                working_dates: workingDates,
                position: managerRel?.position || "",
                office_location: managerRel?.office_location || "",
            };
            setEditManagerData(managerInitial);
            setOriginalManagerData({ ...managerInitial });
            setManagerWorkingDates(workingDates);
            const fullName = [managerInitial.first_name, managerInitial.middle_name, managerInitial.last_name].filter(Boolean).join(" ").trim();
            setManagerFullName(fullName);
            
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

    const handleManagerFullNameChange = (e) => {
        const value = e.target.value;
        setManagerFullName(value);
        const parsed = parseFullName(value);
        setEditManagerData(prev => ({
            ...prev,
            first_name: parsed.first_name,
            middle_name: parsed.middle_name,
            last_name: parsed.last_name,
        }));
    };

    const handleManagerChange = (e) => {
        const { name, value } = e.target;
        setEditManagerData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const toggleManagerDay = (day) => {
        const next = managerWorkingDates.includes(day)
            ? managerWorkingDates.filter(d => d !== day)
            : [...managerWorkingDates, day];
        setManagerWorkingDates(next);
        setEditManagerData(prev => ({
            ...prev,
            working_dates: next
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!originalData) {
            setErrors({ general: 'Original hospital data not loaded. Please close and try again.' });
            return;
        }
        if (!originalManagerData) {
            setErrors({ general: 'Original manager data not loaded. Please close and try again.' });
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

        // Manager changes (send as nested manager payload)
        const managerChanged = {};
        const compareKeys = ['first_name', 'middle_name', 'last_name', 'phone_nb', 'email', 'start_time', 'end_time', 'position', 'office_location'];
        compareKeys.forEach((k) => {
            if ((editManagerData[k] || "") !== (originalManagerData[k] || "")) {
                managerChanged[k] = editManagerData[k] || "";
            }
        });

        // password: only if user entered a new value
        if (editManagerData.password) {
            managerChanged.password = editManagerData.password;
        }

        const managerDatesChanged =
            JSON.stringify((editManagerData.working_dates || []).slice().sort()) !==
            JSON.stringify((originalManagerData.working_dates || []).slice().sort());
        if (managerDatesChanged) {
            managerChanged.working_dates = editManagerData.working_dates || [];
        }

        if (Object.keys(managerChanged).length > 0) {
            changedFields.manager = managerChanged;
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

    const fieldError = (key) => errors?.[key];

    if (fetchLoading) {
        return (
            <div className="modal-overlay modal-overlay-edit" onClick={onClose}>
                <div className="modal-container modal-container-edit modal-modern" onClick={(e) => e.stopPropagation()}>
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
            <div className="modal-container modal-container-edit modal-modern" onClick={(e) => e.stopPropagation()}>
                <div className="modal-modern-header">
                    <div className="modal-modern-title">
                        <h2>Edit Hospital</h2>
                        <div className="modal-modern-subtitle">
                            <span><strong>Code:</strong> {hospitalInfo?.code || hospitalCode || 'N/A'}</span>
                            <span><strong>Name:</strong> {hospitalInfo?.name || editHospitalData.name || 'N/A'}</span>
                        </div>
                    </div>
                    <button className="modal-icon-btn" onClick={onClose} disabled={loading} aria-label="Close">
                        <IoClose />
                    </button>
                </div>

                <div className="modal-modern-body">
                    <div className="donor-detail-tabs" style={{ marginBottom: 14 }}>
                        <button
                            type="button"
                            className={`tab-button ${activeTab === 'hospital' ? 'active' : ''}`}
                            onClick={() => setActiveTab('hospital')}
                            disabled={loading}
                        >
                            Hospital Info
                        </button>
                        <button
                            type="button"
                            className={`tab-button ${activeTab === 'manager' ? 'active' : ''}`}
                            onClick={() => setActiveTab('manager')}
                            disabled={loading}
                        >
                            Manager Info
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {activeTab === 'hospital' ? (
                            <>
                                <div className="modal-section">
                                    <h3 className="modal-section-title">Hospital Details</h3>

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
                                            {fieldError('name') && <small className="error-text">{fieldError('name')}</small>}
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
                                            {fieldError('address') && <small className="error-text">{fieldError('address')}</small>}
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
                                            {fieldError('phone_nb') && <small className="error-text">{fieldError('phone_nb')}</small>}
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
                                            {fieldError('email') && <small className="error-text">{fieldError('email')}</small>}
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
                                            {fieldError('status') && <small className="error-text">{fieldError('status')}</small>}
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-section">
                                    <h3 className="modal-section-title">Media</h3>
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
                                                            borderRadius: "8px",
                                                            marginBottom: "10px",
                                                            display: "block"
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveImage}
                                                        style={{
                                                            padding: "6px 14px",
                                                            backgroundColor: "#f12c31",
                                                            color: "white",
                                                            border: "none",
                                                            borderRadius: "8px",
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
                                            {fieldError('image') && <small className="error-text">{fieldError('image')}</small>}
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-section">
                                    <h3 className="modal-section-title">About</h3>
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
                                            {fieldError('description') && <small className="error-text">{fieldError('description')}</small>}
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-section">
                                    <h3 className="modal-section-title">Services & Needs</h3>

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
                                            {fieldError('services') && <small className="error-text">{fieldError('services')}</small>}
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
                                            {fieldError('hours') && <small className="error-text">{fieldError('hours')}</small>}
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
                                            {fieldError('established') && <small className="error-text">{fieldError('established')}</small>}
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
                                            {fieldError('urgent_needs') && <small className="error-text">{fieldError('urgent_needs')}</small>}
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-section">
                                    <h3 className="modal-section-title">Location</h3>
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
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="modal-section">
                                    <h3 className="modal-section-title">Manager Details</h3>

                                    <div className="form-group">
                                        <div>
                                            <label htmlFor="manager_full_name">Manager Full Name</label>
                                            <input
                                                id="manager_full_name"
                                                type="text"
                                                name="manager_full_name"
                                                value={managerFullName}
                                                placeholder="(e.g., John Michael Smith)"
                                                onChange={handleManagerFullNameChange}
                                            />
                                            <small className="muted" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                                                Parsed: First: <strong>{editManagerData.first_name || '(none)'}</strong>
                                                {editManagerData.middle_name ? ` | Middle: ${editManagerData.middle_name}` : ''}
                                                {editManagerData.last_name ? ` | Last: ${editManagerData.last_name}` : ''}
                                            </small>
                                            {fieldError('manager.first_name') && <small className="error-text">{fieldError('manager.first_name')}</small>}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <div>
                                            <label htmlFor="manager_phone_nb">Manager Phone</label>
                                            <input
                                                id="manager_phone_nb"
                                                type="tel"
                                                name="phone_nb"
                                                value={editManagerData.phone_nb}
                                                placeholder="Enter manager phone number"
                                                onChange={handleManagerChange}
                                            />
                                            {fieldError('manager.phone_nb') && <small className="error-text">{fieldError('manager.phone_nb')}</small>}
                                        </div>
                                        <div>
                                            <label htmlFor="manager_email">Manager Email</label>
                                            <input
                                                id="manager_email"
                                                type="email"
                                                name="email"
                                                value={editManagerData.email}
                                                placeholder="Enter manager email"
                                                onChange={handleManagerChange}
                                            />
                                            {fieldError('manager.email') && <small className="error-text">{fieldError('manager.email')}</small>}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <div>
                                            <label htmlFor="manager_password">New Password (optional)</label>
                                            <input
                                                id="manager_password"
                                                type="password"
                                                name="password"
                                                value={editManagerData.password}
                                                placeholder="Leave empty to keep current password"
                                                onChange={handleManagerChange}
                                            />
                                            {fieldError('manager.password') && <small className="error-text">{fieldError('manager.password')}</small>}
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-section">
                                    <h3 className="modal-section-title">Office Details</h3>
                                    <div className="form-group">
                                        <div>
                                            <label htmlFor="position">Position</label>
                                            <input
                                                id="position"
                                                type="text"
                                                name="position"
                                                value={editManagerData.position || ""}
                                                placeholder="e.g., Organ Transfer Manager"
                                                onChange={handleManagerChange}
                                            />
                                            {fieldError('manager.position') && <small className="error-text">{fieldError('manager.position')}</small>}
                                        </div>
                                        <div>
                                            <label htmlFor="office_location">Office Location</label>
                                            <input
                                                id="office_location"
                                                type="text"
                                                name="office_location"
                                                value={editManagerData.office_location || ""}
                                                placeholder="e.g., Building A - Floor 2"
                                                onChange={handleManagerChange}
                                            />
                                            {fieldError('manager.office_location') && <small className="error-text">{fieldError('manager.office_location')}</small>}
                                        </div>
                                    </div>

                                    <div className="working-hours">
                                        <h3>Manager Office Hours</h3>
                                        <div className="form-group">
                                            <div>
                                                <label htmlFor="start_time">Start Time</label>
                                                <input
                                                    id="start_time"
                                                    type="time"
                                                    name="start_time"
                                                    value={editManagerData.start_time || ""}
                                                    onChange={handleManagerChange}
                                                />
                                                {fieldError('manager.start_time') && <small className="error-text">{fieldError('manager.start_time')}</small>}
                                            </div>
                                            <div>
                                                <label htmlFor="end_time">End Time</label>
                                                <input
                                                    id="end_time"
                                                    type="time"
                                                    name="end_time"
                                                    value={editManagerData.end_time || ""}
                                                    onChange={handleManagerChange}
                                                />
                                                {fieldError('manager.end_time') && <small className="error-text">{fieldError('manager.end_time')}</small>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="working-dates">
                                        <h3>Manager Working Days</h3>
                                        <div className="dates">
                                            {DAYS_OF_WEEK.map((day) => (
                                                <button
                                                    type="button"
                                                    key={day}
                                                    className={`date ${managerWorkingDates.includes(day) ? "active" : ""}`}
                                                    onClick={() => toggleManagerDay(day)}
                                                    disabled={loading}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                        {fieldError('manager.working_dates') && <small className="error-text">{fieldError('manager.working_dates')}</small>}
                                    </div>
                                </div>
                            </>
                        )}

                        {errors.general && (
                            <div className="error-message modal-error-container">
                                {errors.general}
                            </div>
                        )}

                        <div className="modal-modern-footer">
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
                                    activeTab === 'hospital' ? 'Update Hospital' : 'Update Manager'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
