import { useState, useEffect } from "react"
import { FiEye } from "react-icons/fi";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoSearchSharp } from "react-icons/io5";
import { BsCalendar3, BsClock, BsHospital, BsChevronDown, BsChevronUp, BsListUl } from "react-icons/bs";
import { MdLocationOn } from "react-icons/md";
import { SpinnerDotted } from 'spinners-react';
import HospitalCalendarView from "./HospitalCalendarView";

export default function HomeAppTable({ appointments = [], loading = false, error = "" }){
    const [visitState, setVisitState] = useState("all-states"); 
    const [bloodType, setBloodType] = useState("all-blood");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(9);
    const [expandedDates, setExpandedDates] = useState({}); // Track which dates are expanded
    const [viewMode, setViewMode] = useState("list"); // 'list' or 'calendar'
    const [selectedHospitalId, setSelectedHospitalId] = useState(""); // Selected hospital for calendar view

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
            <div style={{ textAlign: 'center', padding: '40px', color: '#F12C31' }}>
                <p>Error: {error}</p>
            </div>
        );
    }

    // Handle date selection from calendar
    const handleDateSelect = (date, timeslots) => {
        console.log('Selected date:', date, 'with timeslots:', timeslots);
        // You can add additional logic here if needed
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
                                    <button className="icon-btn" title="View Details"><FiEye /></button>
                                    <button className="icon-btn" title="Edit"><FiEdit /></button>
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
                                                        <div className="date-header-right">
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
            
        </section>
    )
}