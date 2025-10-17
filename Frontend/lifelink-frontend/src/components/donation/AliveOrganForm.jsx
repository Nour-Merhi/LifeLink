import { IoIosSend } from "react-icons/io";
import { FaUser } from "react-icons/fa6";
import { PiHeartbeatFill } from "react-icons/pi";

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom";

export default function AliveOragnForm(){
    const navigate = useNavigate();
    const [isChecked, setIsChecked] = useState([]);
    
    const disqualifiedConditions = [
        "daibetes",
        "kidney-liver-dis",
        "surgeries",
        "high-bld-press",
        "hiv",
        "smoker"
    ]

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


     const handleSubmit = (e) => {
        e.preventDefault();

        console.log("Form submitted!");
        navigate("/donation");
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
                                        <input type="text" id="first-name" placeholder="Enter your first name" required/>
                                    </div>
                                    <div>
                                        <label htmlFor="middle-name">Middle Name</label>
                                        <input type="text" id="middle-name" placeholder="Enter your middle name" required/>
                                    </div>
                                    <div>
                                        <label htmlFor="last-name">Last Name</label>
                                        <input type="text" id="last-name" placeholder="Enter your last name" required/>
                                    </div>
                                </div>
                                <div className="organ-form-group">
                                    <div>
                                        <label htmlFor="email">Email Address</label>
                                        <input type="email" id="email" placeholder="Enter your email" required/>
                                    </div>
                                    <div>
                                        <label htmlFor="phone">Phone Number</label>
                                        <input type="tel" id="phone" placeholder="Enter your phone number" required/>
                                    </div>
                                </div>
                                <div className="organ-form-group">
                                    <div>
                                        <label htmlFor="birth-date">Date of Birth</label>
                                        <input type="date" id="birth-date" required/>
                                    </div>
                                    <div>
                                        <label htmlFor="gender">Gender</label>
                                        <select id="gender">
                                            <option value="" disabled selected>Select a Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="organ-form-group">
                                    <div>
                                        <label htmlFor="address">Address</label>
                                        <textarea id="address" placeholder="Enter your address in detials.."required />
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
                                        <select id="blood-type" required>
                                            <option value="" disabled selected>Select Blood Type</option>
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
                                        <select id="living-organ" required>
                                            <option  value="" disabled selected>Select organ</option>
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
                                <input type="checkbox" value="agree-intrest" required />
                                <div>
                                    <h3 className="text-bold">I understand this is an expression of interest only. Final approval is done by hospital doctors and legal authorities.</h3>
                                    <h3 className="text-[13px] text-light">By checking this box, I consent to being contacted by partner hospitals for further evaluation.</h3>
                                </div>
                                </label>
                            </div>

                            <div className="line"></div>

                            <div className="form-action">
                                <button 
                                    type="submit" 
                                    className="next-step-btn organ-btn linear-blue position-middle"
                                    disabled = {isDisqualified}
                                > 
                                    <IoIosSend/> Send Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
        </section>
    )
}