import { useState, useEffect } from "react";
import { FaHospital } from "react-icons/fa";
import "../../styles/Dashboard.css"
import api from "../../api/axios";

import HospitalTable from "./hospitalComponents/HospitalTable"
import AddHospitalForm from "./hospitalComponents/AddHospitalForm"

export default function Hospitals(){
    const [openModal, setModal] = useState(false);
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");     
    const onClose = () => {
        setModal(false)
    }

    const fetchHospitals = ()=>{
        setLoading(true);
        setError("");

        api.get('/api/admin/dashboard/get-hospitals')
            .then((res) => {
                console.log('Hospitals API Response:', res.data);
                // Backend returns { hospitals: [...], total: ... }
                const hospitalsData = res.data.hospitals || res.data || [];
                setHospitals(Array.isArray(hospitalsData) ? hospitalsData : []);
            })
            .catch(err => {
                console.error('Error fetching hospitals:', err);
                console.error('Error response:', err.response);
                setError(err.response?.data?.message || err.message || "An error occurred while fetching hospitals")
            })
            .finally(() => setLoading(false))
    }

    const onHospitalAdded = () => {
        fetchHospitals(); // Refetch hospitals list
        setModal(false); // Close modal
    }

    useEffect(()=> {
        fetchHospitals();
    }, []);
    
    return (
        <section className="hospital-panel">
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <FaHospital className="icon-size "/>
                        <h2>Hospital Management</h2>
                    </div>
                    <p>Manage hospital partners and their blood bank inventory</p>
                </div>
                <div className="add-btn">
                    <button type="button" onClick={() => setModal(true)}>+ Add New Hospital</button>
                </div>
            </div>

            <HospitalTable 
                hospitals = { hospitals }
                loading = { loading }
                error = { error }
                onHospitalsUpdate = { fetchHospitals }
            />
            
            {openModal && 
                <AddHospitalForm onClose = { onClose } onHospitalAdded = { onHospitalAdded } />
            }
            
        </section>
    )
}