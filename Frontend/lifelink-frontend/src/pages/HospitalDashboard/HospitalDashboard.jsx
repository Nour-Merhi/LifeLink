import { useState, useEffect } from "react";
import { FaHospital } from "react-icons/fa";
import { FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { BiSolidBuildingHouse } from "react-icons/bi";
import { LiaUserNurseSolid } from "react-icons/lia";
import { PiHeartbeatFill } from "react-icons/pi";
import { MdOutlineHealthAndSafety } from "react-icons/md";
import axios from "axios";

export default function HospitalDashboard() {
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

    useEffect(() => {
        // Fetch hospital info and metrics
        fetchHospitalData();
        fetchTodayAppointments();
        fetchRecentEvents();
    }, []);

    const fetchHospitalData = () => {
        setLoading(true);
        // In production, fetch from API: /api/hospital/dashboard/overview
        // For now, using sample data
        setTimeout(() => {
            setHospitalInfo({
                name: "City General Hospital",
                status: "active",
                address: "123 Medical Center Drive"
            });
            setMetrics({
                urgentDonations: 5,
                regularAppointments: 23,
                pendingHomeVisits: 8,
                phlebotomistsOnDuty: 12,
                criticalBloodShortages: 2,
                pendingOrganMatches: 3
            });
            setLoading(false);
        }, 500);
    };

    const fetchTodayAppointments = () => {
        // Fetch today's appointments
        const sampleAppointments = [
            { id: 1, time: "09:00", donor: "John Doe", type: "urgent", bloodType: "O+", status: "pending" },
            { id: 2, time: "10:30", donor: "Jane Smith", type: "regular", bloodType: "A+", status: "confirmed" },
            { id: 3, time: "14:00", donor: "Mike Johnson", type: "urgent", bloodType: "B-", status: "pending" },
        ];
        setTodayAppointments(sampleAppointments);
    };

    const fetchRecentEvents = () => {
        // Fetch recent events
        const sampleEvents = [
            { id: 1, type: "urgent", message: "New urgent blood request: O+ needed", time: "2 min ago" },
            { id: 2, type: "donor", message: "Donor John Doe arrived", time: "15 min ago" },
            { id: 3, type: "home", message: "Home visit completed by Sarah", time: "1 hour ago" },
        ];
        setRecentEvents(sampleEvents);
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

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '20px' }}>
                {/* Left: Today's Timeline/Agenda */}
                <div className="control-panel">
                    <h3 className="control-panel-title">Today's Appointments Timeline</h3>
                    <div className="timeline-container">
                        {todayAppointments.length > 0 ? (
                            todayAppointments.map((appointment) => (
                                <div 
                                    key={appointment.id} 
                                    className={`timeline-item ${appointment.type === 'urgent' ? 'urgent-item' : ''}`}
                                >
                                    <div className="timeline-time">{appointment.time}</div>
                                    <div className="timeline-content">
                                        <div className="timeline-header">
                                            <strong>{appointment.donor}</strong>
                                            {appointment.type === 'urgent' && (
                                                <span className="urgent-badge">URGENT</span>
                                            )}
                                        </div>
                                        <div className="timeline-details">
                                            <span>Blood Type: {appointment.bloodType}</span>
                                            <span className={`status-badge status-${appointment.status}`}>
                                                {appointment.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="muted">No appointments scheduled for today</p>
                        )}
                    </div>
                </div>

                {/* Right: Real-time Events Feed */}
                <div className="control-panel">
                    <h3 className="control-panel-title">Real-time Events Feed</h3>
                    <div className="events-feed">
                        {recentEvents.length > 0 ? (
                            recentEvents.map((event) => (
                                <div key={event.id} className={`event-item event-${event.type}`}>
                                    <div className="event-content">
                                        <p className="event-message">{event.message}</p>
                                        <span className="event-time">{event.time}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="muted">No recent events</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom: Quick Actions and System Health */}
            <div className="control-panel" style={{ marginTop: '20px' }}>
                <div className="control-panel-layout">
                    <div>
                        <h3 className="control-panel-title">Quick Actions</h3>
                        <div className="filter-gap" style={{ marginTop: '10px' }}>
                            <button className="add-btn button" style={{ margin: 0 }}>Export CSV</button>
                            <button className="add-btn button" style={{ margin: 0 }}>Export PDF</button>
                            <button className="add-btn button" style={{ margin: 0 }}>View Reports</button>
                        </div>
                    </div>
                    <div>
                        <h3 className="control-panel-title">System Health</h3>
                        <div className="filter-gap" style={{ marginTop: '10px' }}>
                            <span className="status-badge status-active">● All Systems Operational</span>
                            <span className="status-badge status-active">● Last Sync: {new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

