import { useState, useEffect, Fragment } from "react";
import { FiAlertCircle, FiSearch } from "react-icons/fi";
import { FiEye, FiMessageSquare, FiEdit, FiUserPlus } from "react-icons/fi";
import { IoClose, IoEye } from "react-icons/io5";
import { FaCalendarAlt, FaCheckCircle, FaUsers as FaUsersIcon } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";
import api from "../../api/axios";
import { SpinnerDotted } from 'spinners-react';
import { useAuth } from "../../context/AuthContext";
import CalendarView from "../../components/adminDashboard/homeVisitComponents/CalendarView";
import AssignPhlebotomistModal from "../../components/adminDashboard/homeVisitComponents/AssignPhlebotomistModal";

export default function UrgentRequests() {
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState("table"); // "calendar" or "table"
    const [donorRequests, setDonorRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [expandedRequests, setExpandedRequests] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRequests, setSelectedRequests] = useState(new Set());
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [appointmentTypeFilters, setAppointmentTypeFilters] = useState([]); // Array: 'home', 'hospital'
    const [statusFilters, setStatusFilters] = useState([]); // Array: 'pending', 'completed', 'canceled'
    
    // Modal states
    const [viewModal, setViewModal] = useState(null); // Request to view
    const [editModal, setEditModal] = useState(null); // Request to edit
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState("");
    const [editFormData, setEditFormData] = useState({
        appointment_date: '',
        appointment_time: '',
        state: 'pending',
        max_capacity: null
    });
    
    // Phlebotomist assignment states (only for home appointments)
    const [selectedHomeAppointments, setSelectedHomeAppointments] = useState(new Set());
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedAppointmentForAssign, setSelectedAppointmentForAssign] = useState(null);

    // Get hospital ID from user's health center manager relationship
    const hospitalId = user?.health_center_manager?.hospital_id || user?.healthCenterManager?.hospital_id;

    useEffect(() => {
        if (user && hospitalId) {
            fetchDonorRequests();
        }
    }, [user, hospitalId, appointmentTypeFilters]);

    const fetchDonorRequests = () => {
        if (!hospitalId) {
            setError("Hospital ID not found. Please ensure you are logged in as a hospital manager.");
            return;
        }

        setLoading(true);
        setError("");
        
        const params = { urgency: 'urgent' }; // Filter for urgent appointments
        // Note: Backend filtering by donation_type will be handled in frontend filtering

        api.get(`/api/hospital/dashboard/appointments/${hospitalId}`, { params })
            .then(res => {
                if (res.data.success) {
                    setDonorRequests(res.data.appointments || []);
                } else {
                    setError(res.data.message || "Failed to fetch donor requests");
                }
            })
            .catch(err => {
                console.error('Error fetching donor requests:', err);
                setError(err.response?.data?.message || "An error occurred while fetching donor requests");
            })
            .finally(() => setLoading(false));
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


    // Get selected home appointments data in format expected by AssignPhlebotomistModal
    const getSelectedHomeAppointmentsData = () => {
        return donorRequests
            .filter(apt => selectedHomeAppointments.has(apt.id) && isHomeAppointment(apt))
            .map(apt => {
                return {
                    id: apt.code || apt.id,
                    code: apt.code || apt.id,
                    name: `${apt.donor?.user?.first_name || ''} ${apt.donor?.user?.last_name || ''}`.trim() || 'Unknown Donor',
                    date: apt.appointment_date || 'N/A',
                    time: apt.appointment_time || 'N/A',
                    hospital_id: apt.hospital_id || hospitalId,
                    hospital_name: apt.hospital?.name || 'N/A'
                };
            });
    };

    const handleClearAllFilters = () => {
        setAppointmentTypeFilters([]);
        setStatusFilters([]);
    };

    const filteredRequests = donorRequests.filter(request => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = searchTerm === "" || 
            request.bloodType?.toLowerCase().includes(searchLower) ||
            (request.code || request.id || '').toString().toLowerCase().includes(searchLower) ||
            `${request.donor?.user?.first_name || ''} ${request.donor?.user?.last_name || ''}`.toLowerCase().includes(searchLower) ||
            request.donor?.user?.email?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;

        // Filter by appointment type (home/hospital)
        if (appointmentTypeFilters.length > 0) {
            const donationType = request.donation_type || '';
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
            if (!statusFilters.includes(request.state)) {
                return false;
            }
        }

        return true;
    });

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedRequests(new Set(filteredRequests.map(r => r.id)));
        } else {
            setSelectedRequests(new Set());
        }
    };

    const handleSelectRequest = (requestId) => {
        setSelectedRequests(prev => {
            const newSet = new Set(prev);
            if (newSet.has(requestId)) {
                newSet.delete(requestId);
            } else {
                newSet.add(requestId);
            }
            return newSet;
        });
    };

    const handleDeleteClick = () => {
        if (selectedRequests.size === 0) return;
        setDeleteConfirm({
            requestIds: Array.from(selectedRequests),
            count: selectedRequests.size
        });
        setDeleteError("");
    };

    const handleDeleteCancel = () => {
        setDeleteConfirm(null);
        setDeleteError("");
    };

    const handleView = (request) => {
        setViewModal(request);
    };

    const handleEdit = (request) => {
        setEditFormData({
            appointment_date: request.appointment_date || '',
            appointment_time: request.appointment_time || '',
            state: request.state || 'pending',
            max_capacity: request.max_capacity || null
        });
        setEditModal(request);
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

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm || !deleteConfirm.requestIds || deleteConfirm.requestIds.length === 0) {
            setDeleteError("No requests to delete");
            return;
        }

        setDeleteLoading(true);
        setDeleteError("");

        try {
            await api.get("/sanctum/csrf-cookie");
            
            const deletePromises = deleteConfirm.requestIds.map(requestId => 
                api.delete(`/api/admin/dashboard/appointments/${requestId}`)
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
            setSelectedRequests(new Set());
            fetchDonorRequests();
        } catch (error) {
            console.error('Error deleting donor requests:', error);
            setDeleteError(error.response?.data?.message || error.message || "Failed to delete donor requests");
        } finally {
            setDeleteLoading(false);
        }
    };

    const allSelected = filteredRequests.length > 0 && filteredRequests.every(r => selectedRequests.has(r.id));
    const someSelected = Array.from(selectedRequests).some(id => filteredRequests.some(r => r.id === id));

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
            title: "Total Urgent Appointments",
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
            icon: <FaUsersIcon />,
            bgColor: "#F5E9FF",
            iconColor: "#6132BE"
        }
    ];

    if (loading) {
        return (
            <section className="home-visit-section">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                    <SpinnerDotted size={60} thickness={125} speed={100} color="#2349C2" />
                </div>
            </section>
        );
    }

    return (
        <section className="home-visit-section">
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <FiAlertCircle className="icon-size" />
                        <h2>Urgent Request Orders</h2>
                    </div>
                    <p>Manage and schedule all urgent donor appointment request orders</p>
                </div>
            </div>

            {error && (
                <div className="control-panel" style={{ marginBottom: '20px', backgroundColor: '#FDE8E8', border: '1px solid #E92C30' }}>
                    <p style={{ color: '#E92C30', margin: 0 }}>{error}</p>
                </div>
            )}

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

            {/* Search Bar, Filter, and Delete Button */}
            <div className="control-panel" style={{ padding: '20px' }}>

                {/* Delete Button and Assign Phlebotomist Button */}
                <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {selectedRequests.size > 0 && (
                        <button
                            type="button"
                            onClick={handleDeleteClick}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#E92C30',
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
                            <FiX />
                            Delete Selected ({selectedRequests.size})
                        </button>
                    )}
                    
                    {/* Assign Phlebotomist Button - appears when home appointments are selected */}
                    {selectedHomeAppointments.size > 0 && (
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
                    )}
                </div>

                {/* Filters Section */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end', marginTop: '15px' }}>
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

            {/* Calendar or Table View */}
            {viewMode === "calendar" ? (
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
                        placeholder="Search by appointment ID, donor name, email..."
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
                            <th style={{ width: '50px', textAlign: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={input => {
                                        if (input) input.indeterminate = someSelected && !allSelected;
                                    }}
                                    onChange={handleSelectAll}
                                    style={{ cursor: 'pointer' }}
                                />
                            </th>
                            <th className="col-order-id">Request ID</th>
                            <th className="col-donor">Donor</th>
                            <th className="col-date">Date & Time</th>
                            <th className="col-contact">Appointment Type</th>
                            <th className="col-availability">Status</th>
                            <th className="col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRequests.length > 0 ? (
                            filteredRequests.map((request) => {
                                const isExpanded = expandedRequests.has(request.id);
                                const donorName = `${request.donor?.user?.first_name || ''} ${request.donor?.user?.last_name || ''}`.trim() || 'Unknown Donor';
                                const donationType = request.donation_type || '';
                                const isHome = donationType.includes('Home');
                                const isHospital = donationType.includes('Hospital');
                                
                                return (
                                    <Fragment key={request.id}>
                                        <tr>
                                            <td style={{ textAlign: 'center', width: '50px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRequests.has(request.id)}
                                                    onChange={() => handleSelectRequest(request.id)}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            </td>
                                            <td className="col-order-id">
                                                <strong>{request.code || `REQ-${request.id}`}</strong>
                                            </td>
                                            <td className="col-donor">
                                                <div>
                                                    <div>{donorName}</div>
                                                    {request.donor?.user?.email && (
                                                        <small className="muted">{request.donor.user.email}</small>
                                                    )}
                                                    {request.donor?.bloodType && (
                                                        <div style={{ marginTop: '4px' }}>
                                                            <span style={{ color: '#F12C31', fontWeight: '500' }}>
                                                                {request.donor.bloodType.type}{request.donor.bloodType.rh_factor || ''}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="col-date">
                                                <div className="cell-date">
                                                    <span>{request.appointment_date || 'N/A'}</span>
                                                    {request.appointment_time && (
                                                        <small className="muted">{request.appointment_time}</small>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="col-contact !text-center">
                                                <span className={`badge ${isHome ? 'badge-blue' : isHospital ? 'urgent-badge' : 'badge-gray'}`}>
                                                    {isHome ? 'Home' : isHospital ? 'Hospital' : donationType}
                                                </span>
                                            </td>
                                            <td className="col-availability !text-center">
                                                <span className={`badge status-${request.state || 'pending'}`}>
                                                    {request.state || 'pending'}
                                                </span>
                                            </td>
                                            <td className="col-actions !text-center">
                                                <div className="row-actions">
                                                    <button 
                                                        className="icon-btn text-blue-600" 
                                                        title="View Details"
                                                        onClick={() => handleView(request)}
                                                    >
                                                        <FiEye />
                                                    </button>
                                                    <button 
                                                        className="icon-btn text-blue-800" 
                                                        title="Edit"
                                                        onClick={() => handleEdit(request)}
                                                    >
                                                        <FiEdit />
                                                    </button>
                                                    <button 
                                                        className="icon-btn text-blue-600" 
                                                        title="Expand/Collapse"
                                                        onClick={() => toggleExpand(request.id)}
                                                    >
                                                        <FiMessageSquare />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr key={`${request.id}-details`}>
                                                <td colSpan="7" style={{ padding: '20px', backgroundColor: '#f8f9fa' }}>
                                                    <div style={{ display: 'grid', gap: '15px' }}>
                                                        <div style={{
                                                            padding: '15px',
                                                            backgroundColor: 'white',
                                                            borderRadius: '8px',
                                                            border: '1px solid #e0e0e0'
                                                        }}>
                                                            <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>Request Details</h4>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                                                                <div>
                                                                    <strong>Donor Name:</strong> {donorName}
                                                                </div>
                                                                {request.donor?.user?.phone_nb && (
                                                                    <div>
                                                                        <strong>Phone:</strong> {request.donor.user.phone_nb}
                                                                    </div>
                                                                )}
                                                                {request.donor?.user?.email && (
                                                                    <div>
                                                                        <strong>Email:</strong> {request.donor.user.email}
                                                                    </div>
                                                                )}
                                                                {request.donor?.bloodType && (
                                                                    <div>
                                                                        <strong>Blood Type:</strong> 
                                                                        <span style={{ color: '#F12C31', marginLeft: '8px' }}>
                                                                            {request.donor.bloodType.type}{request.donor.bloodType.rh_factor || ''}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <strong>Appointment Date:</strong> {request.appointment_date || 'N/A'}
                                                                </div>
                                                                {request.appointment_time && (
                                                                    <div>
                                                                        <strong>Appointment Time:</strong> {request.appointment_time}
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <strong>Type:</strong> 
                                                                    <span className={`badge ${isHome ? 'badge-blue' : isHospital ? 'urgent-badge' : 'badge-gray'}`} style={{ marginLeft: '8px' }}>
                                                                        {isHome ? 'Home' : isHospital ? 'Hospital' : donationType}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <strong>Status:</strong> 
                                                                    <span className={`badge status-${request.state || 'pending'}`} style={{ marginLeft: '8px' }}>
                                                                        {request.state || 'pending'}
                                                                    </span>
                                                                </div>
                                                                {request.code && (
                                                                    <div>
                                                                        <strong>Request Code:</strong> {request.code}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="7" style={{ textAlign: "center", padding: "40px" }}>
                                    {searchTerm ? "No donor requests found matching your search" : "No donor requests at this time"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="modal-overlay modal-overlay-delete">
                    <div className="modal-container modal-container-delete">
                        <div className="modal-title">
                            <h2>Delete Donor Requests</h2>
                            <button onClick={handleDeleteCancel} disabled={deleteLoading}>
                                <IoClose />
                            </button>
                        </div>
                        <div className="modal-form">
                            <p>Are you sure you want to delete <strong>{deleteConfirm.count}</strong> donor request{deleteConfirm.count !== 1 ? 's' : ''}?</p>
                            <p className="modal-text-secondary">
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

            {/* View Modal */}
            {viewModal && (
                <div className="modal-overlay modal-overlay-delete" onClick={() => setViewModal(null)}>
                    <div className="modal-container modal-container-delete" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-title">
                            <h2>Urgent Request Details</h2>
                            <button onClick={() => setViewModal(null)}>
                                <IoClose />
                            </button>
                        </div>
                        <div className="modal-form">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                                <div>
                                    <strong>Request ID:</strong> {viewModal.code || `REQ-${viewModal.id}`}
                                </div>
                                {viewModal.bloodType && (
                                    <div>
                                        <strong>Blood Type Needed:</strong> 
                                        <span style={{ color: '#F12C31', marginLeft: '8px', fontWeight: '600' }}>
                                            {viewModal.bloodType}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <strong>Due Date:</strong> {viewModal.due_date || viewModal.appointment_date || 'N/A'}
                                </div>
                                {viewModal.due_time && (
                                    <div>
                                        <strong>Due Time:</strong> {viewModal.due_time}
                                    </div>
                                )}
                                {viewModal.timeRemaining && (
                                    <div>
                                        <strong>Time Remaining:</strong> 
                                        <span style={{ color: viewModal.urgency === 'critical' ? '#F12C31' : viewModal.urgency === 'high' ? '#FF9800' : '#16a34a', marginLeft: '8px', fontWeight: '600' }}>
                                            {viewModal.timeRemaining}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <strong>Appointment Type:</strong> 
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
                                {viewModal.registeredDonorCount !== undefined && (
                                    <div>
                                        <strong>Registered Donors:</strong> {viewModal.registeredDonorCount || 0}
                                    </div>
                                )}
                            </div>

                            {/* Registered Donors List */}
                            {viewModal.registeredDonors && viewModal.registeredDonors.length > 0 && (
                                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                    <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>Registered Donors ({viewModal.registeredDonors.length})</h4>
                                    <div style={{ display: 'grid', gap: '10px' }}>
                                        {viewModal.registeredDonors.map((donor, idx) => (
                                            <div key={idx} style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                                                    <div><strong>Name:</strong> {donor.name}</div>
                                                    {donor.phone && <div><strong>Phone:</strong> {donor.phone}</div>}
                                                    {donor.email && <div><strong>Email:</strong> {donor.email}</div>}
                                                    {donor.bloodType && (
                                                        <div>
                                                            <strong>Blood Type:</strong> 
                                                            <span style={{ color: '#F12C31', marginLeft: '5px' }}>{donor.bloodType}</span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <strong>Type:</strong> 
                                                        <span className={`badge ${donor.appointmentType === 'home' ? 'badge-blue' : 'urgent-badge'}`} style={{ marginLeft: '5px' }}>
                                                            {donor.appointmentType === 'home' ? 'Home' : 'Hospital'}
                                                        </span>
                                                    </div>
                                                    {donor.appointmentTime && <div><strong>Time:</strong> {donor.appointmentTime}</div>}
                                                    <div>
                                                        <strong>Status:</strong> 
                                                        <span className={`badge status-${donor.state || 'pending'}`} style={{ marginLeft: '5px' }}>
                                                            {donor.state || 'pending'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="form-actions form-actions-modal" style={{ marginTop: '20px' }}>
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
                            <h2>Edit Urgent Request</h2>
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
        </section>
    );
}
