import { useNavigate } from "react-router-dom"
import { useState } from "react";
import { IoHeart } from "react-icons/io5";
import api from "../../../api/axios";

import ScrollToTop from "../../ScrollToTop";
import ThankModalHomeBlood from "../ThankModals/ThankModalHomeBlood";


export default function ThirdStep({ prevStep, pageType = "home", homeBloodFormData }){
     const navigate = useNavigate()
     const [thankMessHome, setThankMessHome] = useState(false);
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState("");

     const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError("");

        try {
            // Ensure all required fields are present
            const formDataToSend = {
                ...homeBloodFormData,
                date_of_birth: homeBloodFormData.date_of_birth || '',
                hospital_id: homeBloodFormData.hospital_id || null,
                appointment_date: homeBloodFormData.appointment_date || '',
                appointment_time: homeBloodFormData.appointment_time || '',
                medical_conditions: homeBloodFormData.medical_conditions || {}
            };

            // For hospital appointments, remove address-related fields as they're not needed
            if (pageType === "hospital") {
                delete formDataToSend.address;
                delete formDataToSend.latitude;
                delete formDataToSend.longitude;
            }

            console.log('Submitting form data:', formDataToSend);
            console.log('Page type:', pageType);
            console.log('Page type check (pageType === "hospital"):', pageType === "hospital");

            // Send all data to backend - use different endpoint based on pageType
            const endpoint = pageType === "hospital" 
                ? '/api/hospital/appointments' 
                : '/api/blood/home_appointment';
            
            console.log('Using endpoint:', endpoint);
            const response = await api.post(endpoint, formDataToSend);

            console.log(`${pageType === "hospital" ? "Hospital" : "Home"} appointment created:`, response.data);

            // Clear localStorage only on successful submission
            const prefix = pageType === "home" ? "home_" : "hospital_";
            const formDataKey = pageType === "home" ? 'home_blood_form_data' : 'hospital_blood_form_data';
            localStorage.setItem(prefix + "step", "hospitals");
            localStorage.removeItem(prefix + "hospital");
            localStorage.removeItem(prefix + "date");
            localStorage.removeItem(prefix + "appointment_time");
            // Backward compat: older key
            localStorage.removeItem("appointment_time");
            localStorage.removeItem(formDataKey); // Clear form data

            setThankMessHome(true);
        } catch (err) {
            console.error('Error submitting home appointment:', err);
            console.error('Error response:', err.response?.data);
            
            // Handle validation errors
            if (err.response?.status === 422 && err.response?.data?.errors) {
                const validationErrors = err.response.data.errors;
                const errorMessages = Object.keys(validationErrors)
                    .map(key => `${key}: ${validationErrors[key].join(', ')}`)
                    .join('\n');
                
                const errorMessage = `Validation Errors:\n${errorMessages}`;
                setError(errorMessage);
                alert(errorMessage);
            } else {
                // Get detailed error message from backend
                const errorMessage = err.response?.data?.error 
                    || err.response?.data?.message 
                    || err.message 
                    || `Failed to submit ${pageType === "hospital" ? "hospital" : "home"} appointment. Please try again.`;
                
                console.error('Full error details:', {
                    message: errorMessage,
                    type: err.response?.data?.type,
                    details: err.response?.data?.details,
                    status: err.response?.status
                });
                
                setError(errorMessage);
                alert(`Error: ${errorMessage}`);
            }
        } finally {
            setLoading(false);
        }
     }

     const onClose = () => {
        setThankMessHome (false);
        navigate(pageType === "hospital" ? "/donation/hospital-blood-donation" : "/donation/home-blood-donation");
     }
     
    return (
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
                            <div className="small-line active-step"></div>
                        </div>
                        <small>Medical Info</small>
                    </div>

                    <div className="step">
                        <div className="step-at">
                            <span className="span active-step">3</span>
                        </div>
                        <small>Review & Submit</small>
                    </div>
               </div>

               <div className="form-box">
                    <div className="form-title"></div>
                    <h2>Review and Submit</h2>
                </div>
                
                    <div className="form-container">
                    
                        <div>
                            <form action="#" className="form" onSubmit= { handleSubmit }>
                                <div className="form-group">
                                    <div className="info-box">
                                        <div className="check-box">
                                            <input type="checkbox" id="consent" name="consent" value="consent" required/>
                                            <label htmlFor="consent">I consent to donate blood and confirm that the information provided is accurate to the best of my knowledge.</label>
                                        </div>
                                        <div className="check-box">
                                            <input type="checkbox" id="terms" name="terms" value="terms" required/>
                                            <label htmlFor="terms">I agree to the <span className="text-red-500">Terms & Conditions</span> of the blood donation service.</label>
                                        </div>
                                    </div>
                                </div>

                                <div className="whats-next">
                                    <div>
                                        <IoHeart className="text-red-400 "/>
                                        <h3 className="font-semibold m-1">What Happens Next?</h3>
                                    </div>
                                    <ul>
                                        <li>You'll receive an email with your registration details</li>
                                        <li>Our team will review your application within 24 hours</li>
                                        <li>A brief health screening will be conducted before the donation</li>
                                    </ul>
                                    
                                </div>

                                <div className="line"></div>

                                <div className="buttons-align">
                                    <button type="button" className="cancel-btn prev-btn"
                                            onClick = { prevStep }
                                        >Previous</button>
                                    
                                    <div>
                                        <button type="button" className="cancel-btn"
                                            onClick={
                                                ()=> navigate(pageType === "hospital" ? "/donation/hospital-blood-donation" : "/donation/home-blood-donation")
                                            }
                                        >Cancel</button>
                                        <button 
                                            type="submit" 
                                            className="next-step-btn color"
                                            disabled={loading}
                                        >
                                            {loading ? "Submitting..." : "Submit"}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {thankMessHome && 
                    <ThankModalHomeBlood  onClose={ onClose }/>
                }
        
        </section>
    )
}