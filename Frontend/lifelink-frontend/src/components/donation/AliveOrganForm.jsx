import { IoIosSend } from "react-icons/io";
import { FaUser } from "react-icons/fa6";
import { PiHeartbeatFill } from "react-icons/pi";

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AliveOragnForm(){
    const navigate = useNavigate();
    const [isChecked, setIsChecked] = useState([]);
    const [formData, setFormData] = useState({
        first_name: "",
        middle_name: "",
        last_name: "",
        email: "",
        phone: "",
        birth_date: "",
        gender: "",
        address: "",
        blood_type: "",
        living_organ: "",
        donationType: "",
        health: [],
        agree_intrest: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    
    const disqualifiedConditions = [
        "daibetes",
        "kidney-liver-dis",
        "surgeries",
        "high-bld-press",
        "hiv",
        "smoker"
    ]

    // Handle input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (type === 'checkbox') {
            setFormData(prev => ({
                ...prev,
                [name]: checked
            }));
        } else if (type === 'radio') {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleCheckboxChange = (e) => {
        const { value, checked} = e.target;
        if (checked) {
            setIsChecked((prev)=> [...prev, value] )
        }else {
            setIsChecked ((prev) => prev.filter(c => c != value))
        }
    }

    const isDisqualified = isChecked.some(
        c => disqualifiedConditions.includes(c)
    );


     const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            // Prepare submission data
            const submissionData = {
                ...formData,
                medical_conditions: isChecked.length > 0 ? isChecked : null,
                organ: formData.living_organ,
                donation_type: formData.donationType === 'direct-donation' ? 'directed' : 'non-directed',
                agree_interest: formData.agree_intrest
            };

            const response = await axios.post(
                "http://localhost:8000/api/organ/living-donor",
                submissionData,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                }
            );

            setSuccess(true);
            setTimeout(() => {
                navigate("/donation");
            }, 2000);
        } catch (err) {
            console.error("Error submitting form:", err);
            if (err.response?.data?.errors) {
                // Format validation errors
                const errorMessages = Object.values(err.response.data.errors).flat().join(', ');
                setError(errorMessages || "Validation failed. Please check all required fields.");
            } else {
                setError(err.response?.data?.message || "An error occurred while submitting the form. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="organ organ-alive">
            <div id="live-donor" className="title linear-blue">
                <h2 className="text-center">Live Organ Donation Registration</h2>
            </div>
            
            <div  className="form-box-container">

                    <div className="form">
                        <form action="#" className="form-info" onSubmit= { handleSubmit } >
                            <div className="personal-info">
                                <div className="info-title">
                                    <FaUser  className="text-blue-500 text-2xl"/>
                                    <h3 className="text-2xl font-semibold">Personal Information</h3>
                                </div>
                                <div className="organ-form-group">
                                    <div>
                                        <label htmlFor="first-name">First Name</label>
                                        <input 
                                            type="text" 
                                            id="first-name" 
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            placeholder="Enter your first name" 
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="middle-name">Middle Name</label>
                                        <input 
                                            type="text" 
                                            id="middle-name" 
                                            name="middle_name"
                                            value={formData.middle_name}
                                            onChange={handleChange}
                                            placeholder="Enter your middle name" 
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="last-name">Last Name</label>
                                        <input 
                                            type="text" 
                                            id="last-name" 
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            placeholder="Enter your last name" 
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="organ-form-group">
                                    <div>
                                        <label htmlFor="email">Email Address</label>
                                        <input 
                                            type="email" 
                                            id="email" 
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="Enter your email" 
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="phone">Phone Number</label>
                                        <input 
                                            type="tel" 
                                            id="phone" 
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="Enter your phone number" 
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="organ-form-group">
                                    <div>
                                        <label htmlFor="birth-date">Date of Birth</label>
                                        <input 
                                            type="date" 
                                            id="birth-date" 
                                            name="birth_date"
                                            value={formData.birth_date}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="gender">Gender</label>
                                        <select 
                                            id="gender" 
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="" disabled>Select a Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="organ-form-group">
                                    <div>
                                        <label htmlFor="address">Address</label>
                                        <textarea 
                                            id="address" 
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            placeholder="Enter your address in detials.."
                                            required 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/*Helath Information*/}
                            <div className="personal-info">
                                <div className="info-title">
                                    <PiHeartbeatFill  className="text-blue-500 text-3xl"/>
                                    <h3 className="text-2xl font-semibold">Health Information</h3>
                                </div>
                                <div className="organ-form-group">
                                    <div>
                                        <label htmlFor="blood-type">Blood Type</label>
                                        <select 
                                            id="blood-type" 
                                            name="blood_type"
                                            value={formData.blood_type}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="" disabled>Select Blood Type</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                        </select>
                                    </div>
                                   <div>
                                        <label htmlFor="living-organ">Choose Organ</label>
                                        <select 
                                            id="living-organ" 
                                            name="living_organ"
                                            value={formData.living_organ}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="" disabled>Select organ</option>
                                            <option value="kidney">Kidney</option>
                                            <option value="liver-partial">Liver (Partial)</option>
                                            <option value="bone-marrow">Bone Marrow</option>
                                        </select>
                                    </div>
                                </div>

                                <p className="mb-4 mt-5">Please check any conditions that applies to you:</p>

                                <div className="organ-checkbox-group">
                                    <div>
                                        <label htmlFor="daibetes" >
                                            <input id="daibetes" name="health" type="checkbox" value="daibetes"
                                                onChange={ handleCheckboxChange } />
                                            Daibetes
                                        </label>
                                    </div>
                                    <div>
                                        <label htmlFor="kd-lv-ds" >
                                            <input id="kd-lv-ds" name="health" type="checkbox" value="kidney-liver-dis" 
                                                onChange={ handleCheckboxChange }
                                            />
                                            Kidney/Liver Disease
                                        </label>
                                    </div>
                                    <div>
                                        <label htmlFor="surg" >
                                            <input id="surg" name="health" type="checkbox" value="surgeries"
                                                onChange={ handleCheckboxChange }
                                            />
                                            Previous Major Surgeries
                                        </label>
                                    </div>
                                    <div>
                                        <label htmlFor="bld-press" >
                                            <input id="bld-press" name="health" type="checkbox" value="high-bld-press"
                                                onChange={ handleCheckboxChange }
                                            />
                                            High Blood Pressure
                                        </label>
                                    </div>
                                    <div>
                                        <label htmlFor="hiv" >
                                            <input id="hiv" name="health" type="checkbox" value="hiv" 
                                                onChange={ handleCheckboxChange }
                                            />
                                            Hepatitis/HIV
                                        </label>
                                    </div>
                                    <div>
                                        <label htmlFor="smkr" >
                                            <input id="smkr" name="health" type="checkbox" value="smoker"
                                                onChange={ handleCheckboxChange }
                                            />
                                            Current Smoker
                                        </label>
                                    </div>
                                </div>

                                {isDisqualified &&
                                    <p style={{ color: "red" }}>
                                    ⚠️ Not eligible due to medical conditions
                                    </p>
                                }
                            </div>

                            {/*Donation Type*/}
                            <div className="personal-info">
                                <div className="info-title">
                                    <PiHeartbeatFill  className="text-blue-500 text-3xl"/>
                                    <h3 className="text-2xl font-semibold">Donation Type</h3>
                                </div>
                                <div className="organ-form-group">
                                    <div className="donation-type">
                                        <label>
                                            <input
                                                type="radio"
                                                name="donationType"
                                                value="direct-donation"
                                                checked={formData.donationType === 'direct-donation'}
                                                onChange={handleChange}
                                                required
                                            />
                                            <div>
                                                <p>Directed Donation</p>
                                                <p>Donate to a specific person you know</p>
                                            </div>
                                        </label>

                                        <label>
                                            <input
                                                type="radio"
                                                name="donationType"
                                                value="non-direct-donation"
                                                checked={formData.donationType === 'non-direct-donation'}
                                                onChange={handleChange}
                                                required
                                            />
                                            <div>
                                                <p>Non-Directed Donation</p>
                                                <p>Donate to someone on the waiting list</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="agreement">
                                <label >
                                <input 
                                    type="checkbox" 
                                    name="agree_intrest"
                                    checked={formData.agree_intrest}
                                    onChange={handleChange}
                                    required 
                                />
                                <div>
                                    <h3 className="text-bold">I understand this is an expression of interest only. Final approval is done by hospital doctors and legal authorities.</h3>
                                    <h3 className="text-[13px] text-light">By checking this box, I consent to being contacted by partner hospitals for further evaluation.</h3>
                                </div>
                                </label>
                            </div>

                            <div className="line"></div>

                            {error && (
                                <div style={{ 
                                    padding: '15px', 
                                    backgroundColor: '#fee', 
                                    color: '#c33', 
                                    borderRadius: '5px', 
                                    marginBottom: '20px' 
                                }}>
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div style={{ 
                                    padding: '15px', 
                                    backgroundColor: '#efe', 
                                    color: '#3c3', 
                                    borderRadius: '5px', 
                                    marginBottom: '20px' 
                                }}>
                                    ✓ Pledge submitted successfully! Redirecting...
                                </div>
                            )}

                            <div className="form-action">
                                <button 
                                    type="submit" 
                                    className="next-step-btn organ-btn linear-blue position-middle"
                                    disabled = {isDisqualified || loading}
                                > 
                                    {loading ? "Submitting..." : (
                                        <>
                                            <IoIosSend/> Send Request
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
        </section>
    )
}