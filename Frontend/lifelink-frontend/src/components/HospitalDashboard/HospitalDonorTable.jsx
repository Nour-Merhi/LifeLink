import { useMemo, useState } from "react";
import { FiEye, FiSearch, FiX } from "react-icons/fi";
import { SpinnerDotted } from 'spinners-react';
import api from "../../api/axios";

export default function HospitalDonorTable({ donors = [], loading = false, error = "", onViewDonor, onStatusUpdate }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
    const itemsPerPage = 10;

    // Filter donors based on search term
    const filteredDonors = donors.filter((donor) => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            (donor.name && donor.name.toLowerCase().includes(searchLower)) ||
            (donor.code && donor.code.toLowerCase().includes(searchLower)) ||
            (donor.email && donor.email.toLowerCase().includes(searchLower)) ||
            (donor.blood_type && donor.blood_type.toLowerCase().includes(searchLower))
        );
    });

    // Pagination
    const totalPages = Math.ceil(filteredDonors.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedDonors = filteredDonors.slice(startIndex, startIndex + itemsPerPage);
    const startDisplay = startIndex + 1;
    const endDisplay = Math.min(startIndex + itemsPerPage, filteredDonors.length);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {
            return dateString;
        }
    };

    const getAppointmentTypeBadgeClass = (type) => {
        switch (type?.toLowerCase()) {
            case 'urgent':
                return 'badge-danger';
            case 'regular':
                return 'badge-pending';
            default:
                return 'badge-secondary';
        }
    };

    const filteredIds = useMemo(() => filteredDonors.map((d) => d.id).filter(Boolean), [filteredDonors]);
    const isAllSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));
    const selectedCount = selectedIds.length;

    const toggleSelect = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
        } else {
            setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        const ok = window.confirm(
            `Delete ${selectedIds.length} donor record(s) from this hospital?\n\nThis will remove their appointment registrations for this hospital (it will NOT delete the donor account).`
        );
        if (!ok) return;

        setBulkDeleteLoading(true);
        try {
            const res = await api.post(`/api/hospital/dashboard/donors/bulk-delete`, {
                donor_ids: selectedIds,
            });

            if (res.data?.success) {
                setSelectedIds([]);
                if (onStatusUpdate) onStatusUpdate();
            } else {
                alert(res.data?.message || "Failed to delete selected donors");
            }
        } catch (e) {
            console.error("Bulk delete donors error:", e);
            alert(e.response?.data?.message || "Failed to delete selected donors");
        } finally {
            setBulkDeleteLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loader">
                <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />
                <h3>Fetching Donors...</h3>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: '#F12C31' }}>
                <p>Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="control-panel" style={{ padding: '20px' }}>
            {/* Search Bar */}
            <div style={{ marginBottom: '20px', position: 'relative' }}>
                <FiSearch style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: '#999',
                    fontSize: '18px'
                }} />
                <input
                    type="text"
                    placeholder="Search by name, code, email, or blood type..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{
                        width: '100%',
                        padding: '10px 40px 10px 40px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                    }}
                />
                {searchTerm && (
                    <button
                        onClick={() => {
                            setSearchTerm("");
                            setCurrentPage(1);
                        }}
                        style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#999',
                            padding: '4px'
                        }}
                    >
                        <FiX />
                    </button>
                )}
            </div>

            {/* Bulk actions */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", marginBottom: 12 }}>
                <div style={{ color: "#6B6B6B", fontSize: 13 }}>
                    {selectedCount > 0 ? <strong>{selectedCount} selected</strong> : <span>Select donors to delete their hospital registrations</span>}
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {selectedCount > 0 && ( <>
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={() => setSelectedIds([])}
                            disabled={bulkDeleteLoading}
                        >
                            Clear selection
                        </button>
                    <button
                    type="button"
                    className="submit-btn active"
                    onClick={handleBulkDelete}
                    >
                        {bulkDeleteLoading ? "Deleting..." : "Delete Selected"}
                    </button>
                    </>)}
                </div>
            </div>

            {/* Table */}
            {filteredDonors.length === 0 ? (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '40px',
                    color: '#999'
                }}>
                    <p>No donors found</p>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            style={{
                                marginTop: '10px',
                                padding: '8px 16px',
                                background: '#285BFF',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            Clear Search
                        </button>
                    )}
                </div>
            ) : (
                <div className="table-overflow-x">
                    <table className="h1-table">
                        <thead>
                            <tr>
                                <th style={{ width: 44 }}>
                                    <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} />
                                </th>
                                <th className="col-donor-id">DonorID</th>
                                <th className="text-left col-donor">Donor</th>
                                <th className="col-blood">Blood Type</th>
                                <th className="col-contact">Contact</th>
                                <th className="col-date">Latest Appointment</th>
                                <th className="col-date">Last Donation</th>
                                <th className="col-total">Donations</th>
                                <th className="col-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedDonors.map((donor, index) => (
                                <tr key={donor.id || donor.code || index}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(donor.id)}
                                            onChange={() => toggleSelect(donor.id)}
                                        />
                                    </td>
                                    <td classNmae="col-donor-id">{donor.code || 'N/A'}</td>
                                    <td className="col-hospital-donor">
                                        <div className="cell-title">
                                            <strong title={donor.name}>{donor.name || 'N/A'}</strong>
                                            <small className="muted">
                                                
                                                {donor.age && ` • Age: ${donor.age}`}
                                            </small>
                                        </div>
                                    </td>
                                    <td className="col-blood">
                                        <span className="badge">{donor.blood_type || 'N/A'}</span>
                                    </td>
                                    <td className="col-contact">
                                        <div className="contact">
                                            <span>{donor.email || 'N/A'}</span>
                                            {donor.phone_nb && (
                                                <small className="muted">{donor.phone_nb}</small>
                                            )}
                                        </div>
                                    </td>
                                    <td className="col-date">
                                        {donor.latest_appointment_date ? (
                                            <div>
                                                {donor.latest_appointment_type && (
                                                    <span className={`badge ${getAppointmentTypeBadgeClass(donor.latest_appointment_type)}`} style={{ fontSize: '11px', marginTop: '4px', marginBottom: '4px', display: 'inline-block' }}>
                                                        {donor.latest_appointment_type}
                                                    </span>
                                                )}

                                                <div>{formatDate(donor.latest_appointment_date)}</div>

                                                {donor.latest_donation_type && (
                                                    <small className="muted" style={{ display: 'block', marginTop: '2px' }}>
                                                        {donor.latest_donation_type}
                                                    </small>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="muted">No appointments</span>
                                        )}
                                    </td>
                                    <td className="col-date">
                                        <span className="muted">{formatDate(donor.last_donation)}</span>
                                    </td>
                                    <td className="col-total">
                                        <div>
                                            <strong>Total: {donor.total_donations || 0}</strong>
                                            {donor.pending_appointments > 0 && (
                                                <small className="muted" style={{ display: 'block', marginTop: '2px' }}>
                                                    {donor.pending_appointments} pending
                                                </small>
                                            )}
                                        </div>
                                    </td>
                                    <td className="col-actions">
                                        <div className="row-actions">
                                            <button
                                                onClick={() => onViewDonor && onViewDonor(donor)}
                                                className="icon-btn view-btn"
                                                title="View Details"
                                            >
                                                <FiEye />
                                                View
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages >= 1 && (
                        <div className="pagination">
                            <div className="showing">
                                <small className="muted">Showing {startDisplay} to {endDisplay} of {filteredDonors.length} donors</small>
                            </div>
                            <div className="pagination-controls">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="pagination-btn"
                                >
                                    Previous
                                </button>
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
                    )}
                </div>
            )}
        </div>
    );
}
