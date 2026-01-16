import { useState, useEffect } from "react";
import { IoPerson } from "react-icons/io5";
import { FiX } from "react-icons/fi";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import HospitalDonorTable from "./HospitalDonorTable";

export default function DonorManagement() {
    const { user } = useAuth();
    const [donors, setDonors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedDonor, setSelectedDonor] = useState(null);
    const [showDonorModal, setShowDonorModal] = useState(false);
    const [hospitalId, setHospitalId] = useState(null);

    // Filter states
    const [donationType, setDonationType] = useState(""); // All, Home Blood Donation, Hospital Blood Donation, Alive Organ Donation
    const [appointmentType, setAppointmentType] = useState(""); // All, urgent, regular
    const [status, setStatus] = useState(""); // All, pending, completed, canceled

    useEffect(() => {
        // Get hospital ID from authenticated user's health center manager relationship
        if (user) {
            let id = null;
            
            // Try different possible property names for the relationship
            if (user.health_center_manager && user.health_center_manager.hospital_id) {
                id = user.health_center_manager.hospital_id;
            } else if (user.healthCenterManager && user.healthCenterManager.hospital_id) {
                id = user.healthCenterManager.hospital_id;
            } else if (user.hospital_id) {
                id = user.hospital_id;
            }
            
            // Fallback to URL param
            if (!id) {
                id = new URLSearchParams(window.location.search).get('hospital_id');
            }
            
            if (id) {
                setHospitalId(id);
            } else {
                setError("Hospital ID not found. Please ensure you are logged in as a hospital manager.");
            }
        }
    }, [user]);

    const fetchDonors = () => {
        if (!hospitalId) {
            setError("Hospital ID is not available");
            return;
        }

        setLoading(true);
        setError("");
        
        // Build query parameters
        const params = {};
        if (donationType) params.donation_type = donationType;
        if (appointmentType) params.appointment_type = appointmentType;
        if (status) params.status = status;
        
        const queryString = new URLSearchParams(params).toString();
        const url = `/api/hospital/dashboard/donors/${hospitalId}${queryString ? '?' + queryString : ''}`;
        
        api.get(url)
            .then(res => {
                if (res.data.success) {
                    setDonors(res.data.donors || []);
                } else {
                    setError(res.data.message || "Failed to fetch donors");
                    setDonors([]);
                }
            })
            .catch(err => {
                console.error('Error fetching donors:', err);
                setError(err.response?.data?.message || "An error occurred while fetching donors");
                setDonors([]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (hospitalId) {
            fetchDonors();
        }
    }, [hospitalId, donationType, appointmentType, status]);

    const handleViewDonor = (donor) => {
        setSelectedDonor(donor);
        setShowDonorModal(true);
    };

    const handleApproveDonation = (donorId) => {
        // In production: axios.post(`/api/hospital/donors/${donorId}/approve`)
        console.log("Approve donation for:", donorId);
        // Trigger notification
    };

    const handleClearFilters = () => {
        setDonationType("");
        setAppointmentType("");
        setStatus("");
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

            {/* Filters Section */}
            <div className="control-panel" style={{ marginBottom: '20px', padding: '20px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end' }}>
                    {/* Donation Type Filter */}
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                            Donation Type
                        </label>
                        <select
                            value={donationType}
                            onChange={(e) => setDonationType(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                fontSize: '14px',
                                backgroundColor: '#fff'
                            }}
                        >
                            <option value="">All Donation Types</option>
                            <option value="Home Blood Donation">Home Blood Donation</option>
                            <option value="Hospital Blood Donation">Hospital Blood Donation</option>
                            <option value="Alive Organ Donation">Alive Organ Donation</option>
                        </select>
                    </div>

                    {/* Appointment Type Filter */}
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                            Appointment Type
                        </label>
                        <select
                            value={appointmentType}
                            onChange={(e) => setAppointmentType(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                fontSize: '14px',
                                backgroundColor: '#fff'
                            }}
                        >
                            <option value="">All Appointment Types</option>
                            <option value="urgent">Urgent</option>
                            <option value="regular">Regular</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                            Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                fontSize: '14px',
                                backgroundColor: '#fff'
                            }}
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="canceled">Canceled</option>
                        </select>
                    </div>

                    {/* Clear Filters Button */}
                    <div>
                        <button
                            onClick={handleClearFilters}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#6B6B6B',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#5a5a5a'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#6B6B6B'}
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Active Filters Display */}
                {(donationType || appointmentType || status) && (
                    <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '6px', fontSize: '13px' }}>
                        <strong>Active Filters:</strong>
                        {donationType && <span style={{ marginLeft: '10px', padding: '4px 8px', backgroundColor: '#fff', borderRadius: '4px' }}>Donation: {donationType}</span>}
                        {appointmentType && <span style={{ marginLeft: '10px', padding: '4px 8px', backgroundColor: '#fff', borderRadius: '4px' }}>Type: {appointmentType}</span>}
                        {status && <span style={{ marginLeft: '10px', padding: '4px 8px', backgroundColor: '#fff', borderRadius: '4px' }}>Status: {status}</span>}
                    </div>
                )}
            </div>

            {error && (
                <div style={{ 
                    padding: '12px', 
                    background: '#fee', 
                    color: '#c33', 
                    borderRadius: '8px',
                    marginBottom: '20px' 
                }}>
                    {error}
                </div>
            )}

            <HospitalDonorTable 
                donors={donors}
                loading={loading}
                error={error}
                onViewDonor={handleViewDonor}
                hospitalId={hospitalId}
                onStatusUpdate={fetchDonors}
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
                                    <div><strong>Donor ID:</strong> {selectedDonor.code || selectedDonor.id}</div>
                                    <div><strong>Age:</strong> {selectedDonor.age || 'N/A'}</div>
                                    <div><strong>Blood Type:</strong> {selectedDonor.blood_type || 'N/A'}</div>
                                    <div><strong>Gender:</strong> {selectedDonor.gender || 'N/A'}</div>
                                    <div><strong>Phone:</strong> {selectedDonor.phone_nb || 'N/A'}</div>
                                    <div><strong>Email:</strong> {selectedDonor.email || 'N/A'}</div>
                                    <div><strong>Address:</strong> {selectedDonor.address || 'N/A'}</div>
                                </div>
                            </div>
                            <div className="control-panel" style={{ marginTop: '15px' }}>
                                <h4 className="control-panel-title">Appointment Information</h4>
                                <div className="info-grid">
                                    <div><strong>Last Appointment Type:</strong> {selectedDonor.latest_appointment_type || 'N/A'}</div>
                                    <div><strong>Last Appointment Status:</strong> {selectedDonor.latest_appointment_status || 'N/A'}</div>
                                    <div><strong>Last Appointment Date:</strong> {selectedDonor.latest_appointment_date || 'N/A'}</div>
                                    <div><strong>Last Donation Type:</strong> {selectedDonor.latest_donation_type || 'N/A'}</div>
                                </div>
                            </div>
                            <div className="control-panel" style={{ marginTop: '15px' }}>
                                <h4 className="control-panel-title">Medical History</h4>
                                <div className="info-grid">
                                    <div><strong>Last Donation:</strong> {selectedDonor.last_donation || 'Never'}</div>
                                    <div><strong>Total Donations:</strong> {selectedDonor.total_donations || 0}</div>
                                    <div><strong>Pending Appointments:</strong> {selectedDonor.pending_appointments || 0}</div>
                                    <div><strong>Hospital Appointments:</strong> {selectedDonor.hospital_appointments_count || 0}</div>
                                    <div><strong>Home Appointments:</strong> {selectedDonor.home_appointments_count || 0}</div>
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
