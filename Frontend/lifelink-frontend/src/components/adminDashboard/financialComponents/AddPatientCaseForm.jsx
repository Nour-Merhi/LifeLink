import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';

import axios from "axios"

export default function AddPatientCaseForm({ onClose }) {
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [errors, setErrors] = useState({});

    const [addPatientData, setAddPatientData] = useState({
        full_name: "",
        date_of_birth: '',
        case_title: '',
        sevirity: "",
        description: "",
        hospital_name: '',
        gender: '',
        target_amount: '',
        due_date: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setAddPatientData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };
    
    

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading (true);

        try{
           const response = await axios.post(
                "http://localhost:8000/api/admin/dashboard/add-donor",
                addPatientData,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                }
            );
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setFullName("");
                setAddPatientData({
                    full_name: "",
                    date_of_birth: '',
                    case_title: '',
                    sevirity: "",
                    description: "",
                    hospital_name: '',
                    gender: '',
                    target_amount: '',
                    due_date: '',
                  });
                
                onClose();
            }, 2000);
        }catch (error){
            console.error("❌ Error adding donor:", error);
            alert(error);
        }finally{
            setLoading(false);
        }
    };

    return (
        <section className="modal" onClick={onClose}>
            <div className="modal-container">
            {showSuccess && (
                <div className="success-overlay">
                    <div className="success-check">
                        <svg viewBox="0 0 52 52">
                            <path className="checkmark__circle" d="M26 2c13.255 0 24 10.745 24 24S39.255 50 26 50 2 39.255 2 26 12.745 2 26 2z"/>
                            <path className="checkmark__check" d="M14 27l7 7 17-17"/>
                        </svg>
                        <div className="success-text">Patient case added successfully</div>
                    </div>
                </div>
            )}
            {!loading ? ( <>
                    <div className="modal-title">
                        <h2>Add New Patient Case</h2>
                        <button onClick={onClose}><IoClose /></button>
                    </div>

                    <div className="modal-form">
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <div>
                                    <label htmlFor="full_name">Full Name</label>
                                    <input
                                        id="full_name"
                                        type="text"
                                        name="full_name"
                                        value={addPatientData.full_name}
                                        placeholder="(e.g., John Michael Smith)"
                                        onChange={handleChange}
                                    />
                                    {errors.full_name && (<small className="muted">{errors.full_name}</small>)}
                                </div>
                                <div>
                                    <label htmlFor="age">Full Name</label>
                                    <input
                                        id="age"
                                        type="date"
                                        name="date_of_birth"
                                        value={addPatientData.date_of_birth}
                                        placeholder="dd/mm/yyyy"
                                        onChange={handleChange}
                                    />
                                    {errors.date_of_birth && (<small className="muted">{errors.date_of_birth}</small>)}
                                </div>
                            </div>

                            <div className="form-group">
                                <div>
                                    <label htmlFor="title">Case Title</label>
                                    <input
                                        id="title"
                                        type="text"
                                        name="case_title"
                                        value={addPatientData.case_title}
                                        placeholder="Enter case title"
                                        onChange={handleChange}
                                    />
                                    {errors.case_title && (<small className="muted">{errors.case_title}</small>)}
                                </div>
                            </div>

                            <div className="form-group">
                                <div>
                                    <label htmlFor="description">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={addPatientData.description}
                                        placeholder="write patient case description"
                                        rows="5"
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <div>
                                    <label htmlFor="target_amount">
                                        Target Amount (in $)
                                    </label>
                                    <input
                                        id="target_amount"
                                        type="number"
                                        name="target_amount"
                                        value={addPatientData.target_amount}
                                        placeholder="e.g 1000"
                                        onChange={handleChange}
                                    />
                                    {errors.target_amount && (<small className="muted">{errors.target_amount}</small>)}
                                </div>
                            </div>

                            <div className="form-group">
                                <div>
                                    <label htmlFor="hospital_name">
                                        Patient's Hospital Name
                                    </label>
                                    <div className="select-des">
                                        <select
                                            value = {addPatientData.hospital_name}
                                            name = "hospital_name"
                                            onChange={handleChange}
                                        >
                                            <option value = "" disabled >Select Hospital</option>
                                            
                                        </select>
                                    </div>
                                    {errors.hospital_name && (<small className="muted">{errors.hospital_name}</small>)}
                                </div>

                                <div>
                                    <label htmlFor="due-date">Due Date</label>
                                    <input
                                        id="due-date"
                                        type="date"
                                        name="due_date"
                                        value={addPatientData.due_date}
                                        placeholder="Enter due date"
                                        onChange={handleChange}
                                    />
                                    {errors.due_date && (<small className="muted">{errors.due_date}</small>)}
                                </div>

                            </div>

                            <div className="form-submit-btn">
                                <button type="submit" className="submit-btn" disabled={loading}>
                                    Add Patient Case
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            ): (
                <div className="loader">
                  <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />                
                  <h3>Adding Patient Case...</h3>
                </div>
            )
            }
        </div>
    </section>
    );
}
