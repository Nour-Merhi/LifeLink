import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { MdOutlineNotificationsActive } from "react-icons/md";
import { FaPhone } from "react-icons/fa";
import { IoChatbubbleEllipses } from "react-icons/io5";
import { MdEmail } from "react-icons/md";
import { IoChevronDown } from "react-icons/io5";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import profile from "../assets/imgs/profile.svg";
import "../styles/Dashboard.css";

export default function Support() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeFAQTab, setActiveFAQTab] = useState("All");
    const [openFAQ, setOpenFAQ] = useState(null);
    const [formData, setFormData] = useState({
        subject: "",
        category: "",
        message: ""
    });
    const [charCount, setCharCount] = useState(0);
    const [faqs, setFaqs] = useState([]);
    const [faqCategories, setFaqCategories] = useState(["All"]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (name === "message") {
            setCharCount(value.length);
        }
    };

    // Fetch FAQs from API
    useEffect(() => {
        const fetchFAQs = async () => {
            try {
                setLoading(true);
                const response = await api.get('/api/faqs');
                const fetchedFaqs = response.data.faqs || [];
                const categories = response.data.categories || [];
                
                setFaqs(fetchedFaqs);
                setFaqCategories(["All", ...categories]);
            } catch (error) {
                console.error('Error fetching FAQs:', error);
                setFaqs([]);
            } finally {
                setLoading(false);
            }
        };

        fetchFAQs();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError("");
        setSubmitSuccess(false);

        if (!formData.subject.trim() || !formData.category.trim() || !formData.message.trim()) {
            setSubmitError("Please fill in all fields");
            return;
        }

        if (formData.message.length > 500) {
            setSubmitError("Message cannot exceed 500 characters");
            return;
        }

        try {
            setSubmitting(true);
            await api.get("/sanctum/csrf-cookie");
            const response = await api.post('/api/support/tickets', {
                subject: formData.subject,
                category: formData.category,
                message: formData.message
            });

            setSubmitSuccess(true);
            setFormData({ subject: "", category: "", message: "" });
            setCharCount(0);
            
            // Clear success message after 5 seconds
            setTimeout(() => setSubmitSuccess(false), 5000);
        } catch (error) {
            console.error('Error submitting support ticket:', error);
            setSubmitError(
                error.response?.data?.message || 
                error.response?.data?.errors?.message?.[0] ||
                "Failed to submit support ticket. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const toggleFAQ = (id) => {
        setOpenFAQ(openFAQ === id ? null : id);
    };

    const filteredFAQs = activeFAQTab === "All" 
        ? faqs 
        : faqs.filter(faq => faq.category === activeFAQTab);

    return (
        <div className="support-page">
            {/* Header */}
            <div className="support-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <IoArrowBack />
                        <h1 className="support-title !ml-2">Support</h1>
                    </button>
                <div className="support-nav-info">
                    <MdOutlineNotificationsActive className="support-notification-icon"/>
                        <div className="support-user-info">
                        <img src={profile} alt="profile" style={{ width: '40px', height: '40px' }} />
                        <div className="support-user-details">
                            <h3>{user?.name || user?.username || "Guest"}</h3>
                            <small>{user?.donor?.blood_type ? `Blood Type ${user.donor.blood_type}` : "Not a donor"}</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="support-container">
                {/* How can we help you section */}
                <div className="support-hero-section">
                    <h2 className="support-hero-title">How can we help you?</h2>
                    <p className="support-hero-description">
                        Find answers to common questions or get in touch with our support team for personalized assistance.
                    </p>

                    {/* Contact Cards */}
                    <div className="support-contact-cards">
                        <div className="support-contact-card">
                            <FaPhone className="support-card-icon call-icon" style={{ color: '#F12C31' }} />
                            <div>
                                <h3 className="support-card-title">Call Us</h3>
                                <p className="support-card-description">Speak with our support team</p>
                            </div>
                            <div>
                                <p className="support-card-contact call-text" style={{ color: '#F12C31' }}>1-800-LIFELINK</p>
                                <p className="support-card-hours">Mon-Fri 8AM-8PM EST</p>
                            </div>
                                
                        </div>

                        <div className="support-contact-card">
                            <IoChatbubbleEllipses className="support-card-icon chat-icon" style={{ color: '#2196F3' }} />
                            <div>
                                <h3 className="support-card-title">Live Chat</h3>
                                <p className="support-card-description">Chat with our AI assistant</p>
                            </div>
                            <div>
                                <button 
                                    className="support-chat-button" 
                                    style={{ background: '#2196F3', color: 'white' }}
                                    onClick={() => navigate('/chatbot')}
                                >
                                    Start Chat
                                </button>
                                <p className="support-card-hours">Available 24/7</p>
                            </div>
                        </div>

                        <div className="support-contact-card">
                            <MdEmail className="support-card-icon email-icon" style={{ color: '#4CAF50' }} />
                            <div>
                                <h3 className="support-card-title">Email Support</h3>
                                <p className="support-card-description">Send us a detailed message</p>
                            </div>
                            <div>
                                <p className="support-card-contact email-text" style={{ color: '#4CAF50' }}>support@lifelink.org</p>
                                <p className="support-card-hours">Response within 24 hours</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FAQ and Contact Form Section */}
                <div className="support-main-section">
                    {/* FAQ Section */}
                    <div className="support-faq-section">
                        <h3 className="support-section-title mb-5">Frequently Asked Questions</h3>
                        
                        {/* FAQ Tabs */}
                        <div className="support-faq-tabs">
                            {faqCategories.map((category) => (
                                <button
                                    key={category}
                                    className={`support-faq-tab ${activeFAQTab === category ? 'active' : ''}`}
                                    onClick={() => setActiveFAQTab(category)}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>

                        {/* FAQ List */}
                        <div className="support-faq-list">
                            {loading ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                    Loading FAQs...
                                </div>
                            ) : filteredFAQs.length === 0 ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                    No FAQs found{activeFAQTab !== "All" ? ` in ${activeFAQTab}` : ""}.
                                </div>
                            ) : (
                                filteredFAQs.map((faq) => (
                                    <div key={faq.id} className="support-faq-item">
                                        <button
                                            className="support-faq-question"
                                            onClick={() => toggleFAQ(faq.id)}
                                        >
                                            <span>{faq.question}</span>
                                            <IoChevronDown 
                                                className={`support-faq-chevron ${openFAQ === faq.id ? 'open' : ''}`}
                                            />
                                        </button>
                                        {openFAQ === faq.id && (
                                            <div className="support-faq-answer">
                                                {faq.answer}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Contact Form Section */}
                    <div className="support-contact-form-section">
                        <h3 className="support-section-title">Contact Support</h3>
                        <p className="support-form-description">
                            Can't find what you're looking for? Send us a message.
                        </p>

                        <form onSubmit={handleSubmit} className="support-form">
                            <div className="support-form-group">
                                <label htmlFor="subject">Subject</label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    placeholder="Enter subject"
                                />
                            </div>

                            <div className="support-form-group">
                                <label htmlFor="category">Category</label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select a category</option>
                                    <option value="Blood Donation">Blood Donation</option>
                                    <option value="Organ Donation">Organ Donation</option>
                                    <option value="Appointments">Appointments</option>
                                    <option value="Account">Account</option>
                                    <option value="Privacy">Privacy</option>
                                    <option value="Rewards">Rewards</option>
                                    <option value="Technical">Technical</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="support-form-group">
                                <label htmlFor="message">Message</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="Enter your message"
                                    maxLength={500}
                                    rows={6}
                                />
                                <p className="char-count">Max 500 characters ({charCount}/500)</p>
                            </div>

                            {submitError && (
                                <div className="support-error-message" style={{ 
                                    color: '#F12C31', 
                                    marginBottom: '12px',
                                    padding: '8px 12px',
                                    background: 'rgba(241, 44, 49, 0.1)',
                                    borderRadius: '6px'
                                }}>
                                    {submitError}
                                </div>
                            )}

                            {submitSuccess && (
                                <div className="support-success-message" style={{ 
                                    color: '#4CAF50', 
                                    marginBottom: '12px',
                                    padding: '8px 12px',
                                    background: 'rgba(76, 175, 80, 0.1)',
                                    borderRadius: '6px'
                                }}>
                                    Support ticket submitted successfully! We'll get back to you soon.
                                </div>
                            )}

                            <button 
                                type="submit" 
                                className="support-submit-button"
                                disabled={submitting}
                            >
                                {submitting ? "Sending..." : "Send Message"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

