import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import api from "../../../api/axios";

export default function AddPhlebotomistForm({
    onClose,
    hospitals,
    onPhlebotomistAdded,
    fixedHospitalId,
    fixedHospitalName,
}) {
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

    const [addPhlebotomistData, setAddPhlebotomistData] = useState({
        first_name: "",
        middle_name: "",
        last_name: '',
        licence_number: '',
        hospital_name: '',
        hospital_id: fixedHospitalId || '',
        phone_nb: "",
        email: "",
        password: '',
        start_time: '',
        end_time: '',
        years_of_experience: '',
        max_appointments: '',
        working_dates: [],
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setAddPhlebotomistData((prev) => ({
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
        setAddPhlebotomistData((prev) => ({
          ...prev,
          working_dates: workingDates,
        }));
    }, [workingDates]);

    useEffect(() => {
        if (fixedHospitalId) {
            setAddPhlebotomistData((prev) => ({
                ...prev,
                hospital_id: fixedHospitalId,
                hospital_name: fixedHospitalName || prev.hospital_name,
            }));
        }
    }, [fixedHospitalId, fixedHospitalName]);

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
                "/api/admin/dashboard/add-phlebotomist",
                addPhlebotomistData
            );
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setAddPhlebotomistData({
                    first_name: "",
                    middle_name: "",
                    last_name: '',
                    licence_number: '',
                    hospital_name: '',
                    hospital_id: fixedHospitalId || '',
                    phone_nb: "",
                    email: "",
                    password: '',
                    start_time: '',
                    end_time: '',
                    years_of_experience: '',
                    max_appointments: '',
                    working_dates: [],
                  });
                setWorkingDates([]);
                setPasswordMes("");
                setPasswordChecks({
                    length: false,
                    upper: false,
                    lower: false,
                    number: false,
                    special: false,
                });
                
                // Call callback to refresh table
                if (onPhlebotomistAdded) {
                    onPhlebotomistAdded();
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
        <section className="modal">
            <div className="modal-container">
            {showSuccess && (
                <div className="success-overlay">
                    <div className="success-check">
                        <svg viewBox="0 0 52 52">
                            <path className="checkmark__circle" d="M26 2c13.255 0 24 10.745 24 24S39.255 50 26 50 2 39.255 2 26 12.745 2 26 2z"/>
                            <path className="checkmark__check" d="M14 27l7 7 17-17"/>
                        </svg>
                        <div className="success-text">Phlebotomist added successfully</div>
                    </div>
                </div>
            )}
            {!loading ? ( <>
                    <div className="modal-title" >
                        <h2>Add New Phlebotomist</h2>
                        <button onClick={onClose}><IoClose /></button>
                    </div>

                    <div className="modal-form">
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <div>
                                    <label htmlFor="first_name">First Name</label>
                                    <input
                                        id="first_name"
                                        type="text"
                                        name="first_name"
                                        value={addPhlebotomistData.first_name}
                                        placeholder="Enter first name"
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="middle_name">Middle Name</label>
                                    <input
                                        id="middle_name"
                                        type="text"
                                        name="middle_name"
                                        value={addPhlebotomistData.middle_name}
                                        placeholder="Enter middle name"
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="last_name">Last Name</label>
                                    <input
                                        id="last_name"
                                        type="text"
                                        name="last_name"
                                        value={addPhlebotomistData.last_name}
                                        placeholder="Enter last name"
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <div>
                                    <label>
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone_nb"
                                        value={addPhlebotomistData.phone_nb}
                                        placeholder="Enter phone number"
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="licence-number">
                                        Licence Number
                                    </label>
                                    <input
                                        id="licence-number"
                                        type="password"
                                        name="licence_number"
                                        value={addPhlebotomistData.licence_number}
                                        placeholder="#######"
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <div>
                                    <label>Email Account</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={addPhlebotomistData.email}
                                        placeholder="Enter email"
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="password">
                                        Account Password
                                    </label>
                                    <input 
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={addPhlebotomistData.password}
                                        placeholder="Enter password"
                                        onChange={(e) => { 
                                            handleChange(e); 
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

                            <div className="form-group">
                                <div>
                                    <label htmlFor="hospital_id">Working at Hospital</label>
                                    <div className="select-des">
                                        {fixedHospitalId ? (
                                            <input
                                                type="text"
                                                value={fixedHospitalName ? fixedHospitalName : `Hospital #${fixedHospitalId}`}
                                                readOnly
                                                style={{ backgroundColor: "#f6f6f6" }}
                                            />
                                        ) : (
                                        <select
                                            id="hospital_id"
                                            name="hospital_id"
                                            value={addPhlebotomistData.hospital_id}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="" disabled>Select hospital</option>
                                            {hospitals && hospitals.map(hospital => (
                                                <option key={hospital.id} value={hospital.id}>
                                                    {hospital.name}
                                                </option>
                                            ))}
                                        </select>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="yr-exp">
                                         Years of Experience
                                    </label>
                                    <input 
                                        id="yr-exp"
                                        type="number"
                                        name="years_of_experience"
                                        value={addPhlebotomistData.years_of_experience || ""}
                                        min = "0"
                                        placeholder="0"
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="working-hours">
                                <h3>Working Hours</h3>
                                <div className="form-group">
                                    <div>
                                        <label>
                                            Start Time:
                                        </label>
                                        <input 
                                            id="start_time"
                                            type="time"
                                            name="start_time"
                                            value={addPhlebotomistData.start_time}
                                            onChange={handleChange}
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
                                            value={addPhlebotomistData.end_time}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <div>
                                    <label>
                                        Max Number of Appointments:
                                    </label>
                                    <input 
                                        id="max-app"
                                        type="number"
                                        name="max_appointments"
                                        value={addPhlebotomistData.max_appointments || ""}
                                        min = "1"
                                        placeholder="Enter max number of appointments"
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="working-dates">
                                <h3>Preffered Working Days</h3>
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
                                    Add Phlebotomist
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
