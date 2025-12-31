import { useState } from "react";
import { IoPerson } from "react-icons/io5";
import { LuPhoneCall } from "react-icons/lu";
import { GrMapLocation } from "react-icons/gr";
import { FaRegClock, FaReply } from "react-icons/fa";
import { MdOutlineEmail } from "react-icons/md";
import { RiAlarmWarningLine } from "react-icons/ri";
import { FaPlus } from "react-icons/fa";
import { FaUserMd } from "react-icons/fa";


import "../../styles/Dashboard.css";

export default function ManagerContact(){
    const [activeTab, setActiveTab] = useState("Contact Info");

    // Sample messages data
    const messages = [
        {
            id: 1,
            senderName: "Dr. Amanda Richardson",
            date: "2024-01-14 10:30 AM",
            subject: "Weekly Schedule Update",
            body: "Hi Alex, please review the updated schedule for next week. We have increased demand for O- collections.",
        },
        {
            id: 2,
            senderName: "Dr. Amanda Richardson",
            date: "2024-01-14 10:30 AM",
            subject: "Weekly Schedule Update",
            body: "Hi Alex, please review the updated schedule for next week. We have increased demand for O- collections.",
        },
        {
            id: 3,
            senderName: "Dr. Amanda Richardson",
            date: "2024-01-14 10:30 AM",
            subject: "Weekly Schedule Update",
            body: "Hi Alex, please review the updated schedule for next week. We have increased demand for O- collections.",
        },
    ];

    return (
        <div className="nurse-section">
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <FaUserMd className="icon-size" />
                        <h2>Manager Contact</h2>
                    </div>
                    <p className="subtitle-text">
                        Connect with your blood services manager
                    </p>
                </div>
            </div>

            <div className="financial-tabs new-message-tabs-container">
                <div className="tabs-group">
                    <button
                        className={activeTab === "Contact Info" ? "tab-active-nurse" : "tab-inactive"}
                        onClick={() => setActiveTab("Contact Info")}
                    >
                        Contact Info
                    </button>
                    <button
                        className={activeTab === "Messages" ? "tab-active-nurse" : "tab-inactive"}
                        onClick={() => setActiveTab("Messages")}
                    >
                        Messages
                    </button>
                    <button
                        className={activeTab === "Schedule" ? "tab-active-nurse" : "tab-inactive"}
                        onClick={() => setActiveTab("Schedule")}
                    >
                        Schedule
                    </button>
                </div>
                <button className="new-message-btn">
                    <FaPlus />
                    New Message
                </button>
            </div>

            {activeTab === "Contact Info" && (
                <div className="donor-container manager-contact-card">
                    {/* Manager Profile Section */}
                    <div className="manager-profile-section">
                        <div className="manager-profile-icon">
                            <IoPerson />
                        </div>
                        <div className="manager-profile-info">
                            <h3>Dr. Amanda Richardson</h3>
                            <p className="manager-title">Blood Services Manager</p>
                            <p className="manager-department">Transfusion Medicine</p>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="contact-info-list">
                        <div className="contact-info-item">
                            <LuPhoneCall />
                            <div>
                                <p className="contact-label">Phone</p>
                                <p className="contact-value">+961 1456456</p>
                            </div>
                        </div>

                        <div className="contact-info-item">
                            <MdOutlineEmail />
                            <div>
                                <p className="contact-label">Email</p>
                                <p className="contact-value">a.richardson@centralmedical.org</p>
                            </div>
                        </div>

                        <div className="contact-info-item">
                            <GrMapLocation />
                            <div>
                                <p className="contact-label">Office Location</p>
                                <p className="contact-value">Building A, Room 205</p>
                            </div>
                        </div>

                        <div className="contact-info-item">
                            <FaRegClock />
                            <div>
                                <p className="contact-label">Availability</p>
                                <p className="contact-value">Monday - Friday, 8:00 AM - 6:00 PM</p>
                            </div>
                        </div>
                    </div>

                    {/* Emergency Contact Section */}
                    <div className="emergency-contact-section">
                        <RiAlarmWarningLine />
                        <div>
                            <p className="emergency-title">Emergency Contact</p>
                            <p className="emergency-phone">(555) 911-HELP</p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "Messages" && (
                <div className="message-card-container">
                    {messages.map((message) => (
                        <div key={message.id} className="donor-container message-card">
                            {/* Left Section - Sender Info and Message */}
                            <div className="message-card-left">
                                <div className="flex flex-row align-items-center gap-5">
                                    <div className="message-card-icon">
                                        <IoPerson />
                                    </div>
                                    <div className="message-card-content">
                                        <div className="message-header">
                                            <h3>{message.senderName}</h3>
                                            <p className="message-date">{message.date}</p>
                                        </div>
                                    </div>

                                    {/* Right Section - Reply Button */}
                                    <div className="message-card-actions">
                                        <button className="reply-button">
                                            <FaReply />
                                            Reply
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="!m-0">{message.subject}</h4>
                                    <p className="!text-[16px]">{message.body}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === "Schedule" && (
                <div className="donor-container schedule-placeholder">
                    <p>Schedule feature coming soon</p>
                </div>
            )}
        </div>
    )
}
