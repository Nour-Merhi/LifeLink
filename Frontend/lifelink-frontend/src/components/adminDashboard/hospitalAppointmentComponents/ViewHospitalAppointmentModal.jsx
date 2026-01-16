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

    const statusLabel = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'canceled' || s === 'cancelled') return 'Cancelled';
        if (!s) return 'Pending';
        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    const statusBadgeClass = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'completed') return 'badge-success';
        if (s === 'pending') return 'badge-pending';
        return 'badge-danger';
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container modal-modern" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                <div className="modal-modern-header">
                    <div className="modal-modern-title">
                        <h2>Hospital Appointment</h2>
                        <div className="modal-modern-subtitle">
                            <span>Appointment: {appointmentCode || appointmentData?.id || 'N/A'}</span>
                            {appointmentData?.status && (
                                <span className={`badge ${statusBadgeClass(appointmentData.status)}`}>
                                    {statusLabel(appointmentData.status)}
                                </span>
                            )}
                        </div>
                    </div>
                    <button className="modal-icon-btn" onClick={onClose} aria-label="Close">
                        <IoClose />
                    </button>
                </div>

                <div className="modal-modern-body">
                    {loading ? (
                        <div className="loader">
                            <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />
                            <h3>Loading Appointment Details...</h3>
                        </div>
                    ) : error ? (
                        <div className="error-message modal-error-container">{error}</div>
                    ) : appointmentData ? (
                        <>
                            <div className="modal-section">
                                <h3 className="modal-section-title">
                                    Appointment Overview
                                    <span className="muted">{appointmentData.created_at || 'N/A'}</span>
                                </h3>
                                <div className="modal-grid">
                                    <div className="modal-field">
                                        <span className="label">Appointment ID</span>
                                        <span className="value">{appointmentData.id || 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Status</span>
                                        <span className="value">
                                            <span className={`badge ${statusBadgeClass(appointmentData.status)}`}>
                                                {statusLabel(appointmentData.status)}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-section">
                                <h3 className="modal-section-title">Donor</h3>
                                <div className="modal-grid">
                                    <div className="modal-field">
                                        <span className="label">Name</span>
                                        <span className="value">{appointmentData.name || 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Age</span>
                                        <span className="value">{appointmentData.age ? `${appointmentData.age} years` : 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Blood Type</span>
                                        <span className="value">{appointmentData.blood_type || 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Email</span>
                                        <span className="value">{appointmentData.email || 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Phone</span>
                                        <span className="value">{appointmentData.phone || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-section">
                                <h3 className="modal-section-title">Schedule</h3>
                                <div className="modal-grid">
                                    <div className="modal-field">
                                        <span className="label">Hospital</span>
                                        <span className="value">{appointmentData.hospital_name || 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Date</span>
                                        <span className="value">{appointmentData.date || 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Time</span>
                                        <span className="value">{appointmentData.time || 'N/A'}</span>
                                    </div>
                                </div>

                                {appointmentData.note && (
                                    <div className="modal-note">
                                        {appointmentData.note}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="error-message modal-error-container">No appointment data available</div>
                    )}
                </div>

                <div className="modal-modern-footer">
                    <button type="button" onClick={onClose} className="btn-cancel">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

