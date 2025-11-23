import { useNavigate } from "react-router-dom";
import ScrollToTop from "../../ScrollToTop";

export default function FirstStep({ nextStep, homeBloodFormData, setHomeBloodFormData }){
     const navigate = useNavigate()

     const handleSubmit = (e) => {
         e.preventDefault();
        if (!e.target.checkValidity()) {
            e.target.reportValidity(); 
            return;
        }
        
        nextStep();
     }

     const handleChange = (e) => {
        const {name, value} = e.target;
        setHomeBloodFormData ((prev) => ({...prev, [name]: value}));
     }

    return (
        <section className="donation-section">
            <ScrollToTop />
            
            <div className="container">
               <div className="steps">
                    <div className="step">
                        <div className="step-at">
                            <span className="span active-step">1</span>
                            <div className="small-line"></div>
                        </div>
                        <small>Personal Info</small>
                    </div>
                   <div className="step">
                        <div className="step-at">
                            <span className="span">2</span>
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
                        <h2>Personal Information</h2>
                    </div>
               <div className="form-container">
                    
                    <div>
                        <form action="#" className="form" onSubmit= { handleSubmit }>
                            <div className="form-group">
                                <div>
                                    <label htmlFor="first-name">First Name</label>
                                    <input 
                                        onChange={ handleChange }
                                        type="text" 
                                        id="first-name"
                                        name="first_name"
                                        value = { homeBloodFormData.first_name || "" }
                                        placeholder="Enter your first name" 
                                    required/>
                                </div>
                                <div>
                                    <label for="last-name">Last Name</label>
                                    <input 
                                        onChange={ handleChange }
                                        type="text" 
                                        id="last-name"
                                        name="last_name"
                                        value = { homeBloodFormData.last_name || "" }
                                        placeholder="Enter your last name" 
                                    required/>
                                </div>
                            </div>
                            <div className="form-group">
                                <div>
                                    <label for="email">Email Address</label>
                                    <input 
                                        onChange={ handleChange }
                                        type="email" 
                                        id="email" 
                                        name ="email"
                                        value = { homeBloodFormData.email || "" }
                                        placeholder="Enter your email" 
                                    required/>
                                </div>
                                <div>
                                    <label for="phone">Phone Number</label>
                                    <input 
                                        onChange={ handleChange }
                                        type="tel" 
                                        id="phone" 
                                        name="phone_nb"
                                        value = { homeBloodFormData.phone_nb || "" }
                                        placeholder="Enter your phone number" 
                                    required/>
                                </div>
                            </div>
                            <div className="form-group">
                                <div>
                                    <label for="birth-date">Date of Birth</label>
                                    <input 
                                        onChange={ handleChange }
                                        type="date" 
                                        id="birth-date" 
                                        name="date_of_birth"
                                        value = { homeBloodFormData.date_of_birth || "" }
                                    required/>
                                </div>
                                <div>
                                    <label htmlFor="gender">Gender</label>
                                    <select id="gender" name="gender" onChange={ handleChange }>
                                        <option value="" disabled>Select a Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                                <div>
                                    <label for="weight">Weight (kg)</label>
                                    <input 
                                        onChange={ handleChange } 
                                        name="weight" 
                                        type="number"
                                        id="weight"
                                        value = { homeBloodFormData.weight || "" } 
                                        placeholder="Must be over 50kg"
                                        min="50" 
                                    required/>
                                </div>
                            </div>
                            <div className="form-group">
                                <div>
                                    <label for="address">Address</label>
                                    <textarea 
                                        onChange={ handleChange }
                                        id="address" 
                                        name="address"
                                        value = { homeBloodFormData.address || "" }
                                        placeholder="Enter your address in detials.."
                                    required />
                                </div>
                            </div>
                            <div className="form-group">
                                <div>
                                    <label for="emergency-contact">Emergency Contact (optional)</label>
                                    <input
                                        onChange={ handleChange } 
                                        type="text" 
                                        id="emergency-contact"
                                        name="emerg_contact"
                                        value = { homeBloodFormData.emerg_contact || "" } 
                                        placeholder="Enter emergency contact name"
                                    />
                                </div>
                                <div>
                                    <label for="emergency-contact-number">Emergency Contact Number (optional)</label>
                                    <input 
                                        onChange={ handleChange }
                                        type="tel" 
                                        id="emergency-contact-number" 
                                        name="emerg_phone"
                                        value = { homeBloodFormData.emerg_phone || "" }
                                        placeholder="Enter emergency contact number"
                                    />
                                </div>
                            </div>

                            <div className="line"></div>
                            <div className="form-actions">
                                <button type="button" className="cancel-btn"
                                    onClick={
                                        ()=> navigate("/donation/home-blood-donation")
                                    }
                                >Cancel</button>
                                <button type="submit" className="next-step-btn color" >Next Step</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    )
}