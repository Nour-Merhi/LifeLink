import { useState, useEffect } from "react";
import { FiEye, FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoSearchSharp } from "react-icons/io5";
import { FaCheckCircle } from "react-icons/fa";
import { SpinnerDotted } from 'spinners-react';
import ViewOrganCoordinationModal from "./ViewOrganCoordinationModal";
import EditOrganCoordinationModal from "./EditOrganCoordinationModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import api from "../../../api/axios";

export default function LivingDonors({ livingDonors = [], metricsData, loading = false, error = "", onRefresh }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterMedicalStatus, setFilterMedicalStatus] = useState("all-states");
    const [filterEthicsStatus, setFilterEthicsStatus] = useState("all-ethics");
    const [filterOrgan, setFilterOrgan] = useState("all-organs");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [viewingDonor, setViewingDonor] = useState(null);
    const [editingDonor, setEditingDonor] = useState(null);
    const [deletingDonor, setDeletingDonor] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterMedicalStatus, filterEthicsStatus, filterOrgan]);

    // Filter living donors
    const filteredDonors = livingDonors.filter((donor) => {
        const matchesSearch = donor.donor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            donor.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMedicalStatus = filterMedicalStatus === "all-states" || donor.medical_status === filterMedicalStatus;
        const matchesEthicsStatus = filterEthicsStatus === "all-ethics" || donor.ethics_status === filterEthicsStatus;
        const matchesOrgan = filterOrgan === "all-organs" || donor.organ.toLowerCase() === filterOrgan.toLowerCase();
        
        return matchesSearch && matchesMedicalStatus && matchesEthicsStatus && matchesOrgan;
    });

    // Pagination
    const totalDonors = filteredDonors.length;
    const totalPages = Math.ceil(totalDonors / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentDonors = filteredDonors.slice(startIndex, endIndex);

    // Displaying text
    const startDisplay = startIndex + 1;
    const endDisplay = Math.min(endIndex, totalDonors);

    // Medical Status badge
    const getMedicalStatusBadge = (status) => {
        const statusMap = {
            cleared: { label: "Cleared", className: "badge-success" },
            in_progress: { label: "In Progress", className: "badge-pending" },
            rejected: { label: "Rejected", className: "badge-danger" },
            not_started: { label: "Not Started", className: "badge-inactive" }
        };
        const statusInfo = statusMap[status] || { label: status, className: "badge-inactive" };
        return <span className={`badge ${statusInfo.className}`}>{statusInfo.label}</span>;
    };

    // Ethics Status badge
    const getEthicsStatusBadge = (status) => {
        const statusMap = {
            approved: { label: "Approved", className: "badge-success" },
            pending: { label: "Pending", className: "badge-pending" },
            "N/A": { label: "N/A", className: "badge-inactive" }
        };
        const statusInfo = statusMap[status] || { label: status, className: "badge-inactive" };
        return <span className={`badge ${statusInfo.className}`}>{statusInfo.label}</span>;
    };

    return (
        <section className="hospital-table-section">
            {/* Metrics Cards */}
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
            {/* Control Panel */}
            <div className="control-panel">
                <div className="control">
                    <div>
                        <h4>Living Organ Donors</h4>
                        <span className="text-sm text-gray-500">Manage and track living organ donation cases</span>
                    </div>
                </div>

                <div className="control-panel-layout">
                    <div className="control-panel-layout-left">
                        <div className="search-input">
                            <IoSearchSharp />
                            <input
                                type="search"
                                placeholder="Search by donor name or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="filter-gap">
                        <div className="filters">
                            <select value={filterOrgan} onChange={(e) => setFilterOrgan(e.target.value)}>
                                <option value="all-organs">All Organs</option>
                                <option value="kidney">Kidney</option>
                                <option value="liver">Liver</option>
                                <option value="bone marrow">Bone Marrow</option>
                            </select>
                        </div>

                        <div className="filters">
                            <select value={filterMedicalStatus} onChange={(e) => setFilterMedicalStatus(e.target.value)}>
                                <option value="all-states">Medical Status</option>
                                <option value="cleared">Cleared</option>
                                <option value="in_progress">In Progress</option>
                                <option value="rejected">Rejected</option>
                                <option value="not_started">Not Started</option>
                            </select>
                        </div>

                        <div className="filters">
                            <select value={filterEthicsStatus} onChange={(e) => setFilterEthicsStatus(e.target.value)}>
                                <option value="all-ethics">Ethics Status</option>
                                <option value="approved">Approved</option>
                                <option value="pending">Pending</option>
                                <option value="N/A">N/A</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="loader" style={{ padding: "40px", textAlign: "center" }}>
                    <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />                
                    <h3>Loading Living Donors...</h3>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#F12C31' }}>
                    <p>Error: {error}</p>
                    {onRefresh && (
                        <button 
                            onClick={onRefresh}
                            style={{ 
                                marginTop: '10px', 
                                padding: '10px 20px', 
                                backgroundColor: '#f01010ff', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            Retry
                        </button>
                    )}
                </div>
            )}

            {/* Table */}
            {!loading && !error && (
            <div className="table-design">
                <table className="h1-table">
                <thead>
                    <tr>
                        <th className="col-select">
                            <input className="ml-3" type="checkbox" aria-label="select all" />
                        </th>
                        <th className="col-lo-id">LO ID</th>
                        <th className="col-donor-info">Donor</th>
                        <th className="col-contact-info">Contact</th>
                        <th className="col-organ">Organ</th>
                        <th className="col-medical-status">Medical Status</th>
                        <th className="col-hospital-info">Hospital</th>
                        <th className="col-ethics-status">Ethics Status</th>
                        <th className="col-donation-type">Donation Type</th>
                        <th className="col-actions">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {currentDonors.length > 0 ? (
                        currentDonors.map((donor, index) => (
                            <tr key={`${donor.id}-${startIndex + index}`}>
                                <td className="col-select">
                                    <input className="ml-3" type="checkbox" aria-label={`select ${donor.id}`} />
                                </td>
                                {/* LO ID */}
                                <td className="col-lo-id">
                                    <div className="cell-title">
                                        <strong>{donor.id}</strong>
                                        <small className="muted">{donor.created_at}</small>
                                    </div>
                                </td>

                                {/* Donor */}
                                <td className="col-donor-info">
                                    <div className="cell-title">
                                        <strong>{donor.donor_name}</strong>
                                        <small className="muted">{donor.blood_type} • {donor.age} years</small>
                                    </div>
                                </td>

                                {/* Contact */}
                                <td className="col-contact-info">
                                    <div className="contact">
                                        <span>{donor.email}</span>
                                        <small className="muted">{donor.phone_nb}</small>
                                    </div>
                                </td>

                                {/* Organ */}
                                <td className="col-organ">
                                    <span>{donor.organ}</span>
                                </td>

                                {/* Medical Status */}
                                <td className="col-medical-status">
                                    {getMedicalStatusBadge(donor.medical_status)}
                                </td>

                                {/* Hospital */}
                                <td className="col-hospital-info">
                                    <div className="cell-title">
                                        <strong>{donor.hospital_name}</strong>
                                        <small className="muted">{donor.manager_name}</small>
                                    </div>
                                </td>

                                {/* Ethics Status */}
                                <td className="col-ethics-status">
                                    {getEthicsStatusBadge(donor.ethics_status)}
                                </td>

                                {/* Donation Type */}
                                <td className="col-donation-type">
                                    <span>{donor.donation_type}</span>
                                </td>

                                {/* Actions */}
                                <td className="col-actions">
                                    <div className="row-actions">
                                        <button
                                            className="icon-btn text-blue-800"
                                            title="View Details"
                                            onClick={() => setViewingDonor(donor)}
                                        >
                                            <FiEye />
                                        </button>
                                        <button
                                            className="icon-btn text-green-600"
                                            title="Edit"
                                            onClick={() => setEditingDonor(donor)}
                                        >
                                            <FiEdit />
                                        </button>
                                        {donor.medical_status === "cleared" && donor.ethics_status === "approved" && (
                                            <button className="icon-btn text-green-600" title="Approve Donation">
                                                <FaCheckCircle />
                                            </button>
                                        )}
                                        <button
                                            className="icon-btn text-red-500"
                                            title="Delete"
                                            onClick={() => {
                                                setDeleteError("");
                                                setDeletingDonor(donor);
                                            }}
                                        >
                                            <RiDeleteBin6Line />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="9" style={{ textAlign: "center", padding: "40px" }}>
                                <p>No living donors found</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination">
                <div className="showing">
                    <small className="muted">Showing {startDisplay} to {endDisplay} of {totalDonors} living donors</small>
                </div>
                <div className="pagination-controls">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="pagination-btn"
                    >
                        Previous
                    </button>

                    {/* Page Number Buttons */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                        >
                            {pageNum}
                        </button>
                    ))}

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="pagination-btn"
                    >
                        Next
                    </button>
                </div>
            </div>
            </div>
            )}

            {/* View Details Modal */}
            {viewingDonor && (
                <ViewOrganCoordinationModal
                    mode="living"
                    code={viewingDonor?.id}
                    data={viewingDonor}
                    onClose={() => setViewingDonor(null)}
                />
            )}

            {editingDonor && (
                <EditOrganCoordinationModal
                    mode="living"
                    code={editingDonor?.id}
                    onClose={() => setEditingDonor(null)}
                    onSaved={() => onRefresh?.()}
                />
            )}

            {deletingDonor && (
                <ConfirmDeleteModal
                    title="Delete Living Donor Pledge"
                    description={`Delete pledge ${deletingDonor.id}? This cannot be undone.`}
                    loading={deleteLoading}
                    error={deleteError}
                    onClose={() => setDeletingDonor(null)}
                    onConfirm={async () => {
                        setDeleteLoading(true);
                        setDeleteError("");
                        try {
                            await api.delete(`/api/admin/dashboard/living-donors/${deletingDonor.id}`);
                            setDeletingDonor(null);
                            onRefresh?.();
                        } catch (e) {
                            setDeleteError(e.response?.data?.message || "Failed to delete pledge");
                        } finally {
                            setDeleteLoading(false);
                        }
                    }}
                />
            )}
        </section>
    );
}

