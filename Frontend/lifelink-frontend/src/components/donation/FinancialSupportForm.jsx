import { IoIosSend } from "react-icons/io";
import { FaUser } from "react-icons/fa6";
import { PiHeartbeatFill } from "react-icons/pi";
import { RiHandHeartFill } from "react-icons/ri";
import { FaCalendarDays } from "react-icons/fa6";
import { TbArrowBigRightLinesFilled } from "react-icons/tb";
import { BiSolidShieldPlus } from "react-icons/bi";
import { RiUserHeartFill } from "react-icons/ri";
import { FaMoneyCheck } from "react-icons/fa";
import { FaPaypal } from "react-icons/fa6";
import { BsFillCreditCard2FrontFill } from "react-icons/bs";
import WishIcon from "../../assets/imgs/wish.svg";
import { RiSettings4Fill } from "react-icons/ri";
import { BiSolidBadgeDollar } from "react-icons/bi";

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function FinancialSupportForm({ setModal, selectedPatientCaseId, selectedPatientName }){
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        address: "",
        donation_type: "",
        donation_amount: 0.00,
        recipient_chosen: "",
        patient_case_id: null,
        payment_method: "",
        preference: "",
    })

    // Auto-select specific patient when a patient is selected from slider
    useEffect(() => {
        if (selectedPatientCaseId && selectedPatientName) {
            setFormData(prev => ({
                ...prev,
                recipient_chosen: "specific patient",
                patient_case_id: selectedPatientCaseId
            }));
        }
        // Don't reset to general when no patient selected - let user's manual choice stand
    }, [selectedPatientCaseId, selectedPatientName]);

    const handleChange = (e) => {
        const {name, value} = e.target 
        setFormData (prev => ({...prev, [name]: value}) )
    }

    const handleSubmit = async (e) => {
        e.preventDefault(); 

        if (!formData.donation_type || !formData.donation_amount || !formData.payment_method) {
            setError("Please choose a donation type, amount and payment method.");
            return;
        }

        if (formData.donation_amount <= 0) {
            setError("Please enter a valid donation amount greater than 0.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Get CSRF cookie first
            await api.get("/sanctum/csrf-cookie");

            const response = await api.post("/api/financial-donations", {
                name: formData.name || null,
                phone: formData.phone || null,
                email: formData.email || null,
                address: formData.address || null,
                donation_type: formData.donation_type,
                donation_amount: parseFloat(formData.donation_amount) || 0,
                recipient_chosen: formData.recipient_chosen || 'general patient',
                patient_case_id: formData.patient_case_id || null,
                payment_method: formData.payment_method,
                preference: formData.preference || null,
            });

            // Reset form
            setFormData ({
                name: "",
                phone: "",
                email: "",
                address: "",
                donation_type: "",
                donation_amount: 0.0,
                recipient_chosen: selectedPatientCaseId ? "specific patient" : "general patient",
                patient_case_id: selectedPatientCaseId || null,
                payment_method: "",
                preference: "",
            })

            setModal(true)

        } catch (err) {
            console.error("Error submitting donation:", err);
            
            // Handle validation errors
            if (err.response?.data?.errors) {
                const validationErrors = Object.values(err.response.data.errors).flat();
                setError(validationErrors.join(", "));
            } else {
                const errorMessage = err.response?.data?.message || "Failed to submit donation. Please try again.";
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div id="financial-donor" className="title linear-green">
                <h2 className="text-center">Make Your Donation</h2>
            </div>
            <div className="form-box-container">

                    <div className="form">
                        <form className="form-info" onSubmit= { handleSubmit } >

                            {/*Donation Type*/}
                            <div className="personal-info">
                                <div className="info-title">
                                    <TbArrowBigRightLinesFilled  className="green-color"/>
                                    <h3 className="text-2xl font-semibold">Donation Type</h3>
                                </div>
                                <div className="type">
                                    <button 
                                        type="button"
                                        onClick={ ()=> setFormData (prev => ({...prev, donation_type: "one time"})) } 
                                    >
                                        <div 
                                            className={`dn-type ${formData.donation_type === "one time" ? "selected-dn-btn" : ""}`}
                                        >
                                            <RiHandHeartFill className={`fin-icon ${formData.donation_type === "one time" ? "white-color" : "green-color"}`} />
                                            <h3>One-Time Donation</h3>
                                            <p>Make a single contribution</p>
                                        </div>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={ ()=> setFormData (prev => ({...prev, donation_type: "monthly"})) } 
                                        >
                                        <div 
                                        className={`dn-type ${formData.donation_type === "monthly" ? "selected-dn-btn" : ""}`}
                                        >
                                            <FaCalendarDays className={`fin-icon ${formData.donation_type === "monthly" ? "white-color" : "green-color"}`}/>
                                            <h3>Monthly Support</h3>
                                            <p>Recurring monthly help</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/*Donation Amount*/}
                            <div className="personal-info">
                                <div className="info-title">
                                    <BiSolidBadgeDollar  className="green-color"/>
                                    <h3 className="text-2xl font-semibold">Donation Amount</h3>
                                </div>
                                <div className="mn-type">
                                    <button 
                                        type="button"
                                        onClick={ ()=> setFormData (prev => ({...prev, donation_amount: 10})) } 
                                    >
                                        <div 
                                            className={`dn-type ${formData.donation_amount === 10 ? "selected-dn-btn" : ""}`}
                                        >
                                            <h3>$10</h3>
                                        </div>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={ ()=> setFormData (prev => ({...prev, donation_amount: 25})) } 
                                    >
                                        <div 
                                            className={`dn-type ${formData.donation_amount === 25 ? "selected-dn-btn" : ""}`}
                                        >
                                            <h3>$25</h3>
                                        </div>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={ ()=> setFormData (prev => ({...prev, donation_amount: 50})) } 
                                    >
                                        <div 
                                            className={`dn-type ${formData.donation_amount === 50 ? "selected-dn-btn" : ""}`}
                                        >
                                            <h3>$50</h3>
                                        </div>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={ ()=> setFormData (prev => ({...prev, donation_amount: 100})) } 
                                    >
                                        <div 
                                            className={`dn-type ${formData.donation_amount === 100 ? "selected-dn-btn" : ""}`}
                                        >                                            
                                            <h3>$100</h3>
                                        </div>
                                    </button>
                                </div>
                                <div className="cust-amount dn-type">
                                    <h3>Custom Amount</h3>
                                    <span>$</span>
                                    <input 
                                        type="number" 
                                        name="donation_amount" 
                                        value={formData.donation_amount }
                                         onChange={(e) =>
                                            setFormData((prev) => ({
                                            ...prev,
                                            donation_amount: parseFloat(e.target.value),
                                            }))
                                        }
                                        min="0"
                                        step="0.05"
                                    />
                                </div>
                            </div>
                            
                            {/*Donation Recipient Choose*/}
                            <div className="personal-info">
                                <div className="info-title recipient-chosen">
                                    <RiUserHeartFill  className="green-color"/>
                                    <h3 className="text-2xl font-semibold">Choose Recipient</h3>
                                </div>
                                <div className="rec-chose">
                                    <button 
                                        type="button"
                                        onClick={ ()=> setFormData (prev => ({...prev, recipient_chosen: "general patient", patient_case_id: null})) } 
                                    >
                                        <div 
                                            className={`rec-type ${formData.recipient_chosen === "general patient" ? "selected-dn-btn" : ""}`}
                                        >
                                            <BiSolidShieldPlus className={`fin-icon ${formData.recipient_chosen === "general patient" ? "white-color" : "green-color"}`}/>
                                            <div>
                                                <h3>General Patient Fund</h3>
                                                <p>Supports any urgent medical case</p>
                                            </div>
                                        </div>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={ ()=> setFormData (prev => ({...prev, recipient_chosen: "specific patient"})) } 
                                    >
                                        <div 
                                            className={`rec-type ${formData.recipient_chosen === "specific patient" ? "selected-dn-btn" : ""}`}
                                        >
                                            <FaUser className={`fin-icon ${formData.recipient_chosen === "specific patient" ? "white-color" : "green-color"}`}/>
                                            <div>
                                                <h3>Specific Patient</h3>
                                                <p>
                                                    {selectedPatientName 
                                                        ? `Supporting: ${selectedPatientName}` 
                                                        : "Choose a patient to support directly"}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/*Donation Payment Method*/}
                            <div className="personal-info">
                                <div className="info-title">
                                    <FaMoneyCheck  className="green-color"/>
                                    <h3 className="text-2xl font-semibold">Payment Method</h3>
                                </div>
                                <div className="payment-method">
                                    <button 
                                        type="button"
                                        onClick={ ()=> setFormData (prev => ({...prev, payment_method: "credit card"})) } 
                                    >
                                        <div 
                                            className={`pay-type ${formData.payment_method === "credit card" ? "selected-dn-btn" : ""}`}
                                        >
                                            <BsFillCreditCard2FrontFill className={`fin-icon ${formData.payment_method === "credit card" ? "white-color" : "green-color"}`}/>
                                            <h3>Credit Card</h3>
                                        </div>
                                    </button>
                                    
                                     <button 
                                        type="button"
                                        onClick={ ()=> setFormData (prev => ({...prev, payment_method: "wish"})) } 
                                    >
                                        <div 
                                            className={`pay-type ${formData.payment_method === "wish" ? "selected-dn-btn" : ""}`}
                                        >
                                            <div className="fin-icon">
                                                <img src={WishIcon}  alt="wish money icon"/>
                                            </div>
                                            
                                            <h3>Wish Money</h3>
                                        </div>
                                    </button>

                                    <button 
                                        type="button"
                                        onClick={ ()=> setFormData (prev => ({...prev, payment_method: "cash"})) } 
                                    >
                                        <div 
                                            className={`pay-type ${formData.payment_method === "cash" ? "selected-dn-btn" : ""}`}
                                        >
                                            <FaPaypal className={`fin-icon ${formData.payment_method === "cash" ? "white-color" : "green-color"}`}/>
                                            <h3>Cash</h3>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/*Donation Contact Info*/}
                            <div className="personal-info">
                                <div className="info-title">
                                    <FaUser  className="green-color"/>
                                    <h3 className="text-2xl font-semibold">Contact Information (optional)</h3>
                                </div>
                                <div className="organ-form-group">
                                    <div>
                                        <label htmlFor="full-name">Full Name</label>
                                        <input type="text" id="full-name" name="name" placeholder="Enter your full name" 
                                                value={formData.name}
                                                onChange={ handleChange }
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="email">Email Address</label>
                                        <input type="email" id="email" name="email" placeholder="Enter your email" 
                                                value={ formData.email }
                                                onChange={ handleChange }
                                        />
                                    </div>
                                    
                                </div>
                                <div className="organ-form-group">
                                    <div>
                                        <label htmlFor="phone">Phone Number</label>
                                        <input type="text" id="phone" name="phone" placeholder="Enter your phone number" 
                                                value={formData.phone}
                                                onChange={ handleChange }
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="address">Address</label>
                                        <textarea id="address" name="address" placeholder="Enter your address in detials.."
                                                value={formData.address}
                                                onChange={ handleChange }
                                         />
                                    </div>
                                </div>
                              
                                <div className="organ-form-group">
                                </div>
                            </div>

                            {/*Donation Preference*/}
                            <div className="personal-info">
                                <div className="info-title">
                                    <RiSettings4Fill  className="green-color"/>
                                    <h3 className="text-2xl font-semibold">Preference</h3>
                                </div>
                                <div className="organ-form-group">
                                    <div className="donation-type">
                                        <label>
                                            <input
                                            className="checked"
                                            type="radio"
                                            name="preference"
                                            value="anonymous"
                                            onChange={ handleChange }
                                            required
                                            />
                                            <div>
                                                <p>Make this donation anonymous</p>
                                                <p>Your name will not be shared with patients or publicly</p>
                                            </div>
                                        </label>

                                        <label>
                                            <input
                                            className="checked"
                                            type="radio"
                                            name="preference"
                                            value="stay_updated"
                                            onChange={ handleChange }
                                            required
                                            />
                                            <div>
                                                <p>I want to stay updated on the patient's progress</p>
                                                <p>Receive updates on how your donation is helping</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="line"></div>

                            {/* Error Message */}
                            {error && (
                                <div style={{ 
                                    padding: "12px", 
                                    backgroundColor: "#fee", 
                                    color: "#c33", 
                                    borderRadius: "8px", 
                                    marginBottom: "20px",
                                    border: "1px solid #fcc"
                                }}>
                                    {error}
                                </div>
                            )}

                            <div className="form-action">
                                <button 
                                    type="submit" 
                                    className="next-step-btn organ-btn linear-green"
                                    disabled={loading}
                                > 
                                    {loading ? (
                                        <>
                                            <span style={{ marginRight: "8px" }}>Processing...</span>
                                            <span className="spinner" style={{ 
                                                display: "inline-block", 
                                                width: "16px", 
                                                height: "16px", 
                                                border: "2px solid #fff", 
                                                borderTopColor: "transparent", 
                                                borderRadius: "50%", 
                                                animation: "spin 0.6s linear infinite" 
                                            }}></span>
                                        </>
                                    ) : (
                                        <>
                                            <IoIosSend/> Donate Securely
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                 
        </>
    )
}