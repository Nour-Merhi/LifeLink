import { useState, useEffect } from "react"
import { FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoSearchSharp, IoClose } from "react-icons/io5";
import { BsCalendar3, BsClock, BsHospital, BsChevronDown, BsChevronUp, BsListUl } from "react-icons/bs";
import { MdLocationOn } from "react-icons/md";
import { SpinnerDotted } from 'spinners-react';
import axios from 'axios';
import HospitalCalendarView from "./HospitalCalendarView";
import EditAppointmentModal from "./EditAppointmentModal";

export default function HomeAppTable({ appointments = [], loading = false, error = "", onAppointmentsUpdate }){
    const [visitState, setVisitState] = useState("all-states"); 
    const [bloodType, setBloodType] = useState("all-blood");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(9);
    const [expandedDates, setExpandedDates] = useState({}); // Track which dates are expanded
    const [viewMode, setViewMode] = useState("list"); // 'list' or 'calendar'
    const [selectedHospitalId, setSelectedHospitalId] = useState(""); // Selected hospital for calendar view
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null); // { hospitalId, date, appointmentIds, type: 'hospital' | 'date' }
    const [deleteError, setDeleteError] = useState("");
    const [editModal, setEditModal] = useState(null); // { hospitalId, hospitalName, availableSlots }
    const [editAppointmentModal, setEditAppointmentModal] = useState(null); // { appointmentIds, hospitalId, date }

    const [searchTerm, setSearchTerm] = useState("");

    // Toggle date expansion
    const toggleDate = (hospitalId, dateIndex) => {
        const key = `${hospitalId}-${dateIndex}`;
        setExpandedDates(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    useEffect(()=>{
        setCurrentPage(1);
    }, [searchTerm, visitState, bloodType])


    //Filtering orders based on search term, status and blood type
    const filteredOrders = appointments.filter((app) => {
        const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = visitState === "all-states" || app.status === visitState;
        const matchesBlood = bloodType === "all-blood" || app.blood_type === bloodType;

        return matchesSearch && matchesStatus && matchesBlood;
    })

    //Calculate paginiation values
    const totalOrders = filteredOrders.length;
    const totalPages = Math.ceil(totalOrders / itemsPerPage);

    //Calculating which items should show
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentOrder = filteredOrders.slice(startIndex, endIndex);

    //Displaying text
    const startDisplay = startIndex + 1;
    const endDisplay = Math.min(endIndex, totalOrders);

    if (loading) {
        return (
            <div className="loader">
                <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />                
                <h3>Loading Home Visit Appointments...</h3>
            </div>
        );
    }

    if (error && !loading) {
        return (
            <div className="error-container">
                <p>Error: {error}</p>
            </div>
        );
    }

    // Handle date selection from calendar
    const handleDateSelect = (date, timeslots) => {
        console.log('Selected date:', date, 'with timeslots:', timeslots);
        // You can add additional logic here if needed
    };

    // Handle delete for entire hospital
    const handleDeleteHospitalClick = (e, hospital) => {
        e.stopPropagation();
        // Collect all appointment IDs from all dates for this hospital
        const allAppointmentIds = [];
        if (hospital.availableSlots && hospital.availableSlots.length > 0) {
            hospital.availableSlots.forEach(slot => {
                if (slot.appointment_ids && slot.appointment_ids.length > 0) {
                    allAppointmentIds.push(...slot.appointment_ids);
                }
            });
        }
        setDeleteConfirm({ 
            hospitalId: hospital.id, 
            hospitalName: hospital.name,
            appointmentIds: allAppointmentIds,
            type: 'hospital'
        });
        setDeleteError("");
    };

    // Handle delete for specific date
    const handleDeleteDateClick = (e, hospitalId, date, appointmentIds) => {
        e.stopPropagation();
        setDeleteConfirm({ hospitalId, date, appointmentIds, type: 'date' });
        setDeleteError("");
    };

    // Handle edit click - open edit modal
    const handleEditClick = (e, hospital) => {
        e.stopPropagation();
        setEditModal({
            hospitalId: hospital.id,
            hospitalName: hospital.name,
            availableSlots: hospital.availableSlots || []
        });
    };

    // Handle edit modal close
    const handleEditModalClose = () => {
        setEditModal(null);
    };

    // Handle delete cancellation
    const handleDeleteCancel = () => {
        setDeleteConfirm(null);
        setDeleteError("");
    };

    // Handle delete confirmation and API call
    const handleDeleteConfirm = async () => {
        if (!deleteConfirm || !deleteConfirm.appointmentIds || deleteConfirm.appointmentIds.length === 0) {
            setDeleteError("No appointments to delete");
            return;
        }

        setDeleteLoading(true);
        setDeleteError("");

        try {
            // Delete all appointments
            const deletePromises = deleteConfirm.appointmentIds.map(appointmentId => 
                axios.delete(`http://localhost:8000/api/admin/dashboard/appointments/${appointmentId}`, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                })
            );

            const results = await Promise.allSettled(deletePromises);
            
            // Check for any failures
            const failures = results.filter(r => r.status === 'rejected');
            if (failures.length > 0) {
                const errorMessages = failures.map(f => f.reason?.response?.data?.message || f.reason?.message || 'Unknown error');
                setDeleteError(errorMessages.join(', '));
                
                // If all failed, show error and don't close modal
                if (failures.length === results.length) {
                    setDeleteLoading(false);
                    return;
                }
            }

            // Success - close modal and refresh data
            setDeleteConfirm(null);
            setEditModal(null); // Close edit modal if open
            if (onAppointmentsUpdate) {
                onAppointmentsUpdate();
            }
        } catch (error) {
            console.error('Error deleting appointments:', error);
            setDeleteError(error.response?.data?.message || error.message || "Failed to delete appointments");
        } finally {
            setDeleteLoading(false);
        }
    };

    return(
        <section className="hospital-table-section">
            <div className="control-panel">
                <div className="control-panel-layout">
                    <div className="control-panel-layout-left">
                        <div className="search-input">
                            <IoSearchSharp />
                            <input 
                                type="search" 
                                placeholder="Search by hospital name.." 
                                value = {searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="view-toggle">
                            <button 
                                className={viewMode === "list" ? "active-view" : ""}
                                onClick={() => setViewMode("list")}
                                title="List View"
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
                    
                    {viewMode === "calendar" && (
                        <div className="filter-gap">
                            <div className="filters">
                                <select
                                    value={selectedHospitalId}
                                    onChange={(e) => setSelectedHospitalId(e.target.value)}
                                >
                                    <option value="">Select Hospital</option>
                                    {filteredOrders.map(hospital => (
                                        <option key={hospital.id} value={hospital.id}>
                                            {hospital.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Calendar View */}
            {viewMode === "calendar" && (
                <HospitalCalendarView 
                    appointments={appointments}
                    selectedHospitalId={selectedHospitalId}
                    onDateSelect={handleDateSelect}
                />
            )}

            {/* List View */}
            {viewMode === "list" && (
                <>
                {/* Hospital Appointment Slots Grid */}
            <div className="hospital-slots-grid">
                {currentOrder.length > 0 ? (
                    currentOrder.map((hospital) => (
                        <div key={hospital.id} className="hospital-slot-card">
                            <div className="hospital-card-header">
                                <div className="hospital-info">
                                    <BsHospital className="hospitals-icon" />
                                    <div>
                                        <h4 className="hospital-name">{hospital.name}</h4>
                                        {hospital.location && (
                                            <div className="hospital-location">
                                                <MdLocationOn />
                                                <span title={hospital.location}>{hospital.location}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="hospital-actions">
                                    <button 
                                        className="icon-btn" 
                                        title="Edit Appointments"
                                        onClick={(e) => handleEditClick(e, hospital)}
                                    >
                                        <FiEdit />
                                    </button>
                                    <button 
                                        className="icon-btn icon-btn-delete" 
                                        title="Delete All Appointments for Hospital"
                                        onClick={(e) => handleDeleteHospitalClick(e, hospital)}
                                    >
                                        <RiDeleteBin6Line />
                                    </button>
                                </div>
                            </div>

                            <div className="hospital-card-body">
                                <div className="available-slots-header">
                                    <h5>Available Appointment Slots:</h5>
                                </div>

                                {hospital.availableSlots && hospital.availableSlots.length > 0 ? (
                                    <div className="dates-container">
                                        {hospital.availableSlots.map((slot, idx) => {
                                            const isExpanded = expandedDates[`${hospital.id}-${idx}`];
                                            const availableCount = slot.times.filter(t => t.available).length;
                                            
                                            return (
                                                <div key={idx} className="date-slot">
                                                    <div 
                                                        className="date-header clickable"
                                                        onClick={() => toggleDate(hospital.id, idx)}
                                                    >
                                                        <div className="date-header-left">
                                                            <BsCalendar3 className="date-icon" />
                                                            <span className="date-value">{slot.date}</span>
                                                        </div>
                                                        <div className="date-header-right date-header-right-flex">
                                                            <span className="available-count">
                                                                {availableCount} available
                                                            </span>
                                                            <span className="total-count">
                                                                of {slot.times.length}
                                                            </span>
                                                            {isExpanded ? (
                                                                <BsChevronUp className="toggle-icon" />
                                                            ) : (
                                                                <BsChevronDown className="toggle-icon" />
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {isExpanded && (
                                                        <div className="time-slots">
                                                            {slot.times.map((time, timeIdx) => (
                                                                <div 
                                                                    key={timeIdx} 
                                                                    className={`time-slot ${time.available ? 'available' : 'booked'}`}
                                                                >
                                                                    <BsClock />
                                                                    <span>{time.time}</span>
                                                                    {!time.available && (
                                                                        <span className="booked-label">Booked</span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="no-slots">
                                        <p>No available slots at this time</p>
                                    </div>
                                )}

                                {hospital.totalCapacity && (
                                    <div className="capacity-info">
                                        <span>Daily Capacity: {hospital.totalCapacity} appointments</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-hospitals-message">
                        <p>No hospitals found</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalOrders > 0 && (
                <div className="pagination">
                    <div className="showing">
                        <small className="muted">Showing {startDisplay} to {endDisplay} of {totalOrders} hospitals</small>
                    </div>
                    <div className="pagination-controls">
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="pagination-btn"
                        >
                            Previous
                        </button>

                        {Array.from({ length: totalPages}, (_, i) => i + 1).map((pageNum) => (
                            <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`pagination-btn ${currentPage === pageNum ? 'active': ''}`}
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
                </>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="modal-overlay modal-overlay-delete">
                    <div className="modal-container modal-container-delete">
                        <div className="modal-title">
                            <h2>Delete Appointments</h2>
                            <button onClick={handleDeleteCancel} disabled={deleteLoading}>
                                <IoClose />
                            </button>
                        </div>
                        <div className="modal-form">
                            {deleteConfirm.type === 'hospital' ? (
                                <>
                                    <p>Are you sure you want to delete <strong>ALL</strong> appointments for <strong>{deleteConfirm.hospitalName}</strong>?</p>
                                    <p className="modal-text-secondary">
                                        This will delete {deleteConfirm.appointmentIds?.length || 0} appointment record(s) across all dates. 
                                        {deleteConfirm.appointmentIds?.length > 0 && (
                                            <span className="modal-warning-text">
                                                {' '}Note: This action cannot be undone if there are no active bookings.
                                            </span>
                                        )}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p>Are you sure you want to delete all appointments for <strong>{deleteConfirm.date}</strong>?</p>
                                    <p className="modal-text-secondary">
                                        This will delete {deleteConfirm.appointmentIds?.length || 0} appointment record(s). 
                                        {deleteConfirm.appointmentIds?.length > 0 && (
                                            <span className="modal-warning-text">
                                                {' '}Note: This action cannot be undone if there are no active bookings.
                                            </span>
                                        )}
                                    </p>
                                </>
                            )}
                            
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

            {/* Edit Appointment Modal */}
            {editAppointmentModal && (
                <EditAppointmentModal
                    onClose={() => setEditAppointmentModal(null)}
                    onAppointmentUpdated={() => {
                        setEditAppointmentModal(null);
                        setEditModal(null);
                        if (onAppointmentsUpdate) {
                            onAppointmentsUpdate();
                        }
                    }}
                    appointmentIds={editAppointmentModal.appointmentIds}
                    hospitalId={editAppointmentModal.hospitalId}
                    date={editAppointmentModal.date}
                    hospitals={[]}
                />
            )}

            {/* Edit Modal */}
            {editModal && !deleteConfirm && !editAppointmentModal && (
                <div className="modal-overlay modal-overlay-edit">
                    <div className="modal-container modal-container-edit">
                        <div className="modal-title">
                            <h2>Edit Appointments - {editModal.hospitalName}</h2>
                            <button onClick={handleEditModalClose} disabled={deleteLoading}>
                                <IoClose />
                            </button>
                        </div>
                        <div className="modal-form">
                            <div className="edit-modal-description">
                                <p className="edit-modal-description-text">
                                    Manage appointments for this hospital. You can delete specific dates or edit appointment details.
                                </p>
                            </div>

                            {editModal.availableSlots && editModal.availableSlots.length > 0 ? (
                                <div className="dates-container edit-dates-container">
                                    {editModal.availableSlots.map((slot, idx) => {
                                        const availableCount = slot.times?.filter(t => t.available).length || 0;
                                        const totalCount = slot.times?.length || 0;
                                        
                                        return (
                                            <div key={idx} className="date-slot edit-date-slot">
                                                <div className="edit-date-header">
                                                    <div className="edit-date-header-left">
                                                        <BsCalendar3 className="edit-date-calendar-icon" />
                                                        <span className="edit-date-value">{slot.date}</span>
                                                        <span className="edit-date-count">
                                                            ({availableCount} available of {totalCount})
                                                        </span>
                                                    </div>
                                                    <div className="edit-date-actions">
                                                        <button
                                                            className="icon-btn icon-btn-delete-red"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteDateClick(e, editModal.hospitalId, slot.date, slot.appointment_ids || []);
                                                            }}
                                                            title="Delete this date"
                                                        >
                                                            <RiDeleteBin6Line />
                                                        </button>
                                                        <button
                                                            className="icon-btn icon-btn-edit-blue"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditAppointmentModal({
                                                                    appointmentIds: slot.appointment_ids || [],
                                                                    hospitalId: editModal.hospitalId,
                                                                    date: slot.date
                                                                });
                                                            }}
                                                            title="Edit this date"
                                                        >
                                                            <FiEdit />
                                                        </button>
                                                    </div>
                                                </div>
                                                {slot.times && slot.times.length > 0 && (
                                                    <div className="edit-times-container">
                                                        <div className="edit-times-grid">
                                                            {slot.times.slice(0, 10).map((time, timeIdx) => (
                                                                <div 
                                                                    key={timeIdx}
                                                                    className={time.available ? 'edit-time-slot-available' : 'edit-time-slot-booked'}
                                                                >
                                                                    <BsClock className="edit-time-clock-icon" />
                                                                    {time.time}
                                                                    {!time.available && (
                                                                        <span className="edit-time-booked-label">(Booked)</span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                            {slot.times.length > 10 && (
                                                                <span className="edit-time-more">
                                                                    +{slot.times.length - 10} more
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="edit-no-appointments">
                                    <p>No appointments found for this hospital</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
        </section>
    )
}