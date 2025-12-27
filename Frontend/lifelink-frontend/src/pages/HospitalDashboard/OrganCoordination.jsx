import { useState, useEffect } from "react";
import { MdOutlineHealthAndSafety } from "react-icons/md";
import { FiCheck, FiX, FiEye, FiFileText } from "react-icons/fi";
import { IoSearchSharp } from "react-icons/io5";
import axios from "axios";

export default function OrganCoordination() {
    const [organRequests, setOrganRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchOrganRequests();
    }, []);

    const fetchOrganRequests = () => {
        setLoading(true);
        // In production: axios.get("/api/hospital/organ-requests")
        setTimeout(() => {
            setOrganRequests([
                {
                    id: 1,
                    organType: "Kidney",
                    donorName: "John Doe",
                    recipientName: "Jane Smith",
                    compatibility: "High",
                    medicalVerification: "Pending",
                    transportStatus: "Not Scheduled",
                    status: "pending"
                },
                {
                    id: 2,
                    organType: "Liver",
                    donorName: "Mike Johnson",
                    recipientName: "Sarah Williams",
                    compatibility: "Medium",
                    medicalVerification: "Approved",
                    transportStatus: "Scheduled",
                    status: "in_progress"
                }
            ]);
            setLoading(false);
        }, 500);
    };

    const handleApprove = (requestId) => {
        if (window.confirm("Approve this organ match? This will trigger notifications to all parties.")) {
            // In production: axios.post(`/api/hospital/organ-requests/${requestId}/approve`)
            console.log("Approve organ match:", requestId);
            fetchOrganRequests();
        }
    };

    const handleReject = (requestId) => {
        if (window.confirm("Reject this organ match?")) {
            // In production: axios.post(`/api/hospital/organ-requests/${requestId}/reject`)
            console.log("Reject organ match:", requestId);
            fetchOrganRequests();
        }
    };

    const handleViewDetails = (request) => {
        setSelectedRequest(request);
        setShowDetailModal(true);
    };

    return (
        <section className="organ-coordination-section">
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <MdOutlineHealthAndSafety className="icon-size" />
                        <h2>Organ Coordination</h2>
                    </div>
                    <p>Manage organ donation matches and approval workflows</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="control-panel">
                <div className="control-panel-layout">
                    <div className="search-input">
                        <IoSearchSharp />
                        <input 
                            type="search" 
                            placeholder="Search by organ type, donor name, recipient name.." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Organ Requests Table */}
            <div className="table-design">
                <table className="h1-table">
                    <thead>
                        <tr>
                            <th className="col-order-id">Request ID</th>
                            <th className="col-donor">Organ Type</th>
                            <th className="col-donor">Donor</th>
                            <th className="col-donor">Recipient</th>
                            <th className="col-availability">Compatibility</th>
                            <th className="col-availability">Medical Verification</th>
                            <th className="col-availability">Transport</th>
                            <th className="col-availability">Status</th>
                            <th className="col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {organRequests.filter(request => {
                            const searchLower = searchTerm.toLowerCase();
                            return searchTerm === "" || 
                                request.organType.toLowerCase().includes(searchLower) ||
                                request.donorName.toLowerCase().includes(searchLower) ||
                                request.recipientName.toLowerCase().includes(searchLower) ||
                                `org-${request.id}`.toLowerCase().includes(searchLower);
                        }).length > 0 ? (
                            organRequests.filter(request => {
                                const searchLower = searchTerm.toLowerCase();
                                return searchTerm === "" || 
                                    request.organType.toLowerCase().includes(searchLower) ||
                                    request.donorName.toLowerCase().includes(searchLower) ||
                                    request.recipientName.toLowerCase().includes(searchLower) ||
                                    `org-${request.id}`.toLowerCase().includes(searchLower);
                            }).map((request) => (
                                <tr key={request.id}>
                                    <td className="col-order-id">
                                        <strong>ORG-{request.id}</strong>
                                    </td>
                                    <td className="col-donor">
                                        <strong>{request.organType}</strong>
                                    </td>
                                    <td className="col-donor">{request.donorName}</td>
                                    <td className="col-donor">{request.recipientName}</td>
                                    <td className="col-availability">
                                        <span className={`badge ${request.compatibility === 'High' ? 'badge-success' : 'badge-pending'}`}>
                                            {request.compatibility}
                                        </span>
                                    </td>
                                    <td className="col-availability">
                                        <span className={`badge ${request.medicalVerification === 'Approved' ? 'badge-success' : 'badge-pending'}`}>
                                            {request.medicalVerification}
                                        </span>
                                    </td>
                                    <td className="col-availability">
                                        <span className={`badge ${request.transportStatus === 'Scheduled' ? 'badge-success' : 'badge-pending'}`}>
                                            {request.transportStatus}
                                        </span>
                                    </td>
                                    <td className="col-availability">
                                        <span className={`badge status-${request.status}`}>
                                            {request.status}
                                        </span>
                                    </td>
                                    <td className="col-actions">
                                        <div className="row-actions">
                                            <button 
                                                className="icon-btn text-blue-800" 
                                                onClick={() => handleViewDetails(request)}
                                                title="View Details"
                                            >
                                                <FiEye />
                                            </button>
                                            <button 
                                                className="icon-btn text-green-600" 
                                                onClick={() => handleApprove(request.id)}
                                                title="Approve"
                                            >
                                                <FiCheck />
                                            </button>
                                            <button 
                                                className="icon-btn text-red-500" 
                                                onClick={() => handleReject(request.id)}
                                                title="Reject"
                                            >
                                                <FiX />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="9" style={{ textAlign: "center", padding: "40px" }}>
                                    {searchTerm ? "No organ coordination requests found matching your search" : "No organ coordination requests at this time"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedRequest && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal-title">Organ Match Details: {selectedRequest.organType}</h3>
                        <div className="modal-content">
                            <div className="control-panel">
                                <h4 className="control-panel-title">Match Information</h4>
                                <div className="info-grid">
                                    <div><strong>Donor:</strong> {selectedRequest.donorName}</div>
                                    <div><strong>Recipient:</strong> {selectedRequest.recipientName}</div>
                                    <div><strong>Compatibility:</strong> {selectedRequest.compatibility}</div>
                                    <div><strong>Status:</strong> {selectedRequest.status}</div>
                                </div>
                            </div>
                            <div className="control-panel" style={{ marginTop: '15px' }}>
                                <h4 className="control-panel-title">Medical Verification</h4>
                                <p>{selectedRequest.medicalVerification}</p>
                            </div>
                            <div className="control-panel" style={{ marginTop: '15px' }}>
                                <h4 className="control-panel-title">Transport Logistics</h4>
                                <p>{selectedRequest.transportStatus}</p>
                            </div>
                            <div className="filter-gap" style={{ marginTop: '15px' }}>
                                <button className="add-btn button" onClick={() => handleApprove(selectedRequest.id)}>
                                    Approve Match
                                </button>
                                <button className="button" style={{ background: '#6B6B6B' }} onClick={() => setShowDetailModal(false)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

