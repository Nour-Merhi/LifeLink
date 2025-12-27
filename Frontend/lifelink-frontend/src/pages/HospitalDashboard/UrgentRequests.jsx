import { useState, useEffect } from "react";
import { FiAlertCircle } from "react-icons/fi";
import { FiCheck, FiX, FiMessageSquare, FiMapPin } from "react-icons/fi";
import { IoSearchSharp } from "react-icons/io5";
import axios from "axios";

export default function UrgentRequests() {
    const [urgentRequests, setUrgentRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchUrgentRequests();
    }, []);

    const fetchUrgentRequests = () => {
        setLoading(true);
        // In production: axios.get("/api/hospital/urgent-requests")
        // For now, using sample data
        setTimeout(() => {
            setUrgentRequests([
                {
                    id: 1,
                    requestTime: new Date(Date.now() - 30 * 60000).toISOString(),
                    bloodType: "O+",
                    dueDateTime: new Date(Date.now() + 20 * 60 * 60000).toISOString(),
                    donorMatch: "3 matches found",
                    distance: "5.2 km",
                    eligibility: "verified",
                    urgency: "critical"
                },
                {
                    id: 2,
                    requestTime: new Date(Date.now() - 120 * 60000).toISOString(),
                    bloodType: "A-",
                    dueDateTime: new Date(Date.now() + 18 * 60 * 60000).toISOString(),
                    donorMatch: "1 match found",
                    distance: "12.8 km",
                    eligibility: "pending",
                    urgency: "high"
                }
            ]);
            setLoading(false);
        }, 500);
    };

    const calculateTimeRemaining = (dueDateTime) => {
        const now = new Date();
        const due = new Date(dueDateTime);
        const diff = due - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const handleAssign = (requestId) => {
        // In production: axios.post(`/api/hospital/urgent-requests/${requestId}/assign`)
        console.log("Assign request:", requestId);
    };

    const handleAccept = (requestId) => {
        if (window.confirm("Accept this urgent request?")) {
            // In production: axios.post(`/api/hospital/urgent-requests/${requestId}/accept`)
            console.log("Accept request:", requestId);
        }
    };

    const handleDecline = (requestId) => {
        if (window.confirm("Decline this urgent request?")) {
            // In production: axios.post(`/api/hospital/urgent-requests/${requestId}/decline`)
            console.log("Decline request:", requestId);
        }
    };

    return (
        <section className="home-visit-section">
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <FiAlertCircle className="icon-size" />
                        <h2>Urgent Requests Queue</h2>
                    </div>
                    <p>Manage 24-hour urgent blood donation requests</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="control-panel">
                <div className="control-panel-layout">
                    <div className="search-input">
                        <IoSearchSharp />
                        <input 
                            type="search" 
                            placeholder="Search by blood type, request ID.." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Urgent Requests Table */}
            <div className="table-design">
                <table className="h1-table">
                    <thead>
                        <tr>
                            <th className="col-order-id">Request Time</th>
                            <th className="col-donor">Blood Type</th>
                            <th className="col-date">Due Date/Time</th>
                            <th className="col-contact">Time Remaining</th>
                            <th className="col-phlebotomist">Donor Match</th>
                            <th className="col-address">Distance</th>
                            <th className="col-availability">Eligibility</th>
                            <th className="col-availability">Urgency</th>
                            <th className="col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {urgentRequests.filter(request => {
                            const searchLower = searchTerm.toLowerCase();
                            return searchTerm === "" || 
                                request.bloodType.toLowerCase().includes(searchLower) ||
                                `request-${request.id}`.toLowerCase().includes(searchLower);
                        }).length > 0 ? (
                            urgentRequests.filter(request => {
                                const searchLower = searchTerm.toLowerCase();
                                return searchTerm === "" || 
                                    request.bloodType.toLowerCase().includes(searchLower) ||
                                    `request-${request.id}`.toLowerCase().includes(searchLower);
                            }).map((request) => (
                                <tr key={request.id} className={request.urgency === 'critical' ? 'urgent-row' : ''}>
                                    <td className="col-order-id">
                                        <div className="cell-date">
                                            <span>{new Date(request.requestTime).toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className="col-donor">
                                        <strong style={{ color: '#F12C31', fontSize: '16px' }}>{request.bloodType}</strong>
                                    </td>
                                    <td className="col-date">
                                        <div className="cell-date">
                                            <span>{new Date(request.dueDateTime).toLocaleDateString()}</span>
                                            <small className="muted">{new Date(request.dueDateTime).toLocaleTimeString()}</small>
                                        </div>
                                    </td>
                                    <td className="col-contact">
                                        <span className="urgent-badge">{calculateTimeRemaining(request.dueDateTime)}</span>
                                    </td>
                                    <td className="col-phlebotomist">
                                        {request.donorMatch}
                                    </td>
                                    <td className="col-address">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <FiMapPin />
                                            {request.distance}
                                        </div>
                                    </td>
                                    <td className="col-availability">
                                        <span className={`badge ${request.eligibility === 'verified' ? 'badge-success' : 'badge-pending'}`}>
                                            {request.eligibility}
                                        </span>
                                    </td>
                                    <td className="col-availability">
                                        <span className={`urgent-badge ${request.urgency === 'critical' ? '' : ''}`}>
                                            {request.urgency}
                                        </span>
                                    </td>
                                    <td className="col-actions">
                                        <div className="row-actions">
                                            <button 
                                                className="icon-btn text-blue-800" 
                                                onClick={() => handleAssign(request.id)}
                                                title="Assign Phlebotomist"
                                            >
                                                Assign
                                            </button>
                                            <button 
                                                className="icon-btn text-green-600" 
                                                onClick={() => handleAccept(request.id)}
                                                title="Accept Request"
                                            >
                                                <FiCheck />
                                            </button>
                                            <button 
                                                className="icon-btn text-red-500" 
                                                onClick={() => handleDecline(request.id)}
                                                title="Decline Request"
                                            >
                                                <FiX />
                                            </button>
                                            <button 
                                                className="icon-btn text-blue-600" 
                                                title="Send Message"
                                            >
                                                <FiMessageSquare />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="9" style={{ textAlign: "center", padding: "40px" }}>
                                    {searchTerm ? "No urgent requests found matching your search" : "No urgent requests at this time"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

