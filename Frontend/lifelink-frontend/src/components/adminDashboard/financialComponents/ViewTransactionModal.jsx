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

    return (
        <div className="modal-overlay modal-overlay-edit" onClick={onClose}>
            <div className="modal-container modal-container-edit" onClick={(e) => e.stopPropagation()}>
                <div className="modal-title">
                    <h2>Transaction Details</h2>
                    <button onClick={onClose}>
                        <IoClose />
                    </button>
                </div>
                <div className="modal-form">
                    {loading ? (
                        <div className="loader">
                            <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />
                            <h3>Loading Transaction Details...</h3>
                        </div>
                    ) : error ? (
                        <div className="error-message modal-error-container">
                            {error}
                        </div>
                    ) : transactionData ? (
                        <div className="edit-modal-description">
                            <div className="info-text" style={{ marginBottom: '20px' }}>
                                <h3 style={{ marginBottom: '15px', color: '#2349C2' }}>Transaction Information</h3>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                    <div>
                                        <strong>Transaction ID:</strong>
                                        <p>{transactionData.code || transactionData.id}</p>
                                    </div>
                                    <div>
                                        <strong>Status:</strong>
                                        <p>
                                            <span className={`badge ${
                                                transactionData.status === "completed" ? "badge-success" : 
                                                transactionData.status === "pending" ? "badge-pending" : 
                                                "badge-danger"
                                            }`}>
                                                {transactionData.status?.charAt(0).toUpperCase() + transactionData.status?.slice(1) || "Pending"}
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <strong>Amount:</strong>
                                        <p>${parseFloat(transactionData.donation_amount || transactionData.amount || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <strong>Payment Method:</strong>
                                        <p>{formatPaymentMethod(transactionData.payment_method)}</p>
                                    </div>
                                    <div>
                                        <strong>Donation Type:</strong>
                                        <p>{transactionData.donation_type === 'one time' ? 'One Time' : 'Monthly'}</p>
                                    </div>
                                    <div>
                                        <strong>Date:</strong>
                                        <p>{transactionData.created_at ? new Date(transactionData.created_at).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                </div>

                                <h4 style={{ marginTop: '20px', marginBottom: '10px', color: '#2349C2' }}>Donor Information</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                    <div>
                                        <strong>Name:</strong>
                                        <p>{transactionData.name || (transactionData.donor?.user ? `${transactionData.donor.user.first_name || ''} ${transactionData.donor.user.last_name || ''}`.trim() : 'Anonymous')}</p>
                                    </div>
                                    <div>
                                        <strong>Email:</strong>
                                        <p>{transactionData.email || transactionData.donor?.user?.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <strong>Phone:</strong>
                                        <p>{transactionData.phone || transactionData.donor?.user?.phone_nb || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <strong>Address:</strong>
                                        <p>{transactionData.address || 'N/A'}</p>
                                    </div>
                                </div>

                                <h4 style={{ marginTop: '20px', marginBottom: '10px', color: '#2349C2' }}>Beneficiary Information</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                    <div>
                                        <strong>Recipient:</strong>
                                        <p>{transactionData.patientCase ? transactionData.patientCase.full_name : 'General Patient Fund'}</p>
                                    </div>
                                    {transactionData.patientCase && (
                                        <>
                                            <div>
                                                <strong>Hospital:</strong>
                                                <p>{transactionData.patientCase.hospital?.name || transactionData.patientCase.hospital_name || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <strong>Case Title:</strong>
                                                <p>{transactionData.patientCase.case_title || 'N/A'}</p>
                                            </div>
                                        </>
                                    )}
                                    <div>
                                        <strong>Preference:</strong>
                                        <p>{transactionData.preference === 'anonymous' ? 'Anonymous' : transactionData.preference === 'stay_updated' ? 'Stay Updated' : 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

