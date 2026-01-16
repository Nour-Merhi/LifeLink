import { forwardRef } from "react";
import { FaPhoneAlt } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { MdLocationPin } from "react-icons/md";
import AiIcon from "../assets/imgs/aiIcon.svg";
import { IoIosSend } from "react-icons/io";
import { FaSquareFacebook } from "react-icons/fa6";
import { FaXTwitter } from "react-icons/fa6";
import { RiInstagramFill } from "react-icons/ri";
import { FaTelegram } from "react-icons/fa6";
import { TbDropletFilled } from "react-icons/tb";
import { HiMiniHeart } from "react-icons/hi2";
import { FaHandHoldingHeart } from "react-icons/fa";
import "../styles/footer.css";

import { useState } from "react";


const Footer = forwardRef(function Footer(props, ref) {
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
        <footer className="footer text-white p-20" ref={ref}>
            <div className="footer-content text-center">
                <h2 className="text-4xl font-bold mb-2">Get In Touch</h2>
                <p className="text-gray-400 max-w-2xl mx-auto !text-[16px]">
                Have questions about donation? Need assistance? 
                Our dedicated team is here to help you make a life-saving difference.
                </p>
            </div>

            {/* Contact Information */}
            <div className="footer-contact">
                <div className="footer-contact-item">
                    <div className="footer-contact-item-icon footer-contact-item-icon-red">
                        <FaPhoneAlt className="text-2xl"/>
                    </div>
                    <h2 className="text-lg font-bold mt-3">24/7 Hotline</h2>
                    <div className="footer-contact-item-text">
                        <span className="text-sm">(555) LIFE-LINK</span>
                        <span className="text-sm">(555) LIFE-LINK</span>
                        <span className="font-light mt-1 text-sm">Emergency donation requests</span>
                    </div>
                </div>
                <div className="footer-contact-item">
                    <div className="footer-contact-item-icon footer-contact-item-icon-blue">
                        <MdEmail className="text-2xl"/>
                    </div>
                    <h2 className="text-lg font-bold mt-3">Email Support</h2>
                    <div className="footer-contact-item-text">
                        <span className="text-sm">lifelink.org.team@gmail.com</span>
                        <span className="text-sm">lifelink.org.team@gmail.com</span>
                        <span className="font-light mt-1 text-sm">Response within 24 hours</span>
                    </div>
                </div>
                <div className="footer-contact-item">
                    <div className="footer-contact-item-icon footer-contact-item-icon-green">
                        <MdLocationPin className="text-2xl"/>
                    </div>
                    <h2 className="text-lg font-bold mt-3">Main Office</h2>
                    <div className="footer-contact-item-text">
                        <span className="text-sm">123 Hope Street</span>
                        <span className="text-sm">Donation City, DC 12345</span>
                        <span className="font-light mt-1 text-sm">Mon-Fri: 8AM-8PM</span>
                    </div>
                </div>
                <div className="footer-contact-item">
                    <div className="footer-contact-item-icon footer-contact-item-icon-purple">
                       <img src={AiIcon} alt="AI Icon" width="35px" height="35px"/>
                    </div>
                    <h2 className="text-lg font-bold mt-3">Live Chat</h2>
                    <div className="footer-contact-item-text">
                        <span className="text-sm">Available on our website</span>
                        <span className="text-sm">Instant assistance</span>
                        <span className="font-light mt-1 text-sm">Online 24/7</span>
                    </div>
                </div>
            </div>

            {/* Social Media */}
            <div className="footer-social-media">
                {/* Send Message */}
                <div className= "footer-send-message">
                    <div className="flex flex-row items-center gap-2 mb-4">
                        <IoIosSend className="text-2xl text-white" />
                        <h2 className="text-xl font-bold">Send a Message</h2>
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
                                <IoIosSend className="text-2xl text-white" />
                                <span>Send Message</span>
                            </div>
                        </button>
                    </form>
                </div>
                
                <div className="footer-actions">
                    {/* Quick Actions */}
                    <div className="footer-quick-actions">
                        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>

                        <div className="quick-actions-list">
                            <button className="quick-actions-item quick-actions-item-red">
                                <div className="quick-actions-item-icon quick-actions-item-icon-red">
                                    <TbDropletFilled className="text-2xl text-white" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold">Schedule Blood Donation</h3>
                                    <p className="text-white !text-xs !text-left">Book your appointment with us</p>
                                </div>
                            </button>
                            <button className="quick-actions-item quick-actions-item-blue">
                                <div className="quick-actions-item-icon quick-actions-item-icon-blue">
                                    <HiMiniHeart className="text-2xl text-white" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold">Organ Donor Registration</h3>
                                    <p className="text-white !text-xs !text-left">Register to save lives</p>
                                </div>
                            </button>
                            <button className="quick-actions-item quick-actions-item-green">
                                <div className="quick-actions-item-icon quick-actions-item-icon-green">
                                    <FaHandHoldingHeart className="text-2xl text-white" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold">Volunteer With Us</h3>
                                    <p className="text-white !text-xs !text-left">Join our team of heroes</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Follow Us */}
                    <div className="footer-follow-us">
                        <h2 className="text-xl font-bold mb-4">Follow Us</h2>
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
                    <p className="!text-sm text-white mt-2">&copy; 2025 LifeLink. All rights are reserved.</p>
                </div>
            </div>
        </footer>
    );
});

export default Footer;