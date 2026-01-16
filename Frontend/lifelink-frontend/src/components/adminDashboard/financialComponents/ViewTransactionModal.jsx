import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import api from "../../../api/axios";

export default function ViewTransactionModal({ onClose, transactionId }) {
    const [loading, setLoading] = useState(true);
    const [transactionData, setTransactionData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchTransactionDetails();
    }, [transactionId]);

    const fetchTransactionDetails = async () => {
        if (!transactionId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");
        try {
            const response = await api.get(`/api/financial-donations/${transactionId}`);
            setTransactionData(response.data.donation || response.data);
        } catch (error) {
            console.error('Error fetching transaction details:', error);
            setError(error.response?.data?.message || "Failed to fetch transaction details");
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
        if (!s) return 'Pending';
        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    const statusBadgeClass = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'completed') return 'badge-success';
        if (s === 'pending') return 'badge-pending';
        return 'badge-danger';
    };

    const money = (v) => {
        const n = Number(v);
        if (Number.isNaN(n)) return '$0';
        return `$${n.toLocaleString()}`;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container modal-modern" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                <div className="modal-modern-header">
                    <div className="modal-modern-title">
                        <h2>Transaction</h2>
                        <div className="modal-modern-subtitle">
                            <span>Transaction: {transactionId || transactionData?.code || transactionData?.id || 'N/A'}</span>
                            {transactionData?.status && (
                                <span className={`badge ${statusBadgeClass(transactionData.status)}`}>
                                    {statusLabel(transactionData.status)}
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
                            <h3>Loading Transaction Details...</h3>
                        </div>
                    ) : error ? (
                        <div className="error-message modal-error-container">{error}</div>
                    ) : transactionData ? (
                        <>
                            <div className="modal-section">
                                <h3 className="modal-section-title">
                                    Transaction Information
                                    <span className="muted">{transactionData.created_at ? new Date(transactionData.created_at).toLocaleDateString() : 'N/A'}</span>
                                </h3>
                                <div className="modal-grid">
                                    <div className="modal-field">
                                        <span className="label">Transaction ID</span>
                                        <span className="value">{transactionData.code || transactionData.id || 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Status</span>
                                        <span className="value">
                                            <span className={`badge ${statusBadgeClass(transactionData.status)}`}>
                                                {statusLabel(transactionData.status)}
                                            </span>
                                        </span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Amount</span>
                                        <span className="value">{money(transactionData.donation_amount || transactionData.amount || 0)}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Payment Method</span>
                                        <span className="value">{formatPaymentMethod(transactionData.payment_method) || 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Donation Type</span>
                                        <span className="value">{transactionData.donation_type === 'one time' ? 'One Time' : (transactionData.donation_type ? 'Monthly' : 'N/A')}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Preference</span>
                                        <span className="value">{transactionData.preference === 'anonymous' ? 'Anonymous' : transactionData.preference === 'stay_updated' ? 'Stay Updated' : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-section">
                                <h3 className="modal-section-title">Donor</h3>
                                <div className="modal-grid">
                                    <div className="modal-field">
                                        <span className="label">Name</span>
                                        <span className="value">
                                            {transactionData.name ||
                                                (transactionData.donor?.user
                                                    ? `${transactionData.donor.user.first_name || ''} ${transactionData.donor.user.last_name || ''}`.trim()
                                                    : 'Anonymous')}
                                        </span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Email</span>
                                        <span className="value">{transactionData.email || transactionData.donor?.user?.email || 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Phone</span>
                                        <span className="value">{transactionData.phone || transactionData.donor?.user?.phone_nb || 'N/A'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Address</span>
                                        <span className="value">{transactionData.address || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-section">
                                <h3 className="modal-section-title">Beneficiary</h3>
                                <div className="modal-grid">
                                    <div className="modal-field">
                                        <span className="label">Recipient</span>
                                        <span className="value">{transactionData.patientCase ? transactionData.patientCase.full_name : 'General Patient Fund'}</span>
                                    </div>
                                    {transactionData.patientCase && (
                                        <>
                                            <div className="modal-field">
                                                <span className="label">Hospital</span>
                                                <span className="value">{transactionData.patientCase.hospital?.name || transactionData.patientCase.hospital_name || 'N/A'}</span>
                                            </div>
                                            <div className="modal-field">
                                                <span className="label">Case Title</span>
                                                <span className="value">{transactionData.patientCase.case_title || 'N/A'}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="error-message modal-error-container">No transaction data available</div>
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

