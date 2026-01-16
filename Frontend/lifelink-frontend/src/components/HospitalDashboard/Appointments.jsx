import { useState, useEffect, Fragment } from "react";
import { IoCalendarOutline, IoClose, IoEye } from "react-icons/io5";
import { FiEye, FiEdit, FiX, FiClock, FiSearch, FiMessageSquare, FiUserPlus } from "react-icons/fi";
import { FaCalendarAlt, FaCheckCircle, FaUsers } from "react-icons/fa";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import CalendarView from "../../components/adminDashboard/homeVisitComponents/CalendarView";
import { SpinnerDotted } from 'spinners-react';
import { RiDeleteBin6Line } from "react-icons/ri";
import AssignPhlebotomistModal from "../../components/adminDashboard/homeVisitComponents/AssignPhlebotomistModal";


export default function Appointments() {
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState("table"); // "calendar" or "table"
    const [donorRequests, setDonorRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState("all"); // Changed default to "all" to show all appointments
    const [appointmentTypeFilters, setAppointmentTypeFilters] = useState([]); // Array: 'home', 'hospital'
    const [statusFilters, setStatusFilters] = useState([]); // Array: 'pending', 'completed', 'canceled'
    
    // Modal states
    const [viewModal, setViewModal] = useState(null); // Appointment to view
    const [editModal, setEditModal] = useState(null); // Appointment to edit
    const [deleteConfirm, setDeleteConfirm] = useState(null); // Appointment(s) to delete
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState("");
    const [editFormData, setEditFormData] = useState({
        appointment_date: '',
        appointment_time: '',
        state: 'pending',
        max_capacity: null
    });
    const [expandedRequests, setExpandedRequests] = useState(new Set());
    
    // Phlebotomist assignment states (only for home appointments)
    const [selectedHomeAppointments, setSelectedHomeAppointments] = useState(new Set());
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedAppointmentForAssign, setSelectedAppointmentForAssign] = useState(null);

    const hospitalId = user?.health_center_manager?.hospital_id || user?.healthCenterManager?.hospital_id;

    useEffect(() => {
        if (user && hospitalId) {
            fetchDonorRequests();
        }
    }, [dateRange, appointmentTypeFilters, statusFilters, user, hospitalId]);

    const fetchDonorRequests = () => {
        if (!hospitalId) {
            setError("Hospital ID not found. Please ensure you are logged in as a hospital manager.");
            return;
        }

        setLoading(true);
        setError("");

        const params = {
            dateRange: dateRange,
            urgency: 'regular' // Only show regular appointments
        };

        api.get(`/api/hospital/dashboard/appointments/${hospitalId}`, { params })
            .then(res => {
                console.log('Appointments API Response:', res.data);
                if (res.data.success) {
                    const appointments = res.data.appointments || [];
                    console.log('Fetched appointments:', appointments.length, appointments);
                    setDonorRequests(appointments);
                } else {
                    const errorMsg = res.data.message || "Failed to fetch donor requests";
                    console.error('API returned error:', errorMsg);
                    setError(errorMsg);
                }
            })
            .catch(err => {
                console.error('Error fetching donor requests:', err);
                console.error('Error response:', err.response);
                setError(err.response?.data?.message || "An error occurred while fetching donor requests");
            })
            .finally(() => setLoading(false));
    };

    const handleView = (appointment) => {
        setViewModal(appointment);
    };

    const handleEdit = (appointment) => {
        setEditFormData({
            appointment_date: appointment.appointment_date || '',
            appointment_time: appointment.appointment_time || '',
            state: appointment.state || 'pending',
            max_capacity: appointment.max_capacity || null
        });
        setEditModal(appointment);
        setEditError("");
    };

    const handleSaveEdit = async () => {
        if (!editModal) return;

        setEditLoading(true);
        setEditError("");

        try {
            await api.get("/sanctum/csrf-cookie");
            
            const response = await api.put(`/api/admin/dashboard/appointments/${editModal.id}`, editFormData);
            
            if (response.data) {
                setEditModal(null);
                fetchDonorRequests();
            }
        } catch (err) {
            console.error('Error updating appointment:', err);
            setEditError(err.response?.data?.message || err.message || "Failed to update appointment");
        } finally {
            setEditLoading(false);
        }
    };

    const handleDelete = (appointment) => {
        setDeleteConfirm({
            appointmentIds: [appointment.id],
            count: 1,
            appointment: appointment
        });
        setDeleteError("");
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm || !deleteConfirm.appointmentIds || deleteConfirm.appointmentIds.length === 0) {
            setDeleteError("No appointments to delete");
            return;
        }

        setDeleteLoading(true);
        setDeleteError("");

        try {
            await api.get("/sanctum/csrf-cookie");
            
            const deletePromises = deleteConfirm.appointmentIds.map(appointmentId => 
                api.delete(`/api/admin/dashboard/appointments/${appointmentId}`)
            );

            const results = await Promise.allSettled(deletePromises);
            
            const failures = results.filter(r => r.status === 'rejected');
            if (failures.length > 0) {
                const errorMessages = failures.map(f => f.reason?.response?.data?.message || f.reason?.message || 'Unknown error');
                setDeleteError(errorMessages.join(', '));
                
                if (failures.length === results.length) {
                    setDeleteLoading(false);
                    return;
                }
            }

            setDeleteConfirm(null);
            fetchDonorRequests();
        } catch (error) {
            console.error('Error deleting appointment:', error);
            setDeleteError(error.response?.data?.message || error.message || "Failed to delete appointment");
        } finally {
            setDeleteLoading(false);
        }
    };

    const toggleExpand = (requestId) => {
        setExpandedRequests(prev => {
            const newSet = new Set(prev);
            if (newSet.has(requestId)) {
                newSet.delete(requestId);
            } else {
                newSet.add(requestId);
            }
            return newSet;
        });
    };

    // Check if appointment is a home appointment
    const isHomeAppointment = (apt) => {
        return apt.donation_type && apt.donation_type.includes('Home');
    };

    // Handle select/deselect for phlebotomist assignment (only home appointments)
    const handleSelectForAssignment = (apt) => {
        if (!isHomeAppointment(apt)) return; // Only allow selection of home appointments
        
        setSelectedHomeAppointments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(apt.id)) {
                newSet.delete(apt.id);
            } else {
                newSet.add(apt.id);
            }
            return newSet;
        });
    };

    // Get selected home appointments data in format expected by AssignPhlebotomistModal
    const getSelectedHomeAppointmentsData = () => {
        return donorRequests
            .filter(apt => selectedHomeAppointments.has(apt.id) && isHomeAppointment(apt))
            .map(apt => {
                // Find the actual home appointment record (we need the code/id from home_appointments table)
                // The appointment data should have a homeAppointment relationship or code
                return {
                    id: apt.code || apt.id, // Use code if available (from home_appointments table), otherwise fallback to id
                    code: apt.code || apt.id,
                    name: `${apt.donor?.user?.first_name || ''} ${apt.donor?.user?.last_name || ''}`.trim() || 'Unknown Donor',
                    date: apt.appointment_date || 'N/A',
                    time: apt.appointment_time || 'N/A',
                    hospital_id: apt.hospital_id || hospitalId,
                    hospital_name: apt.hospital?.name || 'N/A'
                };
            });
    };

    const handleFilterChange = (filterType, selectedOptions) => {
        const values = Array.from(selectedOptions, option => option.value);
        if (filterType === 'appointmentType') {
            setAppointmentTypeFilters(values);
        } else if (filterType === 'status') {
            setStatusFilters(values);
        }
    };

    const handleClearAllFilters = () => {
        setAppointmentTypeFilters([]);
        setStatusFilters([]);
    };

    const filteredRequests = donorRequests.filter(apt => {
        // Exclude organ donations
        if (apt.donation_type && apt.donation_type.includes('Organ')) {
            return false;
        }
        
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = searchTerm === "" || 
            (apt.donor?.user?.first_name?.toLowerCase().includes(searchLower) ||
             apt.donor?.user?.last_name?.toLowerCase().includes(searchLower) ||
             apt.donor?.user?.email?.toLowerCase().includes(searchLower) ||
             (apt.code || apt.id)?.toString().toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;

        // Filter by appointment type (home/hospital)
        if (appointmentTypeFilters.length > 0) {
            const donationType = apt.donation_type || '';
            const isHome = donationType.includes('Home');
            const isHospital = donationType.includes('Hospital');
            
            const filterValue = appointmentTypeFilters[0];
            if (filterValue === 'home' && !isHome) {
                return false;
            } else if (filterValue === 'hospital' && !isHospital) {
                return false;
            }
        }

        // Filter by status
        if (statusFilters.length > 0) {
            if (!statusFilters.includes(apt.state)) {
                return false;
            }
        }
        
        return true;
    });

    // Debug logging
    useEffect(() => {
        console.log('Donor requests count:', donorRequests.length);
        console.log('Filtered requests count:', filteredRequests.length);
        console.log('Date range:', dateRange);
        console.log('Appointment type filters:', appointmentTypeFilters);
        console.log('Status filters:', statusFilters);
        if (donorRequests.length > 0) {
            console.log('Sample appointment:', donorRequests[0]);
        }
    }, [donorRequests, filteredRequests, dateRange, appointmentTypeFilters, statusFilters]);

    // Calculate metrics
    const totalAppointments = donorRequests.length;
    const completedAppointments = donorRequests.filter(apt => apt.state === 'completed').length;
    const canceledAppointments = donorRequests.filter(apt => apt.state === 'canceled').length;
    const activeAppointments = totalAppointments - canceledAppointments;
    const successRate = activeAppointments > 0 
        ? Math.round((completedAppointments / activeAppointments) * 100 * 10) / 10 
        : 0;
    
    // Count unique donors
    const uniqueDonorIds = new Set();
    donorRequests.forEach(apt => {
        if (apt.donor?.id) {
            uniqueDonorIds.add(apt.donor.id);
        }
    });
    const totalDonors = uniqueDonorIds.size;

    const metricsData = [
        {
            title: "Total Regular Appointments",
            value: totalAppointments.toString(),
            change: "All scheduled appointments",
            icon: <FaCalendarAlt />,
            bgColor: "#EAFFE5",
            iconColor: "#16a34a"
        },
        {
            title: "Success Rate",
            value: `${successRate}%`,
            change: `${completedAppointments} completed out of ${activeAppointments} active`,
            icon: <FaCheckCircle />,
            bgColor: "#EBEAFF",
            iconColor: "#285BFF"
        },
        {
            title: "Total Donors",
            value: totalDonors.toString(),
            change: "Unique donors registered",
            icon: <FaUsers />,
            bgColor: "#F5E9FF",
            iconColor: "#6132BE"
        }
    ];

    return (
        <section className="home-visit-section">
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <IoCalendarOutline className="icon-size" />
                        <h2>Regular Request Orders</h2>
                    </div>
                    <p>Manage and schedule all regular donor appointment request orders</p>
                </div>
            </div>

            {/* Metrics */}
            <div className="metrics-grid-3">
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

            {/* View Mode Switcher */}
            <div className="scroll-btn">
                <div className="chose-page">
                    <div className={`sliding-indicator ${viewMode === 'table' ? 'slide-left' : 'slide-right'}`}></div>
                    <button
                        className={viewMode === 'table' ? 'active-btn' : 'inactive-btn'}
                        onClick={() => setViewMode('table')}
                    >
                        Table View
                    </button>
                    <button
                        className={viewMode === 'calendar' ? 'active-btn' : 'inactive-btn'}
                        onClick={() => setViewMode('calendar')}
                    >
                        Calendar View
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="control-panel" style={{ marginBottom: '20px', padding: '20px' }}>
                
                {/* Assign Phlebotomist Button - appears when home appointments are selected */}
                {selectedHomeAppointments.size > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                        <button
                            type="button"
                            onClick={() => setAssignModalOpen(true)}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#2349C2',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <FiUserPlus />
                            Assign Phlebotomist ({selectedHomeAppointments.size})
                        </button>
                    </div>
                )}

                {/* Filters Section */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end' }}>
                    {/* Date Range Filter */}
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                            Date Range
                        </label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                fontSize: '14px',
                                backgroundColor: '#fff'
                            }}
                        >
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="all">All Dates</option>
                        </select>
                    </div>

                    {/* Appointment Type Filter */}
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                            Appointment Type
                        </label>
                        <select
                            value={appointmentTypeFilters.length > 0 ? appointmentTypeFilters[0] : ''}
                            onChange={(e) => {
                                const value = e.target.value;
                                setAppointmentTypeFilters(value ? [value] : []);
                            }}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                fontSize: '14px',
                                backgroundColor: '#fff',
                            }}
                        >
                            <option value="">All Types</option>
                            <option value="home">Home Appointments</option>
                            <option value="hospital">Hospital Appointments</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                            Status
                        </label>
                        <select
                            value={statusFilters.length > 0 ? statusFilters[0] : ''}
                            onChange={(e) => {
                                const value = e.target.value;
                                setStatusFilters(value ? [value] : []);
                            }}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                fontSize: '14px',
                                backgroundColor: '#fff',
                            }}
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="canceled">Canceled</option>
                        </select>
                    </div>

                    {/* Clear Filters Button */}
                    <div>
                        <button
                            onClick={handleClearAllFilters}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#6B6B6B',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#5a5a5a'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#6B6B6B'}
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Active Filters Display */}
                {(appointmentTypeFilters.length > 0 || statusFilters.length > 0) && (
                    <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '6px', fontSize: '13px' }}>
                        <strong>Active Filters:</strong>
                        {appointmentTypeFilters.map(type => (
                            <span key={type} style={{ marginLeft: '10px', padding: '4px 8px', backgroundColor: '#fff', borderRadius: '4px' }}>
                                Type: {type === 'home' ? 'Home' : 'Hospital'}
                            </span>
                        ))}
                        {statusFilters.map(status => (
                            <span key={status} style={{ marginLeft: '10px', padding: '4px 8px', backgroundColor: '#fff', borderRadius: '4px' }}>
                                Status: {status}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Loading State */}
            {loading && (
                <div className="loader" style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Loading donor requests...</p>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#F12C31', background: '#fee', borderRadius: '8px', margin: '20px 0' }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Calendar or Table View */}
            {!loading && !error && (viewMode === "calendar" ? (
                <CalendarView 
                    orders={filteredRequests.map(apt => ({
                        id: apt.id,
                        date: apt.appointment_date,
                        time: apt.appointment_time || 'N/A',
                        name: `${apt.donor?.user?.first_name || ''} ${apt.donor?.user?.last_name || ''}`.trim() || 'Unknown Donor',
                        phlebotomist: apt.mobilePhlebotomist?.user?.first_name || 'Unassigned',
                        status: apt.state,
                        type: apt.appointment_type,
                        donationType: apt.donation_type
                    }))}
                    filteredOrders={filteredRequests.map(apt => ({
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
                <div className="table-design p-4">
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
                            placeholder="Search by appointment ID, donor name, email.."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                                onClick={() => setSearchTerm("")}
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

                    <table className="h1-table">
                        <thead>
                            <tr>
                                {filteredRequests.some(apt => isHomeAppointment(apt)) && (
                                    <th style={{ width: '50px', textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={filteredRequests.filter(apt => isHomeAppointment(apt)).length > 0 && 
                                                    filteredRequests.filter(apt => isHomeAppointment(apt)).every(apt => selectedHomeAppointments.has(apt.id))}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    const homeApts = filteredRequests.filter(apt => isHomeAppointment(apt));
                                                    setSelectedHomeAppointments(new Set(homeApts.map(apt => apt.id)));
                                                } else {
                                                    setSelectedHomeAppointments(new Set());
                                                }
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </th>
                                )}
                                <th className="col-order-id">Request ID</th>
                                <th className="col-donor">Donor</th>
                                <th className="col-date">Date & Time</th>
                                <th className="col-contact">Appointment Type</th>
                                <th className="col-availability">Status</th>
                                <th className="col-phlebotomist">Phlebotomist</th>
                                <th className="col-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.length > 0 ? (
                                filteredRequests.map((apt) => {
                                    const donationType = apt.donation_type || '';
                                    const isHome = donationType.includes('Home');
                                    const isHospital = donationType.includes('Hospital');
                                    const isHomeApt = isHomeAppointment(apt);
                                    
                                    return (
                                        <tr key={apt.id}>
                                            {filteredRequests.some(a => isHomeAppointment(a)) && (
                                                <td style={{ textAlign: 'center', width: '50px' }}>
                                                    {isHomeApt ? (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedHomeAppointments.has(apt.id)}
                                                            onChange={() => handleSelectForAssignment(apt)}
                                                            style={{ cursor: 'pointer' }}
                                                        />
                                                    ) : (
                                                        <span style={{ color: '#ccc' }}>-</span>
                                                    )}
                                                </td>
                                            )}
                                            <td className="col-order-id">
                                                <strong>{apt.code || apt.id}</strong>
                                            </td>
                                            <td className="col-donor">
                                                <div>
                                                    <div>{apt.donor?.user?.first_name} {apt.donor?.user?.last_name}</div>
                                                    {apt.donor?.user?.email && (
                                                        <small className="muted">{apt.donor.user.email}</small>
                                                    )}
                                                    {apt.donor?.bloodType && (
                                                        <div style={{ marginTop: '4px' }}>
                                                            <span style={{ color: '#F12C31', fontWeight: '500' }}>
                                                                {apt.donor.bloodType.type}{apt.donor.bloodType.rh_factor || ''}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="col-date">
                                                <div className="cell-date">
                                                    <span>{apt.appointment_date}</span>
                                                    <small className="muted">{apt.appointment_time || 'N/A'}</small>
                                                </div>
                                            </td>
                                            <td className="col-contact !text-center">
                                                <span className={`badge ${isHome ? 'badge-blue' : isHospital ? 'urgent-badge' : 'badge-gray'}`}>
                                                    {isHome ? 'Home' : isHospital ? 'Hospital' : donationType}
                                                </span>
                                            </td>
                                            <td className="col-availability">
                                                <span className={`badge status-${apt.state}`}>{apt.state}</span>
                                            </td>
                                            <td className="col-phlebotomist flex flex-col">
                                                {apt.mobilePhlebotomist?.user?.first_name || 'Unassigned'} {apt.mobilePhlebotomist?.user?.last_name || 'Unassigned'} 
                                                <span className="muted">+961 {apt.mobilePhlebotomist?.user?.phone_nb || 'N/A'}</span>
                                            </td>
                                            <td className="col-actions">
                                                <div className="row-actions">
                                                    <button 
                                                        className="icon-btn text-blue-600" 
                                                        title="View Details"
                                                        onClick={() => handleView(apt)}
                                                    >
                                                        <FiEye />
                                                    </button>
                                                    {isHomeApt && (
                                                        <button 
                                                            className="icon-btn text-green-600" 
                                                            title="Assign Phlebotomist"
                                                            onClick={() => {
                                                                setSelectedAppointmentForAssign(apt);
                                                                setAssignModalOpen(true);
                                                            }}
                                                        >
                                                            <FiUserPlus />
                                                        </button>
                                                    )}
                                                    <button 
                                                        className="icon-btn text-blue-800" 
                                                        title="Edit"
                                                        onClick={() => handleEdit(apt)}
                                                    >
                                                        <FiEdit />
                                                    </button>
                                                    <button 
                                                        className="icon-btn text-red-500" 
                                                        title="Delete"
                                                        onClick={() => handleDelete(apt)}
                                                    >
                                                        <RiDeleteBin6Line />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={filteredRequests.some(apt => isHomeAppointment(apt)) ? "8" : "7"} style={{ textAlign: "center", padding: "40px" }}>
                                        No donor requests found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )
            )}

            {/* Assign Phlebotomist Modal */}
            {assignModalOpen && (
                <AssignPhlebotomistModal
                    onClose={() => {
                        setAssignModalOpen(false);
                        setSelectedAppointmentForAssign(null);
                        setSelectedHomeAppointments(new Set());
                    }}
                    orders={selectedAppointmentForAssign 
                        ? [{
                            id: selectedAppointmentForAssign.code || selectedAppointmentForAssign.id,
                            code: selectedAppointmentForAssign.code || selectedAppointmentForAssign.id,
                            name: `${selectedAppointmentForAssign.donor?.user?.first_name || ''} ${selectedAppointmentForAssign.donor?.user?.last_name || ''}`.trim() || 'Unknown Donor',
                            date: selectedAppointmentForAssign.appointment_date || 'N/A',
                            time: selectedAppointmentForAssign.appointment_time || 'N/A',
                            hospital_id: selectedAppointmentForAssign.hospital_id || hospitalId,
                            hospital_name: selectedAppointmentForAssign.hospital?.name || 'N/A'
                        }]
                        : getSelectedHomeAppointmentsData()
                    }
                    onAssignSuccess={() => {
                        setSelectedHomeAppointments(new Set());
                        setSelectedAppointmentForAssign(null);
                        fetchDonorRequests();
                    }}
                />
            )}

            {/* View Modal */}
            {viewModal && (
                <div className="modal-overlay modal-overlay-delete" onClick={() => setViewModal(null)}>
                    <div className="modal-container modal-container-delete" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-title">
                            <h2>Appointment Details</h2>
                            <button onClick={() => setViewModal(null)}>
                                <IoClose />
                            </button>
                        </div>
                        <div className="modal-form">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                                <div>
                                    <strong>Request ID:</strong> {viewModal.code || viewModal.id}
                                </div>
                                <div>
                                    <strong>Donor Name:</strong> {viewModal.donor?.user?.first_name} {viewModal.donor?.user?.last_name}
                                </div>
                                {viewModal.donor?.user?.email && (
                                    <div>
                                        <strong>Email:</strong> {viewModal.donor.user.email}
                                    </div>
                                )}
                                {viewModal.donor?.user?.phone_nb && (
                                    <div>
                                        <strong>Phone:</strong> {viewModal.donor.user.phone_nb}
                                    </div>
                                )}
                                {viewModal.donor?.bloodType && (
                                    <div>
                                        <strong>Blood Type:</strong> 
                                        <span style={{ color: '#F12C31', marginLeft: '8px' }}>
                                            {viewModal.donor.bloodType.type}{viewModal.donor.bloodType.rh_factor || ''}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <strong>Appointment Date:</strong> {viewModal.appointment_date || 'N/A'}
                                </div>
                                {viewModal.appointment_time && (
                                    <div>
                                        <strong>Appointment Time:</strong> {viewModal.appointment_time}
                                    </div>
                                )}
                                <div>
                                    <strong>Type:</strong> 
                                    <span className={`badge ${viewModal.donation_type?.includes('Home') ? 'badge-blue' : viewModal.donation_type?.includes('Hospital') ? 'urgent-badge' : 'badge-gray'}`} style={{ marginLeft: '8px' }}>
                                        {viewModal.donation_type?.includes('Home') ? 'Home' : viewModal.donation_type?.includes('Hospital') ? 'Hospital' : viewModal.donation_type}
                                    </span>
                                </div>
                                <div>
                                    <strong>Status:</strong> 
                                    <span className={`badge status-${viewModal.state || 'pending'}`} style={{ marginLeft: '8px' }}>
                                        {viewModal.state || 'pending'}
                                    </span>
                                </div>
                                {viewModal.mobilePhlebotomist?.user?.first_name && (
                                    <div>
                                        <strong>Phlebotomist:</strong> {viewModal.mobilePhlebotomist.user.first_name}
                                    </div>
                                )}
                            </div>
                            <div className="form-actions form-actions-modal">
                                <button 
                                    type="button" 
                                    onClick={() => setViewModal(null)}
                                    className="btn-cancel"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editModal && (
                <div className="modal-overlay modal-overlay-delete" onClick={() => !editLoading && setEditModal(null)}>
                    <div className="modal-container modal-container-delete" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-title">
                            <h2>Edit Appointment</h2>
                            <button onClick={() => !editLoading && setEditModal(null)} disabled={editLoading}>
                                <IoClose />
                            </button>
                        </div>
                        <div className="modal-form">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                        Appointment Date <span style={{ color: 'red' }}>*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={editFormData.appointment_date}
                                        onChange={(e) => setEditFormData({...editFormData, appointment_date: e.target.value})}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            fontSize: '14px'
                                        }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                        Appointment Time
                                    </label>
                                    <input
                                        type="time"
                                        value={editFormData.appointment_time}
                                        onChange={(e) => setEditFormData({...editFormData, appointment_time: e.target.value})}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                        Status <span style={{ color: 'red' }}>*</span>
                                    </label>
                                    <select
                                        value={editFormData.state}
                                        onChange={(e) => setEditFormData({...editFormData, state: e.target.value})}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            fontSize: '14px'
                                        }}
                                        required
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="completed">Completed</option>
                                        <option value="canceled">Canceled</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                        Max Capacity
                                    </label>
                                    <input
                                        type="number"
                                        value={editFormData.max_capacity || ''}
                                        onChange={(e) => setEditFormData({...editFormData, max_capacity: e.target.value ? parseInt(e.target.value) : null})}
                                        min="1"
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                            </div>

                            {editError && (
                                <div className="error-message modal-error-container" style={{ marginTop: '15px' }}>
                                    {editError}
                                </div>
                            )}

                            <div className="form-actions form-actions-modal" style={{ marginTop: '20px' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setEditModal(null)}
                                    disabled={editLoading}
                                    className="btn-cancel"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleSaveEdit}
                                    disabled={editLoading}
                                    className="submit-btn btn-delete-submit"
                                >
                                    {editLoading ? (
                                        <>
                                            <SpinnerDotted size={20} thickness={100} speed={100} color="#fff" className="spinner-inline" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="modal-overlay modal-overlay-delete">
                    <div className="modal-container modal-container-delete">
                        <div className="modal-title">
                            <h2>Delete Appointment</h2>
                            <button onClick={() => !deleteLoading && setDeleteConfirm(null)} disabled={deleteLoading}>
                                <IoClose />
                            </button>
                        </div>
                        <div className="modal-form">
                            <p>Are you sure you want to delete this appointment?</p>
                            {deleteConfirm.appointment && (
                                <p style={{ marginTop: '10px' }}>
                                    <strong>Request ID:</strong> {deleteConfirm.appointment.code || deleteConfirm.appointment.id}
                                </p>
                            )}
                            <p className="modal-text-secondary" style={{ marginTop: '10px' }}>
                                This action cannot be undone.
                            </p>
                            <span className="modal-warning-text">
                                Note: This action cannot be undone if there are no active bookings.
                            </span>
                            
                            {deleteError && (
                                <div className="error-message modal-error-container">
                                    {deleteError}
                                </div>
                            )}

                            <div className="form-actions form-actions-modal">
                                <button 
                                    type="button" 
                                    onClick={() => setDeleteConfirm(null)}
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
    );
}
