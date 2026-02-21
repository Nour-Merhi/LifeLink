import { IoIosSend } from "react-icons/io";
import { FaUser } from "react-icons/fa6";
import { PiHeartbeatFill } from "react-icons/pi";

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

export default function AliveOragnForm(){
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isChecked, setIsChecked] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [loadingHospitals, setLoadingHospitals] = useState(false);
    const [recipientData, setRecipientData] = useState({
        full_name: "",
        age: "",
        contact: "",
        contact_type: "phone", // "phone" or "email"
        blood_type: "",
        hospital_id: ""
    });
    const [nonDirectDonation, setNonDirectDonation] = useState({
        hospital_selection: "general", // "general" or "specific"
        hospital_id: ""
    });
    const [idPicture, setIdPicture] = useState(null);
    const [idPicturePreview, setIdPicturePreview] = useState(null);
    const [hasLiveOrganRegistration, setHasLiveOrganRegistration] = useState(false);
    const [eligibilityLoading, setEligibilityLoading] = useState(true);

    // Fetch donation status (live organ registration) when user is logged in
    useEffect(() => {
        if (!user) {
            setHasLiveOrganRegistration(false);
            setEligibilityLoading(false);
            return;
        }
        const fetchEligibility = async () => {
            try {
                setEligibilityLoading(true);
                const response = await api.get('/api/donor/eligibility');
                setHasLiveOrganRegistration(response.data.hasLiveOrganRegistration || false);
            } catch (err) {
                console.error('Error fetching eligibility:', err);
                setHasLiveOrganRegistration(false);
            } finally {
                setEligibilityLoading(false);
            }
        };
        fetchEligibility();
    }, [user]);

    // Initialize form data with user data if available
    const getInitialFormData = () => {
        if (!user) {
            return {
                first_name: "",
                middle_name: "",
                last_name: "",
                email: "",
                phone: "",
                birth_date: "",
                gender: "",
                address: "",
                blood_type: "",
                living_organ: "",
                donationType: "",
                health: [],
                agree_intrest: false,
            };
        }
        
        const donor = user.donor || {};
        const bloodType = donor.bloodType || donor.blood_type || null;
        const bloodTypeString = bloodType 
            ? `${bloodType.type || ''}${bloodType.rh_factor || ''}` 
            : '';
        
        // Format date_of_birth for input field (YYYY-MM-DD)
        let formattedDob = '';
        if (donor.date_of_birth) {
            const dobDate = new Date(donor.date_of_birth);
            formattedDob = dobDate.toISOString().split('T')[0];
        }
        
        // Parse name for first, middle, last
        const firstName = user.first_name || '';
        const middleName = user.middle_name || '';
        const lastName = user.last_name || '';
        
        // Check if phone_nb is a temporary value (starts with 'temp_')
        const phoneNumber = user.phone_nb && !user.phone_nb.startsWith('temp_') ? user.phone_nb : '';
        
        return {
            first_name: firstName,
            middle_name: middleName,
            last_name: lastName,
            email: user.email || "",
            phone: phoneNumber,
            birth_date: formattedDob,
            gender: donor.gender || "",
            address: user.city ? user.city : "",
            blood_type: bloodTypeString,
            living_organ: "",
            donationType: "",
            health: [],
            agree_intrest: false,
        };
    };
    
    const [formData, setFormData] = useState(getInitialFormData());
    
    // Update form when user data loads
    useEffect(() => {
        if (user) {
            const donor = user.donor || {};
            const bloodType = donor.bloodType || donor.blood_type || null;
            const bloodTypeString = bloodType 
                ? `${bloodType.type || ''}${bloodType.rh_factor || ''}` 
                : '';
            
            let formattedDob = '';
            if (donor.date_of_birth) {
                const dobDate = new Date(donor.date_of_birth);
                formattedDob = dobDate.toISOString().split('T')[0];
            }
            
            const firstName = user.first_name || '';
            const middleName = user.middle_name || '';
            const lastName = user.last_name || '';
            
            // Check if phone_nb is a temporary value (starts with 'temp_')
            const phoneNumber = user.phone_nb && !user.phone_nb.startsWith('temp_') ? user.phone_nb : '';
            
            // Only pre-fill empty fields, don't override user's entries
            setFormData((prev) => ({
                ...prev,
                first_name: prev.first_name || firstName,
                middle_name: prev.middle_name || middleName,
                last_name: prev.last_name || lastName,
                email: prev.email || user.email || "",
                phone: prev.phone || phoneNumber,
                birth_date: prev.birth_date || formattedDob,
                gender: prev.gender || donor.gender || "",
                address: prev.address || (user.city || ""),
                blood_type: prev.blood_type || bloodTypeString,
            }));
        }
    }, [user]);

    // Fetch hospitals when component mounts
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

    const handleRecipientChange = (e) => {
        const { name, value } = e.target;
        setRecipientData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleNonDirectChange = (e) => {
        const { name, value } = e.target;
        setNonDirectDonation(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleIdPictureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                setError("Please upload a valid image file (JPEG, PNG, or WebP).");
                return;
            }

            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (file.size > maxSize) {
                setError("Image file size must be less than 5MB.");
                return;
            }

            setIdPicture(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setIdPicturePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeIdPicture = () => {
        setIdPicture(null);
        setIdPicturePreview(null);
        // Reset file input
        const fileInput = document.getElementById('id-picture');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    
    const disqualifiedConditions = [
        "daibetes",
        "kidney-liver-dis",
        "surgeries",
        "high-bld-press",
        "hiv",
        "smoker"
    ]

    // Handle input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (type === 'checkbox') {
            setFormData(prev => ({
                ...prev,
                [name]: checked
            }));
        } else if (type === 'radio') {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

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


     const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);

        // Validate recipient data for direct donation
        if (formData.donationType === 'direct-donation') {
            if (!recipientData.full_name || !recipientData.age || !recipientData.contact || !recipientData.blood_type || !recipientData.hospital_id) {
                setError("Please fill in all recipient information fields for direct donation.");
                setLoading(false);
                return;
            }
        }

        // Validate hospital selection for non-direct donation with specific hospital
        if (formData.donationType === 'non-direct-donation' && nonDirectDonation.hospital_selection === 'specific') {
            if (!nonDirectDonation.hospital_id) {
                setError("Please select a hospital for non-directed donation.");
                setLoading(false);
                return;
            }
        }

        try {
            // If ID picture is uploaded, use FormData, otherwise use JSON
            if (idPicture) {
                const formDataToSend = new FormData();
                
                // Add form data fields
                Object.keys(formData).forEach(key => {
                    if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
                        formDataToSend.append(key, formData[key]);
                    }
                });

                // Add medical conditions
                if (isChecked.length > 0) {
                    formDataToSend.append('medical_conditions', JSON.stringify(isChecked));
                }

                formDataToSend.append('organ', formData.living_organ);
                formDataToSend.append('donation_type', formData.donationType === 'direct-donation' ? 'directed' : 'non-directed');
                formDataToSend.append('agree_interest', formData.agree_intrest);

                // Add recipient data for direct donation
                if (formData.donationType === 'direct-donation') {
                    formDataToSend.append('recipient[full_name]', recipientData.full_name);
                    formDataToSend.append('recipient[age]', recipientData.age);
                    formDataToSend.append('recipient[contact]', recipientData.contact);
                    formDataToSend.append('recipient[contact_type]', recipientData.contact_type);
                    formDataToSend.append('recipient[blood_type]', recipientData.blood_type);
                    formDataToSend.append('recipient[hospital_id]', recipientData.hospital_id);
                }

                // Add hospital selection for non-direct donation
                if (formData.donationType === 'non-direct-donation') {
                    formDataToSend.append('hospital_selection', nonDirectDonation.hospital_selection);
                    if (nonDirectDonation.hospital_selection === 'specific') {
                        formDataToSend.append('hospital_id', nonDirectDonation.hospital_id);
                    }
                }

                // Add ID picture file
                formDataToSend.append('id_picture', idPicture);

                const response = await api.post(
                    "/api/organ/living-donor",
                    formDataToSend,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                            "Accept": "application/json",
                        },
                    }
                );

                setSuccess(true);
                setTimeout(() => {
                    navigate("/donation/alive-organ-donation");
                }, 2000);
            } else {
                // Prepare submission data without file
                const submissionData = {
                    ...formData,
                    medical_conditions: isChecked.length > 0 ? isChecked : null,
                    organ: formData.living_organ,
                    donation_type: formData.donationType === 'direct-donation' ? 'directed' : 'non-directed',
                    agree_interest: formData.agree_intrest
                };

                // Add recipient data for direct donation
                if (formData.donationType === 'direct-donation') {
                    submissionData.recipient = {
                        full_name: recipientData.full_name,
                        age: recipientData.age,
                        contact: recipientData.contact,
                        contact_type: recipientData.contact_type,
                        blood_type: recipientData.blood_type,
                        hospital_id: recipientData.hospital_id
                    };
                }

                // Add hospital selection for non-direct donation
                if (formData.donationType === 'non-direct-donation') {
                    submissionData.hospital_selection = nonDirectDonation.hospital_selection;
                    if (nonDirectDonation.hospital_selection === 'specific') {
                        submissionData.hospital_id = nonDirectDonation.hospital_id;
                    }
                }

                const response = await api.post(
                    "/api/organ/living-donor",
                    submissionData,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json",
                        },
                    }
                );

                setSuccess(true);
                setTimeout(() => {
                    navigate("/donation");
                }, 2000);
            }

        } catch (err) {
            console.error("Error submitting form:", err);
            if (err.response?.data?.errors) {
                // Format validation errors
                const errorMessages = Object.values(err.response.data.errors).flat().join(', ');
                setError(errorMessages || "Validation failed. Please check all required fields.");
            } else {
                setError(err.response?.data?.message || "An error occurred while submitting the form. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="organ organ-alive">
            <div id="live-donor" className="title linear-blue">
                <h2 className="text-center">Live Organ Donation Registration</h2>
            </div>

            {!eligibilityLoading && hasLiveOrganRegistration && (
                <div style={{ 
                    margin: "10px 0 20px", 
                    padding: "16px 18px", 
                    borderRadius: 10, 
                    border: "2px solid #ca8a04", 
                    background: "rgba(234, 179, 8, 0.15)", 
                    color: "#854d0e",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    fontWeight: 500
                }}>
                    You cannot register another. You have already registered for live organ donation.
                </div>
            )}
            
            <div  className="form-box-container">

                    <div className="form" style={hasLiveOrganRegistration ? { pointerEvents: 'none', opacity: 0.6 } : undefined}>
                        <form action="#" className="form-info" onSubmit= { handleSubmit } >
                            <div className="personal-info">
                                <div className="info-title">
                                    <FaUser  className="text-blue-500 text-2xl"/>
                                    <h3 className="text-2xl font-semibold">Personal Information</h3>
                                </div>
                                <div className="organ-form-group">
                                    <div>
                                        <label htmlFor="first-name">First Name</label>
                                        <input 
                                            type="text" 
                                            id="first-name" 
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleChange}
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
                                            value={formData.middle_name}
                                            onChange={handleChange}
                                            placeholder="Enter your middle name" 
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="last-name">Last Name</label>
                                        <input 
                                            type="text" 
                                            id="last-name" 
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            placeholder="Enter your last name" 
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="organ-form-group">
                                    <div>
                                        <label htmlFor="email">Email Address</label>
                                        <input 
                                            type="email" 
                                            id="email" 
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
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
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="Enter your phone number" 
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="organ-form-group">
                                    <div>
                                        <label htmlFor="birth-date">Date of Birth</label>
                                        <input 
                                            type="date" 
                                            id="birth-date" 
                                            name="birth_date"
                                            value={formData.birth_date}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="gender">Gender</label>
                                        <select 
                                            id="gender" 
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="" disabled>Select a Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="organ-form-group">
                                    <div>
                                        <label htmlFor="address">Address</label>
                                        <textarea 
                                            id="address" 
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            placeholder="Enter your address in detials.."
                                            required 
                                        />
                                    </div>
                                </div>
                                <div className="organ-form-group">
                                    <div>
                                        <label htmlFor="id-picture">Personal ID Picture</label>
                                        <input 
                                            type="file" 
                                            id="id-picture" 
                                            name="id_picture"
                                            accept="image/jpeg,image/jpg,image/png,image/webp"
                                            onChange={handleIdPictureChange}
                                            style={{  
                                                padding: '12px'   
                                            }}
                                            required
                                        />
                                        <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                                            Upload a clear picture of your ID (Max 5MB, JPEG/PNG/WebP)
                                        </small>
                                        {idPicturePreview && (
                                            <div style={{ marginTop: '12px', position: 'relative', display: 'inline-block' }}>
                                                <img 
                                                    src={idPicturePreview} 
                                                    alt="ID Preview" 
                                                    style={{ 
                                                        maxWidth: '200px', 
                                                        maxHeight: '150px', 
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px',
                                                        padding: '4px'
                                                    }} 
                                                />
                                                <button
                                                    type="button"
                                                    onClick={removeIdPicture}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '4px',
                                                        right: '4px',
                                                        background: '#f44336',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: '24px',
                                                        height: '24px',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        )}
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
                                        <select 
                                            id="blood-type" 
                                            name="blood_type"
                                            value={formData.blood_type}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="" disabled>Select Blood Type</option>
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
                                        <select 
                                            id="living-organ" 
                                            name="living_organ"
                                            value={formData.living_organ}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="" disabled>Select organ</option>
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
                                                checked={formData.donationType === 'direct-donation'}
                                                onChange={handleChange}
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
                                                checked={formData.donationType === 'non-direct-donation'}
                                                onChange={handleChange}
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

                            {/* Recipient Information Form (for Direct Donation) */}
                            {formData.donationType === 'direct-donation' && (
                                <div className="personal-info">
                                    <div className="info-title">
                                        <FaUser className="text-blue-500 text-xl"/>
                                        <h3 className="text-xl font-semibold">Recipient Information</h3>
                                    </div>
                                    <div className="organ-form-group">
                                        <div>
                                            <label htmlFor="recipient-full-name">Recipient Full Name</label>
                                            <input 
                                                type="text" 
                                                id="recipient-full-name" 
                                                name="full_name"
                                                value={recipientData.full_name}
                                                onChange={handleRecipientChange}
                                                placeholder="Enter recipient's full name" 
                                                required
                                                style={{ fontSize: '14px', padding: '8px' }}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="recipient-age">Age</label>
                                            <input 
                                                type="number" 
                                                id="recipient-age" 
                                                name="age"
                                                value={recipientData.age}
                                                onChange={handleRecipientChange}
                                                placeholder="Enter age" 
                                                min="1"
                                                max="120"
                                                required
                                                style={{ fontSize: '14px', padding: '8px' }}
                                            />
                                        </div>
                                    </div>
                                    <div className="organ-form-group">
                                        <div>
                                            <label htmlFor="recipient-contact-type">Contact Type</label>
                                            <select 
                                                id="recipient-contact-type" 
                                                name="contact_type"
                                                value={recipientData.contact_type}
                                                onChange={handleRecipientChange}
                                                style={{ fontSize: '14px', padding: '8px' }}
                                            >
                                                <option value="phone">Phone Number</option>
                                                <option value="email">Email</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="recipient-contact">{recipientData.contact_type === 'email' ? 'Email' : 'Phone Number'}</label>
                                            <input 
                                                type={recipientData.contact_type === 'email' ? 'email' : 'text'} 
                                                id="recipient-contact" 
                                                name="contact"
                                                value={recipientData.contact}
                                                onChange={handleRecipientChange}
                                                placeholder={recipientData.contact_type === 'email' ? 'Enter email' : 'Enter phone number'} 
                                                required
                                                style={{ fontSize: '14px', padding: '8px' }}
                                            />
                                        </div>
                                    </div>
                                    <div className="organ-form-group">
                                        <div>
                                            <label htmlFor="recipient-blood-type">Recipient Blood Type</label>
                                            <select 
                                                id="recipient-blood-type" 
                                                name="blood_type"
                                                value={recipientData.blood_type}
                                                onChange={handleRecipientChange}
                                                required
                                                style={{ fontSize: '14px', padding: '8px' }}
                                            >
                                                <option value="" disabled>Select Blood Type</option>
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
                                            <label htmlFor="recipient-hospital">Hospital</label>
                                            <select 
                                                id="recipient-hospital" 
                                                name="hospital_id"
                                                value={recipientData.hospital_id}
                                                onChange={handleRecipientChange}
                                                required
                                                disabled={loadingHospitals}
                                                style={{ fontSize: '14px', padding: '8px' }}
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
                                    </div>
                                </div>
                            )}

                            {/* Hospital Selection (for Non-Direct Donation) */}
                            {formData.donationType === 'non-direct-donation' && (
                                <div className="personal-info">
                                    <div className="info-title">
                                        <PiHeartbeatFill className="text-blue-500 text-xl"/>
                                        <h3 className="text-xl font-semibold">Hospital Selection</h3>
                                    </div>
                                    <div className="organ-form-group">
                                        <div style={{ width: '100%' }}>
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="hospital_selection"
                                                    value="general"
                                                    checked={nonDirectDonation.hospital_selection === 'general'}
                                                    onChange={handleNonDirectChange}
                                                    style={{ marginRight: '8px' }}
                                                />
                                                General Donation (not specific to a hospital)
                                            </label>
                                        </div>
                                        <div style={{ width: '100%'}}>
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="hospital_selection"
                                                    value="specific"
                                                    checked={nonDirectDonation.hospital_selection === 'specific'}
                                                    onChange={handleNonDirectChange}
                                                    style={{ marginRight: '8px' }}
                                                />
                                                Select Specific Hospital
                                            </label>
                                        </div>
                                    </div>
                                    {nonDirectDonation.hospital_selection === 'specific' && (
                                        <div className="organ-form-group">
                                            <div>
                                                <label htmlFor="non-direct-hospital">Hospital</label>
                                                <select 
                                                    id="non-direct-hospital" 
                                                    name="hospital_id"
                                                    value={nonDirectDonation.hospital_id}
                                                    onChange={handleNonDirectChange}
                                                    required
                                                    disabled={loadingHospitals}
                                                    style={{ fontSize: '14px', padding: '8px', width: '100%' }}
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
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="agreement">
                                <label >
                                <input 
                                    type="checkbox" 
                                    name="agree_intrest"
                                    checked={formData.agree_intrest}
                                    onChange={handleChange}
                                    required 
                                />
                                <div>
                                    <h3 className="!font-semibold">I understand this is an expression of interest only. Final approval is done by hospital doctors and legal authorities.</h3>
                                    <h3 className="!font-semibold">By checking this box, I consent to being contacted by partner hospitals for further evaluation.</h3>
                                </div>
                                </label>
                            </div>

                            <div className="line"></div>

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

                            {success && (
                                <div style={{ 
                                    padding: '15px', 
                                    backgroundColor: '#efe', 
                                    color: '#3c3', 
                                    borderRadius: '5px', 
                                    marginBottom: '20px' 
                                }}>
                                    ✓ Pledge submitted successfully! Redirecting...
                                </div>
                            )}

                            <div className="form-action">
                                <button 
                                    type="submit" 
                                    className="next-step-btn organ-btn linear-blue position-middle"
                                    disabled = {isDisqualified || loading || hasLiveOrganRegistration}
                                > 
                                    {loading ? "Submitting..." : (
                                        <>
                                            <IoIosSend/> Send Request
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
        </section>
    )
}