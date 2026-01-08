import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import api from "../../../api/axios";

export default function ViewHomeOrderModal({ onClose, orderCode }) {
    const [loading, setLoading] = useState(true);
    const [orderData, setOrderData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchOrderDetails();
    }, [orderCode]);

    const fetchOrderDetails = async () => {
        if (!orderCode) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");
        try {
            const response = await api.get(
                `/api/admin/dashboard/home-visit-orders/${orderCode}`
            );
            
            setOrderData(response.data.order || response.data);
        } catch (error) {
            console.error('Error fetching home order details:', error);
            setError(error.response?.data?.message || "Failed to fetch order details");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString || dateString === 'N/A') return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="modal-overlay modal-overlay-edit" onClick={onClose}>
            <div className="modal-container modal-container-edit" onClick={(e) => e.stopPropagation()}>
                <div className="modal-title">
                    <h2>Home Visit Order Details</h2>
                    <button onClick={onClose}>
                        <IoClose />
                    </button>
                </div>
                <div className="modal-form view-modal-form">
                    {loading ? (
                        <div className="loader">
                            <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />
                            <h3>Loading Order Details...</h3>
                        </div>
                    ) : error ? (
                        <div className="error-message modal-error-container">
                            {error}
                        </div>
                    ) : orderData ? (
                        <div className="edit-modal-description">
                            <div className="info-text">
                                <h3 className="info-section-title" style={{ marginTop: 0 }}>Order Information</h3>
                                
                                <div className="form-group">
                                    <div>
                                        <label>Order ID</label>
                                        <p>{orderData.id || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label>Status</label>
                                        <p>
                                            <span className={`badge ${
                                                orderData.status === "completed" ? "badge-success" : 
                                                (orderData.status === "pending" || orderData.status === "Pending") ? "badge-pending" : 
                                                "badge-danger"
                                            }`}>
                                                {orderData.status === "canceled" || orderData.status === "cancelled" ? "Cancelled" : (orderData.status?.charAt(0).toUpperCase() + orderData.status?.slice(1)) || "Pending"}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <div>
                                        <label>Created At</label>
                                        <p>{formatDate(orderData.created_at)}</p>
                                    </div>
                                </div>

                                <h3 className="info-section-title">Personal Information</h3>
                                <div className="form-group">
                                    <div>
                                        <label>Full Name</label>
                                        <p>{orderData.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label>Gender</label>
                                        <p>{orderData.gender || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <div>
                                        <label>Date of Birth</label>
                                        <p>{formatDate(orderData.date_of_birth)}</p>
                                    </div>
                                    <div>
                                        <label>Age</label>
                                        <p>{orderData.age ? `${orderData.age} years` : 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <div>
                                        <label>Email</label>
                                        <p>{orderData.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label>Phone Number</label>
                                        <p>+961 {orderData.phone || 'N/A'}</p>
                                    </div>
                                </div>

                                <h3 className="info-section-title">Medical Information</h3>
                                <div className="form-group">
                                    <div>
                                        <label>Blood Type</label>
                                        <p>{orderData.blood_type || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label>Weight</label>
                                        <p>{orderData.weight ? `${orderData.weight} kg` : 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <div>
                                        <label>Last Donation Date</label>
                                        <p>{orderData.last_donation ? formatDate(orderData.last_donation) : 'N/A'}</p>
                                    </div>
                                </div>

                                {orderData.medical_conditions && Array.isArray(orderData.medical_conditions) && orderData.medical_conditions.length > 0 && (
                                    <div className="form-group">
                                        <div className="full-width">
                                            <label>Medical Conditions</label>
                                            <div style={{ marginTop: '8px' }}>
                                                {Object.entries(orderData.medical_conditions).map(([key, value]) => (
                                                    <span key={key} className="badge" style={{ marginRight: '8px', marginBottom: '8px', display: 'inline-block' }}>
                                                        {key}: {String(value)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <h3 className="info-section-title">Appointment Details</h3>
                                <div className="form-group">
                                    <div>
                                        <label>Hospital</label>
                                        <p>{orderData.hospital_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label>Appointment Date</label>
                                        <p>{formatDate(orderData.date)}</p>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <div>
                                        <label>Appointment Time</label>
                                        <p>{orderData.time || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label>Assigned Phlebotomist</label>
                                        <p>{orderData.phlebotomist || 'Unassigned'}</p>
                                    </div>
                                </div>

                                <h3 className="info-section-title">Address & Emergency Contact</h3>
                                <div className="form-group">
                                    <div className="full-width">
                                        <label>Home Address</label>
                                        <p>{orderData.address || 'N/A'}</p>
                                    </div>
                                </div>

                                {orderData.emerg_contact && (
                                    <div className="form-group">
                                        <div>
                                            <label>Emergency Contact Name</label>
                                            <p>{orderData.emerg_contact}</p>
                                        </div>
                                        <div>
                                            <label>Emergency Contact Phone</label>
                                            <p>+961 {orderData.emerg_phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                )}

                                {orderData.note && (
                                    <div className="form-group">
                                        <div className="full-width">
                                            <label>Note</label>
                                            <p style={{ marginTop: '5px', padding: '10px', background: '#f5f5f5', borderRadius: '5px', whiteSpace: 'pre-wrap' }}>
                                                {orderData.note}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="error-message modal-error-container">
                            No order data available
                        </div>
                    )}

                    <div className="form-actions form-actions-modal">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="submit-btn"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

