import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import { IoPersonCircle } from "react-icons/io5";
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

    const statusLabel = (status) => {
        const s = (status || '').toLowerCase();
        if (!s) return 'Active';
        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    const statusBadgeClass = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'active' || s === 'funded') return 'badge-success';
        if (s === 'expired') return 'badge-danger';
        return 'badge-danger';
    };

    const severityLabel = (severity) => {
        const s = (severity || '').toLowerCase();
        if (!s) return 'Low';
        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    const severityBadgeClass = (severity) => {
        const s = (severity || '').toLowerCase();
        if (s === 'high') return 'badge-danger';
        if (s === 'medium') return 'badge-pending';
        return 'badge-success';
    };

    const money = (v) => {
        const n = Number(v);
        if (Number.isNaN(n)) return '$0';
        return `$${n.toLocaleString()}`;
    };

    const imageSrc = patientCaseData?.image 
        ? (patientCaseData.image.startsWith('http') ? patientCaseData.image : `${API_BASE_URL}/${patientCaseData.image}`)
        : null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container modal-modern modal-modern-wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                <div className="modal-modern-header">
                    <div className="modal-modern-title">
                        <h2>Patient Case</h2>
                        <div className="modal-modern-subtitle">
                            <span>Case: {patientCaseId || patientCaseData?.code || patientCaseData?.id || 'N/A'}</span>
                            {patientCaseData?.status && (
                                <span className={`badge ${statusBadgeClass(patientCaseData.status)}`}>
                                    {statusLabel(patientCaseData.status)}
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
                            <h3>Loading Patient Case Details...</h3>
                        </div>
                    ) : error ? (
                        <div className="error-message modal-error-container">{error}</div>
                    ) : patientCaseData ? (
                        <>
                            {imageSrc && (
                                <div className="modal-image-wrap">
                                    <img className="modal-image" src={imageSrc} alt={patientCaseData.patientName || 'Patient'} />
                                </div>
                            )}

                            <div className="modal-section">
                                <h3 className="modal-section-title">
                                    Patient Information
                                    <span className="muted">{patientCaseData.created_at || ''}</span>
                                </h3>
                                <div className="modal-grid">
                                    <div className="modal-field">
                                        <span className="label">Case ID</span>
                                        <span className="value">{patientCaseData.code || patientCaseData.id || 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Status</span>
                                        <span className="value">
                                            <span className={`badge ${statusBadgeClass(patientCaseData.status)}`}>
                                                {statusLabel(patientCaseData.status)}
                                            </span>
                                        </span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Patient Name</span>
                                        <span className="value">{patientCaseData.patientName || 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Age</span>
                                        <span className="value">{patientCaseData.age ? `${patientCaseData.age} years` : 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Gender</span>
                                        <span className="value">{patientCaseData.gender ? patientCaseData.gender.charAt(0).toUpperCase() + patientCaseData.gender.slice(1) : 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Date of Birth</span>
                                        <span className="value">{patientCaseData.dateOfBirth || 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Case Title</span>
                                        <span className="value">{patientCaseData.condition || 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Severity</span>
                                        <span className="value">
                                            <span className={`badge ${severityBadgeClass(patientCaseData.severity)}`}>
                                                {severityLabel(patientCaseData.severity)}
                                            </span>
                                        </span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Hospital</span>
                                        <span className="value">{patientCaseData.hospital || 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Due Date</span>
                                        <span className="value">{patientCaseData.dueDate || 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Days Remaining</span>
                                        <span className="value">{typeof patientCaseData.daysRemaining === 'number' ? `${patientCaseData.daysRemaining} days` : (patientCaseData.daysRemaining || 'N/A')}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Created At</span>
                                        <span className="value">{patientCaseData.created_at || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="modal-note">
                                    <strong>Description</strong>
                                    <div>{patientCaseData.description || 'N/A'}</div>
                                </div>
                            </div>

                            <div className="modal-section">
                                <h3 className="modal-section-title">Funding Information</h3>
                                <div className="modal-grid">
                                    <div className="modal-field">
                                        <span className="label">Target Amount</span>
                                        <span className="value">{money(patientCaseData.targetFunding || 0)}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Current Funding</span>
                                        <span className="value">{money(patientCaseData.currentFunding || 0)}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Funding Progress</span>
                                        <span className="value">{patientCaseData.fundingPercentage || 0}%</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Total Donations</span>
                                        <span className="value">{money(patientCaseData.totalDonations || 0)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-section">
                                <h3 className="modal-section-title">Donors Who Funded This Patient</h3>
                                {patientCaseData.donors && patientCaseData.donors.length > 0 ? (
                                    <div className="modal-list">
                                        {patientCaseData.donors.map((donor, index) => (
                                            <div key={index} className="modal-list-item">
                                                <div className="modal-list-item-left">
                                                    <IoPersonCircle style={{ fontSize: '26px', color: '#2349C2', flexShrink: 0 }} />
                                                    <div style={{ minWidth: 0 }}>
                                                        <div className="modal-list-item-title">{donor.name || 'Donor'}</div>
                                                        <p className="modal-list-item-sub">
                                                            Donated {money(donor.amount || 0)}{donor.date ? ` on ${donor.date}` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="muted">{formatPaymentMethod(donor.payment_method) || 'N/A'}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="modal-note">No donors have funded this patient case yet.</div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="error-message modal-error-container">No patient case data available</div>
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

