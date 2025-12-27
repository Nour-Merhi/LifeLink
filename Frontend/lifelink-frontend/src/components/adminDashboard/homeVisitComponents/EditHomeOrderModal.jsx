import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import axios from 'axios';

export default function EditHomeOrderModal({ onClose, onOrderUpdated, orderCode }) {
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [orderData, setOrderData] = useState(null);
    const [editData, setEditData] = useState({
        state: "pending",
        note: "",
        address: "",
        'weight(kg)': "",
        emerg_contact: "",
        emerg_phone: "",
        medical_conditions: {}
    });

    useEffect(() => {
        fetchOrderDetails();
    }, [orderCode]);

    const fetchOrderDetails = async () => {
        if (!orderCode) {
            setFetchLoading(false);
            return;
        }

        setFetchLoading(true);
        try {
            const response = await axios.get(
                `http://localhost:8000/api/admin/dashboard/home-visit-orders/${orderCode}`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            const order = response.data.order || response.data;
            setOrderData(order);
            setEditData({
                state: order.state === 'cancelled' ? 'canceled' : (order.state || "pending"),
                note: order.note || "",
                address: order.address || "",
                'weight(kg)': order.weight || "",
                emerg_contact: order.emerg_contact || "",
                emerg_phone: order.emerg_phone || "",
                medical_conditions: order.medical_conditions || {}
            });
        } catch (error) {
            console.error('Error fetching home order details:', error);
            setErrors({ general: error.response?.data?.message || "Failed to fetch order details" });
        } finally {
            setFetchLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleMedicalConditionChange = (condition, value) => {
        setEditData(prev => ({
            ...prev,
            medical_conditions: {
                ...prev.medical_conditions,
                [condition]: value
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            // Prepare data - only include fields that have values
            const updateData = {};
            if (editData.state) updateData.state = editData.state;
            if (editData.note !== undefined) updateData.note = editData.note;
            if (editData.address) updateData.address = editData.address;
            if (editData['weight(kg)']) updateData['weight(kg)'] = editData['weight(kg)'];
            if (editData.emerg_contact !== undefined) updateData.emerg_contact = editData.emerg_contact || null;
            if (editData.emerg_phone !== undefined) updateData.emerg_phone = editData.emerg_phone || null;
            if (Object.keys(editData.medical_conditions || {}).length > 0) {
                updateData.medical_conditions = editData.medical_conditions;
            }

            await axios.put(
                `http://localhost:8000/api/admin/dashboard/home-visit-orders/${orderCode}`,
                updateData,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (onOrderUpdated) {
                onOrderUpdated();
            }
            onClose();
        } catch (error) {
            console.error('Error updating home order:', error);
            if (error.response?.status === 422 && error.response?.data?.errors) {
                const validationErrors = {};
                Object.keys(error.response.data.errors).forEach(key => {
                    validationErrors[key] = error.response.data.errors[key][0];
                });
                setErrors(validationErrors);
            } else {
                setErrors({ 
                    general: error.response?.data?.message || error.message || "Failed to update order" 
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
                        <h3>Loading Order Details...</h3>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay modal-overlay-edit" onClick={onClose}>
            <div className="modal-container modal-container-edit" onClick={(e) => e.stopPropagation()}>
                <div className="modal-title">
                    <h2>Edit Home Visit Order</h2>
                    <button onClick={onClose} disabled={loading}>
                        <IoClose />
                    </button>
                </div>
                <div className="modal-form">
                    {orderData && (
                        <div className="edit-modal-description">
                            <p className="edit-modal-description-text">
                                <strong>Donor:</strong> {orderData.name}<br />
                                <strong>Hospital:</strong> {orderData.hospital_name}<br />
                                <strong>Date:</strong> {orderData.date}<br />
                                <strong>Time:</strong> {orderData.time}
                            </p>
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <div>
                                <label htmlFor="state">Status</label>
                                <div className="select-des">
                                    <select
                                        id="state"
                                        name="state"
                                        value={editData.state}
                                        onChange={handleChange}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="completed">Completed</option>
                                        <option value="canceled">Canceled</option>
                                    </select>
                                </div>
                                {errors.state && (
                                    <small className="error-text">{errors.state}</small>
                                )}
                            </div>
                            <div>
                                <label htmlFor="weight(kg)">Weight (kg)</label>
                                <input
                                    type="text"
                                    id="weight(kg)"
                                    name="weight(kg)"
                                    value={editData['weight(kg)']}
                                    onChange={handleChange}
                                    placeholder="Enter weight in kg"
                                />
                                {errors['weight(kg)'] && (
                                    <small className="error-text">{errors['weight(kg)']}</small>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="full-width">
                                <label htmlFor="address">Address</label>
                                <textarea
                                    id="address"
                                    name="address"
                                    value={editData.address}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Enter home address"
                                />
                                {errors.address && (
                                    <small className="error-text">{errors.address}</small>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <div>
                                <label htmlFor="emerg_contact">Emergency Contact Name</label>
                                <input
                                    type="text"
                                    id="emerg_contact"
                                    name="emerg_contact"
                                    value={editData.emerg_contact}
                                    onChange={handleChange}
                                    placeholder="Enter emergency contact name"
                                />
                                {errors.emerg_contact && (
                                    <small className="error-text">{errors.emerg_contact}</small>
                                )}
                            </div>
                            <div>
                                <label htmlFor="emerg_phone">Emergency Contact Phone</label>
                                <input
                                    type="tel"
                                    id="emerg_phone"
                                    name="emerg_phone"
                                    value={editData.emerg_phone}
                                    onChange={handleChange}
                                    placeholder="Enter emergency contact phone"
                                />
                                {errors.emerg_phone && (
                                    <small className="error-text">{errors.emerg_phone}</small>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="full-width">
                                <label htmlFor="note">Note</label>
                                <textarea
                                    id="note"
                                    name="note"
                                    value={editData.note}
                                    onChange={handleChange}
                                    rows="4"
                                    placeholder="Add any notes about this order..."
                                />
                                {errors.note && (
                                    <small className="error-text">{errors.note}</small>
                                )}
                            </div>
                        </div>

                        {errors.general && (
                            <div className="error-message modal-error-container">
                                {errors.general}
                            </div>
                        )}

                        <div className="form-actions form-actions-modal">
                            <button 
                                type="button" 
                                onClick={onClose}
                                disabled={loading}
                                className="btn-cancel"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="submit-btn"
                            >
                                {loading ? (
                                    <>
                                        <SpinnerDotted size={20} thickness={100} speed={100} color="#fff" className="spinner-inline" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Order'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

