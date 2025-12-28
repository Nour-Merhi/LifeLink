import { useState } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import api from "../../../api/axios";

export default function AddDonorForm({ onClose, onDonorAdded }) {
    const [passwordMes, setPasswordMes] = useState("");
    const [passwordChecks, setPasswordChecks] = useState({
        length: false,
        upper: false,
        lower: false,
        number: false,
        special: false,
    });
    const [showPasswordHints, setShowPasswordHints] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [errors, setErrors] = useState({});

    const [addDonorData, setAddDonorData] = useState({
        first_name: "",
        middle_name: "",
        last_name: '',
        email: "",
        phone_nb: "",
        blood_type: "",
        password: '',
        gender: '',
        date_of_birth: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setAddDonorData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const checkPassword = (passwordValue)=>{
        const checks = {
            length: passwordValue.length >= 8,
            upper: /[A-Z]/.test(passwordValue),
            lower: /[a-z]/.test(passwordValue),
            number: /[0-9]/.test(passwordValue),
            special: /[^A-Za-z0-9]/.test(passwordValue),
        };
        setPasswordChecks(checks);

        const allGood = Object.values(checks).every(Boolean);
        setPasswordMes(allGood ? "" : "Password must meet all requirements below.");
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Client-side required validation
        const newErrors = {};
        if(!addDonorData.first_name.trim()) {
            newErrors.first_name = 'First name is required';
        }
        if(!addDonorData.last_name.trim()) {
            newErrors.last_name = 'Last name is required';
        }
        if(!addDonorData.email.trim()) newErrors.email = 'Email is required';
        else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addDonorData.email)) newErrors.email = 'Enter a valid email';
        if(!addDonorData.phone_nb.trim()) newErrors.phone_nb = 'Phone number is required';
        if(!addDonorData.blood_type) newErrors.blood_type = 'Blood type is required';
        if(!addDonorData.gender) newErrors.gender = 'Gender is required';
        if(!addDonorData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
        setErrors(newErrors);
        if(Object.keys(newErrors).length > 0) return;

        setLoading (true);

        try{
            const isStrong = Object.values(passwordChecks).every(Boolean);
            if(!isStrong){
                setLoading(false);
                setPasswordMes("Please use a strong password that meets all requirements.");
                return;
            }

            // Map blood type to ID
            const bloodTypeMap = {
                'A+': 1, 'A-': 2, 'B+': 3, 'B-': 4,
                'AB+': 5, 'AB-': 6, 'O+': 7, 'O-': 8
            };

            // Prepare data for backend
            const submissionData = {
                ...addDonorData,
                blood_type_id: bloodTypeMap[addDonorData.blood_type] || null
            };
            delete submissionData.blood_type; // Remove blood_type, keep blood_type_id

            // First, get the CSRF cookie from Sanctum
            await api.get("/sanctum/csrf-cookie");

            // Then, make the POST request
            const response = await api.post(
                "/api/admin/dashboard/add-donor",
                submissionData
            );
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setAddDonorData({
                    first_name: "",
                    middle_name: "",
                    last_name: '',
                    email: "",
                    phone_nb: "",
                    blood_type: "",
                    password: '',
                    gender: '',
                    date_of_birth: '',
                  });
                setPasswordMes("");
                setPasswordChecks({
                    length: false,
                    upper: false,
                    lower: false,
                    number: false,
                    special: false,
                });
                // Call onDonorAdded if provided, otherwise onClose
                if (onDonorAdded) {
                    onDonorAdded();
                } else {
                    onClose();
                }
            }, 2300);
        }catch (error){
            console.error("❌ Error adding donor:", error);
            
            // Show validation errors if available
            if (error.response?.data?.errors) {
                const validationErrors = error.response.data.errors;
                console.log("Validation Errors:", validationErrors);
                
                // Convert validation errors to display format
                const errorMessages = Object.entries(validationErrors)
                    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                    .join('\n');
                
                alert(`Validation Errors:\n\n${errorMessages}`);
            } else {
                alert(error.response?.data?.message || "Error adding donor");
            }
        }finally{
            setLoading(false);
        }
    };

    return (
        <section className="modal" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            {showSuccess && (
                <div className="success-overlay">
                    <div className="success-check">
                        <svg viewBox="0 0 52 52">
                            <path className="checkmark__circle" d="M26 2c13.255 0 24 10.745 24 24S39.255 50 26 50 2 39.255 2 26 12.745 2 26 2z"/>
                            <path className="checkmark__check" d="M14 27l7 7 17-17"/>
                        </svg>
                        <div className="success-text">Donor added successfully</div>
                    </div>
                </div>
            )}
            {!loading ? ( <>
                    <div className="modal-title">
                        <h2>Add New Donor</h2>
                        <button onClick={onClose}><IoClose /></button>
                    </div>

                    <div className="modal-form">
                        <form onSubmit={handleSubmit}>
                            {/* First Name, Middle Name, Last Name */}
                            <div className="form-group">
                                <div>
                                    <label htmlFor="first_name">First Name</label>
                                    <input
                                        id="first_name"
                                        type="text"
                                        name="first_name"
                                        value={addDonorData.first_name}
                                        placeholder="Enter first name"
                                        onChange={handleChange}
                                    />
                                    {errors.first_name && (<small className="muted">{errors.first_name}</small>)}
                                </div>

                                <div>
                                    <label htmlFor="middle_name">Middle Name</label>
                                    <input
                                        id="middle_name"
                                        type="text"
                                        name="middle_name"
                                        value={addDonorData.middle_name}
                                        placeholder="(optional)"
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="last_name">Last Name</label>
                                    <input
                                        id="last_name"
                                        type="text"
                                        name="last_name"
                                        value={addDonorData.last_name}
                                        placeholder="Enter last name"
                                        onChange={handleChange}
                                    />
                                    {errors.last_name && (<small className="muted">{errors.last_name}</small>)}
                                </div>
                            </div>

                            {/* Gender and Date of Birth */}
                            <div className="form-group">
                                <div>
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone_nb"
                                        value={addDonorData.phone_nb}
                                        placeholder="Enter phone number"
                                        onChange={handleChange}
                                    />
                                    {errors.phone_nb && (<small className="muted">{errors.phone_nb}</small>)}
                                </div>

                                <div>
                                    <label>Date of Birth</label>
                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        value={addDonorData.date_of_birth}
                                        placeholder="Enter date of birth"
                                        onChange={handleChange}
                                    />
                                    {errors.date_of_birth && (<small className="muted">{errors.date_of_birth}</small>)}
                                </div>
                            </div>

                            {/* Phone Number and Blood Type */}
                            <div className="form-group">
                                <div>
                                    <label>Gender</label>
                                    <div className="select-des">
                                        <select
                                            value = {addDonorData.gender}
                                            name = "gender"
                                            onChange={handleChange}
                                        >
                                            <option value = "" disabled >Select Gender</option>
                                            <option value = "male">Male</option>
                                            <option value = "female">Female</option>
                                        </select>
                                    </div>
                                    {errors.gender && (<small className="muted">{errors.gender}</small>)}
                                </div>

                                <div>
                                    <label>Blood Type</label>
                                    <div className="select-des">
                                        <select
                                            value = {addDonorData.blood_type}
                                            name = "blood_type"
                                            onChange={handleChange}
                                        >
                                            <option value = "" disabled >Select Blood Type</option>
                                            <option value = "A+">A+</option>
                                            <option value = "A-">A-</option>
                                            <option value = "B+">B+</option>
                                            <option value = "B-">B-</option>
                                            <option value = "AB+">AB+</option>
                                            <option value = "AB-">AB-</option>
                                            <option value = "O+">O+</option>
                                            <option value = "O-">O-</option>
                                        </select>
                                    </div>
                                    {errors.blood_type && (<small className="muted">{errors.blood_type}</small>)}
                                </div>
                            </div>

                            {/* Email */}
                            <div className="form-group">
                                <div>
                                    <label>Email Account</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={addDonorData.email}
                                        placeholder="Enter donor email"
                                        onChange={handleChange}
                                    />
                                    {errors.email && (<small className="muted">{errors.email}</small>)}
                                </div>
                            </div>

                            {/* Account Password */}
                            <div className="form-group">
                                <div>
                                    <label>Account Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={addDonorData.password}
                                        placeholder="Enter password"
                                        onChange={(e) => { handleChange(e); checkPassword(e.target.value); }}
                                        onFocus={() => setShowPasswordHints(true)}
                                        onBlur={() => setShowPasswordHints(false)}
                                    />
                                    {passwordMes && (<small className="muted">{passwordMes}</small>)}
                                    {showPasswordHints && (
                                    <ul style={{ marginTop: '6px', paddingLeft: '18px' }}>
                                        <li style={{ color: passwordChecks.length ? '#16a34a' : '#E92C30' }}>
                                            {passwordChecks.length ? '✔' : '✖'} At least 8 characters
                                        </li>
                                        <li style={{ color: passwordChecks.upper ? '#16a34a' : '#E92C30' }}>
                                            {passwordChecks.upper ? '✔' : '✖'} At least one uppercase letter (A-Z)
                                        </li>
                                        <li style={{ color: passwordChecks.lower ? '#16a34a' : '#E92C30' }}>
                                            {passwordChecks.lower ? '✔' : '✖'} At least one lowercase letter (a-z)
                                        </li>
                                        <li style={{ color: passwordChecks.number ? '#16a34a' : '#E92C30' }}>
                                            {passwordChecks.number ? '✔' : '✖'} At least one number (0-9)
                                        </li>
                                        <li style={{ color: passwordChecks.special ? '#16a34a' : '#E92C30' }}>
                                            {passwordChecks.special ? '✔' : '✖'} At least one special character (!@#$%&* etc.)
                                        </li>
                                    </ul>
                                    )}
                                </div>
                            </div>

                            <div className="form-submit-btn">
                                <button type="submit" className="submit-btn" disabled={loading}>
                                    Add Donor
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            ): (
                <div className="loader">
                  <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />                
                  <h3>Adding Donor...</h3>
                </div>
            )
            }
        </div>
    </section>
    );
}

