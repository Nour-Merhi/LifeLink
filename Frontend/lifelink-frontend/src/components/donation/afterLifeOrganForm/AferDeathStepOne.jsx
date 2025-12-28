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

        setAfterDeathFormData(prev => ({...prev, birth_date: dob, age}))
    }

     const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validate required fields
        if (!afterDeathFormData.first_name || !afterDeathFormData.last_name || 
            !afterDeathFormData.email || !afterDeathFormData.phone || 
            !afterDeathFormData.birth_date || !afterDeathFormData.gender || 
            !afterDeathFormData.address || !afterDeathFormData.blood_type) {
            alert("Please fill in all required fields.");
            return;
        }
        
        // Data is already in state via controlled components, just proceed to next step
        nextStep();
    };

    return(
        <>
        <ScrollToTop />

        <div  id="after-death-donor" className="title linear-blue">
            <h3 className="text-center">General Information</h3>
        </div>
        
        <div className="organ form-box-container">

            <div className="form">
                <form action="#" className="form-info" onSubmit= { handleSubmit }>
                    <div className="form-group">
                        <div>
                            <label htmlFor="first-name">First Name</label>
                            <input 
                                type="text" 
                                id="first-name" 
                                name="first_name" 
                                value={afterDeathFormData.first_name || ""}
                                onChange={(e) => setAfterDeathFormData(prev => ({...prev, first_name: e.target.value}))}
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
                                value={afterDeathFormData.middle_name || ""}
                                onChange={(e) => setAfterDeathFormData(prev => ({...prev, middle_name: e.target.value}))}
                                placeholder="Enter your middle name" 
                            />
                        </div>
                        <div>
                            <label htmlFor="last-name">Last Name</label>
                            <input 
                                type="text" 
                                id="last-name" 
                                name="last_name" 
                                value={afterDeathFormData.last_name || ""}
                                onChange={(e) => setAfterDeathFormData(prev => ({...prev, last_name: e.target.value}))}
                                placeholder="Enter your last name" 
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <div>
                            <label htmlFor="email">Email Address</label>
                            <input 
                                type="email" 
                                id="email" 
                                name="email" 
                                value={afterDeathFormData.email || ""}
                                onChange={(e) => setAfterDeathFormData(prev => ({...prev, email: e.target.value}))}
                                placeholder="Enter your email" 
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="phone">Phone Number</label>
                            <input 
                                type="text" 
                                id="phone" 
                                name="phone" 
                                value={afterDeathFormData.phone || ""}
                                onChange={(e) => setAfterDeathFormData(prev => ({...prev, phone: e.target.value}))}
                                placeholder="Enter your phone number" 
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <div>
                            <label htmlFor="birth-date">Date of Birth</label>
                                <input 
                                type="date" 
                                id="birth-date" 
                                name="birth_date"
                                value = { afterDeathFormData.birth_date || "" }
                                onChange={ getAge }
                                required/>
                        </div>
                        <div>
                            <label htmlFor="gender">Gender</label>
                            <select id="gender" name="gender" value={afterDeathFormData.gender || ""} onChange={(e) => setAfterDeathFormData(prev => ({...prev, gender: e.target.value}))} required>
                                <option value="" disabled>Select a Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <div>
                            <label htmlFor="blood-type">Blood Type</label>
                            <select id="blood-type" name="blood-type" value={afterDeathFormData.blood_type || ""} onChange={(e) => setAfterDeathFormData(prev => ({...prev, blood_type: e.target.value}))} required>
                                <option value="" disabled>Select Blood Type</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <div>
                            <label htmlFor="address">Address</label>
                            <textarea 
                                id="address" 
                                name="address"
                                value={afterDeathFormData.address || ""}
                                onChange={(e) => setAfterDeathFormData(prev => ({...prev, address: e.target.value}))}
                                placeholder="Enter your address in detials.."
                                required 
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <div>
                            <label htmlFor="emergency-contact">Emergency Contact (optional)</label>
                            <input 
                                type="text" 
                                id="emergency-contact" 
                                name="emergency-contact"
                                value={afterDeathFormData.emergency_contact || ""}
                                onChange={(e) => setAfterDeathFormData(prev => ({...prev, emergency_contact: e.target.value}))}
                                placeholder="Enter emergency contact name"
                            />
                        </div>
                        <div>
                            <label htmlFor="emergency-contact-number">Emergency Contact Number (optional)</label>
                            <input 
                                type="text" 
                                id="emergency-contact-number" 
                                name="emergency-contact-number"
                                value={afterDeathFormData.emergency_contact_number || ""}
                                onChange={(e) => setAfterDeathFormData(prev => ({...prev, emergency_contact_number: e.target.value}))}
                                placeholder="Enter emergency contact number"
                            />
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