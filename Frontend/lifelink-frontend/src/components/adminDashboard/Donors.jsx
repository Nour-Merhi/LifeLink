import { useState, useEffect } from "react"
import { IoPerson } from "react-icons/io5";
import api from "../../api/axios"

import DonorTable from "./donorComponents/DonorTable"
import AddDonorForm from "./donorComponents/AddDonorForm";

export default function Donors(){
    const [openModal, setOpenModal] = useState(false)
    const [donors, setDonors] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    // Function to fetch donors
    const fetchDonors = () => {
        setLoading(true);
        api.get("/api/admin/dashboard/get-donors")
        .then(res => {
            setDonors(res.data.donors);
        })
        .catch(err => setError(err.response?.data?.message || "An error occurred while fetching donors"))
        .finally(() => setLoading(false))
    };

    useEffect(()=>{
        fetchDonors();
    }, []);

    const onClose = () => {
        setOpenModal(false)
    }

    const onDonorAdded = () => {
        fetchDonors(); // Refetch donors list
        setOpenModal(false); // Close modal
    }

    return(
        <section className="donor-section">
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <IoPerson className="icon-size "/>
                        <h2>Donor Management</h2>
                    </div>
                    <p>Manage and monitor all registered donors</p>
                </div>
                <div className="add-btn">
                    <button type="button" onClick={() => setOpenModal(true)}>+ Add New Donor</button>
                </div>
            </div>
            
            {/* Pass the fetched donors data, loading state, and error to DonorTable */}
            <DonorTable 
                donors={donors} 
                loading={loading} 
                error={error}
                onDonorsUpdate={fetchDonors}
            />
            
            {openModal && 
                <AddDonorForm onClose = { onClose } onDonorAdded = { onDonorAdded } />
            }
        </section>
    )
}