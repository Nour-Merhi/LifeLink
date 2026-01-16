import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom";
import { FiEye } from "react-icons/fi";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoSearchSharp, IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from "../../../api/axios";
import EditHospitalForm from "./EditHospitalForm";

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function hospitalTable({ hospitals = [], loading = false, error = "", onHospitalsUpdate }){
    const navigate = useNavigate();
    const [hospitalState, setHospitalState] = useState("all-states"); 
    const [bloodTypeFilter, setBloodTypeFilter] = useState("all-blood");
    const [shortageStateFilter, setShortageStateFilter] = useState("all-shortage");
    const [requestsFilter, setRequestsFilter] = useState("all-requests");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    const [searchTerm, setSearchTerm] = useState("");
    const [editModal, setEditModal] = useState(null); // { hospitalCode, hospitalData }
    const [deleteConfirm, setDeleteConfirm] = useState(null); // { hospitalCode, hospitalName, isBulk, hospitalCodes }
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [selectedHospitals, setSelectedHospitals] = useState(new Set()); // Set of hospital IDs
    const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
    const [bulkDeleteError, setBulkDeleteError] = useState("");
    const [mapModalOpen, setMapModalOpen] = useState(false);
    const [selectedHospitalForMap, setSelectedHospitalForMap] = useState(null);

    useEffect(()=>{
        setCurrentPage(1);
        // Clear selections when filters change
        setSelectedHospitals(new Set());
    }, [searchTerm, hospitalState, bloodTypeFilter, shortageStateFilter, requestsFilter])

    // Handle view click - navigate to hospital detail page
    const handleViewClick = (hospitalCode) => {
        navigate(`/admin/hospitals/${hospitalCode}`);
    };

    // Handle map modal
    const handleOpenMap = (hospital) => {
        setSelectedHospitalForMap(hospital);
        setMapModalOpen(true);
    };

    const handleCloseMap = () => {
        setMapModalOpen(false);
        setSelectedHospitalForMap(null);
    };

    // Handle edit click
    const handleEditClick = (hospital) => {
        setEditModal({ 
            hospitalCode: hospital.id, 
            hospitalData: hospital._originalHospital 
        });
    };

    // Handle checkbox change for individual hospitals
    const handleCheckboxChange = (hospitalId, isChecked) => {
        setSelectedHospitals(prev => {
            const newSet = new Set(prev);
            if (isChecked) {
                newSet.add(hospitalId);
            } else {
                newSet.delete(hospitalId);
            }
            return newSet;
        });
    };

    // Handle bulk delete confirmation
    const handleBulkDeleteConfirm = async () => {
        if (!deleteConfirm || !deleteConfirm.isBulk || !deleteConfirm.hospitalCodes) return;

        setBulkDeleteLoading(true);
        setBulkDeleteError("");

        try {
            await api.get("/sanctum/csrf-cookie");
            
            // Delete all selected hospitals
            const deletePromises = deleteConfirm.hospitalCodes.map(hospitalCode =>
                api.delete(`/api/admin/dashboard/hospitals/${hospitalCode}`)
            );

            await Promise.all(deletePromises);

            setDeleteConfirm(null);
            setSelectedHospitals(new Set());
            if (onHospitalsUpdate) {
                onHospitalsUpdate();
            }
        } catch (error) {
            console.error('Error deleting hospitals:', error);
            setBulkDeleteError(error.response?.data?.message || error.message || "Failed to delete some hospitals");
        } finally {
            setBulkDeleteLoading(false);
        }
    };

    // Handle delete click (single hospital)
    const handleDeleteClick = (hospitalCode, hospitalName) => {
        setDeleteConfirm({ hospitalCode, hospitalName, isBulk: false });
        setDeleteError("");
    };

    // Handle delete cancellation
    const handleDeleteCancel = () => {
        setDeleteConfirm(null);
        setDeleteError("");
    };

    // Handle delete confirmation (single hospital)
    const handleDeleteConfirm = async () => {
        if (!deleteConfirm || deleteConfirm.isBulk || !deleteConfirm.hospitalCode) {
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
            // Remove from selected hospitals if it was selected
            setSelectedHospitals(prev => {
                const newSet = new Set(prev);
                newSet.delete(deleteConfirm.hospitalCode);
                return newSet;
            });
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
            blood_stock: hospital.blood_stock || {}, // Object with blood type keys and quantity values
            requests: hospital.requests || 0,
            shortage_states: hospital.shortage_states || {}, // Object with blood type keys and shortage state values
            latitude: hospital.latitude || null,
            longitude: hospital.longitude || null,
            created_at: formatDate(hospital.created_at),
            _originalHospital: hospital // Store full original hospital object for editing
        }
    }) : [];
    

    //Filtering hospital based on search term, status, blood type, shortage state, and requests
    const filteredHospitals = transformedHospitals.filter((hospital) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = hospital.name.toLowerCase().includes(searchLower) || 
                             hospital.id.toLowerCase().includes(searchLower); // Search by code too
        const matchesStatus = hospitalState === "all-states" || hospital.status === hospitalState;
        
        // Filter by blood type (hospitals that have the selected blood type in stock)
        const matchesBloodType = bloodTypeFilter === "all-blood" || 
            (hospital.blood_stock && typeof hospital.blood_stock === 'object' && 
             hospital.blood_stock[bloodTypeFilter] !== undefined);
        
        // Filter by shortage state (hospitals that have the selected shortage state for any blood type)
        let matchesShortageState = shortageStateFilter === "all-shortage";
        if (shortageStateFilter !== "all-shortage" && hospital.shortage_states && typeof hospital.shortage_states === 'object') {
            matchesShortageState = Object.values(hospital.shortage_states).includes(shortageStateFilter);
        }
        
        // Filter by requests count
        let matchesRequests = requestsFilter === "all-requests";
        const requestsCount = hospital.requests || 0;
        if (requestsFilter === "none") {
            matchesRequests = requestsCount === 0;
        } else if (requestsFilter === "low") {
            matchesRequests = requestsCount > 0 && requestsCount <= 10;
        } else if (requestsFilter === "medium") {
            matchesRequests = requestsCount > 10 && requestsCount <= 50;
        } else if (requestsFilter === "high") {
            matchesRequests = requestsCount > 50;
        }
        
        return matchesSearch && matchesStatus && matchesBloodType && matchesShortageState && matchesRequests;
    })

    //Calculate paginiation values
    const totalHospitals = filteredHospitals.length;
    const totalPages = Math.ceil(totalHospitals / itemsPerPage);

    //Calculating which items should show
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentHospitals = filteredHospitals.slice(startIndex, endIndex);

    // Handle select all checkbox (must be after currentHospitals is defined)
    const handleSelectAll = (isChecked) => {
        if (isChecked) {
            const allHospitalIds = new Set(currentHospitals.map(h => h.id));
            setSelectedHospitals(allHospitalIds);
        } else {
            setSelectedHospitals(new Set());
        }
    };

    // Check if all current page hospitals are selected (must be after currentHospitals is defined)
    const isAllSelected = currentHospitals.length > 0 && currentHospitals.every(h => selectedHospitals.has(h.id));

    // Handle bulk delete (must be after filteredHospitals is defined)
    const handleBulkDelete = () => {
        if (selectedHospitals.size === 0) return;
        
        // Get names of all selected hospitals (from all pages, not just current page)
        const selectedHospitalNames = filteredHospitals
            .filter(h => selectedHospitals.has(h.id))
            .map(h => h.name)
            .join(", ");
        
        setDeleteConfirm({
            hospitalCodes: Array.from(selectedHospitals),
            hospitalNames: selectedHospitalNames,
            isBulk: true
        });
        setBulkDeleteError("");
    };

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
                {selectedHospitals.size > 0 ? (
                    <div className="filter-gap" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ color: "#767676", fontSize: "14px" }}>
                            {selectedHospitals.size} hospital{selectedHospitals.size !== 1 ? 's' : ''} selected
                        </span>
                        <button
                            onClick={handleBulkDelete}
                            disabled={bulkDeleteLoading}
                            style={{
                                background: "linear-gradient(to right, #FF585D, #CA2529)",
                                color: "white",
                                border: "none",
                                padding: "8px 16px",
                                borderRadius: "5px",
                                cursor: bulkDeleteLoading ? "not-allowed" : "pointer",
                                fontSize: "14px",
                                fontWeight: "500",
                                opacity: bulkDeleteLoading ? 0.6 : 1
                            }}
                        >
                            {bulkDeleteLoading ? "Deleting..." : "Delete Selected"}
                        </button>
                        <button
                            onClick={() => setSelectedHospitals(new Set())}
                            disabled={bulkDeleteLoading}
                            style={{
                                background: "transparent",
                                color: "#767676",
                                border: "1px solid #D9D9D9",
                                padding: "8px 16px",
                                borderRadius: "5px",
                                cursor: bulkDeleteLoading ? "not-allowed" : "pointer",
                                fontSize: "14px"
                            }}
                        >
                            Clear Selection
                        </button>
                    </div>
                ) : (
                <div className="filter-gap">
                    <div className="filters">
                        <select 
                            value = { hospitalState } 
                            onChange = { (e) => setHospitalState (e.target.value) }
                        >
                            <option value = "all-states" >All Status</option>
                            <option value = "verified" >Verified</option>
                            <option value = "unverified" >Unverified</option>
                        </select>
                    </div>
                    <div className="filters">
                        <select 
                            value = { bloodTypeFilter } 
                            onChange = { (e) => setBloodTypeFilter (e.target.value) }
                        >
                            <option value = "all-blood" >All Blood Types</option>
                            <option value = "A+" >A+</option>
                            <option value = "A-" >A-</option>
                            <option value = "B+" >B+</option>
                            <option value = "B-" >B-</option>
                            <option value = "AB+" >AB+</option>
                            <option value = "AB-" >AB-</option>
                            <option value = "O+" >O+</option>
                            <option value = "O-" >O-</option>
                        </select>
                    </div>
                    <div className="filters">
                        <select 
                            value = { shortageStateFilter } 
                            onChange = { (e) => setShortageStateFilter (e.target.value) }
                        >
                            <option value = "all-shortage" >All Stock States</option>
                            <option value = "critical" >Critical</option>
                            <option value = "low stock" >Low Stock</option>
                            <option value = "sufficient" >Sufficient</option>
                        </select>
                    </div>
                    <div className="filters">
                        <select 
                            value = { requestsFilter } 
                            onChange = { (e) => setRequestsFilter (e.target.value) }
                        >
                            <option value = "all-requests" >All Requests</option>
                            <option value = "none" >No Requests</option>
                            <option value = "low" >Low (1-10)</option>
                            <option value = "medium" >Medium (11-50)</option>
                            <option value = "high" >High (50+)</option>
                        </select>
                    </div>
                </div>
                )}
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
                                <input 
                                    className="ml-3" 
                                    type="checkbox" 
                                    aria-label="select all"
                                    checked={isAllSelected}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                />
                            </th>
                            <th className="text-left col-hospital">Hospital</th>
                            <th className="col-address">Address</th>
                            <th className="col-status">Status</th>
                            <th className="col-contact">Manager Info</th>
                            <th className="col-stock">Blood Stocks</th>
                            <th className="col-requests">Requests</th>
                            <th className="col-date">Date Added</th>
                            <th className="col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentHospitals.length > 0 ? currentHospitals.map ((h, index) => (
                            <tr key={`${h.id}-${startIndex + index}`}>
                                <td className="col-select">
                                    <input 
                                        className="ml-3" 
                                        type="checkbox" 
                                        aria-label={`select ${h.name}`}
                                        checked={selectedHospitals.has(h.id)}
                                        onChange={(e) => handleCheckboxChange(h.id, e.target.checked)}
                                    />
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
                                            <a 
                                                href="#" 
                                                className="link"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleOpenMap(h);
                                                }}
                                            >
                                                View on Map
                                            </a>
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
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', fontSize: '12px' }}>
                                            {Object.entries(h.blood_stock).map(([bloodType, quantity]) => {
                                                const state = h.shortage_states?.[bloodType] || 'critical';
                                                const getStateColor = (state) => {
                                                    if (state === 'critical') return '#E92C30'; // Red
                                                    if (state === 'low stock') return '#F5CF26'; // Yellow
                                                    return '#16a34a'; // Green
                                                };
                                                const getStateBg = (state) => {
                                                    if (state === 'critical') return '#FDE8E8';
                                                    if (state === 'low stock') return '#fcf7d6';
                                                    return '#e8f9ef';
                                                };
                                                return (
                                                    <span 
                                                        key={bloodType} 
                                                        style={{ 
                                                            display: 'inline-block',
                                                            padding: '4px',
                                                            borderRadius: '4px',
                                                            backgroundColor: getStateBg(state),
                                                            color: getStateColor(state),
                                                            fontWeight: '500',
                                                            fontSize: '11px',
                                                            marginBottom: '2px'
                                                        }}
                                                    >
                                                        {bloodType}: {quantity}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <span className="badge">No stock data</span>
                                    )}
                                </td>
                                <td className="col-requests">
                                    <span className="badge request">{ h.requests || 0 }</span>
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
                                <td colSpan="9" className="text-center">No hospitals found</td>
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
                            <h2>{deleteConfirm.isBulk ? "Delete Selected Hospitals" : "Delete Hospital"}</h2>
                            <button onClick={deleteConfirm.isBulk ? () => { setDeleteConfirm(null); setBulkDeleteError(""); } : handleDeleteCancel} disabled={deleteConfirm.isBulk ? bulkDeleteLoading : deleteLoading}>
                                <IoClose />
                            </button>
                        </div>
                        <div className="modal-form">
                            {deleteConfirm.isBulk ? (
                                <>
                                    <p>Are you sure you want to delete <strong>{deleteConfirm.hospitalCodes.length} hospital{deleteConfirm.hospitalCodes.length !== 1 ? 's' : ''}</strong>?</p>
                                    <p className="modal-text-secondary">
                                        This will delete: <strong>{deleteConfirm.hospitalNames}</strong>
                                    </p>
                                    <p className="modal-text-secondary">
                                        This action cannot be undone. The hospitals will be permanently removed from the system.
                                    </p>
                                    
                                    {bulkDeleteError && (
                                        <div className="error-message modal-error-container">
                                            {bulkDeleteError}
                                        </div>
                                    )}

                                    <div className="form-actions form-actions-modal">
                                        <button 
                                            type="button" 
                                            onClick={() => { setDeleteConfirm(null); setBulkDeleteError(""); }}
                                            disabled={bulkDeleteLoading}
                                            className="btn-cancel"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={handleBulkDeleteConfirm}
                                            disabled={bulkDeleteLoading}
                                            className="submit-btn btn-delete-submit"
                                        >
                                            {bulkDeleteLoading ? (
                                                <>
                                                    <SpinnerDotted size={20} thickness={100} speed={100} color="#fff" className="spinner-inline" />
                                                    Deleting...
                                                </>
                                            ) : (
                                                'Delete All'
                                            )}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
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
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Map Modal */}
            {mapModalOpen && selectedHospitalForMap && (
                <div className="modal-overlay" onClick={handleCloseMap}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', width: '90%' }}>
                        <div className="modal-title">
                            <h2>{selectedHospitalForMap.name} - Location</h2>
                            <button onClick={handleCloseMap}><IoClose /></button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            {selectedHospitalForMap.latitude && selectedHospitalForMap.longitude ? (
                                <div style={{ height: '400px', width: '100%', marginBottom: '15px' }}>
                                    <MapContainer
                                        center={[selectedHospitalForMap.latitude, selectedHospitalForMap.longitude]}
                                        zoom={15}
                                        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
                                        scrollWheelZoom={true}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />
                                        <Marker position={[selectedHospitalForMap.latitude, selectedHospitalForMap.longitude]} />
                                    </MapContainer>
                                </div>
                            ) : (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#767676' }}>
                                    <p>No location coordinates available for this hospital.</p>
                                </div>
                            )}
                            <p className="text-gray-700 text-sm text-center" style={{ marginTop: '10px' }}>
                                {selectedHospitalForMap.address}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}