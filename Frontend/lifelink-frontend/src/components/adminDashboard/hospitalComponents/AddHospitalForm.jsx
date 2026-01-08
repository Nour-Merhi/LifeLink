import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import MapIntegration from "../../MapIntegration";
import api from "../../../api/axios";

export default function AddHospitalForm({ onClose, onHospitalAdded }) {
    const [workingDates, setWorkingDates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [passwordMes, setPasswordMes] = useState("");
    const [passwordChecks, setPasswordChecks] = useState({
        length: false,
        upper: false,
        lower: false,
        number: false,
        special: false,
    });
    const [showPasswordHints, setShowPasswordHints] = useState(false);
    const [managerFullName, setManagerFullName] = useState("");

    const [addHospitalData, setAddHospitalData] = useState({
        name: "",
        address: "",
        latitude: null,
        longitude: null,
        phone_nb: "",
        email: "",
        image: null,
        description: "",
        services: [],
        hours: "",
        established: "",
        urgent_needs: [],
        manager: {
            name: '',
            first_name: '',
            middle_name: null,
            last_name: '',
            phone_nb: '',
            email: '',
            password: '',
            start_time: '',
            end_time: '',
            working_dates: [],
        },
    });
    const [serviceInput, setServiceInput] = useState("");
    const [urgentNeedInput, setUrgentNeedInput] = useState("");


    const handleChange = (e) => {
        const { name, value } = e.target;
        setAddHospitalData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    
    const toggleDay = (day) => {
        setWorkingDates((prev) =>
                prev.includes(day)
            ? prev.filter((d) => d !== day)
            : [...prev, day]
        );
    };

    // Function to parse full name into first, middle, and last name
    const parseFullName = (fullNameString) => {
        const nameParts = fullNameString.trim().split(/\s+/).filter(part => part.length > 0);
        
        if (nameParts.length === 0) {
            return { first_name: '', middle_name: null, last_name: '' };
        } else if (nameParts.length === 1) {
            return { first_name: nameParts[0], middle_name: null, last_name: '' };
        } else if (nameParts.length === 2) {
            return { first_name: nameParts[0], middle_name: null, last_name: nameParts[1] };
        } else {
            const first_name = nameParts[0];
            const last_name = nameParts[nameParts.length - 1];
            const middle_name = nameParts.slice(1, -1).join(' ');
            return { first_name, middle_name, last_name };
        }
    };

    const handleManagerFullNameChange = (e) => {
        const value = e.target.value;
        setManagerFullName(value);
        const parsed = parseFullName(value);
        setAddHospitalData((prev) => ({
            ...prev,
            manager: {
                ...prev.manager,
                name: value, 
                first_name: parsed.first_name,
                middle_name: parsed.middle_name,
                last_name: parsed.last_name,
            },
        }));
    };

    const handleManagerChange = (e) => {
        const { name, value } = e.target;
        setAddHospitalData((prev) => ({
        ...prev,
        manager: {
            ...prev.manager,
            [name]: value,
        },
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

    useEffect(() => {
        setAddHospitalData((prev) => ({
          ...prev,
          manager: {
            ...prev.manager,
            working_dates: workingDates,
          },
        }));
    }, [workingDates]);

    const handleLocationSelect = (lat, lng) => {
        setAddHospitalData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const isStrong = Object.values(passwordChecks).every(Boolean);
        if(!isStrong){
            setPasswordMes("Please use a strong password that meets all requirements.");
            return;
        }
        setLoading (true);

        try{
            // First, get the CSRF cookie from Sanctum
            await api.get("/sanctum/csrf-cookie");

            // Then, make the POST request
            const response = await api.post(
                "/api/admin/dashboard/add-hospital",
                addHospitalData
            );
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setAddHospitalData({
                    name: "",
                    address: "",
                    latitude: null,
                    longitude: null,
                    phone_nb: "",
                    email: "",
                    image: null,
                    description: "",
                    services: [],
                    hours: "",
                    established: "",
                    urgent_needs: [],
                    manager: {
                      name: '',
                      first_name: '',
                      middle_name: null,
                      last_name: '',
                      phone_nb: '',
                      email: '',
                      password: '',
                      start_time: '',
                      end_time: '',
                      working_dates: [],
                    },
                  });
                setManagerFullName("");
                setWorkingDates([]);
                setPasswordMes("");
                setServiceInput("");
                setUrgentNeedInput("");
                setPasswordChecks({
                    length: false,
                    upper: false,
                    lower: false,
                    number: false,
                    special: false,
                });
                // Call onHospitalAdded if provided, otherwise just close
                if (onHospitalAdded) {
                    onHospitalAdded();
                } else {
                    onClose();
                }
            }, 1200);
        }catch (error){
            console.error("❌ Error adding hospital:", error);
            alert(error);
        }finally{
            setLoading(false);
        }
    };

    return (
        <section className="modal" >
            <div className="modal-container">
            {showSuccess && (
                <div className="success-overlay">
                    <div className="success-check">
                        <svg viewBox="0 0 52 52">
                            <path className="checkmark__circle" d="M26 2c13.255 0 24 10.745 24 24S39.255 50 26 50 2 39.255 2 26 12.745 2 26 2z"/>
                            <path className="checkmark__check" d="M14 27l7 7 17-17"/>
                        </svg>
                        <div className="success-text">Hospital added successfully</div>
                    </div>
                </div>
            )}
            {!loading ? ( <>
                    <div className="modal-title">
                        <h2>Add New Hospital</h2>
                        <button onClick={onClose}><IoClose /></button>
                    </div>

                    <div className="modal-form">
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <div>
                                    <label htmlFor="name">Hospital Name</label>
                                    <input
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={addHospitalData.name}
                                        placeholder="Enter hospital name"
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <div>
                                    <label>Hospital Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={addHospitalData.email}
                                        placeholder="Enter hospital email"
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label>
                                        Hospital Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone_nb"
                                        value={addHospitalData.phone_nb}
                                        placeholder="Enter hospital phone number"
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <div>
                                    <label htmlFor="address">Hospital Address</label>
                                    <input
                                        id="address"
                                        name="address"
                                        type="text"
                                        className="input"
                                        value={addHospitalData.address}
                                        placeholder="Enter hospital address"
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <div style={{ width: '100%' }}>
                                    <label htmlFor="image">Hospital Image (URL or base64)</label>
                                    <input
                                        id="image"
                                        name="image"
                                        type="text"
                                        className="input"
                                        value={addHospitalData.image || ""}
                                        placeholder="Enter image URL or leave empty"
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <div style={{ width: '100%' }}>
                                    <label htmlFor="description">Description</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        className="input"
                                        value={addHospitalData.description}
                                        placeholder="Enter hospital description"
                                        onChange={handleChange}
                                        rows="4"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <div style={{ width: '100%' }}>
                                    <label htmlFor="services">Services (comma-separated)</label>
                                    <input
                                        id="services"
                                        type="text"
                                        className="input"
                                        value={serviceInput}
                                        placeholder="e.g., Blood Donation Center, Organ Transplant Services, Emergency Care"
                                        onChange={(e) => setServiceInput(e.target.value)}
                                        onBlur={(e) => {
                                            const servicesArray = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                                            setAddHospitalData(prev => ({ ...prev, services: servicesArray }));
                                        }}
                                    />
                                    {addHospitalData.services.length > 0 && (
                                        <small className="muted" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                                            Services: {addHospitalData.services.join(', ')}
                                        </small>
                                    )}
                                </div>
                            </div>
                            <div className="form-group">
                                <div>
                                    <label htmlFor="hours">Operating Hours</label>
                                    <input
                                        id="hours"
                                        name="hours"
                                        type="text"
                                        className="input"
                                        value={addHospitalData.hours}
                                        placeholder="e.g., Mon-Fri: 8AM-8PM"
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="established">Established Year</label>
                                    <input
                                        id="established"
                                        name="established"
                                        type="text"
                                        className="input"
                                        value={addHospitalData.established}
                                        placeholder="e.g., 1985"
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <div style={{ width: '100%' }}>
                                    <label htmlFor="urgent_needs">Urgent Blood Type Needs (comma-separated)</label>
                                    <input
                                        id="urgent_needs"
                                        type="text"
                                        className="input"
                                        value={urgentNeedInput}
                                        placeholder="e.g., A+, B-, AB+, O-"
                                        onChange={(e) => setUrgentNeedInput(e.target.value)}
                                        onBlur={(e) => {
                                            const needsArray = e.target.value.split(',').map(n => n.trim()).filter(n => n);
                                            setAddHospitalData(prev => ({ ...prev, urgent_needs: needsArray }));
                                        }}
                                    />
                                    {addHospitalData.urgent_needs.length > 0 && (
                                        <small className="muted" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                                            Urgent Needs: {addHospitalData.urgent_needs.join(', ')}
                                        </small>
                                    )}
                                </div>
                            </div>
                            <div className="form-group">
                                <div>
                                    <label>Hospital Location</label>
                                    <MapIntegration
                                        latitude={addHospitalData.latitude}
                                        longitude={addHospitalData.longitude}
                                        onLocationSelect={handleLocationSelect}
                                    />

                                    {addHospitalData.latitude && addHospitalData.longitude && (
                                        <small className="muted" style={{ fontSize: '12px', display: 'block', marginTop: '4px', color: '#16a34a' }}>
                                        ✓ Selected Location: {addHospitalData.latitude.toFixed(6)}, {addHospitalData.longitude.toFixed(6)}
                                        </small>
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <div>
                                    <label htmlFor="full_name">
                                        Manager Full Name
                                    </label>
                                    <input className="input"
                                        id="full_name"
                                        type="text"
                                        name="full_name"
                                        value={managerFullName}
                                        placeholder="(e.g., John Michael Smith)"
                                        onChange={handleManagerFullNameChange}
                                    />
                                    {managerFullName && (
                                        <small className="muted" style={{fontSize: '12px', display: 'block', marginTop: '4px'}}>
                                            Parsed: First: <strong>{addHospitalData.manager.first_name || '(none)'}</strong>
                                            {addHospitalData.manager.middle_name && ` | Middle: ${addHospitalData.manager.middle_name}`}
                                            {addHospitalData.manager.last_name && ` | Last: ${addHospitalData.manager.last_name}`}
                                        </small>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="phone_nb">
                                        Manager Phone
                                    </label>
                                    <input className="input"
                                        id="phone_nb"
                                        type="tel"
                                        name="phone_nb"
                                        value={addHospitalData.manager.phone_nb}
                                        placeholder="Enter manager phone number"
                                        onChange={handleManagerChange}
                                    />
                                </div>

                            </div>
                            <div className="form-group">
                                <div>
                                    <label htmlFor="email">
                                        Manager Email
                                    </label>
                                    <input className="input"
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={addHospitalData.manager.email}
                                        placeholder="Enter manager email"
                                        onChange={handleManagerChange}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="password">
                                        Manager account Password
                                    </label>
                                    <input className="input"
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={addHospitalData.manager.password}
                                        placeholder="Enter password"
                                        onChange={(e) => { 
                                            handleManagerChange(e); 
                                            checkPassword(e.target.value); 
                                        }}
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

                            <div className="working-hours">
                                <h3>Manager Office Hours</h3>
                                <div className="form-group">
                                    <div>
                                        <label>
                                            Start Time:
                                        </label>
                                        <input className="input"
                                            id="start_time"
                                            type="time"
                                            name="start_time"
                                            value={addHospitalData.manager.start_time}
                                            onChange={handleManagerChange}
                                        />
                                    </div>

                                    <div>
                                        <label>
                                            End Time:
                                        </label>
                                        <input className="input"
                                            id="end_time"
                                            type="time"
                                            name="end_time"
                                            value={addHospitalData.manager.end_time}
                                            onChange={handleManagerChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="working-dates">
                                <h3>Manager Working Days</h3>
                                <div className="dates">
                                    {[
                                        "Monday",
                                        "Tuesday",
                                        "Wednesday",
                                        "Thursday",
                                        "Friday",
                                        "Saturday",
                                        "Sunday",
                                    ].map((day) => (
                                        <button
                                            type="button"
                                            key={day}
                                            className={`date ${
                                                workingDates.includes(day) ? "active" : ""
                                            }`}
                                            onClick={() => toggleDay(day)}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-submit-btn">
                                <button type="submit" className="submit-btn">
                                    Add Hospital
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            ): (
                <div className="loader">
                  <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />                
                  <h3>Adding Hospital...</h3>
                </div>
            )
            }
        </div>
    </section>
    );
}
