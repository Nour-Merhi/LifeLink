import { useState, useEffect } from "react"
import { FiEye } from "react-icons/fi";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoSearchSharp } from "react-icons/io5";
import { BsCalendar3 } from "react-icons/bs";
import { BsListUl } from "react-icons/bs";
import { SpinnerDotted } from 'spinners-react';
import api from "../../../api/axios";
import CalendarView from "../homeVisitComponents/CalendarView";
import EditHospitalAppointmentModal from "./EditHospitalAppointmentModal";
import ViewHospitalAppointmentModal from "./ViewHospitalAppointmentModal";
import ConfirmDeleteDialog from "../../common/ConfirmDeleteDialog";

export default function HospitalAppointmentTable({ appointments = [], loading = false, error = "", onAppointmentsUpdate, searchTerm: externalSearchTerm = "", filters: externalFilters = null, onStatusUpdate }){
    const [visitState, setVisitState] = useState("all-states"); 
    const [bloodType, setBloodType] = useState("all-blood");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [viewMode, setViewMode] = useState("table"); 
    const [internalSearchTerm, setInternalSearchTerm] = useState("");
    const [editModal, setEditModal] = useState(null); 
    const [viewModal, setViewModal] = useState(null); 
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    
    const searchTerm = externalSearchTerm || internalSearchTerm;

    useEffect(()=>{
        setCurrentPage(1);
    }, [searchTerm, visitState, bloodType])


    // Normalize status for filtering (backend uses 'canceled', frontend expects 'cancelled')
    const normalizeStatus = (status) => {
        if (status === 'canceled') return 'cancelled';
        return status;
    };

    //Filtering appointments based on search term, status, blood type, and external filters
    const filteredAppointments = appointments.filter((appointment) => {
        const normalizedStatus = normalizeStatus(appointment.status || 'pending');
        const matchesSearch = appointment.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             appointment.id?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        
        // Use external filters if provided, otherwise use internal filters
        const effectiveStatus = externalFilters?.status || visitState;
        const effectiveBloodType = bloodType; // Blood type filter stays internal
        const effectiveHospital = externalFilters?.hospital;
        const effectiveDonationType = externalFilters?.donationType;
        
        const matchesStatus = effectiveStatus === "all-states" || normalizedStatus === effectiveStatus;
        const matchesBlood = effectiveBloodType === "all-blood" || appointment.blood_type === effectiveBloodType;
        const matchesHospital = !effectiveHospital || effectiveHospital === 'all-hospitals' || 
                               String(appointment.hospital_id) === String(effectiveHospital);
        
        // Donation type filtering (appointment data uses 'Hospital Blood Donation', filter uses 'blood')
        let matchesDonationType = true;
        if (effectiveDonationType && effectiveDonationType !== 'all-types') {
            const appointmentDonationType = (appointment.donation_type || '').toLowerCase();
            matchesDonationType = appointmentDonationType.includes(effectiveDonationType.toLowerCase());
        }
        
        // Date range filtering (simplified - would need proper date comparison in real implementation)
        let matchesDateRange = true;
        if (externalFilters?.dateRange && externalFilters.dateRange !== 'all-dates') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const aptDate = appointment.date ? new Date(appointment.date) : null;
            
            if (aptDate) {
                aptDate.setHours(0, 0, 0, 0);
                switch (externalFilters.dateRange) {
                    case 'today':
                        matchesDateRange = aptDate.getTime() === today.getTime();
                        break;
                    case 'this-week':
                        const oneWeekAgo = new Date(today);
                        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                        matchesDateRange = aptDate >= oneWeekAgo;
                        break;
                    case 'this-month':
                        const oneMonthAgo = new Date(today);
                        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                        matchesDateRange = aptDate >= oneMonthAgo;
                        break;
                    case 'custom':
                        // Would need to compare with dateFrom and dateTo
                        if (externalFilters.dateFrom && externalFilters.dateTo) {
                            const fromDate = new Date(externalFilters.dateFrom);
                            const toDate = new Date(externalFilters.dateTo);
                            fromDate.setHours(0, 0, 0, 0);
                            toDate.setHours(23, 59, 59, 999);
                            matchesDateRange = aptDate >= fromDate && aptDate <= toDate;
                        }
                        break;
                    default:
                        matchesDateRange = true;
                }
            } else {
                matchesDateRange = false; 
            }
        }

        return matchesSearch && matchesStatus && matchesBlood && matchesHospital && matchesDonationType && matchesDateRange;
    });

    const sortedAppointments = [...filteredAppointments].sort((a, b) => {
        const futureDateA = a.date ? new Date(a.date) : new Date(0);
        const futureDateB = b.date ? new Date(b.date) : new Date(0);
        const createdA = a.created_at ? new Date(a.created_at) : new Date(0);
        const createdB = b.created_at ? new Date(b.created_at) : new Date(0);

        const byFuture = futureDateB.getTime() - futureDateA.getTime();
        if (byFuture !== 0) return byFuture;
        return createdB.getTime() - createdA.getTime();
    });

    //Calculate pagination values
    const totalAppointments = sortedAppointments.length;
    const totalPages = Math.ceil(totalAppointments / itemsPerPage);

    //Calculating which items should show
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentAppointments = sortedAppointments.slice(startIndex, endIndex);

    //Displaying text
    const startDisplay = startIndex + 1;
    const endDisplay = Math.min(endIndex, totalAppointments);

    if (loading) {
        return (
            <div className="loader">
                <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />                
                <h3>Loading Hospital Appointments...</h3>
            </div>
        );
    }

    if (error && !loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: '#F12C31' }}>
                <p>Error: {error}</p>
            </div>
        );
    }

    // Handle view click
    const handleViewClick = (appointmentCode) => {
        setViewModal({ appointmentCode });
    };

    // Handle edit click
    const handleEditClick = (appointmentCode) => {
        setEditModal({ appointmentCode });
    };

    // Handle delete click
    const handleDeleteClick = (appointmentCode, appointmentName) => {
        setDeleteConfirm({ appointmentCode, appointmentName });
        setDeleteError("");
    };

    // Handle delete cancellation
    const handleDeleteCancel = () => {
        setDeleteConfirm(null);
        setDeleteError("");
    };

    // Handle delete confirmation
    const handleDeleteConfirm = async () => {
        if (!deleteConfirm || !deleteConfirm.appointmentCode) {
            setDeleteError("No appointment selected");
            return;
        }

        setDeleteLoading(true);
        setDeleteError("");

        try {
            await api.get("/sanctum/csrf-cookie");
            await api.delete(
                `/api/admin/dashboard/hospital-appointments/${deleteConfirm.appointmentCode}`
            );

            // Success - close modal and refresh data
            setDeleteConfirm(null);
            if (onAppointmentsUpdate) {
                onAppointmentsUpdate();
            }
        } catch (error) {
            console.error('Error deleting hospital appointment:', error);
            setDeleteError(error.response?.data?.message || error.message || "Failed to delete appointment");
        } finally {
            setDeleteLoading(false);
        }
    };

    // Handle modal close
    const handleEditModalClose = () => {
        setEditModal(null);
    };

    const handleViewModalClose = () => {
        setViewModal(null);
    };

    const handleAppointmentUpdated = () => {
        setEditModal(null);
        if (onAppointmentsUpdate) {
            onAppointmentsUpdate();
        }
    };

    return(
        <section className="hospital-table-section">
            <div className="control-panel">
                <h3 className="control-panel-title">Hospital Blood Donation Appointments</h3>
                <div className="control-panel-layout">
                    <div className="control-panel-layout-left">
                        {!externalSearchTerm && (
                            <div className="search-input">
                                <IoSearchSharp />
                                <input 
                                    type="search" 
                                    placeholder="Search by donor name..." 
                                    value = {internalSearchTerm}
                                    onChange={(e) => setInternalSearchTerm(e.target.value)}
                                />
                            </div>
                        )}
                        <div className="view-toggle">
                            <button 
                                className={viewMode === "table" ? "active-view" : ""}
                                onClick={() => setViewMode("table")}
                                title="Table View"
                            >
                                <BsListUl />
                            </button>
                            <button 
                                className={viewMode === "calendar" ? "active-view" : ""}
                                onClick={() => setViewMode("calendar")}
                                title="Calendar View"
                            >
                                <BsCalendar3 />
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {viewMode === "calendar" && (
                <CalendarView orders={appointments} filteredOrders={sortedAppointments} />
            )}

            {viewMode === "table" && <div className="table-design">
                <table className="h1-table">
                    <thead>
                        <tr>
                            <th className="col-order-id">Appointment ID</th>
                            <th className="text-left col-donor">Donor</th>
                            <th className="col-hospital">Hospital</th>
                            <th className="col-contact">Contact</th>
                            <th className="col-physical">Age</th>
                            <th className="col-status">Status</th>
                            <th className="col-date-time">Date & Time</th>
                            <th className="col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                            {currentAppointments.length > 0 ? currentAppointments.map ((a, index) => {
                                return (
                                <tr key={`${a.id}-${startIndex + index}`}>
                                <td className="col-order-id">
                                    <div className="cell-title">
                                        <strong title={a.id}>{ a.id }</strong>
                                        <small className="muted">{ a.created_at }</small>
                                    </div>
                                </td>
                                <td className="col-donor">
                                    <div className="cell-title">
                                        <strong title={a.name}>{ a.name }</strong>
                                        <small className="muted">Blood Type: { a.blood_type }</small>
                                    </div>
                                </td>

                                <td className="col-hospital">
                                    <div className="cell-title">
                                        <strong title={a.hospital_name}>{ a.hospital_name || 'N/A' }</strong>
                                    </div>
                                </td>

                                <td className="col-contact">
                                    <div className="cell-title">
                                        <span>{ a.email }</span>
                                        <small className="muted">{ a.phone }</small>
                                    </div>
                                </td>

                                <td className="col-physical">
                                    <div className="cell-title">
                                        <span>{ a.age } years</span>
                                    </div>
                                </td>

                                <td className="col-status">
                                    <span className={`badge ${
                                        a.status === "completed" ? "badge-success" : 
                                        (a.status === "pending" || a.status === "Pending") ? "badge-pending" : 
                                        "badge-danger"
                                    }`}>
                                        { a.status === "canceled" ? "Cancelled" : (a.status?.charAt(0).toUpperCase() + a.status?.slice(1)) || "Pending" }
                                    </span>
                                </td>
                                
                                <td className="col-date">
                                    <div className="cell-date">
                                        <span>{ a.date }</span>
                                        <span>{ a.time }</span>
                                    </div>
                                </td>    
                                    
                                <td className="col-actions">
                                    <div className="row-actions">
                                        <button 
                                            className="icon-btn text-blue-800" 
                                            title="View Details"
                                            onClick={() => handleViewClick(a.id)}
                                        >
                                            <FiEye />
                                        </button>
                                        <button 
                                            className="icon-btn text-green-600" 
                                            title="Edit"
                                            onClick={() => handleEditClick(a.id)}
                                        >
                                            <FiEdit />
                                        </button>
                                        <button 
                                            className="icon-btn text-red-500" 
                                            title="Delete"
                                            onClick={() => handleDeleteClick(a.id, a.name)}
                                        >
                                            <RiDeleteBin6Line />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            );
                            }) : (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                                    <p>No appointments found</p>
                                </td>
                            </tr>
                        )}

                    </tbody>
                </table>
                
                <div className="pagination">
                    <div className="showing">
                        <small className="muted">Showing {startDisplay} to {endDisplay} of {totalAppointments} appointments</small>
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
            </div>}

            {/* Edit Modal */}
            {editModal && (
                <EditHospitalAppointmentModal
                    onClose={handleEditModalClose}
                    onAppointmentUpdated={handleAppointmentUpdated}
                    appointmentCode={editModal.appointmentCode}
                />
            )}

            {/* View Modal */}
            {viewModal && (
                <ViewHospitalAppointmentModal
                    onClose={handleViewModalClose}
                    appointmentCode={viewModal.appointmentCode}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <ConfirmDeleteDialog
                    title="Delete Hospital Appointment"
                    description={`You are going to delete the appointment for ${deleteConfirm.appointmentName}. Are you sure?`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    loading={deleteLoading}
                    error={deleteError}
                    onClose={handleDeleteCancel}
                    onConfirm={handleDeleteConfirm}
                />
            )}
        </section>
    )
}
