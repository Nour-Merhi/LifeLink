import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import api from "../../../api/axios";

export default function ViewHospitalAppointmentModal({ onClose, appointmentCode }) {
    const [loading, setLoading] = useState(true);
    const [appointmentData, setAppointmentData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchAppointmentDetails();
    }, [appointmentCode]);

    const fetchAppointmentDetails = async () => {
        if (!appointmentCode) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");
        try {
            const response = await api.get(
                `/api/admin/dashboard/hospital-appointments/${appointmentCode}`
            );
            
            setAppointmentData(response.data.hospitalAppointment || response.data);
        } catch (error) {
            console.error('Error fetching hospital appointment details:', error);
            setError(error.response?.data?.message || "Failed to fetch appointment details");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay modal-overlay-edit" onClick={onClose}>
            <div className="modal-container modal-container-edit" onClick={(e) => e.stopPropagation()}>
                <div className="modal-title">
                    <h2>Hospital Appointment Details</h2>
                    <button onClick={onClose}>
                        <IoClose />
                    </button>
                </div>
                <div className="modal-form">
                    {loading ? (
                        <div className="loader">
                            <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />
                            <h3>Loading Appointment Details...</h3>
                        </div>
                    ) : error ? (
                        <div className="error-message modal-error-container">
                            {error}
                        </div>
                    ) : appointmentData ? (
                        <div className="edit-modal-description">
                            <div className="info-text" style={{ marginBottom: '20px' }}>
                                <h3 style={{ marginBottom: '15px', color: '#2349C2' }}>Appointment Information</h3>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                    <div>
                                        <strong>Appointment ID:</strong>
                                        <p>{appointmentData.id}</p>
                                    </div>
                                    <div>
                                        <strong>Status:</strong>
                                        <p>
                                            <span className={`badge ${
                                                appointmentData.status === "completed" ? "badge-success" : 
                                                (appointmentData.status === "pending" || appointmentData.status === "Pending") ? "badge-pending" : 
                                                "badge-danger"
                                            }`}>
                                                {appointmentData.status === "canceled" ? "Cancelled" : (appointmentData.status?.charAt(0).toUpperCase() + appointmentData.status?.slice(1)) || "Pending"}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <h4 style={{ marginTop: '20px', marginBottom: '10px', color: '#2349C2' }}>Donor Information</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                    <div>
                                        <strong>Name:</strong>
                                        <p>{appointmentData.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <strong>Age:</strong>
                                        <p>{appointmentData.age ? `${appointmentData.age} years` : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <strong>Blood Type:</strong>
                                        <p>{appointmentData.blood_type || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <strong>Email:</strong>
                                        <p>{appointmentData.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <strong>Phone:</strong>
                                        <p>{appointmentData.phone || 'N/A'}</p>
                                    </div>
                                </div>

                                <h4 style={{ marginTop: '20px', marginBottom: '10px', color: '#2349C2' }}>Appointment Details</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                    <div>
                                        <strong>Hospital:</strong>
                                        <p>{appointmentData.hospital_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <strong>Date:</strong>
                                        <p>{appointmentData.date || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <strong>Time:</strong>
                                        <p>{appointmentData.time || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <strong>Created At:</strong>
                                        <p>{appointmentData.created_at || 'N/A'}</p>
                                    </div>
                                </div>

                                {appointmentData.note && (
                                    <div style={{ marginTop: '20px' }}>
                                        <strong>Note:</strong>
                                        <p style={{ marginTop: '5px', padding: '10px', background: '#f5f5f5', borderRadius: '5px' }}>
                                            {appointmentData.note}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="error-message modal-error-container">
                            No appointment data available
                        </div>
                    )}

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
        </div>
    );
}

