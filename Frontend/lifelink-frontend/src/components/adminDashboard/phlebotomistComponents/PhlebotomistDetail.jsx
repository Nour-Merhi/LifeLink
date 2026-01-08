import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
    IoPerson, 
    IoMailOutline, 
    IoCallOutline, 
    IoLocationOutline,
    IoTimeOutline,
    IoDocumentTextOutline,
    IoArrowBack,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoHourglassOutline
} from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import api from "../../../api/axios";

export default function PhlebotomistDetail() {
    const { phlebotomistCode } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("work-history");
    const [phlebotomistData, setPhlebotomistData] = useState(null);

    useEffect(() => {
        fetchPhlebotomistDetails();
    }, [phlebotomistCode]);

    const fetchPhlebotomistDetails = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await api.get(
                `/api/admin/dashboard/phlebotomists/${phlebotomistCode}`
            );
            setPhlebotomistData(response.data.phlebotomist || response.data);
        } catch (err) {
            console.error('Error fetching phlebotomist details:', err);
            setError(err.response?.data?.message || "Failed to fetch phlebotomist details");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString || dateString === 'N/A') return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
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

    const getStatusLabel = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'Completed';
            case 'pending':
                return 'Pending';
            case 'canceled':
            case 'cancelled':
                return 'Cancelled';
            default:
                return status || 'Pending';
        }
    };

    const getAvailabilityBadgeClass = (availability) => {
        switch (availability?.toLowerCase()) {
            case 'available':
                return 'badge-success';
            case 'onduty':
                return 'badge-pending';
            case 'unavailable':
                return 'badge-danger';
            default:
                return 'badge-pending';
        }
    };

    if (loading) {
        return (
            <div className="loader">
                <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />
                <h3>Loading Phlebotomist Details...</h3>
            </div>
        );
    }

    if (error || !phlebotomistData) {
        return (
            <div className="error-container">
                <p>Error: {error || "Phlebotomist not found"}</p>
                <button onClick={() => navigate('/admin/phlebotomists')} className="btn-cancel">
                    Back to Phlebotomist List
                </button>
            </div>
        );
    }

    const { statistics, work_history } = phlebotomistData;

    return (
        <section className="donor-detail-section">
            {/* Back Button */}
            <div className="donor-detail-back">
                <button onClick={() => navigate('/admin/phlebotomists')} className="back-link">
                    <IoArrowBack />
                    <span>Back to Phlebotomist List</span>
                </button>
            </div>

            {/* Profile Card */}
            <div className="donor-profile-card">
                <div className="donor-profile-header">
                    <div className="donor-avatar" style={{ backgroundColor: '#EBEAFF' }}>
                        <IoPerson style={{ fontSize: '40px', color: '#285BFF' }} />
                    </div>
                    <div className="donor-basic-info">
                        <h2 className="donor-name">{phlebotomistData.name}</h2>
                        <div className="donor-stats">
                            <span className="badge badge-success">{phlebotomistData.code}</span>
                            <span className={`badge ${getAvailabilityBadgeClass(phlebotomistData.availability)}`}>
                                {phlebotomistData.availability === 'onDuty' ? 'On Duty' : 
                                 phlebotomistData.availability?.charAt(0).toUpperCase() + phlebotomistData.availability?.slice(1) || 'Available'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="donor-profile-info">
                    <div className="detail-info-item">
                        <IoMailOutline className="info-icon" />
                        <span className="info-value">{phlebotomistData.email}</span>
                    </div>
                    <div className="detail-info-item">
                        <IoCallOutline className="info-icon" />
                        <span className="info-value">+961 {phlebotomistData.phone_nb}</span>
                    </div>
                    <div className="detail-info-item">
                        <IoLocationOutline className="info-icon" />
                        <span className="info-value">{phlebotomistData.hospital_name}</span>
                    </div>
                    <div className="detail-info-item">
                        <IoDocumentTextOutline className="info-icon" />
                        <span className="info-value">{phlebotomistData.license_number}</span>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="metrics-grid-4" style={{ marginTop: '20px', marginBottom: '20px' }}>
                <div className="metric-card margin-bottom-10">
                    <div className="metric-content">
                        <div className="metric-info">
                            <p className="metric-title">Total Appointments</p>
                            <h3 className="metric-value">{statistics?.total_appointments || 0}</h3>
                        </div>
                        <div className="metric-icon" style={{ backgroundColor: '#EBEAFF', color: '#285BFF' }}>
                            <IoDocumentTextOutline style={{ fontSize: '24px' }} />
                        </div>
                    </div>
                </div>
                <div className="metric-card margin-bottom-10">
                    <div className="metric-content">
                        <div className="metric-info">
                            <p className="metric-title">Completed</p>
                            <h3 className="metric-value">{statistics?.completed_appointments || 0}</h3>
                        </div>
                        <div className="metric-icon" style={{ backgroundColor: '#EAFFE5', color: '#16a34a' }}>
                            <IoCheckmarkCircleOutline style={{ fontSize: '24px' }} />
                        </div>
                    </div>
                </div>
                <div className="metric-card margin-bottom-10">
                    <div className="metric-content">
                        <div className="metric-info">
                            <p className="metric-title">Pending</p>
                            <h3 className="metric-value">{statistics?.pending_appointments || 0}</h3>
                        </div>
                        <div className="metric-icon" style={{ backgroundColor: '#FFF4E5', color: '#F59E0B' }}>
                            <IoHourglassOutline style={{ fontSize: '24px' }} />
                        </div>
                    </div>
                </div>
                <div className="metric-card margin-bottom-10">
                    <div className="metric-content">
                        <div className="metric-info">
                            <p className="metric-title">Success Rate</p>
                            <h3 className="metric-value">{statistics?.success_rate || 0}%</h3>
                        </div>
                        <div className="metric-icon" style={{ backgroundColor: '#F5E9FF', color: '#6132BE' }}>
                            <IoCheckmarkCircleOutline style={{ fontSize: '24px' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="info-card">
                    <h3 className="info-card-title">Working Information</h3>
                    <div className="info-card-content">
                        <div className="info-item">
                            <IoTimeOutline className="info-icon" />
                            <div>
                                <span className="info-label">Working Hours</span>
                                <span className="info-value">{phlebotomistData.start_time} - {phlebotomistData.end_time}</span>
                            </div>
                        </div>
                        <div className="info-item">
                            <IoDocumentTextOutline className="info-icon" />
                            <div>
                                <span className="info-label">Max Appointments</span>
                                <span className="info-value">{phlebotomistData.max_appointments}</span>
                            </div>
                        </div>
                        {phlebotomistData.working_dates && phlebotomistData.working_dates.length > 0 && (
                            <div className="info-item">
                                <IoTimeOutline className="info-icon" />
                                <div>
                                    <span className="info-label">Working Days</span>
                                    <span className="info-value">{phlebotomistData.working_dates.join(', ')}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="info-card">
                    <h3 className="info-card-title">Hospital Information</h3>
                    <div className="info-card-content">
                        <div className="info-item">
                            <IoLocationOutline className="info-icon" />
                            <div>
                                <span className="info-label">Hospital Name</span>
                                <span className="info-value">{phlebotomistData.hospital_name}</span>
                            </div>
                        </div>
                        <div className="info-item">
                            <IoLocationOutline className="info-icon" />
                            <div>
                                <span className="info-label">Address</span>
                                <span className="info-value">{phlebotomistData.hospital_address}</span>
                            </div>
                        </div>
                        <div className="info-item">
                            <IoCallOutline className="info-icon" />
                            <div>
                                <span className="info-label">Phone</span>
                                <span className="info-value">{phlebotomistData.hospital_phone}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="donor-detail-tabs">
                <button
                    className={`tab-button ${activeTab === 'work-history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('work-history')}
                >
                    Work History
                </button>
            </div>

            {/* Work History Tab */}
            {activeTab === 'work-history' && (
                <div className="info-card">
                    <h3 className="info-card-title">Appointment History</h3>
                    <div className="info-card-content">
                        {work_history && work_history.length > 0 ? (
                            <div className="activity-list">
                                {work_history.map((appointment, index) => (
                                    <div key={index} className="activity-item">
                                        <div className="activity-header">
                                            <div>
                                                <strong>{appointment.donor_name}</strong>
                                                <span className="badge" style={{ marginLeft: '10px' }}>
                                                    {appointment.blood_type}
                                                </span>
                                            </div>
                                            <span className={`badge ${getStatusBadgeClass(appointment.state)}`}>
                                                {getStatusLabel(appointment.state)}
                                            </span>
                                        </div>
                                        <div className="activity-details">
                                            <div className="activity-detail-item">
                                                <strong>Hospital:</strong> {appointment.hospital_name}
                                            </div>
                                            <div className="activity-detail-item">
                                                <strong>Date:</strong> {formatDate(appointment.date)}
                                            </div>
                                            <div className="activity-detail-item">
                                                <strong>Time:</strong> {appointment.time}
                                            </div>
                                            <div className="activity-detail-item">
                                                <strong>Address:</strong> {appointment.address}
                                            </div>
                                            <div className="activity-date">
                                                Created: {formatDate(appointment.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-activity">
                                <p>No appointment history available</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

