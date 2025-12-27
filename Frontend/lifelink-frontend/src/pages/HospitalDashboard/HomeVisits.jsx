import { useState, useEffect } from "react";
import { BiSolidBuildingHouse } from "react-icons/bi";
import { FiMapPin } from "react-icons/fi";
import axios from "axios";
import HomeAppTable from "../../components/adminDashboard/homeVisitComponents/HomeAppTable";
import AddHomeApp from "../../components/adminDashboard/homeVisitComponents/AddHomeApp";

export default function HomeVisits() {
    const [homeVisits, setHomeVisits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [showMap, setShowMap] = useState(false);

    useEffect(() => {
        fetchHomeVisits();
    }, []);

    const fetchHomeVisits = () => {
        setLoading(true);
        axios.get("http://localhost:8000/api/admin/dashboard/home-visit-appointments")
            .then(res => {
                setHomeVisits(res.data.appointments || []);
            })
            .catch(err => {
                setError(err.response?.data?.message || "An error occurred");
            })
            .finally(() => setLoading(false));
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

            {/* Map Toggle */}
            <div className="control-panel">
                <div className="control-panel-layout">
                    <div>
                        <button
                            className={showMap ? 'active-btn' : 'inactive-btn'}
                            onClick={() => setShowMap(!showMap)}
                        >
                            {showMap ? 'Hide Map' : 'Show Map View'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Map View */}
            {showMap && (
                <div className="control-panel" style={{ marginBottom: '20px', minHeight: '400px' }}>
                    <h3 className="control-panel-title">Home Visit Locations Map</h3>
                    <div style={{ 
                        width: '100%', 
                        height: '400px', 
                        background: '#f5f5f5', 
                        borderRadius: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6B6B6B'
                    }}>
                        {/* In production, integrate Google Maps or Mapbox here */}
                        <div style={{ textAlign: 'center' }}>
                            <FiMapPin style={{ fontSize: '48px', marginBottom: '10px' }} />
                            <p>Map integration placeholder</p>
                            <small>Google Maps / Mapbox integration would go here</small>
                        </div>
                    </div>
                </div>
            )}

            {/* Home Visits Table */}
            <HomeAppTable 
                appointments={homeVisits}
                loading={loading}
                error={error}
            />

            {openModal && (
                <AddHomeApp
                    onClose={() => setOpenModal(false)}
                    onAppointmentAdded={fetchHomeVisits}
                />
            )}
        </section>
    );
}

