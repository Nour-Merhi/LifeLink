import { useState, useEffect } from "react";
import { LuPhoneCall } from "react-icons/lu";
import { FaRegClock } from "react-icons/fa";
import { MdOutlineCalendarMonth } from "react-icons/md";
import { GrMapLocation } from "react-icons/gr";
import { FaInfoCircle } from "react-icons/fa";
import { FaClipboardList } from "react-icons/fa6";
import { FaMapMarkerAlt } from "react-icons/fa";

import "../../styles/Dashboard.css";
import api from "../../api/axios";

export default function MyAppointments(){
    const [activeTab, setActiveTab] = useState("All");
    const [bloodType, setBloodType] = useState("all-blood");
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await api.get("/api/nurse/my-appointments");
                
                if (response.data && response.data.appointments) {
                    setAppointments(response.data.appointments);
                } else {
                    setError("No appointments data received from server");
                }
            } catch (err) {
                console.error("Error fetching appointments:", err);
                console.error("Error response:", err.response);
                
                let errorMessage = "Failed to load appointments";
                if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (err.response?.status === 401) {
                    errorMessage = "Please log in to view your appointments";
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

        fetchAppointments();
    }, []);

    // Filter appointments based on active tab
    const filteredAppointments = appointments.filter((appointment) => {
        if (activeTab === "All") return true;
        const statusLower = appointment.status?.toLowerCase() || "";
        if (activeTab === "Pending") return statusLower === "pending";
        if (activeTab === "Confirmed") return statusLower === "confirmed";
        if (activeTab === "Completed") return statusLower === "completed";
        return true;
    });

    // Get status class for badge
    const getStatusClass = (status) => {
        if (!status) return "";
        const statusLower = status.toLowerCase();
        if (statusLower === "completed") return "status-completed";
        if (statusLower === "pending") return "status-pending";
        if (statusLower === "confirmed") return "status-completed"; // Confirmed uses green background like completed
        if (statusLower === "cancelled" || statusLower === "canceled") return "status-canceled";
        return "";
    };

    if (loading) {
        return (
            <div className="nurse-section flex items-center justify-center h-64">
                <p className="text-gray-500">Loading appointments...</p>
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

    return (
        <div className="nurse-section">
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <FaClipboardList />
                        <h2>My Appointments</h2>
                    </div>
                    <p>Manage your scheduled home donation visits</p>
                </div>
                <p>Total Appointments: {appointments.length}</p>
            </div>

            <div className="financial-tabs">
                <button
                    className={activeTab === "All" ? "tab-active-nurse" : "tab-inactive"}
                    onClick={() => setActiveTab("All")}
                >
                    All
                </button>
                <button
                    className={activeTab === "Pending" ? "tab-active-nurse" : "tab-inactive"}
                    onClick={() => setActiveTab("Pending")}
                >
                    Pending
                </button>
                <button
                    className={activeTab === "Confirmed" ? "tab-active-nurse" : "tab-inactive"}
                    onClick={() => setActiveTab("Confirmed")}
                >
                    Confirmed
                </button>
                <button
                    className={activeTab === "Completed" ? "tab-active-nurse" : "tab-inactive"}
                    onClick={() => setActiveTab("Completed")}
                >
                    Completed
                </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "20px" }}>
                {filteredAppointments.length > 0 ? filteredAppointments.map((appointment) => (
                    <div key={appointment.id} className="donor-container" style={{ padding: "20px", display: "flex", flexDirection: "column" }}>
                        {/* Left Side - Donor Information */}
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "20px", flex: 1 }}>
                            <div style={{ width: "60px", height: "60px", borderRadius: "50%", backgroundColor: "#E7F1FD", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <FaInfoCircle style={{ fontSize: "30px", color: "#2196F3" }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                    <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#252E32", margin: 0 }}>
                                        {appointment.donorName} ({appointment.gender})
                                    </h3>
                                    {appointment.status && (
                                        <span className={`status-badge ${getStatusClass(appointment.status)}`}>
                                            {appointment.status}
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#767676", marginTop: "5px" }}>
                                    <span style={{ fontWeight: "600", color: "#767676" }}>Blood Type:</span> {appointment.bloodType}
                                </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                                {appointment.status?.toLowerCase() !== "completed" && (
                                    <button
                                        className="add-btn"
                                        style={{ background: "linear-gradient(to right, #A7BBFC, #3257CD)", padding: "8px 16px", fontSize: "14px", borderRadius: "5px", color: "white" }}
                                    >
                                        Mark Complete
                                    </button>
                                )}
                                <button
                                    className="add-btn"
                                    style={{ background: "linear-gradient(to right, #FF9D9D, #EE2A2A)", padding: "8px 16px", fontSize: "14px", borderRadius: "5px", display: "flex", alignItems: "center", gap: "5px", color: "white" }}
                                >
                                    <FaMapMarkerAlt style={{ fontSize: "12px" }} />
                                    Directions
                                </button>
                            </div>
                        </div>

                        {/* Right Side - Contact and Actions */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", padding: "5px 0 20px 0" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px"}}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", color: "#767676" }}>
                                    <LuPhoneCall className="text-red-500"/>
                                    {appointment.phone}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", color: "#767676" }}>
                                    <FaRegClock className="text-red-500"/>
                                    {appointment.time}
                                </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", color: "#767676" }}>
                                    <GrMapLocation className="text-red-500"/>
                                    {appointment.address}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", color: "#767676" }}>
                                    <MdOutlineCalendarMonth className="text-red-500"/>
                                    {appointment.date}
                                </div>
                            </div>
                            
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#204BD3", backgroundColor: "#E8EDFF", padding: "10px", borderRadius: "5px" }}>
                            <FaInfoCircle className="text-blue-500"/>
                            For emergency contact: {appointment.emergencyContact}
                        </div>
                    </div>
                )) : (
                    <div className="donor-container" style={{ padding: "40px", textAlign: "center" }}>
                        <p className="text-gray-500 text-lg">No appointments found</p>
                        <p className="text-gray-400 text-sm mt-2">
                            {activeTab !== "All" 
                                ? `No appointments with status "${activeTab}"` 
                                : "You don't have any appointments yet"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
