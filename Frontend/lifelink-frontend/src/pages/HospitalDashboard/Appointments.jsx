import { useState, useEffect } from "react";
import { IoCalendarOutline, IoSearchSharp } from "react-icons/io5";
import { FiEdit, FiX, FiClock } from "react-icons/fi";
import axios from "axios";
import CalendarView from "../../components/adminDashboard/homeVisitComponents/CalendarView";
import AddHomeApp from "../../components/adminDashboard/homeVisitComponents/AddHomeApp";

export default function Appointments() {
    const [viewMode, setViewMode] = useState("calendar"); // "calendar" or "table"
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        dateRange: "today",
        donationType: "all",
        urgency: "all",
        phlebotomist: "all",
        state: "all"
    });

    useEffect(() => {
        fetchAppointments();
    }, [filters]);

    const fetchAppointments = () => {
        setLoading(true);
        // In production: axios.get("/api/hospital/appointments", { params: filters })
        axios.get("http://localhost:8000/api/admin/dashboard/home-visit-appointments")
            .then(res => {
                setAppointments(res.data.appointments || []);
            })
            .catch(err => {
                setError(err.response?.data?.message || "An error occurred");
            })
            .finally(() => setLoading(false));
    };

    const handleEdit = (appointment) => {
        setSelectedAppointment(appointment);
        setOpenModal(true);
    };

    const handleReschedule = (appointment) => {
        // Open reschedule modal
        setSelectedAppointment(appointment);
        setOpenModal(true);
    };

    const handleCancel = (appointmentId) => {
        if (window.confirm("Are you sure you want to cancel this appointment?")) {
            // In production: axios.delete(`/api/hospital/appointments/${appointmentId}`)
            console.log("Cancel appointment:", appointmentId);
            fetchAppointments();
        }
    };

    const filteredAppointments = appointments.filter(apt => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = searchTerm === "" || 
            (apt.donor?.user?.first_name?.toLowerCase().includes(searchLower) ||
             apt.donor?.user?.last_name?.toLowerCase().includes(searchLower) ||
             (apt.code || apt.id)?.toString().toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
        if (filters.donationType !== "all" && apt.donation_type !== filters.donationType) return false;
        if (filters.urgency !== "all" && apt.appointment_type !== filters.urgency) return false;
        if (filters.state !== "all" && apt.state !== filters.state) return false;
        return true;
    });

    return (
        <section className="home-visit-section">
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <IoCalendarOutline className="icon-size" />
                        <h2>Appointments Management</h2>
                    </div>
                    <p>Manage and schedule all hospital appointments</p>
                </div>
                <div className="add-btn">
                    <button type="button" onClick={() => setOpenModal(true)}>+ New Appointment</button>
                </div>
            </div>

            {/* View Mode Switcher */}
            <div className="scroll-btn">
                <div className="chose-page">
                    <div className={`sliding-indicator ${viewMode === 'calendar' ? 'slide-left' : 'slide-right'}`}></div>
                    <button
                        className={viewMode === 'calendar' ? 'active-btn' : 'inactive-btn'}
                        onClick={() => setViewMode('calendar')}
                    >
                        Calendar View
                    </button>
                    <button
                        className={viewMode === 'table' ? 'active-btn' : 'inactive-btn'}
                        onClick={() => setViewMode('table')}
                    >
                        Table View
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="control-panel">
                <div className="control-panel-layout">
                    <div className="search-input">
                        <IoSearchSharp />
                        <input 
                            type="search" 
                            placeholder="Search by appointment ID, donor name.." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filter-gap">
                        <div className="filters">
                            <select
                                value={filters.dateRange}
                                onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                            >
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                                <option value="all">All Dates</option>
                            </select>
                        </div>
                        <div className="filters">
                            <select
                                value={filters.donationType}
                                onChange={(e) => setFilters({...filters, donationType: e.target.value})}
                            >
                                <option value="all">All Types</option>
                                <option value="Home Blood Donation">Home Blood</option>
                                <option value="Hospital Blood Donation">Hospital Blood</option>
                                <option value="Alive Organ Donation">Organ Donation</option>
                            </select>
                        </div>
                        <div className="filters">
                            <select
                                value={filters.urgency}
                                onChange={(e) => setFilters({...filters, urgency: e.target.value})}
                            >
                                <option value="all">All Urgency</option>
                                <option value="urgent">Urgent</option>
                                <option value="regular">Regular</option>
                            </select>
                        </div>
                        <div className="filters">
                            <select
                                value={filters.state}
                                onChange={(e) => setFilters({...filters, state: e.target.value})}
                            >
                                <option value="all">All States</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="canceled">Canceled</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar or Table View */}
            {viewMode === "calendar" ? (
                <CalendarView 
                    orders={filteredAppointments.map(apt => ({
                        id: apt.id,
                        date: apt.appointment_date,
                        time: apt.appointment_time || 'N/A',
                        name: `${apt.donor?.user?.first_name || ''} ${apt.donor?.user?.last_name || ''}`.trim() || 'Unknown Donor',
                        phlebotomist: apt.mobilePhlebotomist?.user?.first_name || 'Unassigned',
                        status: apt.state,
                        type: apt.appointment_type,
                        donationType: apt.donation_type
                    }))}
                    filteredOrders={filteredAppointments.map(apt => ({
                        id: apt.id,
                        date: apt.appointment_date,
                        time: apt.appointment_time || 'N/A',
                        name: `${apt.donor?.user?.first_name || ''} ${apt.donor?.user?.last_name || ''}`.trim() || 'Unknown Donor',
                        phlebotomist: apt.mobilePhlebotomist?.user?.first_name || 'Unassigned',
                        status: apt.state,
                        type: apt.appointment_type,
                        donationType: apt.donation_type
                    }))}
                />
            ) : (
                <div className="table-design">
                    <table className="h1-table">
                        <thead>
                            <tr>
                                <th className="col-order-id">Appointment ID</th>
                                <th className="col-donor">Donor</th>
                                <th className="col-date">Date & Time</th>
                                <th className="col-contact">Type</th>
                                <th className="col-availability">Status</th>
                                <th className="col-phlebotomist">Phlebotomist</th>
                                <th className="col-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAppointments.length > 0 ? (
                                filteredAppointments.map((apt) => (
                                    <tr key={apt.id}>
                                        <td className="col-order-id">
                                            <strong>{apt.code || apt.id}</strong>
                                        </td>
                                        <td className="col-donor">
                                            {apt.donor?.user?.first_name} {apt.donor?.user?.last_name}
                                        </td>
                                        <td className="col-date">
                                            <div className="cell-date">
                                                <span>{apt.appointment_date}</span>
                                                <small className="muted">{apt.appointment_time || 'N/A'}</small>
                                            </div>
                                        </td>
                                        <td className="col-contact">
                                            <span className={apt.appointment_type === 'urgent' ? 'urgent-badge' : ''}>
                                                {apt.appointment_type}
                                            </span>
                                        </td>
                                        <td className="col-availability">
                                            <span className={`badge status-${apt.state}`}>{apt.state}</span>
                                        </td>
                                        <td className="col-phlebotomist">
                                            {apt.mobilePhlebotomist?.user?.first_name || 'Unassigned'}
                                        </td>
                                        <td className="col-actions">
                                            <div className="row-actions">
                                                <button className="icon-btn text-blue-800" onClick={() => handleEdit(apt)}>
                                                    <FiEdit />
                                                </button>
                                                <button className="icon-btn text-green-600" onClick={() => handleReschedule(apt)}>
                                                    <FiClock />
                                                </button>
                                                <button className="icon-btn text-red-500" onClick={() => handleCancel(apt.id)}>
                                                    <FiX />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: "center", padding: "40px" }}>
                                        No appointments found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {openModal && (
                <AddHomeApp
                    onClose={() => {
                        setOpenModal(false);
                        setSelectedAppointment(null);
                    }}
                    appointment={selectedAppointment}
                    onAppointmentAdded={fetchAppointments}
                />
            )}
        </section>
    );
}

