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
                        <h2>Home Visit Order</h2>
                        <div className="modal-modern-subtitle">
                            <span>Order: {orderCode || orderData?.id || 'N/A'}</span>
                            {orderData?.status && (
                                <span className={`badge ${statusBadgeClass(orderData.status)}`}>
                                    {statusLabel(orderData.status)}
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
                            <h3>Loading Order Details...</h3>
                        </div>
                    ) : error ? (
                        <div className="error-message modal-error-container">{error}</div>
                    ) : orderData ? (
                        <>
                            <div className="modal-section">
                                <h3 className="modal-section-title">
                                    Order Overview
                                    <span className="muted">{formatDate(orderData.created_at)}</span>
                                </h3>
                                <div className="modal-grid">
                                    <div className="modal-field">
                                        <span className="label">Order ID</span>
                                        <span className="value">{orderData.id || 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Status</span>
                                        <span className="value">
                                            <span className={`badge ${statusBadgeClass(orderData.status)}`}>
                                                {statusLabel(orderData.status)}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-section">
                                <h3 className="modal-section-title">Donor</h3>
                                <div className="modal-grid">
                                    <div className="modal-field">
                                        <span className="label">Full Name</span>
                                        <span className="value">{orderData.name || 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Gender</span>
                                        <span className="value">{orderData.gender || 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Date of Birth</span>
                                        <span className="value">{formatDate(orderData.date_of_birth)}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Age</span>
                                        <span className="value">{orderData.age ? `${orderData.age} years` : 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Email</span>
                                        <span className="value">{orderData.email || 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Phone</span>
                                        <span className="value">{orderData.phone ? `+961 ${orderData.phone}` : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-section">
                                <h3 className="modal-section-title">Medical</h3>
                                <div className="modal-grid">
                                    <div className="modal-field">
                                        <span className="label">Blood Type</span>
                                        <span className="value">{orderData.blood_type || 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Weight</span>
                                        <span className="value">{orderData.weight ? `${orderData.weight} kg` : 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Last Donation</span>
                                        <span className="value">{orderData.last_donation ? formatDate(orderData.last_donation) : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-section">
                                <h3 className="modal-section-title">Appointment</h3>
                                <div className="modal-grid">
                                    <div className="modal-field">
                                        <span className="label">Hospital</span>
                                        <span className="value">{orderData.hospital_name || 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Date</span>
                                        <span className="value">{formatDate(orderData.date)}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Time</span>
                                        <span className="value">{orderData.time || 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Phlebotomist</span>
                                        <span className="value">{orderData.phlebotomist || 'Unassigned'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-section">
                                <h3 className="modal-section-title">Address & Emergency</h3>
                                <div className="modal-grid">
                                    <div className="modal-field" style={{ gridColumn: '1 / -1' }}>
                                        <span className="label">Home Address</span>
                                        <span className="value">{orderData.address || 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Emergency Contact</span>
                                        <span className="value">{orderData.emerg_contact || 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Emergency Phone</span>
                                        <span className="value">{orderData.emerg_phone ? `+961 ${orderData.emerg_phone}` : 'N/A'}</span>
                                    </div>
                                </div>

                                {orderData.note && (
                                    <div className="modal-note">
                                        {orderData.note}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="error-message modal-error-container">No order data available</div>
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

