import { useState, useEffect } from "react";
import { FaHome } from "react-icons/fa";
import { IoMdArrowForward } from "react-icons/io";
import { FiEdit2 } from "react-icons/fi";
import nurseMetricIcon from "../../assets/imgs/nurseMetricIcon.svg";
import "../../styles/Dashboard.css";
import api from "../../api/axios";

export default function Home(){
    const [searchTerm, setSearchTerm] = useState("");
    const [bloodType, setBloodType] = useState("all-blood");
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await api.get("/api/nurse/dashboard");
                
                if (response.data) {
                    setDashboardData(response.data);
                } else {
                    setError("No data received from server");
                }
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                console.error("Error response:", err.response);
                
                let errorMessage = "Failed to load dashboard data";
                if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (err.response?.status === 401) {
                    errorMessage = "Please log in to view your dashboard";
                } else if (err.response?.status === 403) {
                    errorMessage = "You don't have permission to access this page";
                } else if (err.message) {
                    errorMessage = err.message;
                }
                
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Prepare metrics data from API response
    const metricsData = dashboardData ? [
        {
            title: "Upcoming Home Visits",
            value: dashboardData.metrics.upcoming_home_visits.count.toString(),
            change: `Next: ${dashboardData.metrics.upcoming_home_visits.next_appointment}`,
            icon: <img src={nurseMetricIcon} alt="nurse metric icon" />,
        },
        {
            title: "Completed Donations",
            value: dashboardData.metrics.completed_donations.total.toString(),
            change: `This month ${dashboardData.metrics.completed_donations.this_month}`,
        },
        {
            title: "Pending Requests",
            value: dashboardData.metrics.pending_requests.count.toString(),
            change: dashboardData.metrics.pending_requests.urgent > 0 
                ? `${dashboardData.metrics.pending_requests.urgent} urgent`
                : "No urgent requests",
        },
        {
            title: "Hospital Assigned",
            value: dashboardData.metrics.hospital_assigned.name,
            change: "View details",
        }
    ] : [];

    // Get appointments from API response
    const appointments = dashboardData?.appointments || [];

    // Filter appointments based on search and blood type
    const filteredAppointments = appointments.filter((appointment) => {
        const matchesSearch = !searchTerm || 
            appointment.donor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointment.address?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesBloodType = bloodType === "all-blood" || 
            appointment.bloodType === bloodType;
        
        return matchesSearch && matchesBloodType;
    });

    const getStatusClass = (status) => {
        if (!status) return "";
        const statusLower = status.toLowerCase();
        if (statusLower === "completed") return "status-completed";
        if (statusLower === "canceled") return "status-canceled";
        if (statusLower === "pending") return "status-pending";
        return "";
    };

    if (loading) {
        return (
            <div className="nurse-section flex items-center justify-center h-64">
                <p className="text-gray-500">Loading dashboard data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="nurse-section flex flex-col items-center justify-center h-64 p-4">
                <p className="text-red-500 text-lg font-semibold mb-2">Error: {error}</p>
                <p className="text-gray-600 text-sm">
                    Please check your browser console for more details, or contact support if the issue persists.
                </p>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="nurse-section flex items-center justify-center h-64">
                <p className="text-gray-500">No dashboard data available</p>
            </div>
        );
    }

    return (
        <>
        <div className="nurse-section">
            {/* Summary Cards */}
            <div className="metrics-grid">
                {metricsData.map((metric, index) => (
                    <div key={index} className={`metric-card ${index === 0 ? "linear-light-blue" : ""}`}>
                        <div className="metric-content">
                            <div className="metric-info">
                                <p className="metric-title">{metric.title}</p>
                                <h3 className="metric-value">{metric.value}</h3>
                                {index === 3 ? (
                                    <button style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "5px", background: "none", border: "none", color: "#2196F3", cursor: "pointer", fontSize: "12px", fontWeight: "500", padding: 0 }}>
                                        {metric.change} <IoMdArrowForward />
                                    </button>
                                ) : (
                                    <span className="metric-change">{metric.change}</span>
                                )}
                            </div>
                            <div className="metric-icon" style={{ backgroundColor: metric.bgColor, color: metric.iconColor }}>
                                {metric.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Home Donation Appointments */}
            <div className="donor-section">

                <div className="control-panel">
                    <div className="dashboard-title">
                        <div className="icon-title">
                            <FaHome style={{ fontSize: "24px", color: "#252E32" }} />
                            <h2 className="control-panel-title">Home Donation Appointments</h2>
                        </div>
                    </div>
                    <div className="control-panel-layout">
                        <div className="control-panel-layout-left">
                            <div className="search-input">
                                <input
                                    type="text"
                                    placeholder="Search by name"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="filters">
                            <select
                                value = { bloodType } 
                                onChange = { (e) => setBloodType (e.target.value) }
                            >
                                <option value = "all-blood" >All blood types</option>
                                <option value = "AB+" >AB+</option>
                                <option value = "A+" >A+</option>
                                <option value = "B+" >B+</option>
                                <option value = "O+" >O+</option>
                                <option value = "O-" >O-</option>
                                <option value = "B-" >B-</option>
                                <option value = "A-" >A-</option>
                                <option value = "AB-" >AB-</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="donor-container table-design">
                    <table className="h1-table">
                        <thead>
                            <tr>
                                <th className="col-checkbox"></th>
                                <th className="col-donor text-left">Donor</th>
                                <th className="col-address text-left">Address</th>
                                <th className="col-status">Status</th>
                                <th className="col-blood-type">Blood Type</th>
                                <th className="col-date">Date</th>
                                <th className="col-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAppointments.length > 0 ? filteredAppointments.map((appointment) => (
                                <tr key={appointment.id}>
                                    <td className="col-checkbox">
                                        <input type="checkbox" />
                                    </td>
                                    <td className="col-donor">{appointment.donor}</td>
                                    <td className="col-address">{appointment.address}</td>
                                    <td className="col-status">
                                        <span className={`status-badge ${getStatusClass(appointment.status)}`}>
                                            {appointment.status || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="col-blood-type">{appointment.bloodType}</td>
                                    <td className="col-date">{appointment.date}</td>
                                    <td className="col-actions">
                                        <button className="icon-btn edit-btn">
                                            <FiEdit2 />
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" className="text-center text-gray-500 py-4">
                                        No appointments found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        </>
    )
}
