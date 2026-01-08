import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import api from "../../../api/axios";

export default function EditAppointmentModal({ onClose, onAppointmentUpdated, appointmentIds, hospitalId, date, hospitals = [] }) {
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [appointmentData, setAppointmentData] = useState(null);
    const [editData, setEditData] = useState({
        appointment_date: "",
        appointment_time: "",
        max_capacity: "",
        state: "pending"
    });

    useEffect(() => {
        fetchAppointmentDetails();
    }, [appointmentIds]);

    const fetchAppointmentDetails = async () => {
        if (!appointmentIds || appointmentIds.length === 0) {
            setFetchLoading(false);
            return;
        }

        setFetchLoading(true);
        try {
            // Fetch first appointment to get details (all appointments for same date should have similar structure)
            // In a real scenario, you might want to fetch all and merge or allow editing each separately
            // Note: appointmentIds contains appointment IDs (integers), not codes
            const response = await api.get(
                `/api/admin/dashboard/appointments/${appointmentIds[0]}`
            );
            
            const apt = response.data.appointment || response.data;
            setAppointmentData(apt);
            setEditData({
                appointment_date: apt.appointment_date || date || "",
                appointment_time: apt.appointment_time || "",
                max_capacity: apt.max_capacity || "",
                state: apt.state || "pending"
            });
        } catch (error) {
            console.error('Error fetching appointment details:', error);
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
            // Get CSRF cookie first
            await api.get("/sanctum/csrf-cookie");
            
            // Update all appointments for this date
            const updatePromises = appointmentIds.map(appointmentId =>
                api.put(
                    `/api/admin/dashboard/appointments/${appointmentId}`,
                    editData
                )
            );

            await Promise.all(updatePromises);

            if (onAppointmentUpdated) {
                onAppointmentUpdated();
            }
            onClose();
        } catch (error) {
            console.error('Error updating appointments:', error);
            if (error.response?.status === 422 && error.response?.data?.errors) {
                const validationErrors = {};
                Object.keys(error.response.data.errors).forEach(key => {
                    validationErrors[key] = error.response.data.errors[key][0];
                });
                setErrors(validationErrors);
            } else {
                setErrors({ 
                    general: error.response?.data?.message || error.message || "Failed to update appointments" 
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
                    <h2>Edit Appointment</h2>
                    <button onClick={onClose} disabled={loading}>
                        <IoClose />
                    </button>
                </div>
                <div className="modal-form">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <div>
                                <label htmlFor="appointment_date">Appointment Date</label>
                                <input
                                    id="appointment_date"
                                    type="date"
                                    name="appointment_date"
                                    value={editData.appointment_date}
                                    onChange={handleChange}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                                {errors.appointment_date && (
                                    <small className="error-text">{errors.appointment_date}</small>
                                )}
                            </div>
                            <div>
                                <label htmlFor="appointment_time">Appointment Time</label>
                                <input
                                    id="appointment_time"
                                    type="time"
                                    name="appointment_time"
                                    value={editData.appointment_time}
                                    onChange={handleChange}
                                />
                                {errors.appointment_time && (
                                    <small className="error-text">{errors.appointment_time}</small>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <div>
                                <label htmlFor="max_capacity">Max Capacity</label>
                                <input
                                    id="max_capacity"
                                    type="number"
                                    name="max_capacity"
                                    value={editData.max_capacity}
                                    onChange={handleChange}
                                    min="1"
                                />
                                {errors.max_capacity && (
                                    <small className="error-text">{errors.max_capacity}</small>
                                )}
                            </div>
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

