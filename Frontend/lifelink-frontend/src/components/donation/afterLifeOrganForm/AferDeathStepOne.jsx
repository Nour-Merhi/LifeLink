import { useNavigate } from "react-router-dom";
import ScrollToTop from "../../ScrollToTop";

export default function AfterDeathStepOne({ nextStep, afterDeathFormData, setAfterDeathFormData }){
    const navigate = useNavigate()
    

    const getAge = (e) => {
        const dob = e.target.value;
        const birth = new Date (dob);
        const today = new Date();

        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        setAfterDeathFormData(prev => ({...prev, dob, age}))
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Form submitted!");
        nextStep();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return(
        <>
        <ScrollToTop />

        <div className="title linear-blue">
            <h3 className="text-center">General Information</h3>
        </div>
        
        <div className="organ form-box-container" id="after-death-donor">

            <div className="form">
                <form action="#" className="form-info" onSubmit= { handleSubmit }>
                    <div className="form-group">
                        <div>
                            <label htmlFor="first-name">First Name</label>
                            <input type="text" id="first-name" name="first_name" placeholder="Enter your first name" required/>
                        </div>
                        <div>
                            <label htmlFor="middle-name">Middle Name</label>
                            <input type="text" id="middle-name" name="middle_name" placeholder="Enter your middle name" required/>
                        </div>
                        <div>
                            <label for="last-name">Last Name</label>
                            <input type="text" id="last-name" name="last_name" placeholder="Enter your last name" required/>
                        </div>
                    </div>
                    <div className="form-group">
                        <div>
                            <label for="email">Email Address</label>
                            <input type="email" id="email" name="email" placeholder="Enter your email" required/>
                        </div>
                        <div>
                            <label for="phone">Phone Number</label>
                            <input type="tel" id="phone" name="phone" placeholder="Enter your phone number" required/>
                        </div>
                    </div>
                    <div className="form-group">
                        <div>
                            <label htmlFor="birth-date">Date of Birth</label>
                            <input 
                                type="date" 
                                id="birth-date" 
                                name="birth_date"
                                value = { afterDeathFormData.dob }
                                onChange={ getAge }
                                required/>
                        </div>
                        <div>
                            <label for="gender">Gender</label>
                            <select id="gender">
                                <option value="" disabled selected>Select a Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
            
                    </div>
                    <div className="form-group">
                        <div>
                            <label for="address">Address</label>
                            <textarea id="address" placeholder="Enter your address in detials.."required />
                        </div>
                    </div>
                    <div className="form-group">
                        <div>
                            <label for="emergency-contact">Emergency Contact (optional)</label>
                            <input type="text" id="emergency-contact" placeholder="Enter emergency contact name"/>
                        </div>
                        <div>
                            <label for="emergency-contact-number">Emergency Contact Number (optional)</label>
                            <input type="tel" id="emergency-contact-number" placeholder="Enter emergency contact number"/>
                        </div>
                    </div>

                    <div className="line"></div>
                    <div className="form-actions">
                        <button type="submit" className="next-step-btn organ-btn linear-blue">Next Step</button>
                    </div>
                </form>
            </div>
        </div>
        </>
    )
}