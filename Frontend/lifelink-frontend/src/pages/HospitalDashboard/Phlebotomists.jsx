import { useState, useEffect } from "react";
import { LiaUserNurseSolid } from "react-icons/lia";
import { FiCheckCircle, FiXCircle, FiMapPin, FiSend } from "react-icons/fi";
import axios from "axios";
import PhlebotomistTable from "../../components/adminDashboard/phlebotomistComponents/PhlebotomistTable";

export default function Phlebotomists() {
    const [phlebotomists, setPhlebotomists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedPhleb, setSelectedPhleb] = useState(null);

    useEffect(() => {
        fetchPhlebotomists();
    }, []);

    const fetchPhlebotomists = () => {
        setLoading(true);
        axios.get("http://localhost:8000/api/admin/dashboard/get-phlebotomists")
            .then(res => {
                setPhlebotomists(res.data.phlebotomists || []);
            })
            .catch(err => {
                setError(err.response?.data?.message || "An error occurred");
            })
            .finally(() => setLoading(false));
    };

    const handleSendNotification = (phlebotomistId) => {
        // In production: axios.post(`/api/hospital/phlebotomists/${phlebotomistId}/notify`)
        console.log("Send notification to:", phlebotomistId);
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
            value: phlebotomists.filter(p => p.availability === 'available').length.toString(),
            change: "Ready for assignment",
            icon: <FiCheckCircle />,
            bgColor: "#EBEAFF",
            iconColor: "#285BFF"
        },
        {
            title: "On Assignment",
            value: phlebotomists.filter(p => p.availability === 'unavailable').length.toString(),
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
            </div>

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
            />
        </section>
    );
}

