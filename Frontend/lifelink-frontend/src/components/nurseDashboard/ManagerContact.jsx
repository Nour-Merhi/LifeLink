import { useState, useEffect } from "react";
import { IoPerson } from "react-icons/io5";
import { LuPhoneCall } from "react-icons/lu";
import { GrMapLocation } from "react-icons/gr";
import { FaRegClock, FaReply } from "react-icons/fa";
import { MdOutlineEmail } from "react-icons/md";
import { RiAlarmWarningLine } from "react-icons/ri";
import { FaPlus } from "react-icons/fa";
import { FaUserMd } from "react-icons/fa";

import "../../styles/Dashboard.css";
import api from "../../api/axios";

export default function ManagerContact(){
    const [activeTab, setActiveTab] = useState("Contact Info");
    const [managerData, setManagerData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchManagerContact = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await api.get("/api/nurse/manager-contact");
                
                if (response.data && response.data.manager) {
                    setManagerData(response.data.manager);
                } else {
                    setError("No manager data received from server");
                }
            } catch (err) {
                console.error("Error fetching manager contact:", err);
                console.error("Error response:", err.response);
                
                let errorMessage = "Failed to load manager contact information";
                if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (err.response?.status === 401) {
                    errorMessage = "Please log in to view manager contact";
                } else if (err.response?.status === 403) {
                    errorMessage = "You don't have permission to access this page";
                } else if (err.response?.status === 404) {
                    errorMessage = err.response.data?.message || "Manager not found or not assigned";
                } else if (err.message) {
                    errorMessage = err.message;
                }
                
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchManagerContact();
    }, []);

    const [messages, setMessages] = useState([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [messagesError, setMessagesError] = useState("");
    const [showNewMessageModal, setShowNewMessageModal] = useState(false);
    const [newMessageForm, setNewMessageForm] = useState({
        subject: "",
        body: "",
    });
    const [sendingMessage, setSendingMessage] = useState(false);

    // Fetch messages when Messages tab is active
    useEffect(() => {
        if (activeTab === "Messages") {
            fetchMessages();
        }
    }, [activeTab]);

    const fetchMessages = async () => {
        try {
            setMessagesLoading(true);
            setMessagesError("");
            const response = await api.get("/api/nurse/messages");
            
            if (response.data && response.data.messages) {
                setMessages(response.data.messages);
            } else {
                setMessagesError("No messages data received from server");
            }
        } catch (err) {
            console.error("Error fetching messages:", err);
            console.error("Error response:", err.response);
            
            let errorMessage = "Failed to load messages";
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.status === 401) {
                errorMessage = "Please log in to view messages";
            } else if (err.response?.status === 403) {
                errorMessage = "You don't have permission to access this page";
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setMessagesError(errorMessage);
        } finally {
            setMessagesLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        
        if (!newMessageForm.subject.trim() || !newMessageForm.body.trim()) {
            alert("Please fill in both subject and message body");
            return;
        }

        try {
            setSendingMessage(true);
            const response = await api.post("/api/nurse/messages", {
                subject: newMessageForm.subject,
                body: newMessageForm.body,
            });

            if (response.data && response.data.message) {
                // Add the new message to the list
                setMessages(prev => [response.data.message, ...prev]);
                // Reset form and close modal
                setNewMessageForm({ subject: "", body: "" });
                setShowNewMessageModal(false);
            }
        } catch (err) {
            console.error("Error sending message:", err);
            alert(err.response?.data?.message || "Failed to send message. Please try again.");
        } finally {
            setSendingMessage(false);
        }
    };

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
                <button 
                    className="new-message-btn"
                    onClick={() => setShowNewMessageModal(true)}
                >
                    <FaPlus />
                    New Message
                </button>
            </div>

            {activeTab === "Contact Info" && (
                <>
                    {loading ? (
                        <div className="nurse-section flex items-center justify-center h-64">
                            <p className="text-gray-500">Loading manager contact information...</p>
                        </div>
                    ) : error ? (
                        <div className="nurse-section flex flex-col items-center justify-center h-64 p-4">
                            <p className="text-red-500 text-lg font-semibold mb-2">Error: {error}</p>
                            <p className="text-gray-600 text-sm">
                                Please check your browser console for more details, or contact support if the issue persists.
                            </p>
                        </div>
                    ) : managerData ? (
                        <div className="donor-container manager-contact-card">
                            {/* Manager Profile Section */}
                            <div className="manager-profile-section">
                                <div className="manager-profile-icon">
                                    <IoPerson />
                                </div>
                                <div className="manager-profile-info">
                                    <h3>{managerData.name || 'N/A'}</h3>
                                    <p className="manager-title">{managerData.position || 'N/A'}</p>
                                    <p className="manager-department">Health Center Manager</p>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="contact-info-list">
                                <div className="contact-info-item">
                                    <LuPhoneCall />
                                    <div>
                                        <p className="contact-label">Phone</p>
                                        <p className="contact-value">{managerData.phone_nb || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="contact-info-item">
                                    <MdOutlineEmail />
                                    <div>
                                        <p className="contact-label">Email</p>
                                        <p className="contact-value">{managerData.email || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="contact-info-item">
                                    <GrMapLocation />
                                    <div>
                                        <p className="contact-label">Office Location</p>
                                        <p className="contact-value">{managerData.office_location || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="contact-info-item">
                                    <FaRegClock />
                                    <div>
                                        <p className="contact-label">Availability</p>
                                        <p className="contact-value">
                                            {managerData.start_time && managerData.end_time
                                                ? `${managerData.start_time} - ${managerData.end_time}`
                                                : managerData.working_hours || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Emergency Contact Section */}
                            <div className="emergency-contact-section">
                                <RiAlarmWarningLine />
                                <div>
                                    <p className="emergency-title">Emergency Contact</p>
                                    <p className="emergency-phone">{managerData.phone_nb || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="nurse-section flex items-center justify-center h-64">
                            <p className="text-gray-500">No manager information available</p>
                        </div>
                    )}
                </>
            )}

            {activeTab === "Messages" && (
                <>
                    {messagesLoading ? (
                        <div className="nurse-section flex items-center justify-center h-64">
                            <p className="text-gray-500">Loading messages...</p>
                        </div>
                    ) : messagesError ? (
                        <div className="nurse-section flex flex-col items-center justify-center h-64 p-4">
                            <p className="text-red-500 text-lg font-semibold mb-2">Error: {messagesError}</p>
                            <p className="text-gray-600 text-sm">
                                Please contact support if the issue persists.
                            </p>
                        </div>
                    ) : (
                        <div className="message-card-container">
                            {messages.length > 0 ? messages.map((message) => (
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
                                            {!message.is_sent_by_me && (
                                                <div className="message-card-actions">
                                                    <button 
                                                        className="reply-button"
                                                        onClick={() => {
                                                            setNewMessageForm({
                                                                subject: `Re: ${message.subject}`,
                                                                body: "",
                                                            });
                                                            setShowNewMessageModal(true);
                                                        }}
                                                    >
                                                        <FaReply />
                                                        Reply
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="!m-0">{message.subject}</h4>
                                            <p className="!text-[16px]">{message.body}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="donor-container" style={{ padding: "40px", textAlign: "center" }}>
                                    <p className="text-gray-500 text-lg">No messages found</p>
                                    <p className="text-gray-400 text-sm mt-2">
                                        You don't have any messages yet. Click "New Message" to send your first message.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* New Message Modal */}
                    {showNewMessageModal && (
                        <div className="modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                            <div className="modal-container" style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
                                <div className="modal-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h2>New Message</h2>
                                    <button 
                                        onClick={() => {
                                            setShowNewMessageModal(false);
                                            setNewMessageForm({ subject: "", body: "" });
                                        }}
                                        style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
                                    >
                                        ×
                                    </button>
                                </div>
                                <form onSubmit={handleSendMessage}>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                            Subject
                                        </label>
                                        <input
                                            type="text"
                                            value={newMessageForm.subject}
                                            onChange={(e) => setNewMessageForm({ ...newMessageForm, subject: e.target.value })}
                                            placeholder="Enter message subject"
                                            required
                                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                                        />
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                            Message
                                        </label>
                                        <textarea
                                            value={newMessageForm.body}
                                            onChange={(e) => setNewMessageForm({ ...newMessageForm, body: e.target.value })}
                                            placeholder="Enter your message"
                                            required
                                            rows={6}
                                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', resize: 'vertical' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowNewMessageModal(false);
                                                setNewMessageForm({ subject: "", body: "" });
                                            }}
                                            disabled={sendingMessage}
                                            style={{ padding: '10px 20px', border: '1px solid #ccc', borderRadius: '5px', background: 'white', cursor: 'pointer' }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={sendingMessage}
                                            style={{ padding: '10px 20px', border: 'none', borderRadius: '5px', background: '#3257CD', color: 'white', cursor: 'pointer' }}
                                        >
                                            {sendingMessage ? 'Sending...' : 'Send Message'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeTab === "Schedule" && (
                <div className="donor-container schedule-placeholder">
                    <p>Schedule feature coming soon</p>
                </div>
            )}
        </div>
    )
}
