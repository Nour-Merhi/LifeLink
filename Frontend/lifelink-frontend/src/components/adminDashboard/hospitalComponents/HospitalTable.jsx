import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom";
import { FiEye } from "react-icons/fi";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoSearchSharp, IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import api from "../../../api/axios";
import EditHospitalForm from "./EditHospitalForm";

export default function hospitalTable({ hospitals = [], loading = false, error = "", onHospitalsUpdate }){
    const navigate = useNavigate();
    const [hospitalState, setHospitalState] = useState("all-states"); 
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    const [searchTerm, setSearchTerm] = useState("");
    const [editModal, setEditModal] = useState(null); // { hospitalCode, hospitalData }
    const [deleteConfirm, setDeleteConfirm] = useState(null); // { hospitalCode, hospitalName }
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    useEffect(()=>{
        setCurrentPage(1);
    }, [searchTerm, hospitalState])

    // Handle view click - navigate to hospital detail page
    const handleViewClick = (hospitalCode) => {
        navigate(`/admin/hospitals/${hospitalCode}`);
    };

    // Handle edit click
    const handleEditClick = (hospital) => {
        setEditModal({ 
            hospitalCode: hospital.id, 
            hospitalData: hospital._originalHospital 
        });
    };

    // Handle delete click
    const handleDeleteClick = (hospitalCode, hospitalName) => {
        setDeleteConfirm({ hospitalCode, hospitalName });
        setDeleteError("");
    };

    // Handle delete cancellation
    const handleDeleteCancel = () => {
        setDeleteConfirm(null);
        setDeleteError("");
    };

    // Handle delete confirmation
    const handleDeleteConfirm = async () => {
        if (!deleteConfirm || !deleteConfirm.hospitalCode) {
            setDeleteError("No hospital selected");
            return;
        }

        setDeleteLoading(true);
        setDeleteError("");

        try {
            await api.get("/sanctum/csrf-cookie");
            await api.delete(`/api/admin/dashboard/hospitals/${deleteConfirm.hospitalCode}`);

            // Success - close modal and refresh data
            setDeleteConfirm(null);
            if (onHospitalsUpdate) {
                onHospitalsUpdate();
            }
        } catch (error) {
            console.error('Error deleting hospital:', error);
            setDeleteError(error.response?.data?.message || error.message || "Failed to delete hospital");
        } finally {
            setDeleteLoading(false);
        }
    };

    // Handle modal close
    const handleEditModalClose = () => {
        setEditModal(null);
    };

    const handleHospitalUpdated = () => {
        setEditModal(null);
        if (onHospitalsUpdate) {
            onHospitalsUpdate();
        }
    };

    // Format date to readable format (YYYY-MM-DD HH:MM)
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        } catch {
            return 'N/A';
        }
    };

 // Get manager name - Laravel returns snake_case for relationships
 const transformedHospitals = Array.isArray(hospitals) ? hospitals.map((hospital) => {
        const manager = hospital.health_center_manager?.user || hospital.healthCenterManager?.user;
        const contactName = manager 
            ? `${manager.first_name || ''} ${manager.middle_name || ''} ${manager.last_name || ''}`.trim()
            : 'N/A';
        const managerPhone = manager?.phone_nb || 'N/A';
        
        return {
            id: hospital.code || `HSP-${String(hospital.id).padStart(4, '0')}`,
            db_id: hospital.id, // Store database ID
            name: hospital.name || 'N/A',
            address: hospital.address || 'No address provided',
            status: hospital.status || 'unverified',
            contact_name: contactName,
            phone_nb: managerPhone,
            email: hospital.email || 'N/A',
            blood_stock: hospital.blood_stock || {}, // If it's an object from backend
            requests: hospital.requests || 0,
            created_at: formatDate(hospital.created_at),
            _originalHospital: hospital // Store full original hospital object for editing
        }
    }) : [];
    

    //Filtering hospital based on search term and status
    const filteredHospitals = transformedHospitals.filter((hospital) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = hospital.name.toLowerCase().includes(searchLower) || 
                             hospital.id.toLowerCase().includes(searchLower); // Search by code too
        const matchesStatus = hospitalState === "all-states" || hospital.status === hospitalState;
        
        return matchesSearch && matchesStatus;
    })

    //Calculate paginiation values
    const totalHospitals = filteredHospitals.length;
    const totalPages = Math.ceil(totalHospitals / itemsPerPage);

    //Calculating which items should show
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentHospitals = filteredHospitals.slice(startIndex, endIndex);

    //Displaying text
    const startDisplay = startIndex + 1;
    const endDisplay = Math.min(endIndex, totalHospitals);

    return(
        <section className="hospital-table-section">
            <div className="control-panel control-panel-layout">
                <div className="search-input">
                    <IoSearchSharp />
                    <input 
                        type="search" 
                        placeholder="Search by hospital name.." 
                        value = {searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filters">
                    <select 
                        value = { hospitalState } 
                        onChange = { (e) => setHospitalState (e.target.value) }
                    >
                        <option value = "all-states" >All states</option>
                        <option value = "verified" >Verified</option>
                        <option value = "unverified" >Unverified</option>
                    </select>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="loader">
                    <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />                
                    <h3>Fetching Hospitals</h3>
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
                                <input className="ml-3" type="checkbox" aria-label={`select ${hospitalState.name}`}/>
                            </th>
                            <th className="text-left col-hospital">Hospital</th>
                            <th className="col-address">Address</th>
                            <th className="col-status">Status</th>
                            <th className="col-contact">Manager Info</th>
                            <th className="col-stock">Blood Stock</th>
                            <th className="col-requests">Requests</th>
                            <th className="col-date">Date Added</th>
                            <th className="col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentHospitals.length > 0 ? currentHospitals.map ((h, index) => (
                            <tr key={`${h.id}-${startIndex + index}`}>
                                <td className="col-select">
                                    <input className="ml-3" type="checkbox" aria-label={`select ${hospitalState.name}`}/>
                                </td>
                                <td className="col-hospital">
                                    <div className="cell-title">
                                        <strong title={h.name}>{ h.name }</strong>
                                        <small className="muted">{ h.id }</small>
                                    </div>
                                </td>
                                <td className="col-address">
                                    <div className="cell-sub">
                                        <span title={h.address}>{ h.address }</span>
                                        <div>
                                            <a href="#" className="link">View on Map</a>
                                        </div>
                                    </div>
                                </td>
                                <td className="col-status">
                                    <span className={`badge ${h.status === "verified" ? "badge-success" : "badge-danger"}`}>
                                        { h.status === "verified" ? "Verified" : "Unverified"}
                                    </span>
                                </td>
                                <td className="col-contact">
                                    <div className="contact">
                                        <span>{ h.contact_name }</span>
                                        <small className="muted">+961 { h.phone_nb }</small>
                                    </div>
                                </td>
                                <td className="col-stock">
                                    {typeof h.blood_stock === 'object' && h.blood_stock !== null ? (
                                        <span className="badge">
                                            A+: {h.blood_stock.A || 0}, B+: {h.blood_stock.B || 0}, O+: {h.blood_stock.O || 0}
                                        </span>
                                    ) : (
                                        <span className="badge">No stock data</span>
                                    )}
                                </td>
                                <td className="col-requests">
                                    <span className="badge request">{ h.requests }</span>
                                </td>
                                <td className="col-date">{ h.created_at }</td>
                                <td className="col-actions">
                                    <div className="row-actions">
                                        <button 
                                            className="icon-btn text-blue-800" 
                                            title="View Details"
                                            onClick={() => handleViewClick(h.id)}
                                        >
                                            <FiEye />
                                        </button>
                                        <button 
                                            className="icon-btn text-green-600" 
                                            title="Edit"
                                            onClick={() => handleEditClick(h)}
                                        >
                                            <FiEdit />
                                        </button>
                                        <button 
                                            className="icon-btn text-red-500" 
                                            title="Delete"
                                            onClick={() => handleDeleteClick(h.id, h.name)}
                                        >
                                            <RiDeleteBin6Line />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="10" className="text-center">No hospitals found</td>
                            </tr>
                        )}
                    
                    </tbody>
                </table>
                
                    <div className="pagination">
                        <div className="showing">
                            <small className="muted">Showing {startDisplay} to {endDisplay} of {totalHospitals} hospitals</small>
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

            {/* Edit Modal */}
            {editModal && (
                <EditHospitalForm
                    onClose={handleEditModalClose}
                    onHospitalUpdated={handleHospitalUpdated}
                    hospitalCode={editModal.hospitalCode}
                    hospitalData={editModal.hospitalData}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="modal-overlay modal-overlay-delete">
                    <div className="modal-container modal-container-delete">
                        <div className="modal-title">
                            <h2>Delete Hospital</h2>
                            <button onClick={handleDeleteCancel} disabled={deleteLoading}>
                                <IoClose />
                            </button>
                        </div>
                        <div className="modal-form">
                            <p>Are you sure you want to delete <strong>{deleteConfirm.hospitalName}</strong>?</p>
                            <p className="modal-text-secondary">
                                This action cannot be undone. The hospital will be permanently removed from the system.
                            </p>
                            
                            {deleteError && (
                                <div className="error-message modal-error-container">
                                    {deleteError}
                                </div>
                            )}

                            <div className="form-actions form-actions-modal">
                                <button 
                                    type="button" 
                                    onClick={handleDeleteCancel}
                                    disabled={deleteLoading}
                                    className="btn-cancel"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleDeleteConfirm}
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