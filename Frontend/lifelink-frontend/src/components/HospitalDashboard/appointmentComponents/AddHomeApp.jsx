import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import api from "../../../api/axios";

export default function AddHomeApp({ onClose, hospitals = [], onAppointmentAdded, hospitalId, defaultAppointmentType = "regular" }) {
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [errors, setErrors] = useState({});

    // Get today's date in local timezone (YYYY-MM-DD format)
    const getTodayDate = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [appointmentData, setAppointmentData] = useState({
        hospital_id: hospitalId,
        appointment_type: defaultAppointmentType,
        appointment_date: "",
        start_time: "",
        end_time: "",
        gap_hours: "",
        due_date: defaultAppointmentType === "urgent" ? getTodayDate() : "",
        due_time: "",
        blood_type: ""
    });

    // Get current time in HH:mm format
    const getCurrentTime = () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    // Get tomorrow's date in local timezone (YYYY-MM-DD format)
    const getTomorrowDate = () => {
        const now = new Date();
        now.setDate(now.getDate() + 1);
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Get maximum time allowed (24 hours from now)
    const getMaxTime = () => {
        const now = new Date();
        const maxTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Add 24 hours
        const hours = String(maxTime.getHours()).padStart(2, '0');
        const minutes = String(maxTime.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };


    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // If switching appointment type, clear relevant fields
        if (name === 'appointment_type') {
            if (value === 'urgent') {
                const today = getTodayDate();
                setAppointmentData((prev) => ({
                    ...prev,
                    appointment_type: value,
                    appointment_date: today,
                    due_date: today, // Always today for urgent
                    due_time: '',
                    start_time: '',
                    end_time: '',
                }));
            } else {
                // Switching to regular: clear due date/time and blood type fields
                setAppointmentData((prev) => ({
                    ...prev,
                    [name]: value,
                    due_date: '',
                    due_time: '',
                    blood_type: '',
                }));
            }
        } else {
            setAppointmentData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const isDueWithin24Hours = (dueDate, dueTime) => {
        if (!dueDate || !dueTime) return false;
    
        const now = new Date();
    
        // Build due date in LOCAL time (no UTC parsing)
        const [year, month, day] = dueDate.split('-').map(Number);
        const [hours, minutes] = dueTime.split(':').map(Number);
    
        const due = new Date(
            year,
            month - 1,
            day,
            hours,
            minutes,
            0,
            0
        );
    
        const diffMs = due.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
    
        return diffHours > 0 && diffHours <= 24.01; // small grace
    };
    
    

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try{
            // Prepare data for submission
            const submitData = { ...appointmentData };
            
            // For urgent appointments, set appointment_date to today
            if (submitData.appointment_type === "urgent") {
                submitData.appointment_date = getTodayDate();
            }
            if (appointmentData.appointment_type === "urgent") {
                if (!isDueWithin24Hours(appointmentData.due_date, appointmentData.due_time)) {
                    setErrors({
                        ...errors,
                        due_time: "Due date/time must be within 24 hours from now"
                    });
                    setLoading(false);
                    return;
                }
            }            

            await api.get("/sanctum/csrf-cookie");
            const response = await api.post(
                `/api/hospital/dashboard/generate-appointments/${hospitalId}`,
                submitData
            );
            
            setShowSuccess(true);
            
            // Trigger refresh of appointments list after a short delay to ensure backend has processed
            setTimeout(() => {
                if (onAppointmentAdded) {
                    onAppointmentAdded();
                }
                setShowSuccess(false);
                setAppointmentData({
                    hospital_id: hospitalId,
                    appointment_type: "regular",
                    appointment_date: "",
                    start_time: "",
                    end_time: "",
                    gap_hours: "",
                    due_date: "",
                    due_time: "",
                    blood_type: ""
                });
                onClose();
            }, 1500);
        }catch (error){
            console.error("❌ Error generating appointments:", error);
            
            // Handle validation errors
            if (error.response?.status === 422 && error.response?.data?.errors) {
                const validationErrors = {};
                Object.keys(error.response.data.errors).forEach(key => {
                    validationErrors[key] = error.response.data.errors[key][0];
                });
                setErrors(validationErrors);
            } else {
                setErrors({ 
                    general: error.response?.data?.message || error.message || "Error generating appointments" 
                });
            }
        }finally{
            setLoading(false);
        }
    };

    return (
        <section className="modal">
            <div className="modal-container">
            {showSuccess && (
                <div className="success-overlay">
                    <div className="success-check">
                        <svg viewBox="0 0 52 52">
                            <path className="checkmark__circle" d="M26 2c13.255 0 24 10.745 24 24S39.255 50 26 50 2 39.255 2 26 12.745 2 26 2z"/>
                            <path className="checkmark__check" d="M14 27l7 7 17-17"/>
                        </svg>
                        <div className="success-text">Appointment/s added successfully</div>
                    </div>
                </div>
            )}
            {!loading ? ( <>
                    <div className="modal-title">
                        <h2>{defaultAppointmentType === "urgent" ? "Add New Urgent Request" : "Add New Home Appointments"}</h2>
                        <button onClick={onClose}><IoClose /></button>
                    </div>

                    <div className="modal-form">
                        <form onSubmit={handleSubmit}>
                        
                            {/* Appointment Type */}
                            <div className="form-group">
                                <div>
                                    <label htmlFor="appointment_type">Appointment Type</label>
                                    <div className="select-des">
                                        <select
                                            id="appointment_type"
                                            name="appointment_type"
                                            value={appointmentData.appointment_type}
                                            onChange={handleChange}
                                            required
                                            disabled={defaultAppointmentType === "urgent"}
                                            style={defaultAppointmentType === "urgent" ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
                                        >
                                            <option value="regular">Regular</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>
                                    {errors.appointment_type && (<small className="error-text">{errors.appointment_type}</small>)}
                                </div>
                            </div>

                            {/* Appointment Date - Only show for regular appointments */}
                            {appointmentData.appointment_type === "regular" && (
                                <div className="form-group">
                                    <div>
                                        <label htmlFor="appointment_date">Appointment Date</label>
                                        <input 
                                            id="appointment_date"
                                            type="date"
                                            name="appointment_date"
                                            value={appointmentData.appointment_date}
                                            onChange={handleChange}
                                            required
                                            min={getTodayDate()}
                                        />
                                        {errors.appointment_date && (<small className="error-text">{errors.appointment_date}</small>)}
                                    </div>
                                </div>
                            )}

                            {/* Urgent Appointment Fields - Only show for urgent appointments */}
                            {appointmentData.appointment_type === "urgent" && (
                                <>
                                    <div className="form-group">
                                        <div>
                                            <label htmlFor="due_date">Due Date (Today Only - Within 24 hours)</label>
                                            <input 
                                                id="due_date"
                                                type="date"
                                                name="due_date"
                                                value={appointmentData.due_date}
                                                onChange={handleChange}
                                                required
                                                min={getTodayDate()}
                                                max={getTodayDate()}
                                                readOnly
                                                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                            />
                                            {errors.due_date && (<small className="error-text">{errors.due_date}</small>)}
                                            <small className="info-text" style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                                Urgent appointments can only be scheduled for today within 24 hours
                                            </small>
                                        </div>
                                        <div>
                                            <label htmlFor="due_time">Due Time</label>
                                            <input 
                                                id="due_time"
                                                type="time"
                                                name="due_time"
                                                value={appointmentData.due_time}
                                                onChange={handleChange}
                                                required
                                                step="60"
                                                min={appointmentData.due_date === getTodayDate() ? getCurrentTime() : undefined}
                                            />

                                            {errors.due_time && (<small className="error-text">{errors.due_time}</small>)}
                                            <small className="info-text" style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                                {appointmentData.due_date === getTodayDate() 
                                                    ? `Current time: ${getCurrentTime()} - Must be within 24 hours`
                                                    : `Must be within 24 hours from release time `}
                                            </small>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <div>
                                            <label htmlFor="gap_hours">Gap Between Appointments (hours)</label>
                                            <input className="input-des"
                                                id="gap_hours"
                                                type="number"
                                                step="0.5"
                                                name="gap_hours"
                                                value={appointmentData.gap_hours}
                                                placeholder="e.g., 1.5"
                                                onChange={handleChange}
                                                min="0"
                                                max="4"
                                                required
                                            />
                                            <small className="info-text" style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                                Time slots will be generated from now ({getCurrentTime()}) until the due time
                                            </small>
                                            {errors.gap_hours && (<small className="error-text">{errors.gap_hours}</small>)}
                                        </div>
                                        <div>
                                            <label htmlFor="blood_type">Blood Type Needed</label>
                                            <div className="select-des">
                                                <select
                                                    id="blood_type"
                                                    name="blood_type"
                                                    value={appointmentData.blood_type}
                                                    onChange={handleChange}
                                                    required
                                                >
                                                    <option value="" disabled>Select Blood Type</option>
                                                    <option value="A+">A+</option>
                                                    <option value="A-">A-</option>
                                                    <option value="B+">B+</option>
                                                    <option value="B-">B-</option>
                                                    <option value="AB+">AB+</option>
                                                    <option value="AB-">AB-</option>
                                                    <option value="O+">O+</option>
                                                    <option value="O-">O-</option>
                                                </select>
                                            </div>
                                            {errors.blood_type && (<small className="error-text">{errors.blood_type}</small>)}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Time Range and Gap - Only show for regular appointments */}
                            {appointmentData.appointment_type === "regular" && (
                                <>
                                    <div className="form-group">
                                        <div>
                                            <label htmlFor="start_time">Start Time</label>
                                            <input
                                                id="start_time"
                                                type="time"
                                                name="start_time"
                                                value={appointmentData.start_time}
                                                onChange={handleChange}
                                                required
                                            />
                                            {errors.start_time && (<small className="error-text">{errors.start_time}</small>)}
                                        </div>
                                        <div>
                                            <label htmlFor="end_time">End Time</label>
                                            <input
                                                id="end_time"
                                                type="time"
                                                name="end_time"
                                                value={appointmentData.end_time}
                                                onChange={handleChange}
                                                required
                                            />
                                            {errors.end_time && (<small className="error-text">{errors.end_time}</small>)}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <div>
                                            <label htmlFor="gap_hours">Gap Between Each Appointment (hours)</label>
                                            <input className="input-des"
                                                id="gap_hours"
                                                type="number"
                                                step="0.5"
                                                name="gap_hours"
                                                value={appointmentData.gap_hours}
                                                placeholder="e.g., 1.5"
                                                onChange={handleChange}
                                                min="0.5"
                                                max="4"
                                                required
                                            />
                                            {errors.gap_hours && (<small className="error-text">{errors.gap_hours}</small>)}
                                        </div>
                                    </div>
                                </>
                            )}

                            {errors.general && <div className="error-message">{errors.general}</div>}

                            {/* Form Actions */}
                            <div className="form-actions">
                                <button type="submit" className="submit-btn">
                                    Generate Appointments
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            ): (
                <div className="loader">
                  <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />                
                  <h3>Generating Appointments...</h3>
                </div>
            )
            }
        </div>
    </section>
    );
}
