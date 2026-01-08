import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import { IoPersonCircle } from "react-icons/io5";
import { FaHospital } from "react-icons/fa";
import { IoCalendarSharp } from "react-icons/io5";
import api from "../../../api/axios";

const API_BASE_URL = "http://localhost:8000";

export default function ViewPatientCaseModal({ onClose, patientCaseId }) {
    const [loading, setLoading] = useState(true);
    const [patientCaseData, setPatientCaseData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchPatientCaseDetails();
    }, [patientCaseId]);

    const fetchPatientCaseDetails = async () => {
        if (!patientCaseId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");
        try {
            const response = await api.get(`/api/admin/dashboard/financial/patient-cases/${patientCaseId}`);
            setPatientCaseData(response.data.patientCase || response.data);
        } catch (error) {
            console.error('Error fetching patient case details:', error);
            setError(error.response?.data?.message || "Failed to fetch patient case details");
        } finally {
            setLoading(false);
        }
    };

    const formatPaymentMethod = (method) => {
        if (method === 'credit_card' || method === 'credit card') return 'Credit Card';
        if (method === 'wish_money' || method === 'wish') return 'Wish Money';
        if (method === 'paypal' || method === 'cash') return 'Cash';
        return method;
    };

    const imageSrc = patientCaseData?.image 
        ? (patientCaseData.image.startsWith('http') ? patientCaseData.image : `${API_BASE_URL}/${patientCaseData.image}`)
        : null;

    return (
        <div className="modal-overlay modal-overlay-edit" onClick={onClose}>
            <div className="modal-container modal-container-edit" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="modal-title">
                    <h2>Patient Case Details</h2>
                    <button onClick={onClose}>
                        <IoClose />
                    </button>
                </div>
                <div className="modal-form">
                    {loading ? (
                        <div className="loader">
                            <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />
                            <h3>Loading Patient Case Details...</h3>
                        </div>
                    ) : error ? (
                        <div className="error-message modal-error-container">
                            {error}
                        </div>
                    ) : patientCaseData ? (
                        <div className="edit-modal-description">
                            {/* Patient Image */}
                            {imageSrc && (
                                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                    <img 
                                        src={imageSrc} 
                                        alt={patientCaseData.patientName}
                                        style={{ 
                                            maxWidth: '200px', 
                                            maxHeight: '200px', 
                                            borderRadius: '10px',
                                            objectFit: 'cover'
                                        }} 
                                    />
                                </div>
                            )}

                            <div className="info-text" style={{ marginBottom: '20px' }}>
                                <h3 style={{ marginBottom: '15px', color: '#2349C2' }}>Patient Information</h3>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                    <div>
                                        <strong>Case ID:</strong>
                                        <p>{patientCaseData.code || patientCaseData.id}</p>
                                    </div>
                                    <div>
                                        <strong>Status:</strong>
                                        <p>
                                            <span className={`badge ${
                                                patientCaseData.status === "active" ? "badge-success" : 
                                                patientCaseData.status === "funded" ? "badge-success" : 
                                                patientCaseData.status === "expired" ? "badge-danger" : 
                                                "badge-danger"
                                            }`}>
                                                {patientCaseData.status?.charAt(0).toUpperCase() + patientCaseData.status?.slice(1) || "Active"}
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <strong>Patient Name:</strong>
                                        <p>{patientCaseData.patientName}</p>
                                    </div>
                                    <div>
                                        <strong>Age:</strong>
                                        <p>{patientCaseData.age} years</p>
                                    </div>
                                    <div>
                                        <strong>Gender:</strong>
                                        <p>{patientCaseData.gender ? patientCaseData.gender.charAt(0).toUpperCase() + patientCaseData.gender.slice(1) : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <strong>Date of Birth:</strong>
                                        <p>{patientCaseData.dateOfBirth || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <strong>Case Title:</strong>
                                        <p>{patientCaseData.condition}</p>
                                    </div>
                                    <div>
                                        <strong>Severity:</strong>
                                        <p>
                                            <span className={`badge ${
                                                patientCaseData.severity === "high" ? "badge-danger" :
                                                patientCaseData.severity === "medium" ? "badge-pending" :
                                                "badge-success"
                                            }`}>
                                                {patientCaseData.severity ? patientCaseData.severity.charAt(0).toUpperCase() + patientCaseData.severity.slice(1) : 'Low'}
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <strong>Hospital:</strong>
                                        <p>{patientCaseData.hospital || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <strong>Due Date:</strong>
                                        <p>{patientCaseData.dueDate || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <strong>Days Remaining:</strong>
                                        <p>{patientCaseData.daysRemaining} days</p>
                                    </div>
                                    <div>
                                        <strong>Created At:</strong>
                                        <p>{patientCaseData.created_at || 'N/A'}</p>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <strong>Description:</strong>
                                    <p style={{ marginTop: '5px', padding: '10px', background: '#f5f5f5', borderRadius: '5px' }}>
                                        {patientCaseData.description}
                                    </p>
                                </div>

                                <h4 style={{ marginTop: '20px', marginBottom: '10px', color: '#2349C2' }}>Funding Information</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                    <div>
                                        <strong>Target Amount:</strong>
                                        <p>${parseFloat(patientCaseData.targetFunding || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <strong>Current Funding:</strong>
                                        <p>${parseFloat(patientCaseData.currentFunding || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <strong>Funding Progress:</strong>
                                        <p>{patientCaseData.fundingPercentage || 0}%</p>
                                    </div>
                                    <div>
                                        <strong>Total Donations:</strong>
                                        <p>${parseFloat(patientCaseData.totalDonations || 0).toLocaleString()}</p>
                                    </div>
                                </div>

                                <h4 style={{ marginTop: '20px', marginBottom: '10px', color: '#2349C2' }}>Donors Who Funded This Patient</h4>
                                {patientCaseData.donors && patientCaseData.donors.length > 0 ? (
                                    <div style={{ marginBottom: '15px' }}>
                                        <div style={{ display: 'grid', gap: '10px' }}>
                                            {patientCaseData.donors.map((donor, index) => (
                                                <div 
                                                    key={index}
                                                    style={{
                                                        padding: '12px',
                                                        background: '#f9f9f9',
                                                        borderRadius: '8px',
                                                        border: '1px solid #e0e0e0',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <IoPersonCircle style={{ fontSize: '24px', color: '#2349C2' }} />
                                                        <div>
                                                            <strong>{donor.name}</strong>
                                                            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                                                                Donated ${parseFloat(donor.amount || 0).toLocaleString()} on {donor.date}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                                        {formatPaymentMethod(donor.payment_method)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p style={{ padding: '15px', background: '#f5f5f5', borderRadius: '5px', color: '#666' }}>
                                        No donors have funded this patient case yet.
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="form-actions form-actions-modal">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="btn-cancel"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

