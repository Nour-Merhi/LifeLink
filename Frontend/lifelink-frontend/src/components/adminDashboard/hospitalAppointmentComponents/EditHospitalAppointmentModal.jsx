import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import axios from 'axios';

export default function EditHospitalAppointmentModal({ onClose, onAppointmentUpdated, appointmentCode }) {
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [appointmentData, setAppointmentData] = useState(null);
    const [editData, setEditData] = useState({
        state: "pending",
        note: ""
    });

    useEffect(() => {
        fetchAppointmentDetails();
    }, [appointmentCode]);

    const fetchAppointmentDetails = async () => {
        if (!appointmentCode) {
            setFetchLoading(false);
            return;
        }

        setFetchLoading(true);
        try {
            const response = await axios.get(
                `http://localhost:8000/api/admin/dashboard/hospital-appointments/${appointmentCode}`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            const apt = response.data.hospitalAppointment || response.data;
            setAppointmentData(apt);
            setEditData({
                state: apt.status === 'cancelled' ? 'canceled' : (apt.status || "pending"),
                note: apt.note || ""
            });
        } catch (error) {
            console.error('Error fetching hospital appointment details:', error);
            setErrors({ general: error.response?.data?.message || "Failed to fetch appointment details" });
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            await axios.put(
                `http://localhost:8000/api/admin/dashboard/hospital-appointments/${appointmentCode}`,
                editData,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (onAppointmentUpdated) {
                onAppointmentUpdated();
            }
            onClose();
        } catch (error) {
            console.error('Error updating hospital appointment:', error);
            if (error.response?.status === 422 && error.response?.data?.errors) {
                const validationErrors = {};
                Object.keys(error.response.data.errors).forEach(key => {
                    validationErrors[key] = error.response.data.errors[key][0];
                });
                setErrors(validationErrors);
            } else {
                setErrors({ 
                    general: error.response?.data?.message || error.message || "Failed to update appointment" 
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
                        <h3>Loading Appointment Details...</h3>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay modal-overlay-edit" onClick={onClose}>
            <div className="modal-container modal-container-edit" onClick={(e) => e.stopPropagation()}>
                <div className="modal-title">
                    <h2>Edit Hospital Appointment</h2>
                    <button onClick={onClose} disabled={loading}>
                        <IoClose />
                    </button>
                </div>
                <div className="modal-form">
                    {appointmentData && (
                        <div className="edit-modal-description">
                            <p className="edit-modal-description-text">
                                <strong>Donor:</strong> {appointmentData.name}<br />
                                <strong>Hospital:</strong> {appointmentData.hospital_name}<br />
                                <strong>Date:</strong> {appointmentData.date}<br />
                                <strong>Time:</strong> {appointmentData.time}
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
                        </div>

                        <div className="form-group">
                            <div>
                                <label htmlFor="note">Note</label>
                                <textarea
                                    id="note"
                                    name="note"
                                    value={editData.note}
                                    onChange={handleChange}
                                    rows="4"
                                    placeholder="Add any notes about this appointment..."
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
                                    'Update Appointment'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

