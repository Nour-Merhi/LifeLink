import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import axios from 'axios';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function EditPhlebotomistForm({ onClose, onPhlebotomistUpdated, phlebotomistCode, phlebotomistData }) {
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [phlebotomistInfo, setPhlebotomistInfo] = useState(null);
    const [originalData, setOriginalData] = useState(null);
    const [workingDates, setWorkingDates] = useState([]);
    const [editPhlebotomistData, setEditPhlebotomistData] = useState({
        first_name: "",
        middle_name: "",
        last_name: "",
        email: "",
        phone_nb: "",
        availability: "available",
        max_appointments: "",
        start_time: "",
        end_time: "",
        working_dates: [],
    });

    useEffect(() => {
        if (phlebotomistData) {
            // Extract data from nested structure (raw backend data has user and hospital relationships)
            const user = phlebotomistData.user || {};
            const initialData = {
                first_name: user.first_name || phlebotomistData.first_name || "",
                middle_name: user.middle_name || phlebotomistData.middle_name || "",
                last_name: user.last_name || phlebotomistData.last_name || "",
                email: user.email || phlebotomistData.email || "",
                phone_nb: user.phone_nb || phlebotomistData.phone_nb || "",
                availability: phlebotomistData.availability || "available",
                max_appointments: phlebotomistData.max_appointments || "",
                start_time: phlebotomistData.start_time || "",
                end_time: phlebotomistData.end_time || "",
                working_dates: phlebotomistData.working_dates || [],
            };
            setEditPhlebotomistData(initialData);
            setOriginalData({ ...initialData });
            setPhlebotomistInfo(phlebotomistData);
            setWorkingDates(phlebotomistData.working_dates || []);
            setFetchLoading(false);
        } else if (phlebotomistCode) {
            // Fetch phlebotomist data
            fetchPhlebotomistDetails();
        } else {
            setFetchLoading(false);
        }
    }, [phlebotomistCode, phlebotomistData]);

    const fetchPhlebotomistDetails = async () => {
        if (!phlebotomistCode) {
            setFetchLoading(false);
            return;
        }

        setFetchLoading(true);
        try {
            const response = await axios.get(
                `http://localhost:8000/api/admin/dashboard/phlebotomists/${phlebotomistCode}`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            const phleb = response.data.phlebotomist || response.data;
            setPhlebotomistInfo(phleb);
            
            const initialData = {
                first_name: phleb.first_name || "",
                middle_name: phleb.middle_name || "",
                last_name: phleb.last_name || "",
                email: phleb.email || "",
                phone_nb: phleb.phone_nb || "",
                availability: phleb.availability || "available",
                max_appointments: phleb.max_appointments || "",
                start_time: phleb.start_time || "",
                end_time: phleb.end_time || "",
                working_dates: phleb.working_dates || [],
            };
            
            setEditPhlebotomistData(initialData);
            setOriginalData({ ...initialData });
            setWorkingDates(phleb.working_dates || []);
        } catch (error) {
            console.error('Error fetching phlebotomist details:', error);
            setErrors({ general: error.response?.data?.message || "Failed to fetch phlebotomist details" });
        } finally {
            setFetchLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditPhlebotomistData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const toggleDay = (day) => {
        const newWorkingDates = workingDates.includes(day)
            ? workingDates.filter((d) => d !== day)
            : [...workingDates, day];
        setWorkingDates(newWorkingDates);
        setEditPhlebotomistData(prev => ({
            ...prev,
            working_dates: newWorkingDates
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!originalData) {
            setErrors({ general: 'Original phlebotomist data not loaded. Please close and try again.' });
            return;
        }

        // Compare with original data to only send changed fields
        const changedFields = {};
        Object.keys(editPhlebotomistData).forEach(key => {
            if (key === 'working_dates') {
                // Compare arrays
                const originalDates = originalData.working_dates || [];
                const newDates = editPhlebotomistData.working_dates || [];
                if (JSON.stringify(originalDates.sort()) !== JSON.stringify(newDates.sort())) {
                    changedFields[key] = newDates;
                }
            } else if (editPhlebotomistData[key] !== originalData[key]) {
                changedFields[key] = editPhlebotomistData[key];
            }
        });

        if (Object.keys(changedFields).length === 0) {
            setErrors({ general: 'No changes detected.' });
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            await axios.put(
                `http://localhost:8000/api/admin/dashboard/phlebotomists/${phlebotomistCode}`,
                changedFields,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (onPhlebotomistUpdated) {
                onPhlebotomistUpdated();
            }
            onClose();
        } catch (error) {
            console.error('Error updating phlebotomist:', error);
            if (error.response?.status === 422 && error.response?.data?.errors) {
                const validationErrors = {};
                Object.keys(error.response.data.errors).forEach(key => {
                    validationErrors[key] = error.response.data.errors[key][0];
                });
                setErrors(validationErrors);
            } else {
                setErrors({ 
                    general: error.response?.data?.message || error.message || "Failed to update phlebotomist" 
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
                        <h3>Loading Phlebotomist Details...</h3>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay modal-overlay-edit" onClick={onClose}>
            <div className="modal-container modal-container-edit" onClick={(e) => e.stopPropagation()}>
                <div className="modal-title">
                    <h2>Edit Phlebotomist</h2>
                    <button onClick={onClose} disabled={loading}>
                        <IoClose />
                    </button>
                </div>
                <div className="modal-form">
                    {phlebotomistInfo && (
                        <div className="edit-modal-description">
                            <p className="edit-modal-description-text">
                                <strong>Phlebotomist:</strong> {
                                    phlebotomistInfo.name || 
                                    (phlebotomistInfo.user ? `${phlebotomistInfo.user.first_name || ''} ${phlebotomistInfo.user.middle_name || ''} ${phlebotomistInfo.user.last_name || ''}`.trim() : 'N/A')
                                }<br />
                                <strong>Code:</strong> {phlebotomistInfo.code || phlebotomistCode}<br />
                                <strong>Hospital:</strong> {phlebotomistInfo.hospital_name || (phlebotomistInfo.hospital ? phlebotomistInfo.hospital.name : 'N/A')}
                            </p>
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <div>
                                <label htmlFor="first_name">First Name</label>
                                <input
                                    type="text"
                                    id="first_name"
                                    name="first_name"
                                    value={editPhlebotomistData.first_name}
                                    onChange={handleChange}
                                    placeholder="Enter first name"
                                />
                                {errors.first_name && (
                                    <small className="error-text">{errors.first_name}</small>
                                )}
                            </div>
                            <div>
                                <label htmlFor="middle_name">Middle Name</label>
                                <input
                                    type="text"
                                    id="middle_name"
                                    name="middle_name"
                                    value={editPhlebotomistData.middle_name || ""}
                                    onChange={handleChange}
                                    placeholder="Enter middle name (optional)"
                                />
                                {errors.middle_name && (
                                    <small className="error-text">{errors.middle_name}</small>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <div>
                                <label htmlFor="last_name">Last Name</label>
                                <input
                                    type="text"
                                    id="last_name"
                                    name="last_name"
                                    value={editPhlebotomistData.last_name}
                                    onChange={handleChange}
                                    placeholder="Enter last name"
                                />
                                {errors.last_name && (
                                    <small className="error-text">{errors.last_name}</small>
                                )}
                            </div>
                            <div>
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={editPhlebotomistData.email}
                                    onChange={handleChange}
                                    placeholder="Enter email"
                                />
                                {errors.email && (
                                    <small className="error-text">{errors.email}</small>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <div>
                                <label htmlFor="phone_nb">Phone Number</label>
                                <input
                                    type="tel"
                                    id="phone_nb"
                                    name="phone_nb"
                                    value={editPhlebotomistData.phone_nb}
                                    onChange={handleChange}
                                    placeholder="Enter phone number"
                                />
                                {errors.phone_nb && (
                                    <small className="error-text">{errors.phone_nb}</small>
                                )}
                            </div>
                            <div>
                                <label htmlFor="availability">Availability</label>
                                <div className="select-des">
                                    <select
                                        id="availability"
                                        name="availability"
                                        value={editPhlebotomistData.availability}
                                        onChange={handleChange}
                                    >
                                        <option value="available">Available</option>
                                        <option value="onDuty">On Duty</option>
                                        <option value="unavailable">Unavailable</option>
                                    </select>
                                </div>
                                {errors.availability && (
                                    <small className="error-text">{errors.availability}</small>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <div>
                                <label htmlFor="max_appointments">Max Appointments</label>
                                <input
                                    type="number"
                                    id="max_appointments"
                                    name="max_appointments"
                                    value={editPhlebotomistData.max_appointments}
                                    onChange={handleChange}
                                    placeholder="Enter max appointments"
                                    min="1"
                                />
                                {errors.max_appointments && (
                                    <small className="error-text">{errors.max_appointments}</small>
                                )}
                            </div>
                            <div>
                                <label htmlFor="start_time">Start Time</label>
                                <input
                                    type="time"
                                    id="start_time"
                                    name="start_time"
                                    value={editPhlebotomistData.start_time}
                                    onChange={handleChange}
                                />
                                {errors.start_time && (
                                    <small className="error-text">{errors.start_time}</small>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <div>
                                <label htmlFor="end_time">End Time</label>
                                <input
                                    type="time"
                                    id="end_time"
                                    name="end_time"
                                    value={editPhlebotomistData.end_time}
                                    onChange={handleChange}
                                />
                                {errors.end_time && (
                                    <small className="error-text">{errors.end_time}</small>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="full-width">
                                <label>Working Days</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px' }}>
                                    {DAYS_OF_WEEK.map((day) => (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => toggleDay(day)}
                                            className={`day-button ${workingDates.includes(day) ? 'selected' : ''}`}
                                            style={{
                                                padding: '8px 16px',
                                                border: `2px solid ${workingDates.includes(day) ? '#285BFF' : '#B3B3B3'}`,
                                                borderRadius: '5px',
                                                backgroundColor: workingDates.includes(day) ? '#EBEAFF' : 'white',
                                                color: workingDates.includes(day) ? '#285BFF' : '#333',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: workingDates.includes(day) ? '600' : '400',
                                            }}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                                {errors.working_dates && (
                                    <small className="error-text">{errors.working_dates}</small>
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
                                    'Update Phlebotomist'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

