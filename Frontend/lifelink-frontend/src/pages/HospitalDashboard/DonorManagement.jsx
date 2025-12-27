import { useState, useEffect } from "react";
import { IoPerson } from "react-icons/io5";
import { FiEye, FiEdit, FiX } from "react-icons/fi";
import axios from "axios";
import DonorTable from "../../components/adminDashboard/donorComponents/DonorTable";

export default function DonorManagement() {
    const [donors, setDonors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedDonor, setSelectedDonor] = useState(null);
    const [showDonorModal, setShowDonorModal] = useState(false);

    const fetchDonors = () => {
        setLoading(true);
        // In production: axios.get("/api/hospital/donors")
        axios.get("http://localhost:8000/api/admin/dashboard/get-donors")
            .then(res => {
                setDonors(res.data.donors || []);
            })
            .catch(err => {
                setError(err.response?.data?.message || "An error occurred while fetching donors");
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchDonors();
    }, []);

    const handleViewDonor = (donor) => {
        setSelectedDonor(donor);
        setShowDonorModal(true);
    };

    const handleApproveDonation = (donorId) => {
        // In production: axios.post(`/api/hospital/donors/${donorId}/approve`)
        console.log("Approve donation for:", donorId);
        // Trigger notification
    };

    return (
        <section className="donor-section">
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <IoPerson className="icon-size" />
                        <h2>Donor Management</h2>
                    </div>
                    <p>Search, filter, and manage donor profiles for your hospital</p>
                </div>
            </div>

            <DonorTable 
                donors={donors}
                loading={loading}
                error={error}
            />

            {/* Donor Detail Modal */}
            {showDonorModal && selectedDonor && (
                <div className="modal-overlay" onClick={() => setShowDonorModal(false)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={() => setShowDonorModal(false)}>
                            <FiX />
                        </button>
                        <h3 className="modal-title">Donor Profile: {selectedDonor.name}</h3>
                        <div className="modal-content">
                            <div className="control-panel">
                                <h4 className="control-panel-title">Personal Information</h4>
                                <div className="info-grid">
                                    <div><strong>Donor ID:</strong> {selectedDonor.id}</div>
                                    <div><strong>Age:</strong> {selectedDonor.age}</div>
                                    <div><strong>Blood Type:</strong> {selectedDonor.blood_type}</div>
                                    <div><strong>Gender:</strong> {selectedDonor.gender}</div>
                                    <div><strong>Phone:</strong> {selectedDonor.phone_nb}</div>
                                    <div><strong>Email:</strong> {selectedDonor.email}</div>
                                </div>
                            </div>
                            <div className="control-panel" style={{ marginTop: '15px' }}>
                                <h4 className="control-panel-title">Medical History</h4>
                                <div className="info-grid">
                                    <div><strong>Last Donation:</strong> {selectedDonor.last_donation}</div>
                                    <div><strong>Total Donations:</strong> {selectedDonor.total_donations}</div>
                                    <div><strong>Medical Conditions:</strong> 
                                        {selectedDonor.medical_conditions?.length > 0 
                                            ? selectedDonor.medical_conditions.join(', ')
                                            : 'None'}
                                    </div>
                                </div>
                            </div>
                            <div className="control-panel" style={{ marginTop: '15px' }}>
                                <h4 className="control-panel-title">Eligibility Status</h4>
                                <div className="filter-gap" style={{ marginTop: '10px' }}>
                                    <button 
                                        className="add-btn button"
                                        onClick={() => handleApproveDonation(selectedDonor.id)}
                                    >
                                        Approve for Donation
                                    </button>
                                    <button className="button" style={{ background: '#6B6B6B' }}>
                                        Contact Donor
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

