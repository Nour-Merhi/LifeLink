import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { IoMdHeart } from "react-icons/io";

export default function AliveOrganFormStepThree({ setThankMess, prevStep }){
    const location = useLocation();
    const navigate = useNavigate();


    const [maritalState, setMartialState] = useState("")
    const [profState, setProfState] = useState ("")
    const [fileName, setFileName] = useState("");

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
        setFileName(e.target.files[0].name);
        }
    };


    const handleSubmit = (e) => {
        e.preventDefault();

        if (!e.target.checkValidity()) {
            e.target.reportValidity();
            return;
        }

        setThankMess(true);
    };

    return(
        <section className="organ donation-section">
            <div className="container">
               <div className="steps">
                    <div className="step">
                        <div className="step-at">
                            <span className="span linear-blue">G</span>
                            <div className="small-line linear-blue"></div>
                        </div>
                        <small>Genral Info</small>
                    </div>

                   <div className="step">
                        <div className="step-at">
                            <span className="span linear-blue">P</span>
                            <div className="small-line linear-blue"></div>
                        </div>
                        <small>Personal Info</small>
                    </div>

                    <div className="step">
                        <div className="step-at">
                            <span className="span linear-blue">O</span>
                        </div>
                        <small>Organ Submission</small>
                    </div>
               </div>

               <div className="title linear-blue">
                    <h2 className="text-center">Organ and Tissues to Donate</h2>
                </div>

               <div className="form-container">
                    {/* Form Starts Here */}
                    <div>
                        <form action="#" className="form" onSubmit= { handleSubmit }>
                            <div className="form-group">
                                
                                    <p className="declare">I declare, in full possession of my mental faculties and my own free will, that I donate after my death:</p>
                                
                            </div>
                            <div className="form-group">
                                 <div>
                                    <div className="organ-donate">
                                        <label htmlFor="heart" >
                                            <input type="checkbox" id="heart" name="heart"/>
                                            Heart
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <div className="organ-donate">
                                        <label htmlFor="corneas" >
                                            <input type="checkbox" id="corneas" name="heart"/>
                                            Corneas
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                 <div>
                                    <div className="organ-donate">
                                        <label htmlFor="liver" >
                                            <input type="checkbox" id="liver" name="heart"/>
                                            Liver
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <div className="organ-donate">
                                        <label htmlFor="skin" >
                                            <input type="checkbox" id="skin" name="heart"/>
                                            Skin
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                 <div>
                                    <div className="organ-donate">
                                        <label htmlFor="kidneys" >
                                            <input type="checkbox" id="kidneys" name="heart"/>
                                            Kidneys
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <div className="organ-donate">
                                        <label htmlFor="bones" >
                                            <input type="checkbox" id="bones" name="heart"/>
                                            Bones
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                 <div>
                                    <div className="organ-donate">
                                        <label htmlFor="lungs" >
                                            <input type="checkbox" id="lungs" name="heart"/>
                                            Lungs
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <div className="organ-donate">
                                        <label htmlFor="valves" >
                                            <input type="checkbox" id="valves" name="heart"/>
                                            Valves
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                 <div>
                                    <div className="organ-donate">
                                        <label htmlFor="pancrease" >
                                            <input type="checkbox" id="pancrease" name="heart"/>
                                            Pancrease
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <div className="organ-donate">
                                        <label htmlFor="tendons" >
                                            <input type="checkbox" id="tendons" name="heart"/>
                                            Tendons
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                 <div>
                                    <div className="organ-donate">
                                        <label htmlFor="intestines" >
                                            <input type="checkbox" id="intestines" name="heart"/>
                                            Intestines
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <div className="organ-donate">
                                        <label htmlFor="blood-vessels" >
                                            <input type="checkbox" id="blood-vesseles" name="heart"/>
                                            Blood Vessels
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                <div>
                                    <div className="organ-donate last-child">
                                        <label htmlFor="all-organs" >
                                            <input type="checkbox" id="all-organs" name="heart"/>
                                            Donate all organs and tissues
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="what-next">
                                <div>
                                    <IoMdHeart className="text-gray-400"/>
                                    <h3> What Happens Next ?</h3>
                                </div>
                                <div className="list">
                                    <ul>
                                        <li>You'll receive an email with your registration details</li>
                                        <li>Our team will review your application within 24 hours</li>
                                        <li>If eligible, you'll be contacted for your approval via email and be added to the wait list for “After Death Hero Donors</li>
                                    </ul>
                                    
                                </div>

                            </div>

                            <div className="line"></div>

                            <div className="buttons-align">
                                <button type="button" className="cancel-btn prev-btn"
                                        onClick={ prevStep }
                                    >Previous</button>
                                
                                <div>
                                    <button type="button" className="cancel-btn"
                                        onClick={
                                            ()=> navigate("/donation/after-death-donation")
                                        }
                                    >Cancel</button>
                                    <button type="submit" className="next-step-btn linear-blue" >Complete Registration</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    )
}
