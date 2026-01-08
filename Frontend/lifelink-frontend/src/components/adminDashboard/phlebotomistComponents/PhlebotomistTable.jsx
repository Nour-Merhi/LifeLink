import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom";
import { FiEye } from "react-icons/fi";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoSearchSharp, IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import api from "../../../api/axios";
import AssignPhlebotomistModal from "../homeVisitComponents/AssignPhlebotomistModal";
import EditPhlebotomistForm from "./EditPhlebotomistForm";

export default function PhlebotomistTable({ phlebotomists = [], loading = false, error = "", onPhlebotomistsUpdate }){
    const navigate = useNavigate();
    const [phlebotomistState, setPhlebotomistState] = useState("all-states");
    const [availableState, setAvailableState] = useState("all-states");
    const [assignPhlebotomistModalOpen, setAssignPhlebotomistModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [editModal, setEditModal] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");

    useEffect(()=>{
        setCurrentPage(1);
    }, [searchTerm, phlebotomistState, availableState])

    // Format date to readable format (YYYY-MM-DD)
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch {
            return 'N/A';
        }
    };

    // Transform backend data to match table format
    const transformedPhlebotomists = Array.isArray(phlebotomists) ? phlebotomists.map((phleb) => {
        const user = phleb.user || {};
        const hospital = phleb.hospital || {};
        
        // Build full name
        const fullName = `${user.first_name || ''} ${user.middle_name || ''} ${user.last_name || ''}`.trim() || 'N/A';
        
        // Determine status based on availability (can be enhanced with actual status field)
        const status = phleb.availability === 'unavailable' ? 'inactive' : 'active';
        
        // Get performance data from backend (calculated in controller)
        const totalAppointments = phleb.total_appointments || 0;
        const completedAppointments = phleb.completed_appointments || 0;
        const successRate = phleb.success_rate || 0;
        
        // Format performance: show total appointments completed
        const performance = totalAppointments > 0 ? `${completedAppointments}/${totalAppointments}` : "0/0";
        const success_rate = successRate > 0 ? `${successRate}% success` : "No data";
        
        return {
            id: phleb.code || `PHL-${String(phleb.id).padStart(4, '0')}`,
            name: fullName,
            email: user.email || 'N/A',
            phone_nb: user.phone_nb || 'N/A',
            status: status,
            availability: phleb.availability || 'available',
            performance: performance,
            success_rate: success_rate,
            Working_at: hospital.name || 'N/A',
            hospital_phone: hospital.phone_nb || 'N/A',
            created_at: formatDate(phleb.created_at),
            // Raw data for reference
            raw: phleb
        };
    }) : [];

    //Filtering phlebotomists based on search term, status and availability
    const filteredPhlebotomists = transformedPhlebotomists.filter((phlebotomist) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = phlebotomist.name.toLowerCase().includes(searchLower) ||
                             phlebotomist.id.toLowerCase().includes(searchLower) ||
                             phlebotomist.email.toLowerCase().includes(searchLower);
        const matchesStatus = phlebotomistState === "all-states" || phlebotomist.status === phlebotomistState;
        const matchesAvailable = availableState === "all-states" || phlebotomist.availability === availableState;

        return matchesSearch && matchesStatus && matchesAvailable;
    })

    //Calculate paginiation values
    const totalPhlebotomists = filteredPhlebotomists.length;
    const totalPages = Math.ceil(totalPhlebotomists / itemsPerPage);

    //Calculating which items should show
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPhlebotomists = filteredPhlebotomists.slice(startIndex, endIndex);

    //Displaying text
    const startDisplay = startIndex + 1;
    const endDisplay = Math.min(endIndex, totalPhlebotomists);

    return(
        <section className="phlebotomist-table-section">
            <div className="control-panel">
                <div className="control-panel-layout">
                    <div>
                        <div className="search-input">
                            <IoSearchSharp />
                            <input 
                                type="search" 
                                placeholder="Search by phlebotomist name.." 
                                value = {searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="filter-gap">
                        <div className="filters">
                            <select 
                                value = { phlebotomistState } 
                                onChange = { (e) => setPhlebotomistState (e.target.value) }
                            >
                                <option value = "all-states" >All states</option>
                                <option value = "active" >Active</option>
                                <option value = "inactive" >Inactive</option>
                            </select>
                        </div>
                        <div className="filters">
                            <select 
                                value = { availableState } 
                                onChange = { (e) => setAvailableState (e.target.value) }
                            >
                                <option value = "all-states" >All Availability</option>
                                <option value = "available" >Available</option>
                                <option value = "onDuty" >On Duty</option>
                                <option value = "unavailable" >Unavailable</option>
                            </select>
                        </div>
                    </div>
                   
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="loader">
                    <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />                
                    <h3>Fetching Phlebotomists...</h3>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#F12C31' }}>
                    <p>Error: {error}</p>
                </div>
            )}

            {/* Table Content */}
            {!loading && !error && (
            <div className="table-design">
                <table className="h1-table">
                    <thead>
                        <tr>
                            <th className="col-select">
                                <input className="ml-3" type="checkbox" aria-label="select all"/>
                            </th>
                            <th className="col-phle-id">Nurse ID</th>
                            <th className="text-left col-phlebotomist">Name</th>
                            <th className="col-contact">Contact</th>
                            <th className="col-address">Working At</th>
                            <th className="col-status">Status</th>
                            <th className="col-performance">Performance</th>
                            <th className="col-availability">Availability</th>
                            <th className="col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentPhlebotomists.length === 0 ? (
                            <tr>
                                <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#6B6B6B' }}>
                                    No phlebotomists found
                                </td>
                            </tr>
                        ) : (
                        currentPhlebotomists.map ((p, index) => (
                            <tr key={`${p.id}-${startIndex + index}`}>
                                <td className="col-select">
                                    <input className="ml-3" type="checkbox" aria-label="select phlebotomist"/>
                                </td>
                                <td className="col-phle-id">
                                    <div className="cell-title">
                                        <strong title={p.id}>{ p.id }</strong>
                                        <small className="muted">{ p.created_at }</small>
                                    </div>
                                </td>
                                <td className="col-phlebotomist">
                                    <strong title={p.name}>{ p.name }</strong>
                                </td>
                                <td className="col-contact">
                                    <div className="cell-title">
                                        <span>{ p.email }</span>
                                        <small className="muted">{ p.phone_nb }</small>
                                    </div>
                                </td>
                                <td className="col-address">
                                    <div className="cell-sub">
                                        <span title={p.Working_at}>{ p.Working_at }</span>
                                        <small className="muted">{ p.hospital_phone }</small>
                                    </div>
                                </td>
                                <td className="col-status">
                                    <span className={`badge ${p.status === "active" ? "badge-success" : "badge-danger"}`}>
                                        { p.status === "active" ? "Active" : "Inactive"}
                                    </span>
                                </td>
                                <td className="col-performance">
                                    <div className="cell-title">
                                        <span>{ p.performance }</span>
                                        <small className="muted">{ p.success_rate }</small>
                                    </div>
                                </td>
                                <td className="col-availability">
                                    <span className={`badge ${
                                        p.availability === "available" ? "badge-success" : 
                                        p.availability === "onDuty" ? "badge-pending" : 
                                        "badge-danger"
                                    }`}>
                                    { p.availability === "onDuty" ? "On Duty" : 
                                      p.availability.charAt(0).toUpperCase() + p.availability.slice(1) }
                                </span>
                                </td>
                            
                                <td className="col-actions">
                                    <div className="row-actions">
                                        <button 
                                            className="icon-btn text-blue-800" 
                                            title="View Details"
                                            onClick={() => navigate(`/admin/phlebotomists/${p.id}`)}
                                        >
                                            <FiEye />
                                        </button>
                                        <button 
                                            className="icon-btn text-green-600" 
                                            title="Edit"
                                            onClick={() => {
                                                setEditModal({
                                                    phlebotomistCode: p.id,
                                                    phlebotomistData: p.raw
                                                });
                                            }}
                                        >
                                            <FiEdit />
                                        </button>
                                        <button 
                                            className="icon-btn text-red-500" 
                                            title="Delete"
                                            onClick={() => {
                                                setDeleteConfirm({
                                                    phlebotomistCode: p.id,
                                                    phlebotomistName: p.name
                                                });
                                                setDeleteError("");
                                            }}
                                        >
                                            <RiDeleteBin6Line />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                        )}
                    
                    </tbody>
                </table>
                
                <div className="pagination">
                    <div className="showing">
                        <small className="muted">Showing {startDisplay} to {endDisplay} of {totalPhlebotomists} phlebotomists</small>
                    </div>
                    <div className="pagination-controls">
                        <button 
                            onClick = {()=> setCurrentPage(prev => Math.max(1, prev -1))}
                            disabled = {currentPage === 1}
                            className="pagination-btn"
                        >
                            Previous
                        </button>

                        {/*page Number Buttons*/}
                        {Array.from({ length: totalPages}, (_, i) => i + 1).map((pageNum) =>(
                            <button
                                key = {pageNum}
                                onClick = {() => setCurrentPage(pageNum)}
                                className={`pagination-btn ${currentPage === pageNum ? 'active': ''}`}
                            >
                                {pageNum}
                            </button>
                        ))}
                        
                        <button 
                            onClick = {() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled = {currentPage === totalPages}
                            className="pagination-btn"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
            )}

            {assignPhlebotomistModalOpen && (
                <AssignPhlebotomistModal onClose={() => setAssignPhlebotomistModalOpen(false)} />
            )}

            {editModal && (
                <EditPhlebotomistForm
                    onClose={() => setEditModal(null)}
                    onPhlebotomistUpdated={() => {
                        if (onPhlebotomistsUpdate) {
                            onPhlebotomistsUpdate();
                        }
                    }}
                    phlebotomistCode={editModal.phlebotomistCode}
                    phlebotomistData={editModal.phlebotomistData}
                />
            )}

            {deleteConfirm && (
                <div className="modal-overlay modal-overlay-delete">
                    <div className="modal-container modal-container-delete">
                        <div className="modal-title">
                            <h2>Confirm Deletion</h2>
                            <button onClick={() => {
                                setDeleteConfirm(null);
                                setDeleteError("");
                            }} disabled={deleteLoading}>
                                <IoClose />
                            </button>
                        </div>
                        <div className="modal-form">
                            <p>Are you sure you want to delete <strong>{deleteConfirm.phlebotomistName}</strong>?</p>
                            <p className="modal-text-secondary">
                                This action cannot be undone. The phlebotomist will be permanently removed from the system.
                            </p>
                            {deleteError && (
                                <div className="error-message modal-error-container">
                                    {deleteError}
                                </div>
                            )}
                            <div className="form-actions form-actions-modal">
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setDeleteConfirm(null);
                                        setDeleteError("");
                                    }}
                                    disabled={deleteLoading}
                                    className="btn-cancel"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    onClick={async () => {
                                        setDeleteLoading(true);
                                        setDeleteError("");
                                        try {
                                            await api.get("/sanctum/csrf-cookie");
                                            await api.delete(
                                                `/api/admin/dashboard/phlebotomists/${deleteConfirm.phlebotomistCode}`
                                            );
                                            setDeleteConfirm(null);
                                            if (onPhlebotomistsUpdate) {
                                                onPhlebotomistsUpdate();
                                            }
                                        } catch (error) {
                                            console.error('Error deleting phlebotomist:', error);
                                            setDeleteError(error.response?.data?.message || error.message || "Failed to delete phlebotomist");
                                        } finally {
                                            setDeleteLoading(false);
                                        }
                                    }}
                                    disabled={deleteLoading}
                                    className="submit-btn btn-delete-submit"
                                >
                                    {deleteLoading ? (
                                        <>
                                            <SpinnerDotted size={20} thickness={100} speed={100} color="#fff" className="spinner-inline" />
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}