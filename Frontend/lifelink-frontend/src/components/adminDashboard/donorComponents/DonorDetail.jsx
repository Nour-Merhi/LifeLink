import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
    IoPerson, 
    IoMailOutline, 
    IoCallOutline, 
    IoLocationOutline,
    IoTimeOutline,
    IoDocumentTextOutline,
    IoDocumentOutline,
    IoChatbubbleOutline,
    IoArrowBack
} from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import api from "../../../api/axios";

export default function DonorDetail() {
    const { donorCode } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("activity");
    const [donorData, setDonorData] = useState(null);

    useEffect(() => {
        fetchDonorDetails();
    }, [donorCode]);

    const fetchDonorDetails = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await api.get(
                `/api/admin/dashboard/donors/${donorCode}`
            );
            setDonorData(response.data);
        } catch (err) {
            console.error('Error fetching donor details:', err);
            setError(err.response?.data?.message || "Failed to fetch donor details");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        } catch {
            return dateString;
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'badge-success';
            case 'pending':
                return 'badge-pending';
            case 'canceled':
            case 'cancelled':
                return 'badge-danger';
            default:
                return 'badge-pending';
        }
    };

    if (loading) {
        return (
            <div className="loader">
                <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />
                <h3>Loading Donor Details...</h3>
            </div>
        );
    }

    if (error || !donorData) {
        return (
            <div className="error-container">
                <p>Error: {error || "Donor not found"}</p>
                <button onClick={() => navigate('/admin/donors')} className="btn-cancel">
                    Back to Donor List
                </button>
            </div>
        );
    }

    const { donor, contact, organ_pledges, appointments, medical_conditions } = donorData;

    return (
        <section className="donor-detail-section">
            {/* Back Button */}
            <div className="donor-detail-back">
                <button onClick={() => navigate('/admin/donors')} className="back-link">
                    <IoArrowBack />
                    <span>Back to Donor List</span>
                </button>
            </div>

            {/* Donor Profile Card */}
            <div className="donor-profile-card">
                <div className="donor-profile-header">
                    <div className="donor-profile-info">
                        <div className="donor-avatar">
                            <IoPerson />
                        </div>
                        <div className="donor-basic-info">
                            <h2 className="donor-name">{donor.name}</h2>
                            <div className="donor-stats">
                                <span>Age {donor.age}</span>
                                <span>Blood Type: {donor.blood_type}</span>
                                <span>Total Donations: {donor.total_donations}</span>
                                <span>Last Donation: {formatDate(donor.last_donation) || 'Never'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="donor-actions">
                        <button className="btn-message">Message</button>
                        <button className="btn-suspend">Suspend</button>
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            <div className="donor-info-cards">
                {/* Contact Information */}
                <div className="info-card">
                    <h3 className="info-card-title">Contact Information</h3>
                    <div className="info-card-content">
                        <div className="info-item">
                            <IoCallOutline className="info-icon" />
                            <span>{contact.phone}</span>
                        </div>
                        <div className="info-item">
                            <IoMailOutline className="info-icon" />
                            <span>{contact.email}</span>
                        </div>
                        <div className="info-item">
                            <IoLocationOutline className="info-icon" />
                            <span>{contact.address}</span>
                        </div>
                    </div>
                </div>

                {/* Organ Pledge Status */}
                <div className="info-card">
                    <h3 className="info-card-title">Organ Pledge Status</h3>
                    <div className="info-card-content">
                        <div className="info-item">
                            <span className="info-label">Living Donation:</span>
                            <span className={organ_pledges.living_donation === 'Yes' ? 'text-success' : 'text-danger'}>
                                {organ_pledges.living_donation}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">After Death:</span>
                            <span className={organ_pledges.after_death === 'Yes' ? 'text-success' : 'text-danger'}>
                                {organ_pledges.after_death}
                            </span>
                        </div>
                        {organ_pledges.pledged_organs && organ_pledges.pledged_organs.length > 0 && (
                            <div className="info-item">
                                <span className="info-label">Pledged Organs:</span>
                                <div className="organ-badges">
                                    {organ_pledges.pledged_organs.map((organ, idx) => (
                                        <span key={idx} className="badge badge-success">
                                            {organ}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Registration Details */}
                <div className="info-card">
                    <h3 className="info-card-title">Registration Details</h3>
                    <div className="info-card-content">
                        <div className="info-item">
                            <span className="info-label">Registration Date:</span>
                            <span>{donor.registration_date}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Verification Status:</span>
                            <span className="text-success">{donor.verification_status}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Account Status:</span>
                            <span className={`badge ${donor.account_status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                                {donor.account_status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="donor-detail-tabs">
                <button 
                    className={`tab-button ${activeTab === 'activity' ? 'active' : ''}`}
                    onClick={() => setActiveTab('activity')}
                >
                    <IoTimeOutline />
                    <span>Activity & Donations</span>
                </button>
                <button 
                    className={`tab-button ${activeTab === 'medical' ? 'active' : ''}`}
                    onClick={() => setActiveTab('medical')}
                >
                    <IoDocumentTextOutline />
                    <span>Medical Summary</span>
                </button>
                <button 
                    className={`tab-button ${activeTab === 'documents' ? 'active' : ''}`}
                    onClick={() => setActiveTab('documents')}
                >
                    <IoDocumentOutline />
                    <span>Documents</span>
                </button>
                <button 
                    className={`tab-button ${activeTab === 'communications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('communications')}
                >
                    <IoChatbubbleOutline />
                    <span>Communications</span>
                </button>
            </div>

            {/* Tab Content */}
            <div className="donor-tab-content">
                {activeTab === 'activity' && (
                    <div className="activity-list">
                        {appointments && appointments.length > 0 ? (
                            appointments.map((appt, idx) => (
                                <div key={idx} className="activity-item">
                                    <div className="activity-header">
                                        <div className="activity-date">{formatDate(appt.date)}</div>
                                        <span className={`badge ${getStatusBadgeClass(appt.status)}`}>
                                            {appt.status?.charAt(0).toUpperCase() + appt.status?.slice(1)}
                                        </span>
                                    </div>
                                    <div className="activity-details">
                                        <div className="activity-detail-item">
                                            <strong>Hospital:</strong> {appt.hospital}
                                        </div>
                                        <div className="activity-detail-item">
                                            <strong>Donation Type:</strong> {appt.type}
                                        </div>
                                        {appt.time && (
                                            <div className="activity-detail-item">
                                                <strong>Time:</strong> {appt.time}
                                            </div>
                                        )}
                                        <div className="activity-detail-item">
                                            <strong>Notes:</strong> {appt.notes}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-activity">
                                <p>No donation history available</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'medical' && (
                    <div className="medical-summary">
                        <h3>Medical Conditions</h3>
                        {medical_conditions && Object.keys(medical_conditions).length > 0 ? (
                            <div className="medical-conditions-list">
                                {Object.entries(medical_conditions)
                                    .filter(([key, value]) => value === true)
                                    .map(([condition, _], idx) => (
                                        <span key={idx} className="badge badge-orange">
                                            {condition.charAt(0).toUpperCase() + condition.slice(1).replace(/_/g, ' ')}
                                        </span>
                                    ))}
                            </div>
                        ) : (
                            <p className="muted">No medical conditions recorded</p>
                        )}
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="documents-section">
                        <p className="muted">No documents uploaded</p>
                    </div>
                )}

                {activeTab === 'communications' && (
                    <div className="communications-section">
                        <p className="muted">No communications recorded</p>
                    </div>
                )}
            </div>
        </section>
    );
}

