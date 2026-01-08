import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import api from "../../../api/axios";

export default function AddPatientCaseForm({ onClose, onPatientCaseAdded }) {
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [errors, setErrors] = useState({});
    const [error, setError] = useState("");
    const [imagePreview, setImagePreview] = useState(null);
    const [hospitals, setHospitals] = useState([]);
    const [loadingHospitals, setLoadingHospitals] = useState(true);

    const [addPatientData, setAddPatientData] = useState({
        full_name: "",
        date_of_birth: '',
        case_title: '',
        severity: "",
        description: "",
        hospital_id: '',
        gender: '',
        target_amount: '',
        due_date: '',
        image: null,
    });

    // Fetch hospitals
    useEffect(() => {
        const fetchHospitals = async () => {
            try {
                setLoadingHospitals(true);
                const response = await api.get('/api/admin/dashboard/get-hospitals');
                setHospitals(response.data.hospitals || []);
            } catch (err) {
                console.error('Error fetching hospitals:', err);
                setError('Failed to load hospitals');
            } finally {
                setLoadingHospitals(false);
            }
        };

        fetchHospitals();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setAddPatientData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                setError("File size exceeds 5MB limit. Please choose a smaller image.");
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
                setImagePreview(reader.result);
                setAddPatientData(prev => ({
                    ...prev,
                    image: reader.result // Store base64 string
                }));
                setError("");
            };
            reader.onerror = () => {
                setError("Error reading file. Please try again.");
                e.target.value = '';
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
        setAddPatientData(prev => ({
            ...prev,
            image: null
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setErrors({});

        try {
            await api.get("/sanctum/csrf-cookie");
            const response = await api.post(
                "/api/admin/dashboard/financial/patient-cases",
                addPatientData
            );
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setAddPatientData({
                    full_name: "",
                    date_of_birth: '',
                    case_title: '',
                    severity: "",
                    description: "",
                    hospital_id: '',
                    gender: '',
                    target_amount: '',
                    due_date: '',
                    image: null,
                });
                setImagePreview(null);
                if (onPatientCaseAdded) {
                    onPatientCaseAdded();
                } else {
                    onClose();
                }
            }, 2000);
        } catch (err) {
            console.error("❌ Error adding patient case:", err);
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
                const errorMessages = Object.values(err.response.data.errors).flat();
                setError(errorMessages.join(", "));
            } else {
                setError(err.response?.data?.message || "Failed to add patient case. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="modal">
            <div className="modal-container">
            {showSuccess && (
                <div className="success-overlay">
                    <div className="success-check">
                        <svg viewBox="0 0 52 52">
                            <path className="checkmark__circle" d="M26 2c13.255 0 24 10.745 24 24S39.255 50 26 50 2 39.255 2 26 12.745 2 26 2z"/>
                            <path className="checkmark__check" d="M14 27l7 7 17-17"/>
                        </svg>
                        <div className="success-text">Patient case added successfully</div>
                    </div>
                </div>
            )}
            {!loading ? ( <>
                    <div className="modal-title">
                        <h2>Add New Patient Case</h2>
                        <button onClick={onClose}><IoClose /></button>
                    </div>

                    <div className="modal-form">
                        {error && (
                            <div style={{ padding: "10px", marginBottom: "20px", backgroundColor: "#fee", color: "#c33", borderRadius: "5px" }}>
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <div>
                                    <label htmlFor="full_name">Full Name *</label>
                                    <input
                                        id="full_name"
                                        type="text"
                                        name="full_name"
                                        value={addPatientData.full_name}
                                        placeholder="(e.g., John Michael Smith)"
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.full_name && (<small className="muted">{errors.full_name[0]}</small>)}
                                </div>
                                <div>
                                    <label htmlFor="date_of_birth">Date of Birth *</label>
                                    <input
                                        id="date_of_birth"
                                        type="date"
                                        name="date_of_birth"
                                        value={addPatientData.date_of_birth}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.date_of_birth && (<small className="muted">{errors.date_of_birth[0]}</small>)}
                                </div>
                            </div>

                            <div className="form-group">
                                <div>
                                    <label htmlFor="gender">Gender *</label>
                                    <div className="select-des">
                                        <select
                                            id="gender"
                                            name="gender"
                                            value={addPatientData.gender}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="" disabled>Select Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    </div>
                                    {errors.gender && (<small className="muted">{errors.gender[0]}</small>)}
                                </div>
                                <div>
                                    <label htmlFor="severity">Severity *</label>
                                    <div className="select-des">
                                        <select
                                            id="severity"
                                            name="severity"
                                            value={addPatientData.severity}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="" disabled>Select Severity</option>
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>
                                    {errors.severity && (<small className="muted">{errors.severity[0]}</small>)}
                                </div>
                            </div>

                            <div className="form-group">
                                <div>
                                    <label htmlFor="case_title">Case Title *</label>
                                    <input
                                        id="case_title"
                                        type="text"
                                        name="case_title"
                                        value={addPatientData.case_title}
                                        placeholder="Enter case title"
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.case_title && (<small className="muted">{errors.case_title[0]}</small>)}
                                </div>
                            </div>

                            <div className="form-group">
                                <div>
                                    <label htmlFor="description">
                                        Description *
                                    </label>
                                    <textarea
                                        name="description"
                                        value={addPatientData.description}
                                        placeholder="Write patient case description"
                                        rows="5"
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.description && (<small className="muted">{errors.description[0]}</small>)}
                                </div>
                            </div>

                            <div className="form-group">
                                <div>
                                    <label htmlFor="target_amount">
                                        Target Amount (in $) *
                                    </label>
                                    <input
                                        id="target_amount"
                                        type="number"
                                        name="target_amount"
                                        value={addPatientData.target_amount}
                                        placeholder="e.g 1000"
                                        min="0.01"
                                        step="0.01"
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.target_amount && (<small className="muted">{errors.target_amount[0]}</small>)}
                                </div>
                                <div>
                                    <label htmlFor="due_date">Due Date *</label>
                                    <input
                                        id="due_date"
                                        type="date"
                                        name="due_date"
                                        value={addPatientData.due_date}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.due_date && (<small className="muted">{errors.due_date[0]}</small>)}
                                </div>
                            </div>

                            <div className="form-group">
                                <div>
                                    <label htmlFor="hospital_id">
                                        Hospital (Optional)
                                    </label>
                                    <div className="select-des">
                                        <select
                                            id="hospital_id"
                                            name="hospital_id"
                                            value={addPatientData.hospital_id}
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
                                    {errors.hospital_id && (<small className="muted">{errors.hospital_id[0]}</small>)}
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
                                    {errors.image && (<small className="muted">{errors.image[0]}</small>)}
                                </div>
                            </div>

                            <div className="form-submit-btn">
                                <button type="submit" className="submit-btn" disabled={loading}>
                                    Add Patient Case
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            ): (
                <div className="loader">
                  <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />                
                  <h3>Adding Patient Case...</h3>
                </div>
            )
            }
        </div>
    </section>
    );
}
