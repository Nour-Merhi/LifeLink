import { useState, useEffect } from "react";
import { LiaUserNurseSolid } from "react-icons/lia";
import { FiCheckCircle, FiMapPin } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import PhlebotomistTable from "../adminDashboard/phlebotomistComponents/PhlebotomistTable";
import AddPhlebotomistForm from "../adminDashboard/phlebotomistComponents/AddPhlebotomistForm";
import api from "../../api/axios";

export default function Phlebotomists() {
    const { user } = useAuth();
    const [phlebotomists, setPhlebotomists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [addModalOpen, setAddModalOpen] = useState(false);

    // Get hospital ID: mobile login returns user.hospital_id; session login returns healthCenterManager.hospital_id
    const hospitalId = user?.health_center_manager?.hospital_id ?? user?.healthCenterManager?.hospital_id ?? user?.hospital_id;
    const hospitalName =
        user?.health_center_manager?.hospital?.name ||
        user?.healthCenterManager?.hospital?.name ||
        null;

    useEffect(() => {
        if (user && hospitalId) {
            fetchPhlebotomists();
        }
    }, [user, hospitalId]);

    const fetchPhlebotomists = () => {
        if (!hospitalId) {
            setError("Hospital ID not found. Please ensure you are logged in as a hospital manager.");
            return;
        }

        setLoading(true);
        setError("");
        
        api.get("/api/hospital/dashboard/phlebotomists", {
            params: hospitalId ? { hospital_id: hospitalId } : {}
        })
            .then(res => {
                setPhlebotomists(res.data.phlebotomists || []);
            })
            .catch(err => {
                console.error('Error fetching phlebotomists:', err);
                setError(err.response?.data?.message || "An error occurred while fetching phlebotomists");
            })
            .finally(() => setLoading(false));
    };

    const metricsData = [
        {
            title: "Total Phlebotomists",
            value: phlebotomists.length.toString(),
            change: "All staff",
            icon: <LiaUserNurseSolid />,
            bgColor: "#EAFFE5",
            iconColor: "#16a34a"
        },
        {
            title: "Available Now",
            value: phlebotomists.filter(p => p.availability === 'available' || p.availability === 'onDuty').length.toString(),
            change: "Ready for assignment",
            icon: <FiCheckCircle />,
            bgColor: "#EBEAFF",
            iconColor: "#285BFF"
        },
        {
            title: "On Assignment",
            value: phlebotomists.filter(p => p.availability === 'unavailable' || p.availability === 'offDuty').length.toString(),
            change: "Currently working",
            icon: <FiMapPin />,
            bgColor: "#F5E9FF",
            iconColor: "#6132BE"
        }
    ];

    return (
        <section className="phlebotomist-section">
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <LiaUserNurseSolid className="icon-size" />
                        <h2>Phlebotomist Management</h2>
                    </div>
                    <p>Assign and track phlebotomists for home visits</p>
                </div>
                <div>
                    <button
                        className="submit-btn"
                        type="button"
                        onClick={() => setAddModalOpen(true)}
                        disabled={!hospitalId}
                        title={!hospitalId ? "Hospital ID not found" : "Add phlebotomist"}
                    >
                        Add Phlebotomist
                    </button>
                </div>
            </div>

            {error && (
                <div className="control-panel" style={{ marginBottom: '20px', backgroundColor: '#FDE8E8', border: '1px solid #E92C30' }}>
                    <p style={{ color: '#E92C30', margin: 0 }}>{error}</p>
                </div>
            )}

            {/* Metrics */}
            <div className="metrics-grid-3">
                {metricsData.map((metric, index) => (
                    <div key={index} className="metric-card">
                        <div className="metric-content">
                            <div className="metric-info">
                                <p className="metric-title">{metric.title}</p>
                                <h3 className="metric-value">{metric.value}</h3>
                                <span className="metric-change">{metric.change}</span>
                            </div>
                            <div className="metric-icon" style={{ backgroundColor: metric.bgColor, color: metric.iconColor }}>
                                {metric.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <PhlebotomistTable 
                phlebotomists={phlebotomists}
                loading={loading}
                error={error}
                onPhlebotomistsUpdate={fetchPhlebotomists}
                viewBasePath="/hospital/phlebotomists"
            />

            {addModalOpen && (
                <AddPhlebotomistForm
                    onClose={() => setAddModalOpen(false)}
                    fixedHospitalId={hospitalId}
                    fixedHospitalName={hospitalName}
                    onPhlebotomistAdded={() => {
                        setAddModalOpen(false);
                        fetchPhlebotomists();
                    }}
                />
            )}
        </section>
    );
}
