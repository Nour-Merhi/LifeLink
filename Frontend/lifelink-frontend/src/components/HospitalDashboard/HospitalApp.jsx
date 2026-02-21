import { useState } from "react";
import { FaHospital } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import HospitalAppRequestsTable from "./appointmentComponents/HospitalAppRequestsTable";
import AddHospitalApp from "./appointmentComponents/AddHospitalApp";

export default function HospitalApp() {
    const { user } = useAuth();
    const [refreshKey, setRefreshKey] = useState(0);
    const [openModal, setOpenModal] = useState(false);
    // Get hospital ID from user's health center manager relationship
    const hospitalId = user?.health_center_manager?.hospital_id ?? user?.healthCenterManager?.hospital_id ?? user?.hospital_id;

    const fetchHospitalAppointments = () => {
        // Trigger refresh by updating the key, which will cause HospitalAppRequestsTable to re-render
        setRefreshKey(prev => prev + 1);
    };

    return (
        <section className="home-visit-section">
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <FaHospital className="icon-size" />
                        <h2>Hospital Appointment Requests</h2>
                    </div>
                    <p>View and manage hospital blood donation appointment requests</p>
                </div>
                <div className="add-btn">
                    <button type="button" onClick={() => setOpenModal(true)}>+ Schedule Hospital Appointment</button>
                </div>
            </div>

            {/* Hospital Appointments Table */}
            {hospitalId && (
                <HospitalAppRequestsTable 
                    key={`${refreshKey}-${hospitalId}`}
                    hospitalId={hospitalId}
                    loading={false}
                    error=""
                    onAppointmentsUpdate={fetchHospitalAppointments}
                />
            )}

            {openModal && (
                <AddHospitalApp 
                    open={openModal}
                    onClose={() => setOpenModal(false)}
                    onAppointmentAdded={fetchHospitalAppointments}
                    hospitalId={hospitalId}
                    defaultAppointmentType="hospital"
                />
            )}
        </section>
    );
}
