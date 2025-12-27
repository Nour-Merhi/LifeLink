import { useState } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';

import axios from "axios"

export default function AddHomeApp({ onClose, hospitals = [], onAppointmentAdded }) {
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [errors, setErrors] = useState({});

    const [appointmentData, setAppointmentData] = useState({
        hospital_id: "",
        appointment_type: "regular",
        appointment_date: "",
        start_time: "",
        end_time: "",
        gap_hours: "",
        due_date: "",
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

    // Get today's date in local timezone (YYYY-MM-DD format)
    const getTodayDate = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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
                    due_date: today,
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

            const response = await axios.post(
                "http://localhost:8000/api/admin/dashboard/generate-appointments",
                submitData,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                }
            );
            
            // Trigger refresh of appointments list immediately
            if (onAppointmentAdded) {
                onAppointmentAdded();
            }
            
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setAppointmentData({
                    hospital_id: "",
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
            }, 2000);
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
                        <h2>Add New Home Appointments</h2>
                        <button onClick={onClose}><IoClose /></button>
                    </div>

                    <div className="modal-form">
                        <form onSubmit={handleSubmit}>
                            {/* Hospital Selection */}
                            <div className="form-group">
                                <div>
                                    <label htmlFor="hospital_id">Hospital Name</label>
                                    <div className="select-des">
                                        <select
                                            id="hospital_id"
                                            name="hospital_id"
                                            value={appointmentData.hospital_id}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="" disabled>Select hospital</option>
                                            {hospitals && hospitals.length > 0 ? (
                                                hospitals.map(hospital => (
                                                    <option key={hospital.id} value={hospital.id}>
                                                        {hospital.name} - {hospital.address || 'No address'}
                                                    </option>
                                                ))
                                            ) : (
                                                <option value="" disabled>No hospitals available</option>
                                            )}
                                        </select>
                                    </div>
                                    {errors.hospital_id && (<small className="error-text">{errors.hospital_id}</small>)}
                                </div>
                            </div>

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
                                            <label htmlFor="due_date">Due Date (Within 24 hours)</label>
                                            <input 
                                                id="due_date"
                                                type="date"
                                                name="due_date"
                                                value={appointmentData.due_date}
                                                onChange={handleChange}
                                                required
                                        min={getTodayDate()}
                                        max={getTomorrowDate()}
                                            />
                                            {errors.due_date && (<small className="error-text">{errors.due_date}</small>)}
                                            <small className="info-text" style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                                Urgent appointments must be within 24 hours from release time
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
