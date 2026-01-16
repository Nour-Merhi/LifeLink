import { useState } from "react";
import { BiSolidBuildingHouse } from "react-icons/bi";
import { FiMapPin } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import HomeAppRequestsTable from "./appointmentComponents/HomeAppRequestsTable";
import AddHomeApp from "./appointmentComponents/AddHomeApp";

export default function HomeVisits() {
    const { user } = useAuth();
    const [openModal, setOpenModal] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Get hospital ID from user's health center manager relationship
    const hospitalId = user?.health_center_manager?.hospital_id || user?.healthCenterManager?.hospital_id;

    const fetchHomeVisits = () => {
        // Trigger refresh by updating the key, which will cause HomeAppRequestsTable to re-render
        setRefreshKey(prev => prev + 1);
    };

    return (
        <section className="home-visit-section">
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <BiSolidBuildingHouse className="icon-size" />
                        <h2>Home Visit Management</h2>
                    </div>
                    <p>Schedule and manage home donation visits with phlebotomist assignments</p>
                </div>
                <div className="add-btn">
                    <button type="button" onClick={() => setOpenModal(true)}>+ Schedule Home Visit</button>
                </div>
            </div>           

            {/* Home Visits Table */}
            {hospitalId && (
                <HomeAppRequestsTable 
                    key={`${refreshKey}-${hospitalId}`}
                    hospitalId={hospitalId}
                    loading={false}
                    error=""
                    onAppointmentsUpdate={fetchHomeVisits}
                />
            )}

            {openModal && (
                <AddHomeApp
                    onClose={() => setOpenModal(false)}
                    onAppointmentAdded={fetchHomeVisits}
                    hospitalId={hospitalId}
                />
            )}
        </section>
    );
}
