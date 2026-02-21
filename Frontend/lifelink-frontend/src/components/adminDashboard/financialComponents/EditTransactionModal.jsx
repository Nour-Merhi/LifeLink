import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import api from "../../../api/axios";

export default function EditTransactionModal({ onClose, onTransactionUpdated, transactionId }) {
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [transactionData, setTransactionData] = useState(null);
    const [editData, setEditData] = useState({
        status: "pending",
        donation_amount: 0,
        payment_method: "",
        name: "",
        email: "",
        phone: ""
    });

    useEffect(() => {
        fetchTransactionDetails();
    }, [transactionId]);

    const fetchTransactionDetails = async () => {
        if (!transactionId) {
            setFetchLoading(false);
            return;
        }

        setFetchLoading(true);
        try {
            const response = await api.get(`/api/admin/dashboard/financial/transactions/${transactionId}`);
            const transaction = response.data.donation || response.data;
            setTransactionData(transaction);
            setEditData({
                status: transaction.status || "pending",
                donation_amount: parseFloat(transaction.donation_amount || transaction.amount || 0),
                payment_method: transaction.payment_method || "",
                name: transaction.name || "",
                email: transaction.email || "",
                phone: transaction.phone || ""
            });
        } catch (error) {
            console.error('Error fetching transaction details:', error);
            setErrors({ general: error.response?.data?.message || "Failed to fetch transaction details" });
        } finally {
            setFetchLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditData(prev => ({
            ...prev,
            [name]: name === 'donation_amount' ? parseFloat(value) || 0 : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            await api.get("/sanctum/csrf-cookie");
            await api.put(`/api/admin/dashboard/financial/transactions/${transactionId}`, editData);

            if (onTransactionUpdated) {
                onTransactionUpdated();
            }
            onClose();
        } catch (error) {
            console.error('Error updating transaction:', error);
            if (error.response?.status === 422 && error.response?.data?.errors) {
                const validationErrors = {};
                Object.keys(error.response.data.errors).forEach(key => {
                    validationErrors[key] = error.response.data.errors[key][0];
                });
                setErrors(validationErrors);
            } else {
                setErrors({ 
                    general: error.response?.data?.message || error.message || "Failed to update transaction" 
                });
            }
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading) {
        return (
            <div className="modal-overlay modal-overlay-edit" onClick={onClose}>
                <div className="modal-container modal-container-edit" onClick={(e) => e.stopPropagation()}>
                    <div className="loader">
                        <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />
                        <h3>Loading Transaction Details...</h3>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay modal-overlay-edit" onClick={onClose}>
            <div className="modal-container modal-container-edit" onClick={(e) => e.stopPropagation()}>
                <div className="modal-title">
                    <h2>Edit Transaction</h2>
                    <button onClick={onClose} disabled={loading}>
                        <IoClose />
                    </button>
                </div>
                <div className="modal-form">
                    {transactionData && (
                        <div className="edit-modal-description">
                            <p className="edit-modal-description-text">
                                <strong>Transaction ID:</strong> {transactionData.code || transactionData.id}<br />
                                <strong>Donor:</strong> {transactionData.name || 'Anonymous'}<br />
                                <strong>Amount:</strong> ${parseFloat(transactionData.donation_amount || transactionData.amount || 0).toLocaleString()}
                            </p>
                        </div>
                    )}
                    {errors.general && (
                        <div style={{ padding: "10px", marginBottom: "20px", backgroundColor: "#fee", color: "#c33", borderRadius: "5px" }}>
                            {errors.general}
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <div>
                                <label htmlFor="status">Status</label>
                                <div className="select-des">
                                    <select
                                        id="status"
                                        name="status"
                                        value={editData.status}
                                        onChange={handleChange}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="completed">Completed</option>
                                        <option value="failed">Failed</option>
                                    </select>
                                </div>
                                {errors.status && (
                                    <small className="error-text">{errors.status}</small>
                                )}
                            </div>
                            <div>
                                <label htmlFor="donation_amount">Amount ($)</label>
                                <input
                                    id="donation_amount"
                                    type="number"
                                    name="donation_amount"
                                    value={editData.donation_amount}
                                    onChange={handleChange}
                                    min="0.01"
                                    step="0.01"
                                />
                                {errors.donation_amount && (
                                    <small className="error-text">{errors.donation_amount}</small>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <div>
                                <label htmlFor="payment_method">Payment Method</label>
                                <div className="select-des">
                                    <select
                                        id="payment_method"
                                        name="payment_method"
                                        value={editData.payment_method}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Payment Method</option>
                                        <option value="credit card">Credit Card</option>
                                        <option value="wish">Wish Money</option>
                                        <option value="cash">Cash</option>
                                    </select>
                                </div>
                                {errors.payment_method && (
                                    <small className="error-text">{errors.payment_method}</small>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <div>
                                <label htmlFor="name">Donor Name (Optional)</label>
                                <input
                                    id="name"
                                    type="text"
                                    name="name"
                                    value={editData.name}
                                    onChange={handleChange}
                                />
                                {errors.name && (
                                    <small className="error-text">{errors.name}</small>
                                )}
                            </div>
                            <div>
                                <label htmlFor="email">Email (Optional)</label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={editData.email}
                                    onChange={handleChange}
                                />
                                {errors.email && (
                                    <small className="error-text">{errors.email}</small>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <div>
                                <label htmlFor="phone">Phone (Optional)</label>
                                <input
                                    id="phone"
                                    type="text"
                                    name="phone"
                                    value={editData.phone}
                                    onChange={handleChange}
                                />
                                {errors.phone && (
                                    <small className="error-text">{errors.phone}</small>
                                )}
                            </div>
                        </div>

                        <div className="form-submit-btn">
                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? (
                                    <>
                                        <SpinnerDotted size={20} thickness={100} speed={100} color="#ffffff" />
                                        <span style={{ marginLeft: '8px' }}>Updating...</span>
                                    </>
                                ) : (
                                    "Update Transaction"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

