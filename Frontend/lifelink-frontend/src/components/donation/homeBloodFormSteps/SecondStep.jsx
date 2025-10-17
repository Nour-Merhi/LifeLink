import { useNavigate } from "react-router-dom";
import ScrollToTop from "../../ScrollToTop";

import { useState, useEffect } from "react";

export default function SecondStep({ nextStep, prevStep, homeBloodFormData, setHomeBloodFormData }){
    const navigate = useNavigate();
    const [bloodType, setBloodType] = useState("");
    const [lastDonation, setLastDonation] = useState("");
    const [isAffected, setIsAffected] = useState(false);
    const [medicalConditions, setMedicalConditions] = useState({
        not_healthy: false,
        has_surgery: false,
        has_travel: false,
        take_medicine: false,
        has_disease: false,
    })

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
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!e.target.checkValidity()) {
            e.target.reportValidity(); 
            return;
        }

        setHomeBloodFormData((prev) => ({
            ...prev,
            medical_conditions: { ...medicalConditions },
            blood_type: bloodType,
            last_donation: lastDonation,
        }));
        nextStep();
    };

    useEffect(() => {
        setHomeBloodFormData((prev) => ({
            ...prev,
            medical_conditions: { ...medicalConditions },
            blood_type: bloodType,
            last_donation: lastDonation
        }));
    }, [medicalConditions, bloodType, lastDonation]);

    
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
                                        value={ bloodType} 
                                        onChange={(e)=> (setBloodType(e.target.value))} 
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
                                        onChange={ (e)=> (setLastDonation(e.target.value)) } 
                                        type="date" 
                                        id="last-donation"
                                        value={ homeBloodFormData.last_donation || lastDonation} 
                                    required/>
                                </div>
                            </div>

                            <div className="yes-no-questions">
                                <div className="questions">
                                    <p>Are you feeling healthy today (no fever, cough, or flu symptoms)?</p>
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
                                                 checked={medicalConditions.not_healthy === false} 
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
                                                checked={medicalConditions.has_surgery === false} 
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
                                                checked={medicalConditions.has_tarvel === false} 
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
                                                checked={medicalConditions.take_medicine === false}
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
                                                checked={medicalConditions.has_disease === false}
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
                                        onClick = { prevStep }
                                    >Previous</button>
                                
                                <div>
                                    <button type="button" className="cancel-btn"
                                        onClick={
                                            ()=> navigate("/donation/home-blood-donation")
                                        }
                                    >Cancel</button>
                                    <button 
                                        type="submit" 
                                        className="next-step-btn color" 
                                        disabled = { isAffected } 
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