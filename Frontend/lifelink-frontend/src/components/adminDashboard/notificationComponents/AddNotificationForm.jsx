import { useState } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import api from "../../../api/axios";

export default function AddNotificationForm({ onClose }) {
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [errors, setErrors] = useState({});

    const [notificationData, setNotificationData] = useState({
        notification_type: "",
        priority: "",
        title: "",
        message: "",
        target_audience: "",
        blood_types: [],
        donor_type: "",
        delivery_channels: {
            push: false,
            email: false,
            sms: false
        },
        send_option: "send_now",
        schedule_date: "",
        schedule_time: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNotificationData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleCheckboxChange = (channel) => {
        setNotificationData((prev) => ({
            ...prev,
            delivery_channels: {
                ...prev.delivery_channels,
                [channel]: !prev.delivery_channels[channel]
            }
        }));
    };

    const handleBloodTypeToggle = (bloodType) => {
        setNotificationData((prev) => {
            const bloodTypes = prev.blood_types.includes(bloodType)
                ? prev.blood_types.filter(bt => bt !== bloodType)
                : [...prev.blood_types, bloodType];
            return { ...prev, blood_types: bloodTypes };
        });
    };

    const handleDonorTypeSelect = (type) => {
        setNotificationData((prev) => ({
            ...prev,
            donor_type: type
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.get("/sanctum/csrf-cookie");
            const response = await api.post(
                "/api/admin/dashboard/create-notification",
                notificationData
            );
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setNotificationData({
                    notification_type: "",
                    priority: "",
                    title: "",
                    message: "",
                    target_audience: "",
                    blood_types: [],
                    donor_type: "",
                    delivery_channels: {
                        push: false,
                        email: false,
                        sms: false
                    },
                    send_option: "send_now",
                    schedule_date: "",
                    schedule_time: ""
                });
                onClose();
            }, 2000);
        } catch (error) {
            console.error("❌ Error creating notification:", error);
            setErrors({ general: error.response?.data?.message || "Error creating notification" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="modal" onClick={onClose}>
            <div className="modal-container">
                {showSuccess && (
                    <div className="success-overlay">
                        <div className="success-check">
                            <svg viewBox="0 0 52 52">
                                <path className="checkmark__circle" d="M26 2c13.255 0 24 10.745 24 24S39.255 50 26 50 2 39.255 2 26 12.745 2 26 2z"/>
                                <path className="checkmark__check" d="M14 27l7 7 17-17"/>
                            </svg>
                            <div className="success-text">Notification created successfully</div>
                        </div>
                    </div>
                )}
                {!loading ? (
                    <>
                        <div className="modal-title">
                            <h2>Create Notification</h2>
                            <button onClick={onClose}><IoClose /></button>
                        </div>

                        <div className="modal-form">
                            <form onSubmit={handleSubmit}>
                                {/* Notification Type & Priority */}
                                <div className="form-group">
                                    <div>
                                        <label htmlFor="notification_type">Notification Type</label>
                                        <div className="select-des">
                                            <select
                                                id="notification_type"
                                                name="notification_type"
                                                value={notificationData.notification_type}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="" disabled>Select Type</option>
                                                <option value="alert">Alert</option>
                                                <option value="reminder">Reminder</option>
                                                <option value="announcement">Announcement</option>
                                                <option value="campaign">Campaign</option>
                                            </select>
                                        </div>
                                        {errors.notification_type && (<small className="error-text">{errors.notification_type}</small>)}
                                    </div>

                                    <div>
                                        <label htmlFor="priority">Priority</label>
                                        <div className="select-des">
                                            <select
                                                id="priority"
                                                name="priority"
                                                value={notificationData.priority}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="" disabled>Select priority</option>
                                                <option value="high">High</option>
                                                <option value="medium">Medium</option>
                                                <option value="low">Low</option>
                                            </select>
                                        </div>
                                        {errors.priority && (<small className="error-text">{errors.priority}</small>)}
                                    </div>
                                </div>

                                {/* Title */}
                                <div className="form-group">
                                    <div>
                                        <label htmlFor="title">Title</label>
                                        <input
                                            id="title"
                                            type="text"
                                            name="title"
                                            value={notificationData.title}
                                            placeholder="Enter notification title"
                                            onChange={handleChange}
                                            required
                                        />
                                        {errors.title && (<small className="error-text">{errors.title}</small>)}
                                    </div>
                                </div>

                                {/* Message */}
                                <div className="form-group">
                                    <div>
                                        <label htmlFor="message">Message</label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            value={notificationData.message}
                                            placeholder="Enter notification message..."
                                            onChange={handleChange}
                                            rows="4"
                                            required
                                        />
                                        {errors.message && (<small className="error-text">{errors.message}</small>)}
                                    </div>
                                </div>

                                {/* Target Audience */}
                                <div className="form-group">
                                    <div>
                                        <label htmlFor="target_audience">Target Audience</label>
                                        <div className="select-des">
                                            <select
                                                id="target_audience"
                                                name="target_audience"
                                                value={notificationData.target_audience}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="" disabled>Select audiences</option>
                                                <option value="all_donors">All Donors</option>
                                                <option value="all_hospitals">All Hospitals</option>
                                                <option value="scheduled_donors">Scheduled Donors</option>
                                                <option value="blood_type_specific">Blood Type Specific</option>
                                                <option value="phlebotomists">Phlebotomists</option>
                                            </select>
                                        </div>
                                        {errors.target_audience && (<small className="error-text">{errors.target_audience}</small>)}
                                    </div>
                                </div>

                                {/* Blood Type Selection (Conditional) */}
                                {notificationData.target_audience === "blood_type_specific" && (
                                    <div className="form-group">
                                        <div>
                                            <label>Select Blood Types</label>
                                            <div className="blood-type-selection">
                                                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bloodType) => (
                                                    <button
                                                        key={bloodType}
                                                        type="button"
                                                        className={`blood-type-btn ${notificationData.blood_types.includes(bloodType) ? 'selected' : ''}`}
                                                        onClick={() => handleBloodTypeToggle(bloodType)}
                                                    >
                                                        {bloodType}
                                                    </button>
                                                ))}
                                            </div>
                                            {notificationData.blood_types.length === 0 && (
                                                <small className="error-text">Please select at least one blood type</small>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Donor Type Selection (Conditional) */}
                                {notificationData.target_audience === "scheduled_donors" && (
                                    <div className="form-group">
                                        <div>
                                            <label>Select Donor Type</label>
                                            <div className="donor-type-selection">
                                                <button
                                                    type="button"
                                                    className={`donor-type-btn ${notificationData.donor_type === 'after_death' ? 'selected' : ''}`}
                                                    onClick={() => handleDonorTypeSelect('after_death')}
                                                >
                                                    After Death Organ Donation
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`donor-type-btn ${notificationData.donor_type === 'live_organ' ? 'selected' : ''}`}
                                                    onClick={() => handleDonorTypeSelect('live_organ')}
                                                >
                                                    Live Organ Donation
                                                </button>
                                            </div>
                                            {!notificationData.donor_type && (
                                                <small className="error-text">Please select a donor type</small>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Delivery Channels */}
                                <div className="form-group">
                                    <div>
                                        <label>Delivery Channels</label>
                                        <div className="delivery-channels">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={notificationData.delivery_channels.push}
                                                    onChange={() => handleCheckboxChange('push')}
                                                />
                                                <span>Push Notification</span>
                                            </label>
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={notificationData.delivery_channels.email}
                                                    onChange={() => handleCheckboxChange('email')}
                                                />
                                                <span>Email</span>
                                            </label>
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={notificationData.delivery_channels.sms}
                                                    onChange={() => handleCheckboxChange('sms')}
                                                />
                                                <span>SMS</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Send Option & Schedule Date Time */}
                                <div className="form-group">
                                    <div>
                                        <label htmlFor="send_option">Send Option</label>
                                        <div className="select-des">
                                            <select
                                                id="send_option"
                                                name="send_option"
                                                value={notificationData.send_option}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="send_now">Send Now</option>
                                                <option value="schedule">Schedule for Later</option>
                                            </select>
                                        </div>
                                        {errors.send_option && (<small className="error-text">{errors.send_option}</small>)}
                                    </div>

                                    {notificationData.send_option === "schedule" && (
                                        <div>
                                            <label htmlFor="schedule_date">Schedule Date & Time</label>
                                            <input
                                                id="schedule_date"
                                                type="datetime-local"
                                                name="schedule_date"
                                                value={notificationData.schedule_date}
                                                onChange={handleChange}
                                                placeholder="dd/mm/yyy --:--"
                                                required
                                            />
                                            {errors.schedule_date && (<small className="error-text">{errors.schedule_date}</small>)}
                                        </div>
                                    )}
                                </div>

                                {errors.general && <div className="error-message">{errors.general}</div>}

                                {/* Form Actions */}
                                <div className="form-actions">
                                    <button type="submit" className="submit-btn">
                                        Create Notification
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="loader">
                        <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />
                        <h3>Creating Notification...</h3>
                    </div>
                )}
            </div>
        </section>
    );
}
