import { useNavigate } from "react-router-dom";
import ScrollToTop from "../../ScrollToTop";

import { useState, useEffect } from "react";

export default function SecondStep({ nextStep, prevStep, homeBloodFormData, setHomeBloodFormData, pageType = "home" }){
    const navigate = useNavigate();
    const [bloodType, setBloodType] = useState(homeBloodFormData.blood_type || "");
    const [lastDonation, setLastDonation] = useState(homeBloodFormData.last_donation || "");
    const [isAffected, setIsAffected] = useState(false);
    const [lastDonationError, setLastDonationError] = useState("");
    const [medicalConditions, setMedicalConditions] = useState(homeBloodFormData.medical_conditions || {
        not_healthy: false,
        has_surgery: false,
        has_travel: false,
        take_medicine: false,
        has_disease: false,
    });

   const handleChange = (e) => {
        const { name, value } = e.target;
        const updatedConditions = {
            ...medicalConditions,
            [name]: value === "yes"
        };
        setMedicalConditions(updatedConditions);

        // Determine if any disqualifying condition is true
        const hasDisqualifyingCondition =
            updatedConditions.not_healthy ||
            updatedConditions.has_surgery ||
            updatedConditions.has_travel ||
            updatedConditions.take_medicine ||
            updatedConditions.has_disease;

        setIsAffected(hasDisqualifyingCondition);
        
        // Save to localStorage immediately
        const updatedData = {
            ...homeBloodFormData,
            medical_conditions: updatedConditions,
            blood_type: bloodType,
            last_donation: lastDonation,
        };
        // Ensure email is always included (for user verification)
        if (!updatedData.email && homeBloodFormData.email) {
            updatedData.email = homeBloodFormData.email;
        }
        const formDataKey = pageType === "home" ? 'home_blood_form_data' : 'hospital_blood_form_data';
        localStorage.setItem(formDataKey, JSON.stringify(updatedData));
    };

    // Validate last donation date (must be at least 56 days ago)
    const validateLastDonation = (donationDate) => {
        if (!donationDate) {
            setLastDonationError("");
            return true; // Let HTML5 required validation handle empty
        }

        const lastDonationDate = new Date(donationDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
        lastDonationDate.setHours(0, 0, 0, 0);

        const daysSinceDonation = Math.floor((today - lastDonationDate) / (1000 * 60 * 60 * 24));

        if (daysSinceDonation < 56) {
            const daysRemaining = 56 - daysSinceDonation;
            setLastDonationError(`Thank you for your previous donation! For your safety and health, please wait ${daysRemaining} more day${daysRemaining !== 1 ? 's' : ''} before donating again. We appreciate your generosity and look forward to seeing you soon!`);
            return false;
        }

        setLastDonationError("");
        return true;
    };

    const handleLastDonationChange = (e) => {
        const value = e.target.value;
        setLastDonation(value);
        validateLastDonation(value);
        
        // Save to localStorage immediately
        const updatedData = {
            ...homeBloodFormData,
            medical_conditions: { ...medicalConditions },
            blood_type: bloodType,
            last_donation: value,
        };
        // Ensure email is always included (for user verification)
        if (!updatedData.email && homeBloodFormData.email) {
            updatedData.email = homeBloodFormData.email;
        }
        const formDataKey = pageType === "home" ? 'home_blood_form_data' : 'hospital_blood_form_data';
        localStorage.setItem(formDataKey, JSON.stringify(updatedData));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!e.target.checkValidity()) {
            e.target.reportValidity(); 
            return;
        }

        // Validate last donation date
        if (!validateLastDonation(lastDonation)) {
            return; // Don't proceed if validation fails
        }

        // Save to form data
        const updatedData = {
            ...homeBloodFormData,
            medical_conditions: { ...medicalConditions },
            blood_type: bloodType,
            last_donation: lastDonation,
        };
        // Ensure email is always included (for user verification)
        if (!updatedData.email && homeBloodFormData.email) {
            updatedData.email = homeBloodFormData.email;
        }
        
        setHomeBloodFormData(updatedData);
        
        // Save to localStorage for persistence
        localStorage.setItem('home_blood_form_data', JSON.stringify(updatedData));
        
        nextStep();
    };

    // Initialize from localStorage or homeBloodFormData on mount
    useEffect(() => {
        const formDataKey = pageType === "home" ? 'home_blood_form_data' : 'hospital_blood_form_data';
        const savedData = localStorage.getItem(formDataKey);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.blood_type) setBloodType(parsed.blood_type);
                if (parsed.last_donation) {
                    setLastDonation(parsed.last_donation);
                    // Validate on load
                    validateLastDonation(parsed.last_donation);
                }
                if (parsed.medical_conditions) setMedicalConditions(parsed.medical_conditions);
            } catch (e) {
                console.warn('Error parsing saved form data:', e);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    
    return(
        <section className="donation-section">
            <ScrollToTop />

            <div className="container">
               <div className="steps">
                    <div className="step">
                        <div className="step-at">
                            <span className="span active-step">1</span>
                            <div className="small-line active-step"></div>
                        </div>
                        <small>Personal Info</small>
                    </div>

                   <div className="step">
                        <div className="step-at">
                            <span className="span active-step">2</span>
                            <div className="small-line"></div>
                        </div>
                        <small>Medical Info</small>
                    </div>

                    <div className="step">
                        <div className="step-at">
                            <span className="span">3</span>
                        </div>
                        <small>Review & Submit</small>
                    </div>
               </div>

               <div className="form-box">
                        <div className="form-title"></div>
                        <h2>Medical Information</h2>
                </div>

               <div className="form-container">
                    {/* Form Starts Here */}
                    <div>
                        <form action="#" className="form" onSubmit= { handleSubmit }>
                            <div className="form-group">
                                <div>
                                    <label htmlFor="blood-type">Blood Type</label>
                                    <select 
                                        id="blood-type" 
                                        value={bloodType} 
                                        onChange={(e) => {
                                            setBloodType(e.target.value);
                                            // Save immediately to localStorage
                                            const updatedData = {
                                                ...homeBloodFormData,
                                                blood_type: e.target.value,
                                                medical_conditions: { ...medicalConditions },
                                                last_donation: lastDonation,
                                            };
                                            // Ensure email is always included (for user verification)
                                            if (!updatedData.email && homeBloodFormData.email) {
                                                updatedData.email = homeBloodFormData.email;
                                            }
                                            localStorage.setItem('home_blood_form_data', JSON.stringify(updatedData));
                                        }}
                                    required>
                                        <option value="" disabled>Select Blood Type</option>
                                        <option value="AB+">AB+</option>
                                        <option value="B+">B+</option>
                                        <option value="A+">A+</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                        <option value="A-">A-</option>
                                        <option value="B-">B-</option>
                                        <option value="AB-">AB-</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="last-donation">Last Donation</label>
                                    <input
                                        onChange={handleLastDonationChange}
                                        type="date" 
                                        id="last-donation"
                                        value={lastDonation} 
                                        max={new Date().toISOString().split('T')[0]} // Cannot be in the future
                                        required
                                    />
                                    {lastDonationError && (
                                        <p style={{ 
                                            color: "#dc2626", 
                                            marginTop: "8px", 
                                            fontSize: "14px",
                                            lineHeight: "1.5",
                                            padding: "10px",
                                            backgroundColor: "#fef2f2",
                                            borderRadius: "4px",
                                            border: "1px solid #fecaca"
                                        }}>
                                            {lastDonationError}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="yes-no-questions">
                                <div className="questions">
                                    <p>Are you feeling unhealthy today (fever, cough, or flu symptoms)?</p>
                                    <div className="yes-no">
                                        <label htmlFor="healthy-yes">
                                            <input 
                                                onChange = { handleChange }
                                                type="radio" 
                                                id="healthy-yes" 
                                                name="not_healthy" 
                                                value="yes"
                                                checked={medicalConditions.not_healthy === true} 
                                            required/>
                                            Yes</label>
                                        <label htmlFor="healthy-no">
                                            <input 
                                                onChange = { handleChange }
                                                type="radio" 
                                                id="healthy-no" 
                                                name="not_healthy" 
                                                value="no"
                                            required/>
                                            No</label>
                                        
                                    </div> 
                                </div>
                                    <div className="thin-line"></div>  

                                 <div className="questions">
                                    <p>Have you had surgery, a major illness, or hospitalization in the last 6 months?</p>
                                    <div className="yes-no">
                                        <label htmlFor="surgery-yes">
                                            <input 
                                                onChange = { handleChange }
                                                type="radio" 
                                                id="surgery-yes" 
                                                name="has_surgery" 
                                                value="yes"
                                                checked={medicalConditions.has_surgery === true}
                                            required/>
                                            Yes</label>
                                        <label htmlFor="surgery-no">
                                            <input 
                                                onChange = { handleChange }
                                                type="radio"  
                                                id="surgery-no" 
                                                name="has_surgery" 
                                                value="no"
                                            required/>
                                            No</label>
                                    </div>
                                </div>
                                    <div className="thin-line"></div>  

                                 <div className="questions">
                                    <p>Have you traveled outside the country or had any infectious disease in the past 3 months?</p>
                                    <div className="yes-no">
                                        <label htmlFor="travel-yes">
                                            <input 
                                                onChange = { handleChange }
                                                type="radio" 
                                                id="travel-yes" 
                                                name="has_travel" 
                                                value="yes"
                                                checked={medicalConditions.has_travel === true} 
                                            required/>
                                            Yes</label>
                                        <label htmlFor="travel-no">
                                            <input 
                                                onChange = { handleChange }
                                                type="radio" 
                                                id="travel-no" 
                                                name="has_travel" 
                                                value="no"
                                            required/>
                                            No</label>
                                    </div>
                                    
                                </div>
                                    <div className="thin-line"></div>  

                                 <div className="questions">
                                    <p>Are you currently taking antibiotics or medication for an ongoing illness?</p>
                                    <div className="yes-no">
                                        <label htmlFor="medicine-yes">
                                            <input 
                                                onChange = { handleChange }
                                                type="radio" 
                                                id="medicine-yes" 
                                                name="take_medicine" 
                                                value="yes" 
                                                checked={medicalConditions.take_medicine === true}
                                            required/>
                                            Yes</label>
                                        <label htmlFor="medicine-no">
                                            <input
                                                onChange = { handleChange } 
                                                type="radio" 
                                                id="medicine-no" 
                                                name="take_medicine" 
                                                value="no" 
                                            required/>
                                            No</label>
                                    </div>
                                    
                                </div>
                                    <div className="thin-line"></div>  


                                <div className="questions">
                                    <p>Have you ever had heart disease, hepatitis, HIV, or other blood-borne diseases?</p>
                                    <div className="yes-no">
                                        <label htmlFor="disease-yes">
                                            <input
                                                onChange = { handleChange } 
                                                type="radio" 
                                                id="disease-yes" 
                                                name="has_disease" 
                                                value="yes" 
                                                checked={medicalConditions.has_disease === true}
                                            required/>
                                            Yes</label>
                                        <label htmlFor="disease-no">
                                            <input 
                                                onChange = { handleChange }
                                                type="radio" 
                                                id="disease-no" 
                                                name="has_disease" 
                                                value="no" 
                                            required/>
                                            No</label>
                                    </div> 
                                </div>

                                {isAffected &&
                                    <p style={{ color: "red" }}>
                                    ⚠️ Not eligible due to medical conditions
                                    </p>
                                }

                            </div>
                          
                    
                            <div className="line"></div>

                            <div className="buttons-align">
                                <button type="button" className="cancel-btn prev-btn"
                                        onClick={() => {
                                            // Save current form data to localStorage before going back
                                            const updatedData = {
                                                ...homeBloodFormData,
                                                medical_conditions: { ...medicalConditions },
                                                blood_type: bloodType,
                                                last_donation: lastDonation,
                                            };
                                            // Ensure email is always included (for user verification)
                                            if (!updatedData.email && homeBloodFormData.email) {
                                                updatedData.email = homeBloodFormData.email;
                                            }
                                            setHomeBloodFormData(updatedData);
                                            localStorage.setItem('home_blood_form_data', JSON.stringify(updatedData));
                                            prevStep();
                                        }}
                                    >Previous</button>
                                
                                <div>
                                    <button type="button" className="cancel-btn"
                                        onClick={
                                            ()=> navigate(pageType === "home" ? "/donation/home-blood-donation" : "/donation/hospital-blood-donation")
                                        }
                                    >Cancel</button>
                                    <button 
                                        type="submit" 
                                        className="next-step-btn color" 
                                        disabled={isAffected || !!lastDonationError}
                                    >
                                        Next Step
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    )
}