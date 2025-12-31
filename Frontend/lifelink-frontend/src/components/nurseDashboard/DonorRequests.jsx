import { useState } from "react";
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

export default function DonorRequests(){
    const [activeTab, setActiveTab] = useState("All");
    const [bloodType, setBloodType] = useState("all-blood");

    // Sample data
    const donorRequests = [
        {
            id: 1,
            donorName: "Sarah Johnson",
            gender: "Female",
            bloodType: "O+",
            address: "123 Oak Street, Downtown",
            date: "2024-01-15",
            time: "09:00 AM",
            phone: "961 768900273",
            emergencyContact: "Nour Merhi - 76543271"
        },
        {
            id: 2,
            donorName: "Sarah Johnson",
            gender: "Female",
            bloodType: "O+",
            address: "123 Oak Street, Downtown",
            date: "2024-01-15",
            time: "09:00 AM",
            phone: "961 768900273",
            emergencyContact: "Nour Merhi - 76543271"
        },
        {
            id: 3,
            donorName: "Sarah Johnson",
            gender: "Female",
            bloodType: "O+",
            address: "123 Oak Street, Downtown",
            date: "2024-01-15",
            time: "09:00 AM",
            phone: "961 768900273",
            emergencyContact: "Nour Merhi - 76543271"
        },
        {
            id: 4,
            donorName: "Sarah Johnson",
            gender: "Female",
            bloodType: "O+",
            address: "123 Oak Street, Downtown",
            date: "2024-01-15",
            time: "09:00 AM",
            phone: "961 768900273",
            emergencyContact: "Nour Merhi - 76543271"
        },
    ];

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
                {donorRequests.map((request) => (
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
                ))}
            </div>
        </div>
    )
}
