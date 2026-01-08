import { useState, useEffect } from "react";
import { FaHeartbeat } from "react-icons/fa";
import "../../../styles/Dashboard.css";
import api from "../../../api/axios";

export default function MedicalInformation({ initialData, bloodTypes: initialBloodTypes, onUpdate }) {
    const [medicalData, setMedicalData] = useState({
        bloodTypeId: "",
        bloodType: "",
        emergencyContact: "",
        medicalConditions: "",
        weight: "",
        emergencyPhone: ""
    });
    const [charCount, setCharCount] = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [bloodTypes, setBloodTypes] = useState([]);

    // Initialize form data from props
    useEffect(() => {
        if (initialData) {
            const medicalConditionsValue = typeof initialData.medical_conditions === 'string' 
                ? initialData.medical_conditions 
                : (initialData.medical_conditions ? JSON.stringify(initialData.medical_conditions) : "");

            setMedicalData({
                bloodTypeId: initialData.blood_type_id || "",
                bloodType: initialData.blood_type || "",
                emergencyContact: initialData.emergency_contact_name || "",
                medicalConditions: medicalConditionsValue,
                weight: initialData.weight ? initialData.weight.toString() : "",
                emergencyPhone: initialData.emergency_contact_phone || ""
            });

            setCharCount(medicalConditionsValue.length);
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
        
        if (name === "medicalConditions") {
            setCharCount(value.length);
            setMedicalData(prev => ({ ...prev, [name]: value }));
        } else if (name === "bloodType") {
            // Find blood type ID when blood type changes
            const selectedBloodType = bloodTypes.find(bt => 
                `${bt.type}${bt.rh_factor}` === value || bt.full_name === value || bt.full_type === value
            );
            setMedicalData(prev => ({ 
                ...prev, 
                bloodType: value,
                bloodTypeId: selectedBloodType?.id || "" 
            }));
        } else {
            setMedicalData(prev => ({ ...prev, [name]: value }));
        }
        
        setSuccess(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError("");
            setSuccess(false);

            const updateData = {
                blood_type_id: medicalData.bloodTypeId || null,
                weight: medicalData.weight ? parseFloat(medicalData.weight) : null,
                emergency_contact_name: medicalData.emergencyContact || null,
                emergency_contact_phone: medicalData.emergencyPhone || null,
                medical_conditions: medicalData.medicalConditions || null,
            };

            await api.put("/api/settings/medical", updateData);

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            
            // Refresh settings data
            if (onUpdate) {
                onUpdate();
            }
        } catch (err) {
            console.error("Error updating medical information:", err);
            setError(err.response?.data?.message || "Failed to update medical information");
            if (err.response?.data?.errors) {
                const errorMessages = Object.values(err.response.data.errors).flat();
                setError(errorMessages.join(", "));
            }
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        // Reset form to original values
        if (initialData) {
            const medicalConditionsValue = typeof initialData.medical_conditions === 'string' 
                ? initialData.medical_conditions 
                : (initialData.medical_conditions ? JSON.stringify(initialData.medical_conditions) : "");

            setMedicalData({
                bloodTypeId: initialData.blood_type_id || "",
                bloodType: initialData.blood_type || "",
                emergencyContact: initialData.emergency_contact_name || "",
                medicalConditions: medicalConditionsValue,
                weight: initialData.weight ? initialData.weight.toString() : "",
                emergencyPhone: initialData.emergency_contact_phone || ""
            });
            setCharCount(medicalConditionsValue.length);
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
                    Medical information updated successfully!
                </div>
            )}

            <div className="medical-header">
                <FaHeartbeat className="medical-icon" />
                <div>
                    <h2 className="medical-title">Medical Information</h2>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <div>
                        <label htmlFor="bloodType">Blood Type</label>
                        <select
                            id="bloodType"
                            name="bloodType"
                            value={medicalData.bloodType}
                            onChange={handleChange}
                        >
                            <option value="">Select blood type</option>
                            {bloodTypes.map((bt) => (
                                <option key={bt.id} value={bt.full_name || bt.full_type || `${bt.type}${bt.rh_factor}`}>
                                    {bt.full_name || bt.full_type || `${bt.type}${bt.rh_factor}`}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="weight">Weight (kg)</label>
                        <input
                            type="number"
                            id="weight"
                            name="weight"
                            value={medicalData.weight}
                            onChange={handleChange}
                            placeholder="Enter weight in kg"
                            step="0.1"
                            min="0"
                            max="500"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <div>
                        <label htmlFor="emergencyContact">Emergency Contact</label>
                        <input
                            type="text"
                            id="emergencyContact"
                            name="emergencyContact"
                            value={medicalData.emergencyContact}
                            onChange={handleChange}
                            placeholder="Enter emergency contact name"
                        />
                    </div>
                    <div>
                        <label htmlFor="emergencyPhone">Emergency Phone</label>
                        <input
                            type="tel"
                            id="emergencyPhone"
                            name="emergencyPhone"
                            value={medicalData.emergencyPhone}
                            onChange={handleChange}
                            placeholder="Enter emergency phone number"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <div style={{ width: '100%' }}>
                        <label htmlFor="medicalConditions">Medical Conditions & Allergies</label>
                        <textarea
                            id="medicalConditions"
                            name="medicalConditions"
                            value={medicalData.medicalConditions}
                            onChange={handleChange}
                            placeholder="List any medical conditions, allergies, or medications that might affect donations..."
                            maxLength={500}
                            rows={6}
                        />
                        <p className="char-count">Maximum 500 characters ({charCount}/500)</p>
                    </div>
                </div>

                <div className="settings-form-actions">
                    <button type="button" className="btn-cancel" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="save-changes-button" disabled={saving}>
                        {saving ? "Updating..." : "Update Medical Info"}
                    </button>
                </div>
            </form>
        </div>
    );
}
