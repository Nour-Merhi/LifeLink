import { FaPhoneAlt } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { MdLocationPin } from "react-icons/md";
import AiIcon from "../assets/imgs/aiIcon.svg";
import { IoIosSend } from "react-icons/io";
import { FaSquareFacebook } from "react-icons/fa6";
import { FaXTwitter } from "react-icons/fa6";
import { RiInstagramFill } from "react-icons/ri";
import { FaTelegram } from "react-icons/fa6";
import "../styles/footer.css";

import { useState } from "react";


export default function Footer() {
    const [messageData, setMessageData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        subject: "",
        message: "",    
    });

    const handleMessageSubmit = (e) => {
        e.preventDefault();
        console.log(messageData);
    };

    return (
        <footer className="footer text-white p-20">
            <div className="footer-content text-center">
                <h2 className="text-4xl font-bold mb-2">Get In Touch</h2>
                <p className="text-gray-400 max-w-4xl mx-auto">
                Have questions about donation? Need assistance? 
                Our dedicated team is here to help you make a life-saving difference.
                </p>
            </div>

            {/* Contact Information */}
            <div className="footer-contact">
                <div className="footer-contact-item">
                    <div className="footer-contact-item-icon footer-contact-item-icon-red">
                        <FaPhoneAlt className="text-3xl"/>
                    </div>
                    <h2 className="text-2xl font-bold mt-3">24/7 Hotline</h2>
                    <div className="footer-contact-item-text">
                        <span className="-mb-1">(555) LIFE-LINK</span>
                        <span>(555) LIFE-LINK</span>
                        <span className="font-light mt-1">Emergency donation requests</span>
                    </div>
                </div>
                <div className="footer-contact-item">
                    <div className="footer-contact-item-icon footer-contact-item-icon-blue">
                        <MdEmail className="text-3xl"/>
                    </div>
                    <h2 className="text-2xl font-bold mt-3">Email Support</h2>
                    <div className="footer-contact-item-text">
                        <span className="-mb-1">support@lifelink.org</span>
                        <span>donor@lifelink.org</span>
                        <span className="font-light mt-1">Response within 24 hours</span>
                    </div>
                </div>
                <div className="footer-contact-item">
                    <div className="footer-contact-item-icon footer-contact-item-icon-green">
                        <MdLocationPin className="text-3xl"/>
                    </div>
                    <h2 className="text-2xl font-bold mt-3">Main Office</h2>
                    <div className="footer-contact-item-text">
                        <span className="-mb-1">123 Hope Street</span>
                        <span>Donation City, DC 12345</span>
                        <span className="font-light mt-1">Mon-Fri: 8AM-8PM</span>
                    </div>
                </div>
                <div className="footer-contact-item">
                    <div className="footer-contact-item-icon footer-contact-item-icon-purple">
                       <img src={AiIcon} alt="AI Icon" width="35px" height="35px"/>
                    </div>
                    <h2 className="text-2xl font-bold mt-3">Live Chat</h2>
                    <div className="footer-contact-item-text">
                        <span className="-mb-1">Available on our website</span>
                        <span>Instant assistance</span>
                        <span className="font-light mt-1">Online 24/7</span>
                    </div>
                </div>
            </div>

            {/* Social Media */}
            <div className="footer-social-media">
                {/* Send Message */}
                <div className= "footer-send-message">
                    <div className="flex flex-row items-center gap-2 mb-4">
                        <IoIosSend className="text-3xl text-white" />
                        <h2 className="text-2xl font-bold">Send a Message</h2>
                    </div>
                    <form onSubmit={handleMessageSubmit} className="footer-send-message-form">
                        <div className="form-group">
                            <div>
                                <label htmlFor="first-name">First Name</label>
                                <input
                                    type="text" 
                                    id="first-name" 
                                    name="first_name" 
                                    onChange={(e) => setMessageData({ ...messageData, firstName: e.target.value })}
                                    value={messageData.firstName}
                                required />
                            </div>
                            <div>
                                <label htmlFor="last-name">Last Name</label>
                                <input
                                    type="text" 
                                    id="last-name" 
                                    name="last_name"                                    
                                    onChange={(e) => setMessageData({ ...messageData, lastName: e.target.value })}
                                    value={messageData.lastName}
                                required />
                            </div>
                        </div>
                        <div className="form-group">
                            <div>
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email" 
                                    id="email" 
                                    name="email" 
                                    onChange={(e) => setMessageData({ ...messageData, email: e.target.value })}
                                    value={messageData.email}
                                required />
                            </div>
                            <div>
                                <label htmlFor="phone">Phone (optional)</label>
                                <input
                                    type="tel" 
                                    id="phone" 
                                    name="phone" 
                                    onChange={(e) => setMessageData({ ...messageData, phone: e.target.value })}
                                    value={messageData.phone}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <div>
                                <label htmlFor="subject">Subject</label>
                                <select 
                                    id="subject" 
                                    name="subject" 
                                    onChange={(e) => setMessageData({ ...messageData, subject: e.target.value })}
                                    value={messageData.subject}
                                required >
                                    <option value="" disabled>Select Inquiry Type</option>
                                    <option value="general">General Inquiry</option>
                                    <option value="donation">Donation Inquiry</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <div>
                                <label htmlFor="message">Message</label>
                                <textarea
                                    id="message" 
                                    name="message" 
                                    onChange={(e) => setMessageData({ ...messageData, message: e.target.value })}
                                    value={messageData.message}
                                required />
                            </div>
                        </div>
                        <button type="submit" className="footer-send-message-button">
                            <div className="flex flex-row items-center justify-center gap-2">
                                <IoIosSend className="text-3xl text-white" />
                                <span>Send Message</span>
                            </div>
                        </button>
                    </form>
                </div>
                
                <div className="footer-actions">
                    {/* Quick Actions */}
                    <div className="footer-quick-actions">
                        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>

                        <div className="quick-actions-list">
                            <button className="quick-actions-item quick-actions-item-red">
                                <div className="quick-actions-item-icon quick-actions-item-icon-red">
                                    <IoIosSend className="text-3xl text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Schedule Blood Donation</h3>
                                    <p className="text-white !text-xs !text-left">Book your appointment with us</p>
                                </div>
                            </button>
                            <button className="quick-actions-item quick-actions-item-blue">
                                <div className="quick-actions-item-icon quick-actions-item-icon-blue">
                                    <IoIosSend className="text-3xl text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Organ Donor Registration</h3>
                                    <p className="text-white !text-xs !text-left">Register to save lives</p>
                                </div>
                            </button>
                            <button className="quick-actions-item quick-actions-item-green">
                                <div className="quick-actions-item-icon quick-actions-item-icon-green">
                                    <IoIosSend className="text-3xl text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Volunteer With Us</h3>
                                    <p className="text-white !text-xs !text-left">Join our team of heroes</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Follow Us */}
                    <div className="footer-follow-us">
                        <h2 className="text-2xl font-bold mb-4">Follow Us</h2>
                        <div className="footer-follow-us-list">
                            <button className="footer-follow-us-list-item">
                                <FaSquareFacebook className="footer-follow-us-list-item-icon footer-follow-us-list-item-icon-facebook" />
                            </button>
                            <button className="footer-follow-us-list-item">
                                <FaXTwitter className="footer-follow-us-list-item-icon footer-follow-us-list-item-icon-twitter" />
                            </button>
                            <button className="footer-follow-us-list-item">
                                <RiInstagramFill className="footer-follow-us-list-item-icon footer-follow-us-list-item-icon-instagram" />
                            </button>
                            <button className="footer-follow-us-list-item">
                                <FaTelegram className="footer-follow-us-list-item-icon footer-follow-us-list-item-icon-telegram" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}