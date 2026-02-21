import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import api from "../../../api/axios";
import { getApiBaseUrl } from "../../../config/api";

export default function EditPatientCaseModal({ onClose, onPatientCaseUpdated, patientCaseId }) {
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [patientCaseData, setPatientCaseData] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [hospitals, setHospitals] = useState([]);
    const [loadingHospitals, setLoadingHospitals] = useState(true);
    
    const [editData, setEditData] = useState({
        full_name: "",
        date_of_birth: '',
        gender: '',
        case_title: '',
        description: "",
        severity: "",
        target_amount: '',
        hospital_id: '',
        due_date: '',
        status: 'active',
        image: null,
    });

    useEffect(() => {
        fetchHospitals();
        if (patientCaseId) {
            fetchPatientCaseDetails();
        }
    }, [patientCaseId]);

    const fetchHospitals = async () => {
        try {
            setLoadingHospitals(true);
            const response = await api.get('/api/admin/dashboard/get-hospitals');
            setHospitals(response.data.hospitals || []);
        } catch (err) {
            console.error('Error fetching hospitals:', err);
        } finally {
            setLoadingHospitals(false);
        }
    };

    const fetchPatientCaseDetails = async () => {
        if (!patientCaseId) {
            setFetchLoading(false);
            return;
        }

        setFetchLoading(true);
        try {
            const response = await api.get(`/api/admin/dashboard/financial/patient-cases/${patientCaseId}`);
            const patientCase = response.data.patientCase || response.data;
            setPatientCaseData(patientCase);
            
            setEditData({
                full_name: patientCase.patientName || "",
                date_of_birth: patientCase.dateOfBirth || '',
                gender: patientCase.gender || '',
                case_title: patientCase.condition || '',
                description: patientCase.description || "",
                severity: patientCase.severity || "",
                target_amount: patientCase.targetFunding || '',
                hospital_id: patientCase.hospitalId || patientCase.hospital_id || '',
                due_date: patientCase.dueDate || patientCase.due_date || '',
                status: (patientCase.status === 'done' ? 'funded' : patientCase.status) || 'active',
                image: null,
            });

            // Set image preview if exists
            if (patientCase.image) {
                const imageSrc = patientCase.image.startsWith('http') 
                    ? patientCase.image 
                    : `${getApiBaseUrl()}/${patientCase.image}`;
                setImagePreview(imageSrc);
            }
        } catch (error) {
            console.error('Error fetching patient case details:', error);
            setErrors({ general: error.response?.data?.message || "Failed to fetch patient case details" });
        } finally {
            setFetchLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, image: "File size exceeds 5MB limit. Please choose a smaller image." }));
                e.target.value = '';
                return;
            }
            
            // Check file type
            if (!file.type.match('image.*')) {
                setErrors(prev => ({ ...prev, image: "Please select a valid image file (JPG, PNG, or GIF)." }));
                e.target.value = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
                setEditData(prev => ({
                    ...prev,
                    image: reader.result // Store base64 string
                }));
                setErrors(prev => ({ ...prev, image: null }));
            };
            reader.onerror = () => {
                setErrors(prev => ({ ...prev, image: "Error reading file. Please try again." }));
                e.target.value = '';
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
        setEditData(prev => ({
            ...prev,
            image: null
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            await api.get("/sanctum/csrf-cookie");
            const payload = { ...editData };
            if (payload.hospital_id === '' || payload.hospital_id == null) payload.hospital_id = null;
            if (payload.due_date === '') payload.due_date = null;
            await api.put(`/api/admin/dashboard/financial/patient-cases/${patientCaseId}`, payload);

            if (onPatientCaseUpdated) {
                onPatientCaseUpdated();
            }
            onClose();
        } catch (error) {
            console.error('Error updating patient case:', error);
            if (error.response?.status === 422 && error.response?.data?.errors) {
                const validationErrors = {};
                Object.keys(error.response.data.errors).forEach(key => {
                    validationErrors[key] = error.response.data.errors[key][0];
                });
                setErrors(validationErrors);
            } else {
                setErrors({ 
                    general: error.response?.data?.message || error.message || "Failed to update patient case" 
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
                        <h3>Loading Patient Case Details...</h3>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay modal-overlay-edit" onClick={onClose}>
            <div className="modal-container modal-container-edit" onClick={(e) => e.stopPropagation()}>
                <div className="modal-title">
                    <h2>Edit Patient Case</h2>
                    <button onClick={onClose} disabled={loading}>
                        <IoClose />
                    </button>
                </div>
                <div className="modal-form">
                    {patientCaseData && (
                        <div className="edit-modal-description">
                            <p className="edit-modal-description-text">
                                <strong>Patient:</strong> {patientCaseData.patientName}<br />
                                <strong>Case ID:</strong> {patientCaseData.code || patientCaseData.id}<br />
                                <strong>Status:</strong> {patientCaseData.status}
                            </p>
                        </div>
                    )}
                    {errors.general && (
                        <div style={{ padding: "10px", marginBottom: "20px", backgroundColor: "#fee", color: "#c33", borderRadius: "5px" }}>
                            {errors.general}
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <div>
                                <label htmlFor="full_name">Full Name</label>
                                <input
                                    id="full_name"
                                    type="text"
                                    name="full_name"
                                    value={editData.full_name}
                                    placeholder="(e.g., John Michael Smith)"
                                    onChange={handleChange}
                                />
                                {errors.full_name && (<small className="muted">{errors.full_name}</small>)}
                            </div>
                            <div>
                                <label htmlFor="date_of_birth">Date of Birth</label>
                                <input
                                    id="date_of_birth"
                                    type="date"
                                    name="date_of_birth"
                                    value={editData.date_of_birth}
                                    onChange={handleChange}
                                />
                                {errors.date_of_birth && (<small className="muted">{errors.date_of_birth}</small>)}
                            </div>
                        </div>

                        <div className="form-group">
                            <div>
                                <label htmlFor="gender">Gender</label>
                                <div className="select-des">
                                    <select
                                        id="gender"
                                        name="gender"
                                        value={editData.gender}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                {errors.gender && (<small className="muted">{errors.gender}</small>)}
                            </div>
                            <div>
                                <label htmlFor="severity">Severity</label>
                                <div className="select-des">
                                    <select
                                        id="severity"
                                        name="severity"
                                        value={editData.severity}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Severity</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>
                                {errors.severity && (<small className="muted">{errors.severity}</small>)}
                            </div>
                        </div>

                        <div className="form-group">
                            <div>
                                <label htmlFor="case_title">Case Title</label>
                                <input
                                    id="case_title"
                                    type="text"
                                    name="case_title"
                                    value={editData.case_title}
                                    placeholder="Enter case title"
                                    onChange={handleChange}
                                />
                                {errors.case_title && (<small className="muted">{errors.case_title}</small>)}
                            </div>
                            <div>
                                <label htmlFor="status">Status</label>
                                <div className="select-des">
                                    <select
                                        id="status"
                                        name="status"
                                        value={editData.status}
                                        onChange={handleChange}
                                    >
                                        <option value="active">Active</option>
                                        <option value="funded">Funded</option>
                                        <option value="expired">Expired</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                {errors.status && (<small className="muted">{errors.status}</small>)}
                            </div>
                        </div>

                        <div className="form-group">
                            <div>
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={editData.description}
                                    placeholder="Write patient case description"
                                    rows="5"
                                    onChange={handleChange}
                                />
                                {errors.description && (<small className="muted">{errors.description}</small>)}
                            </div>
                        </div>

                        <div className="form-group">
                            <div>
                                <label htmlFor="target_amount">Target Amount (in $)</label>
                                <input
                                    id="target_amount"
                                    type="number"
                                    name="target_amount"
                                    value={editData.target_amount}
                                    placeholder="e.g 1000"
                                    min="0.01"
                                    step="0.01"
                                    onChange={handleChange}
                                />
                                {errors.target_amount && (<small className="muted">{errors.target_amount}</small>)}
                            </div>
                            <div>
                                <label htmlFor="due_date">Due Date</label>
                                <input
                                    id="due_date"
                                    type="date"
                                    name="due_date"
                                    value={editData.due_date}
                                    onChange={handleChange}
                                />
                                {errors.due_date && (<small className="muted">{errors.due_date}</small>)}
                            </div>
                        </div>

                        <div className="form-group">
                            <div>
                                <label htmlFor="hospital_id">Hospital (Optional)</label>
                                <div className="select-des">
                                    <select
                                        id="hospital_id"
                                        name="hospital_id"
                                        value={editData.hospital_id}
                                        onChange={handleChange}
                                        disabled={loadingHospitals}
                                    >
                                        <option value="">Select Hospital (Optional)</option>
                                        {hospitals.map((hospital) => (
                                            <option key={hospital.id} value={hospital.id}>
                                                {hospital.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {errors.hospital_id && (<small className="muted">{errors.hospital_id}</small>)}
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div className="form-group">
                            <div>
                                <label htmlFor="image">Patient Image (Optional)</label>
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
                                                cursor: "pointer"
                                            }}
                                        >
                                            Remove Image
                                        </button>
                                    </div>
                                ) : (
                                    <input
                                        id="image"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                )}
                                {errors.image && (<small className="muted">{errors.image}</small>)}
                            </div>
                        </div>

                        <div className="form-submit-btn">
                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? (
                                    <>
                                        <SpinnerDotted size={20} thickness={100} speed={100} color="#ffffff" />
                                        <span style={{ marginLeft: '8px' }}>Updating...</span>
                                    </>
                                ) : (
                                    "Update Patient Case"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

