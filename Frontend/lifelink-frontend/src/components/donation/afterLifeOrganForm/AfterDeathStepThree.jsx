import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../../api/axios";

import { IoMdHeart } from "react-icons/io";

export default function AliveOrganFormStepThree({ setThankMess, prevStep, afterDeathFormData, setAfterDeathFormData, onReset }){
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [hospitals, setHospitals] = useState([]);
    const [loadingHospitals, setLoadingHospitals] = useState(false);
    const [hospitalSelection, setHospitalSelection] = useState(
        afterDeathFormData.hospital_selection || "general"
    );
    const [selectedHospitalId, setSelectedHospitalId] = useState(
        afterDeathFormData.hospital_id || ""
    );
    
    // List of all organ IDs (excluding all-organs)
    const allOrganIds = [
        'heart', 'corneas', 'liver', 'skin', 'kidneys', 'bones', 
        'lungs', 'valves', 'pancrease', 'tendons', 'intestines', 'blood-vesseles'
    ];
    
    // State to track selected organs
    const [selectedOrgans, setSelectedOrgans] = useState({
        heart: false,
        corneas: false,
        liver: false,
        skin: false,
        kidneys: false,
        bones: false,
        lungs: false,
        valves: false,
        pancrease: false,
        tendons: false,
        intestines: false,
        'blood-vesseles': false,
        'all-organs': false
    });

    // State to hold form data for submission
    const [formDataState, setFormDataState] = useState(null);

    // Fetch hospitals on component mount
    useEffect(() => {
        fetchHospitals();
    }, []);

    const fetchHospitals = async () => {
        setLoadingHospitals(true);
        try {
            const response = await api.get("/api/hospital");
            if (response.data && Array.isArray(response.data)) {
                setHospitals(response.data);
            } else if (response.data.hospitals && Array.isArray(response.data.hospitals)) {
                setHospitals(response.data.hospitals);
            }
        } catch (err) {
            console.error("Error fetching hospitals:", err);
            // Try alternative endpoint
            try {
                const altResponse = await api.get("/api/admin/dashboard/get-hospitals");
                if (altResponse.data && altResponse.data.hospitals) {
                    setHospitals(altResponse.data.hospitals);
                }
            } catch (altErr) {
                console.error("Error fetching hospitals from alternative endpoint:", altErr);
            }
        } finally {
            setLoadingHospitals(false);
        }
    };

    // Handle individual organ checkbox change
    const handleOrganChange = (organId, checked) => {
        if (organId === 'all-organs') {
            // If "all-organs" is checked, check all others
            if (checked) {
                const newState = {};
                allOrganIds.forEach(id => {
                    newState[id] = true;
                });
                newState['all-organs'] = true;
                setSelectedOrgans(newState);
            } else {
                // If "all-organs" is unchecked, uncheck all
                const newState = {};
                allOrganIds.forEach(id => {
                    newState[id] = false;
                });
                newState['all-organs'] = false;
                setSelectedOrgans(newState);
            }
        } else {
            // Handle individual organ checkbox
            const newState = { ...selectedOrgans, [organId]: checked };
            
            // Check if all individual organs are selected
            const allIndividualSelected = allOrganIds.every(id => {
                if (id === organId) return checked; // Use the new checked value
                return newState[id];
            });
            
            newState['all-organs'] = allIndividualSelected;
            setSelectedOrgans(newState);
        }
    };

    // Function to build FormData from state
    const buildFormData = () => {
        // Collect organ selections from state
        const organsToSubmit = [];
        if (selectedOrgans['all-organs']) {
            // If "all-organs" is selected, include it
            organsToSubmit.push('all-organs');
        } else {
            // Otherwise, include only individually selected organs
            allOrganIds.forEach(organId => {
                if (selectedOrgans[organId]) {
                    organsToSubmit.push(organId);
                }
            });
        }

        // Prepare FormData for file uploads
        const formData = new FormData();
        
        // Step 1 data
        formData.append('first_name', afterDeathFormData.first_name);
        if (afterDeathFormData.middle_name) {
            formData.append('middle_name', afterDeathFormData.middle_name);
        }
        formData.append('last_name', afterDeathFormData.last_name);
        formData.append('email', afterDeathFormData.email);
        formData.append('phone', afterDeathFormData.phone);
        formData.append('birth_date', afterDeathFormData.birth_date);
        formData.append('gender', afterDeathFormData.gender);
        formData.append('address', afterDeathFormData.address);
        if (afterDeathFormData.emergency_contact) {
            formData.append('emergency_contact', afterDeathFormData.emergency_contact);
        }
        if (afterDeathFormData.emergency_contact_number) {
            formData.append('emergency_contact_number', afterDeathFormData.emergency_contact_number);
        }
        
        // Step 2 data
        formData.append('marital_status', afterDeathFormData.marital_status);
        formData.append('education_level', afterDeathFormData.education_level);
        formData.append('professional_status', afterDeathFormData.professional_status);
        if (afterDeathFormData.work_type) {
            formData.append('work_type', afterDeathFormData.work_type);
        }
        if (afterDeathFormData.mother_name) {
            formData.append('mother_name', afterDeathFormData.mother_name);
        }
        if (afterDeathFormData.spouse_name) {
            formData.append('spouse_name', afterDeathFormData.spouse_name);
        }
        
        // Files - id_photo is required
        formData.append('id_photo', afterDeathFormData.id_photo);
        if (afterDeathFormData.father_id_photo) {
            formData.append('father_id_photo', afterDeathFormData.father_id_photo);
        }
        if (afterDeathFormData.mother_id_photo) {
            formData.append('mother_id_photo', afterDeathFormData.mother_id_photo);
        }
        
        // Step 3 data - organs
        organsToSubmit.forEach(organ => {
            formData.append('pledged_organs[]', organ);
        });
        
        // Blood type (required)
        formData.append('blood_type', afterDeathFormData.blood_type);

        // Hospital selection
        formData.append('hospital_selection', hospitalSelection);
        if (hospitalSelection === 'specific' && selectedHospitalId) {
            formData.append('hospital_id', selectedHospitalId);
        }

        return formData;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // Validate required fields before submission
            if (!afterDeathFormData.first_name || !afterDeathFormData.last_name || !afterDeathFormData.email || 
                !afterDeathFormData.phone || !afterDeathFormData.birth_date || !afterDeathFormData.gender || 
                !afterDeathFormData.address || !afterDeathFormData.blood_type) {
                setError("Please complete all required fields in Step 1.");
                setLoading(false);
                return;
            }

            if (!afterDeathFormData.marital_status || !afterDeathFormData.education_level || 
                !afterDeathFormData.professional_status || !afterDeathFormData.id_photo) {
                setError("Please complete all required fields in Step 2, including uploading your ID photo.");
                setLoading(false);
                return;
            }

            // Check if at least one organ is selected
            const hasSelectedOrgans = selectedOrgans['all-organs'] || 
                allOrganIds.some(organId => selectedOrgans[organId]);
            
            if (!hasSelectedOrgans) {
                setError("Please select at least one organ to donate.");
                setLoading(false);
                return;
            }

            // Validate hospital selection if specific is chosen
            if (hospitalSelection === 'specific' && !selectedHospitalId) {
                setError("Please select a hospital or choose general donation.");
                setLoading(false);
                return;
            }

            // Build FormData from state
            const formData = buildFormData();
            
            // Update formDataState
            setFormDataState(formData);

            const response = await api.post(
                "/api/organ/after-death-pledge",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        "Accept": "application/json",
                    },
                }
            );

            // Reset selected organs state
            setSelectedOrgans({
                heart: false,
                corneas: false,
                liver: false,
                skin: false,
                kidneys: false,
                bones: false,
                lungs: false,
                valves: false,
                pancrease: false,
                tendons: false,
                intestines: false,
                'blood-vesseles': false,
                'all-organs': false
            });
            setThankMess(true);
        } catch (err) {
            console.error("Error submitting form:", err);
            if (err.response?.data?.errors) {
                // Format validation errors
                const errorMessages = Object.values(err.response.data.errors).flat().join(', ');
                setError(errorMessages || "Validation failed. Please check all required fields.");
            } else {
                setError(err.response?.data?.message || "An error occurred while submitting the pledge. Please try again.");
            }
        } finally {
            setLoading(false);
        }
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
                            {/* Hospital Selection */}
                            <h3 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '500' }}>
                                Hospital Selection
                            </h3>
                            <div className="hospital-selection">
                                <div className="hospital-selection-options">
                                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="hospital_selection"
                                            value="general"
                                            checked={hospitalSelection === 'general'}
                                            onChange={(e) => {
                                                setHospitalSelection(e.target.value);
                                                setSelectedHospitalId("");
                                            }}
                                            style={{ marginRight: '8px', cursor: 'pointer' }}
                                        />
                                        General Donation (not specific to a hospital)
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="hospital_selection"
                                            value="specific"
                                            checked={hospitalSelection === 'specific'}
                                            onChange={(e) => setHospitalSelection(e.target.value)}
                                            style={{ marginRight: '8px', cursor: 'pointer' }}
                                        />
                                        Select Specific Hospital
                                    </label>
                                </div>
                                {hospitalSelection === 'specific' && (
                                    <div style={{ marginTop: '15px' }}>
                                        <label htmlFor="after-death-hospital" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                            Hospital
                                        </label>
                                        <select
                                            id="after-death-hospital"
                                            value={selectedHospitalId}
                                            onChange={(e) => setSelectedHospitalId(e.target.value)}
                                            required={hospitalSelection === 'specific'}
                                            disabled={loadingHospitals}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                fontSize: '14px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                backgroundColor: loadingHospitals ? '#f5f5f5' : 'white'
                                            }}
                                        >
                                            <option value="" disabled>
                                                {loadingHospitals ? 'Loading hospitals...' : 'Select Hospital'}
                                            </option>
                                            {hospitals.map(hospital => (
                                                <option key={hospital.id} value={hospital.id}>
                                                    {hospital.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <p className="declare">I declare, in full possession of my mental faculties and my own free will, that I donate after my death:</p>
                            </div>
                            <div className="form-group">
                                 <div>
                                    <div className="organ-donate">
                                        <label htmlFor="heart" >
                                            <input 
                                                type="checkbox" 
                                                id="heart" 
                                                name="heart"
                                                checked={selectedOrgans.heart}
                                                onChange={(e) => handleOrganChange('heart', e.target.checked)}
                                            />
                                            Heart
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <div className="organ-donate">
                                        <label htmlFor="corneas" >
                                            <input 
                                                type="checkbox" 
                                                id="corneas" 
                                                name="heart"
                                                checked={selectedOrgans.corneas}
                                                onChange={(e) => handleOrganChange('corneas', e.target.checked)}
                                            />
                                            Corneas
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                 <div>
                                    <div className="organ-donate">
                                        <label htmlFor="liver" >
                                            <input 
                                                type="checkbox" 
                                                id="liver" 
                                                name="heart"
                                                checked={selectedOrgans.liver}
                                                onChange={(e) => handleOrganChange('liver', e.target.checked)}
                                            />
                                            Liver
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <div className="organ-donate">
                                        <label htmlFor="skin" >
                                            <input 
                                                type="checkbox" 
                                                id="skin" 
                                                name="heart"
                                                checked={selectedOrgans.skin}
                                                onChange={(e) => handleOrganChange('skin', e.target.checked)}
                                            />
                                            Skin
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                 <div>
                                    <div className="organ-donate">
                                        <label htmlFor="kidneys" >
                                            <input 
                                                type="checkbox" 
                                                id="kidneys" 
                                                name="heart"
                                                checked={selectedOrgans.kidneys}
                                                onChange={(e) => handleOrganChange('kidneys', e.target.checked)}
                                            />
                                            Kidneys
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <div className="organ-donate">
                                        <label htmlFor="bones" >
                                            <input 
                                                type="checkbox" 
                                                id="bones" 
                                                name="heart"
                                                checked={selectedOrgans.bones}
                                                onChange={(e) => handleOrganChange('bones', e.target.checked)}
                                            />
                                            Bones
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                 <div>
                                    <div className="organ-donate">
                                        <label htmlFor="lungs" >
                                            <input 
                                                type="checkbox" 
                                                id="lungs" 
                                                name="heart"
                                                checked={selectedOrgans.lungs}
                                                onChange={(e) => handleOrganChange('lungs', e.target.checked)}
                                            />
                                            Lungs
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <div className="organ-donate">
                                        <label htmlFor="valves" >
                                            <input 
                                                type="checkbox" 
                                                id="valves" 
                                                name="heart"
                                                checked={selectedOrgans.valves}
                                                onChange={(e) => handleOrganChange('valves', e.target.checked)}
                                            />
                                            Valves
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                 <div>
                                    <div className="organ-donate">
                                        <label htmlFor="pancrease" >
                                            <input 
                                                type="checkbox" 
                                                id="pancrease" 
                                                name="heart"
                                                checked={selectedOrgans.pancrease}
                                                onChange={(e) => handleOrganChange('pancrease', e.target.checked)}
                                            />
                                            Pancrease
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <div className="organ-donate">
                                        <label htmlFor="tendons" >
                                            <input 
                                                type="checkbox" 
                                                id="tendons" 
                                                name="heart"
                                                checked={selectedOrgans.tendons}
                                                onChange={(e) => handleOrganChange('tendons', e.target.checked)}
                                            />
                                            Tendons
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                 <div>
                                    <div className="organ-donate">
                                        <label htmlFor="intestines" >
                                            <input 
                                                type="checkbox" 
                                                id="intestines" 
                                                name="heart"
                                                checked={selectedOrgans.intestines}
                                                onChange={(e) => handleOrganChange('intestines', e.target.checked)}
                                            />
                                            Intestines
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <div className="organ-donate">
                                        <label htmlFor="blood-vessels" >
                                            <input 
                                                type="checkbox" 
                                                id="blood-vesseles" 
                                                name="heart"
                                                checked={selectedOrgans['blood-vesseles']}
                                                onChange={(e) => handleOrganChange('blood-vesseles', e.target.checked)}
                                            />
                                            Blood Vessels
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                <div>
                                    <div className="organ-donate last-child">
                                        <label htmlFor="all-organs" >
                                            <input 
                                                type="checkbox" 
                                                id="all-organs" 
                                                name="heart"
                                                checked={selectedOrgans['all-organs']}
                                                onChange={(e) => handleOrganChange('all-organs', e.target.checked)}
                                            />
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

                            <div className="line"></div>

                            <div className="buttons-align">
                                <button type="button" className="cancel-btn prev-btn"
                                        onClick={ prevStep }
                                        disabled={loading}
                                    >Previous</button>
                                
                                <div>
                                    <button type="button" className="cancel-btn"
                                        onClick={
                                            ()=> navigate("/donation/after-death-donation")
                                        }
                                        disabled={loading}
                                    >Cancel</button>
                                    <button 
                                        type="submit" 
                                        className="next-step-btn linear-blue"
                                        disabled={loading}
                                    >
                                        {loading ? "Submitting..." : "Complete Registration"}
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
