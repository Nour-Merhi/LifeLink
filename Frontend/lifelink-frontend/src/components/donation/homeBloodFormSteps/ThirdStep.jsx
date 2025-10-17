import { useNavigate } from "react-router-dom"
import { useState } from "react";
import { IoHeart } from "react-icons/io5";

import ScrollToTop from "../../ScrollToTop";
import ThankModalHomeBlood from "../ThankModals/ThankModalHomeBlood";


export default function ThirdStep({ prevStep, pageType="home", homeBloodFormData }){
     const navigate = useNavigate()
     const [thankMessHome, setThankMessHome] = useState(false);

     const handleSubmit = (e) => {
        e.preventDefault();

        const prefix = pageType === "home" ? "home_" : "hospital_";
        localStorage.setItem("step", "hospitals");
        localStorage.removeItem("calendar");
        localStorage.removeItem("date");
        localStorage.removeItem("time");

        setThankMessHome(true);
     }

     const onClose = () => {
        setThankMessHome (false);
        navigate("/donation/home-blood-donation");
     }
     console.log(homeBloodFormData)
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
                                        <li>If eligible, you'll be contacted for approval</li>
                                        <li>A brief health screening will be conducted at visit</li>
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
                                                ()=> navigate("/donation/home-blood-donation")
                                            }
                                        >Cancel</button>
                                        <button type="submit" className="next-step-btn color">Submit</button>
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