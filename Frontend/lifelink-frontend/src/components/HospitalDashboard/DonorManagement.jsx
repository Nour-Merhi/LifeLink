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
    const [hospitalId, setHospitalId] = useState(null); // set from API response for status updates

    // Filter states
    const [donationType, setDonationType] = useState(""); // All, Home Blood Donation, Hospital Blood Donation, Alive Organ Donation
    const [appointmentType, setAppointmentType] = useState(""); // All, urgent, regular
    const [status, setStatus] = useState(""); // All, pending, completed, canceled

    const fetchDonors = () => {
        setLoading(true);
        setError("");
        
        // Build query parameters
        const params = {};
        if (donationType) params.donation_type = donationType;
        if (appointmentType) params.appointment_type = appointmentType;
        if (status) params.status = status;

        // Manager-scoped endpoint: backend resolves hospital_id from authenticated manager
        api.get(`/api/hospital/dashboard/donors`, { params })
            .then(res => {
                if (res.data.success) {
                    setDonors(res.data.donors || []);
                    // Keep hospitalId from response for status updates in the table
                    if (res.data?.hospital?.id) {
                        setHospitalId(res.data.hospital.id);
                    }
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
        if (user) {
            fetchDonors();
        }
    }, [user, donationType, appointmentType, status]);

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
                    <div
                        className="modal-container modal-modern modal-modern-wide"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="modal-modern-header">
                            <div className="modal-modern-title">
                                <h2>Donor Profile</h2>
                                <div className="modal-modern-subtitle">
                                    <span><strong>{selectedDonor.name || "N/A"}</strong></span>
                                    <span>•</span>
                                    <span>{selectedDonor.code || selectedDonor.id || "N/A"}</span>
                                </div>
                            </div>
                            <button className="modal-icon-btn" onClick={() => setShowDonorModal(false)} aria-label="Close">
                                <FiX />
                            </button>
                        </div>

                        <div className="modal-modern-body">
                            <div className="modal-section">
                                <div className="modal-section-title">Personal Information</div>
                                <div className="modal-grid">
                                    <div className="modal-field"><span className="label">Age</span><span className="value">{selectedDonor.age ?? "N/A"}</span></div>
                                    <div className="modal-field"><span className="label">Blood Type</span><span className="value">{selectedDonor.blood_type ?? "N/A"}</span></div>
                                    <div className="modal-field"><span className="label">Gender</span><span className="value">{selectedDonor.gender ?? "N/A"}</span></div>
                                    <div className="modal-field"><span className="label">Phone</span><span className="value">{selectedDonor.phone_nb ?? "N/A"}</span></div>
                                    <div className="modal-field"><span className="label">Email</span><span className="value">{selectedDonor.email ?? "N/A"}</span></div>
                                    <div className="modal-field full-width"><span className="label">Address</span><span className="value">{selectedDonor.address ?? "N/A"}</span></div>
                                </div>
                            </div>

                            <div className="modal-section">
                                <div className="modal-section-title">Appointment Information</div>
                                <div className="modal-grid">
                                    <div className="modal-field"><span className="label">Last Appointment Type</span><span className="value">{selectedDonor.latest_appointment_type ?? "N/A"}</span></div>
                                    <div className="modal-field"><span className="label">Last Appointment Status</span><span className="value">{selectedDonor.latest_appointment_status ?? "N/A"}</span></div>
                                    <div className="modal-field"><span className="label">Last Appointment Date</span><span className="value">{selectedDonor.latest_appointment_date ?? "N/A"}</span></div>
                                    <div className="modal-field"><span className="label">Last Donation Type</span><span className="value">{selectedDonor.latest_donation_type ?? "N/A"}</span></div>
                                </div>
                            </div>

                            <div className="modal-section">
                                <div className="modal-section-title">Medical & Activity Summary</div>
                                <div className="modal-grid">
                                    <div className="modal-field"><span className="label">Last Donation</span><span className="value">{selectedDonor.last_donation ?? "Never"}</span></div>
                                    <div className="modal-field"><span className="label">Total Donations</span><span className="value">{selectedDonor.total_donations ?? 0}</span></div>
                                    <div className="modal-field"><span className="label">Pending Appointments</span><span className="value">{selectedDonor.pending_appointments ?? 0}</span></div>
                                    <div className="modal-field"><span className="label">Hospital Appointments</span><span className="value">{selectedDonor.hospital_appointments_count ?? 0}</span></div>
                                    <div className="modal-field"><span className="label">Home Appointments</span><span className="value">{selectedDonor.home_appointments_count ?? 0}</span></div>
                                    <div className="modal-field full-width">
                                        <span className="label">Medical Conditions</span>
                                        <span className="value">
                                            {selectedDonor.medical_conditions?.length > 0 ? selectedDonor.medical_conditions.join(", ") : "None"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-modern-footer">
                            <button className="btn-cancel" type="button" onClick={() => setShowDonorModal(false)}>
                                Close
                            </button>
                            <button className="submit-btn active" type="button" onClick={() => handleApproveDonation(selectedDonor.id)}>
                                Approve for Donation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
