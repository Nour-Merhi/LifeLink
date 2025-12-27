import { useState } from "react";
import { FaHospital, FaCheck, FaTimes } from "react-icons/fa";
import { FiEye } from "react-icons/fi";
import { SpinnerDotted } from 'spinners-react';

export default function HospitalRequestsPanel({ requests = [], loading = false, onApprove, onReject, onViewDetails }) {
    // Filter to show only pending requests
    const pendingRequests = requests.filter(req => req.status === 'pending' || !req.status);

    const getUrgencyBadge = (urgency) => {
        const urgencyMap = {
            'urgent': { label: 'Urgent', className: 'badge-danger' },
            'high': { label: 'High', className: 'badge-orange' },
            'normal': { label: 'Normal', className: 'badge-pending' },
            'low': { label: 'Low', className: 'badge-success' }
        };
        const urgencyInfo = urgencyMap[urgency?.toLowerCase()] || urgencyMap['normal'];
        return (
            <span className={`badge ${urgencyInfo.className}`}>
                {urgencyInfo.label}
            </span>
        );
    };

    const getDonationTypeBadge = (type) => {
        const typeMap = {
            'blood': { label: 'Blood', className: 'badge-danger' },
            'organ': { label: 'Organ', className: 'badge-pending' },
            'platelet': { label: 'Platelet', className: 'badge-blue' }
        };
        const typeInfo = typeMap[type?.toLowerCase()] || { label: type || 'N/A', className: 'badge-pending' };
        return (
            <span className={`badge ${typeInfo.className}`}>
                {typeInfo.label}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        } catch {
            return dateString;
        }
    };

    if (loading) {
        return (
            <div className="loader">
                <SpinnerDotted size={50} thickness={125} speed={100} color="#f01010ff" />
                <h4>Loading requests...</h4>
            </div>
        );
    }

    return (
        <div className="control-panel">
            <h3 className="control-panel-title">Hospital Donation Requests</h3>
            <div className="requests-list">
                {pendingRequests.length > 0 ? (
                    pendingRequests.slice(0, 10).map((request, index) => (
                        <div key={request.id || index} className="request-item">
                            <div className="request-header">
                                <div className="request-hospital-info">
                                    <FaHospital className="request-icon" />
                                    <div>
                                        <h4 className="request-hospital-name">{request.hospital_name || 'Unknown Hospital'}</h4>
                                        <small className="muted">Request ID: {request.id || `REQ-${index + 1}`}</small>
                                    </div>
                                </div>
                                <div className="request-badges">
                                    {getDonationTypeBadge(request.donation_type)}
                                    {getUrgencyBadge(request.urgency || request.appointment_type || 'normal')}
                                </div>
                            </div>
                            
                            <div className="request-details">
                                <div className="request-detail-item">
                                    <span className="request-label">Donation Type:</span>
                                    <span>{request.donation_type || 'Hospital Blood Donation'}</span>
                                </div>
                                <div className="request-detail-item">
                                    <span className="request-label">Appointment Date:</span>
                                    <span>{formatDate(request.date || request.requested_date || request.appointment_date)}</span>
                                </div>
                                <div className="request-detail-item">
                                    <span className="request-label">Hospital:</span>
                                    <span>{request.hospital_name || 'N/A'}</span>
                                </div>
                                {request.blood_type && (
                                    <div className="request-detail-item">
                                        <span className="request-label">Blood Type:</span>
                                        <span>{request.blood_type}</span>
                                    </div>
                                )}
                            </div>

                            <div className="request-actions">
                                <button 
                                    className="btn-action btn-view"
                                    onClick={() => onViewDetails && onViewDetails(request)}
                                    title="View Details"
                                >
                                    <FiEye />
                                    View Details
                                </button>
                                <button 
                                    className="btn-action btn-approve"
                                    onClick={() => onApprove && onApprove(request)}
                                    title="Approve Request"
                                >
                                    <FaCheck />
                                    Approve
                                </button>
                                <button 
                                    className="btn-action btn-reject"
                                    onClick={() => onReject && onReject(request)}
                                    title="Reject Request"
                                >
                                    <FaTimes />
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-requests">
                        <p>No pending donation requests</p>
                        <small className="muted">All requests have been processed</small>
                    </div>
                )}
            </div>
        </div>
    );
}

