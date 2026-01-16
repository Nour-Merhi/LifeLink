import { useState, useEffect } from "react";
import { FaHospital } from "react-icons/fa";
import { FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { BiSolidBuildingHouse } from "react-icons/bi";
import { LiaUserNurseSolid } from "react-icons/lia";
import { PiHeartbeatFill } from "react-icons/pi";
import { MdOutlineHealthAndSafety } from "react-icons/md";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

export default function HospitalDashboard() {
    const { user } = useAuth();
    const [hospitalInfo, setHospitalInfo] = useState(null);
    const [metrics, setMetrics] = useState({
        urgentDonations: 0,
        regularAppointments: 0,
        pendingHomeVisits: 0,
        phlebotomistsOnDuty: 0,
        criticalBloodShortages: 0,
        pendingOrganMatches: 0
    });
    const [todayAppointments, setTodayAppointments] = useState([]);
    const [recentEvents, setRecentEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchDashboardData();
    }, [user]);

    const fetchDashboardData = () => {
        setLoading(true);
        setError("");
        
        // Get hospital ID from user's health center manager relationship or use default
        let hospitalId = null;
        if (user && user.health_center_manager && user.health_center_manager.hospital_id) {
            hospitalId = user.health_center_manager.hospital_id;
        } else if (user && user.healthCenterManager && user.healthCenterManager.hospital_id) {
            hospitalId = user.healthCenterManager.hospital_id;
        }
        
        // TODO: For now, use hospital_id from URL params or default to 1
        // In production, this should come from the authenticated user
        const urlHospitalId = new URLSearchParams(window.location.search).get('hospital_id');
        hospitalId = hospitalId || urlHospitalId || 1;
        
        api.get(`/api/hospital/dashboard/overview/${hospitalId}`)
            .then(res => {
                if (res.data.success) {
                    setHospitalInfo(res.data.hospitalInfo || {});
                    setMetrics(res.data.metrics || {
                        urgentDonations: 0,
                        regularAppointments: 0,
                        pendingHomeVisits: 0,
                        phlebotomistsOnDuty: 0,
                        criticalBloodShortages: 0,
                        pendingOrganMatches: 0
                    });
                    setTodayAppointments(res.data.todayAppointments || []);
                    setRecentEvents(res.data.recentEvents || []);
                } else {
                    setError(res.data.message || "Failed to fetch dashboard data");
                }
            })
            .catch(err => {
                console.error('Error fetching dashboard data:', err);
                setError(err.response?.data?.message || "An error occurred while fetching dashboard data");
            })
            .finally(() => setLoading(false));
    };

    const metricsData = [
        {
            title: "Today's Urgent Donations",
            value: metrics.urgentDonations.toString(),
            change: "24-hour window",
            icon: <FiAlertCircle />,
            bgColor: "#FFE5E5",
            iconColor: "#F12C31"
        },
        {
            title: "Regular Appointments",
            value: metrics.regularAppointments.toString(),
            change: "Scheduled today",
            icon: <FiCheckCircle />,
            bgColor: "#EAFFE5",
            iconColor: "#16a34a"
        },
        {
            title: "Pending Home Visits",
            value: metrics.pendingHomeVisits.toString(),
            change: "Awaiting assignment",
            icon: <BiSolidBuildingHouse />,
            bgColor: "#EBEAFF",
            iconColor: "#285BFF"
        },
        {
            title: "Phlebotomists On Duty",
            value: metrics.phlebotomistsOnDuty.toString(),
            change: "Currently active",
            icon: <LiaUserNurseSolid />,
            bgColor: "#F5E9FF",
            iconColor: "#6132BE"
        },
        {
            title: "Critical Blood Shortages",
            value: metrics.criticalBloodShortages.toString(),
            change: "Below threshold",
            icon: <PiHeartbeatFill />,
            bgColor: "#FFF5E5",
            iconColor: "#F59E0B"
        },
        {
            title: "Pending Organ Matches",
            value: metrics.pendingOrganMatches.toString(),
            change: "Awaiting approval",
            icon: <MdOutlineHealthAndSafety />,
            bgColor: "#E5F3FF",
            iconColor: "#0EA5E9"
        }
    ];

    if (loading) {
        return (
            <section className="hospital-dashboard-section">
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    minHeight: '400px',
                    fontSize: '18px' 
                }}>
                    Loading dashboard data...
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="hospital-dashboard-section">
                <div style={{ 
                    padding: '20px', 
                    background: '#fee', 
                    color: '#c33', 
                    borderRadius: '8px',
                    margin: '20px 0' 
                }}>
                    <strong>Error:</strong> {error}
                    <button 
                        onClick={fetchDashboardData}
                        style={{ 
                            marginLeft: '10px', 
                            padding: '5px 10px',
                            cursor: 'pointer'
                        }}
                    >
                        Retry
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="hospital-dashboard-section">
            {/* Header with Hospital Name and Status */}
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <FaHospital className="icon-size" />
                        <div>
                            <h2>{hospitalInfo?.name || "Hospital Dashboard"}</h2>
                            <span className={`status-badge ${hospitalInfo?.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                                {hospitalInfo?.status === 'active' ? '● Active' : '● Inactive'}
                            </span>
                        </div>
                    </div>
                    <p>{hospitalInfo?.address || "Hospital Management Dashboard"}</p>
                </div>
                <div className="add-btn">
                    <button type="button">Export Report</button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="metrics-grid">
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

        </section>
    );
}

