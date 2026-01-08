import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowBack, IoMailOutline, IoCallOutline, IoLocationOutline } from "react-icons/io5";
import { FaQuestionCircle } from "react-icons/fa";
import Navbar from "../components/Navbar";
import QuestionSVG from "../assets/illustrations/questions-animate.svg";
import "../styles/AskQuestion.css";

export default function AskQuestion() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        }
        
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }
        
        if (!formData.subject.trim()) {
            newErrors.subject = "Subject is required";
        }
        
        if (!formData.message.trim()) {
            newErrors.message = "Message is required";
        } else if (formData.message.trim().length < 10) {
            newErrors.message = "Message must be at least 10 characters long";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        
        try {
            // TODO: Add API call to submit question
            // await api.post("/api/contact/question", formData);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setShowSuccess(true);
            setFormData({ name: "", email: "", subject: "", message: "" });
            
            // Hide success message after 5 seconds
            setTimeout(() => {
                setShowSuccess(false);
            }, 5000);
        } catch (error) {
            console.error("Error submitting question:", error);
            setErrors({ submit: "Failed to submit your question. Please try again." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="ask-question-page">
                <div className="ask-question-color">
                    {/* Header Section */}
                    <div className="ask-question-header">
                        <button className="ask-question-back-btn" onClick={() => navigate(-1)}>
                            <IoArrowBack />
                            <span>Back</span>
                        </button>
                        <div className="ask-question-hero">
                            <div className="ask-question-hero-content">
                                <FaQuestionCircle className="ask-question-hero-icon" />
                                <h1 className="ask-question-hero-title">Ask Us a Question</h1>
                                <p className="ask-question-hero-description">
                                    Have a question about blood donation, organ donation, or our services? 
                                    We're here to help! Fill out the form below and our team will get back to you as soon as possible.
                                </p>
                            </div>
                            <div className="ask-question-hero-illustration">
                                <img src={QuestionSVG} alt="Question illustration" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="ask-question-container">
                    <div className="ask-question-layout">
                        {/* Contact Information Sidebar */}
                        <div className="ask-question-sidebar">
                            <h2 className="ask-question-sidebar-title">Get in Touch</h2>
                            <p className="ask-question-sidebar-description">
                                Prefer to reach us directly? Use one of the following methods:
                            </p>
                            
                            <div className="ask-question-contact-items">
                                <div className="ask-question-contact-item">
                                    <div className="ask-question-contact-icon">
                                        <IoMailOutline />
                                    </div>
                                    <div>
                                        <h3>Email Us</h3>
                                        <p>support@lifelink.com</p>
                                    </div>
                                </div>
                                
                                <div className="ask-question-contact-item">
                                    <div className="ask-question-contact-icon">
                                        <IoCallOutline />
                                    </div>
                                    <div>
                                        <h3>Call Us</h3>
                                        <p>1-800-LIFELINK</p>
                                        <small>Mon-Fri 8AM-8PM EST</small>
                                    </div>
                                </div>
                                
                                <div className="ask-question-contact-item">
                                    <div className="ask-question-contact-icon">
                                        <IoLocationOutline />
                                    </div>
                                    <div>
                                        <h3>Visit Us</h3>
                                        <p>123 Health Street<br />Beirut, Lebanon</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Question Form */}
                        <div className="ask-question-form-container">
                            {showSuccess && (
                                <div className="ask-question-success">
                                    <FaQuestionCircle />
                                    <div>
                                        <h3>Question Submitted!</h3>
                                        <p>Thank you for your question. We'll get back to you within 24-48 hours.</p>
                                    </div>
                                </div>
                            )}
                            
                            <form className="ask-question-form" onSubmit={handleSubmit}>
                                <div className="ask-question-form-group">
                                    <label htmlFor="name">Full Name *</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter your full name"
                                        className={errors.name ? "error" : ""}
                                    />
                                    {errors.name && <span className="ask-question-error">{errors.name}</span>}
                                </div>

                                <div className="ask-question-form-group">
                                    <label htmlFor="email">Email Address *</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter your email address"
                                        className={errors.email ? "error" : ""}
                                    />
                                    {errors.email && <span className="ask-question-error">{errors.email}</span>}
                                </div>

                                <div className="ask-question-form-group">
                                    <label htmlFor="subject">Subject *</label>
                                    <input
                                        type="text"
                                        id="subject"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        placeholder="What is your question about?"
                                        className={errors.subject ? "error" : ""}
                                    />
                                    {errors.subject && <span className="ask-question-error">{errors.subject}</span>}
                                </div>

                                <div className="ask-question-form-group">
                                    <label htmlFor="message">Your Question *</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        placeholder="Please provide as much detail as possible so we can assist you better..."
                                        rows="6"
                                        className={errors.message ? "error" : ""}
                                    />
                                    {errors.message && <span className="ask-question-error">{errors.message}</span>}
                                </div>

                                {errors.submit && (
                                    <div className="ask-question-error-message">
                                        {errors.submit}
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    className="ask-question-submit-btn"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Submitting..." : "Submit Question"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

