import { useState } from "react";
import { FaHeartbeat } from "react-icons/fa";
import "../../../styles/Dashboard.css";

export default function MedicalInformation() {
    const [medicalData, setMedicalData] = useState({
        bloodType: "O+",
        emergencyContact: "Michael Johnson",
        medicalConditions: "",
        weight: "140",
        emergencyPhone: "+1 (555) 987-6543"
    });

    const [charCount, setCharCount] = useState(0);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setMedicalData(prev => ({ ...prev, [name]: value }));
        
        if (name === "medicalConditions") {
            setCharCount(value.length);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Medical data:', medicalData);
        // Add save functionality here
    };

    const handleCancel = () => {
        // Reset form or navigate away
        console.log('Cancel clicked');
    };

    const bloodTypes = [
        "A+",
        "A-",
        "B+",
        "B-",
        "AB+",
        "AB-",
        "O+ (Universal Donor)",
        "O-"
    ];

    return (
        <div className="settings-form-container">
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
                            {bloodTypes.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="weight">Weight (lbs)</label>
                        <input
                            type="text"
                            id="weight"
                            name="weight"
                            value={medicalData.weight}
                            onChange={handleChange}
                            placeholder="Enter weight"
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
                    <button type="submit" className="save-changes-button">
                        Update Medical Info
                    </button>
                </div>
            </form>
        </div>
    );
}

