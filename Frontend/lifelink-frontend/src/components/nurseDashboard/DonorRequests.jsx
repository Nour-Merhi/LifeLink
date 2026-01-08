import { useState, useEffect } from "react";
import { LuPhoneCall } from "react-icons/lu";
import { FaRegClock } from "react-icons/fa";
import { MdOutlineCalendarMonth } from "react-icons/md";
import { GrMapLocation } from "react-icons/gr";
import { FaInfoCircle } from "react-icons/fa";
import { FaClipboardList } from "react-icons/fa6";
import { FaMapMarkerAlt } from "react-icons/fa";
import { FaCheck } from "react-icons/fa";
import { FaTimes } from "react-icons/fa";

import "../../styles/Dashboard.css";
import api from "../../api/axios";

export default function DonorRequests(){
    const [activeTab, setActiveTab] = useState("All");
    const [bloodType, setBloodType] = useState("all-blood");
    const [donorRequests, setDonorRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDonorRequests = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await api.get("/api/nurse/donor-requests");
                
                if (response.data && response.data.requests) {
                    setDonorRequests(response.data.requests);
                } else {
                    setError("No requests data received from server");
                }
            } catch (err) {
                console.error("Error fetching donor requests:", err);
                console.error("Error response:", err.response);
                
                let errorMessage = "Failed to load donor requests";
                if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (err.response?.status === 401) {
                    errorMessage = "Please log in to view donor requests";
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

        fetchDonorRequests();
    }, []);

    // Filter requests based on blood type
    const filteredRequests = donorRequests.filter((request) => {
        if (bloodType === "all-blood") return true;
        return request.bloodType === bloodType;
    });

    if (loading) {
        return (
            <div className="nurse-section flex items-center justify-center h-64">
                <p className="text-gray-500">Loading donor requests...</p>
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
                        <FaClipboardList style={{ fontSize: "24px", color: "#252E32" }} />
                        <h2>Donor Requests</h2>
                    </div>
                    <p style={{ fontSize: "14px", color: "#767676", margin: "5px 0 0 0", fontWeight: "normal" }}>
                        Review and respond to blood donation requests from hospitals.
                    </p>
                </div>
                <p>Total Requests: {donorRequests.length}</p>
            </div>

            <div className="financial-tabs">
                <button
                    className={activeTab === "All" ? "tab-active-nurse" : "tab-inactive"}
                    onClick={() => setActiveTab("All")}
                >
                    All
                </button>
                <div className="filters">
                    <select
                        value={bloodType}
                        onChange={(e) => setBloodType(e.target.value)}
                    >
                        <option value="all-blood">All blood types</option>
                        <option value="AB+">AB+</option>
                        <option value="A+">A+</option>
                        <option value="B+">B+</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="B-">B-</option>
                        <option value="A-">A-</option>
                        <option value="AB-">AB-</option>
                    </select>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "20px" }}>
                {filteredRequests.length > 0 ? filteredRequests.map((request) => (
                    <div key={request.id} className="donor-container" style={{ padding: "20px", display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", gap: "20px" }}>
                            {/* Top Section - Donor Information */}
                            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "20px", flex: 1 }}>
                                <div style={{ display: "flex", gap: "20px", flex: 1 }}>
                                    <div style={{ width: "60px", height: "60px", borderRadius: "50%", backgroundColor: "#E7F1FD", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <FaInfoCircle style={{ fontSize: "30px", color: "#2196F3" }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#252E32" }}>
                                            {request.donorName} ({request.gender})
                                        </h3>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#767676" }}>
                                            <span style={{ fontWeight: "600", color: "#767676" }}>Blood Type:</span> {request.bloodType}
                                        </div>
                                    </div>
                                </div>
                                {/* Bottom Section - Contact and Address Information */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", padding: "5px 0 20px 0" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", color: "#767676" }}>
                                            <LuPhoneCall className="text-red-500"/>
                                            {request.phone}
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", color: "#767676" }}>
                                            <FaRegClock className="text-red-500"/>
                                            {request.time}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", color: "#767676" }}>
                                            <GrMapLocation className="text-red-500"/>
                                            {request.address}
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", color: "#767676" }}>
                                            <MdOutlineCalendarMonth className="text-red-500"/>
                                            {request.date}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                                <button
                                    className="add-btn"
                                    style={{ background: "linear-gradient(to right, #A7BBFC, #3257CD)", padding: "8px 16px", fontSize: "14px", borderRadius: "5px", color: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}
                                >
                                    <FaCheck className="text-white"/>
                                    Accept Request
                                </button>
                                <button
                                    className="add-btn"
                                    style={{ background: "linear-gradient(to right, #FF9D9D, #EE2A2A)", padding: "8px 16px", fontSize: "14px", borderRadius: "5px", color: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}
                                >
                                    <FaTimes className="text-white"/>
                                    Decline
                                </button>
                                <button
                                    className="add-btn"
                                    style={{ background: "linear-gradient(to right, #FF9D9D, #EE2A2A)", padding: "8px 16px", fontSize: "14px", borderRadius: "5px", color: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}
                                >
                                    <FaInfoCircle className="text-white"/>
                                    More Info
                                </button>
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#204BD3", backgroundColor: "#E8EDFF", padding: "10px", borderRadius: "5px" }}>
                            <FaInfoCircle className="text-blue-500"/>
                            For emergency contact: {request.emergencyContact}
                        </div>
                    </div>
                )) : (
                    <div className="donor-container" style={{ padding: "40px", textAlign: "center" }}>
                        <p className="text-gray-500 text-lg">No donor requests found</p>
                        <p className="text-gray-400 text-sm mt-2">
                            {bloodType !== "all-blood" 
                                ? `No requests for blood type "${bloodType}"` 
                                : "There are no pending donor requests at this time"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
