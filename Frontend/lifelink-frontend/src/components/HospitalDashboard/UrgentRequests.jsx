import { useState, useEffect } from "react";
import { FiAlertCircle, FiSearch } from "react-icons/fi";
import { FiEye, FiEdit, FiUserPlus } from "react-icons/fi";
import { IoClose, IoEye } from "react-icons/io5";
import { FaCalendarAlt, FaCheckCircle, FaUsers as FaUsersIcon } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";
import api from "../../api/axios";
import { SpinnerDotted } from 'spinners-react';
import { useAuth } from "../../context/AuthContext";
import CalendarView from "../../components/adminDashboard/homeVisitComponents/CalendarView";
import AssignPhlebotomistModal from "../../components/adminDashboard/homeVisitComponents/AssignPhlebotomistModal";
import ConfirmDeleteDialog from "../common/ConfirmDeleteDialog";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function UrgentRequests() {
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState("table"); // "calendar" or "table"
    const [donorRequests, setDonorRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
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
        appointment_time: '',
        state: 'pending',
    });
    const [showDonorMap, setShowDonorMap] = useState(false);
    
    // Phlebotomist assignment states (only for home appointments)
    const [selectedHomeAppointments, setSelectedHomeAppointments] = useState(new Set());
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedAppointmentForAssign, setSelectedAppointmentForAssign] = useState(null);

    // Get hospital ID: mobile login returns user.hospital_id; session login returns healthCenterManager.hospital_id
    const hospitalId = user?.health_center_manager?.hospital_id ?? user?.healthCenterManager?.hospital_id ?? user?.hospital_id;

    useEffect(() => {
        if (user && hospitalId) {
            fetchDonorRequests();
        }
    }, [user, hospitalId, appointmentTypeFilters]);

    // Reset pagination when filters/search/view changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, appointmentTypeFilters, statusFilters, viewMode]);

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

    // Check if appointment is a home appointment
    const isHomeAppointment = (apt) => {
        return apt.donation_type && apt.donation_type.includes('Home');
    };

    const getDonorCoords = (apt) => {
        const latRaw =
            apt?.donor?.latitude ??
            apt?.donor?.lat ??
            apt?.donor_latitude ??
            apt?.latitude ??
            apt?.lat;
        const lngRaw =
            apt?.donor?.longitude ??
            apt?.donor?.lng ??
            apt?.donor_longitude ??
            apt?.longitude ??
            apt?.lng;

        const lat = latRaw !== undefined && latRaw !== null ? Number(latRaw) : NaN;
        const lng = lngRaw !== undefined && lngRaw !== null ? Number(lngRaw) : NaN;

        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            return { lat, lng };
        }
        return null;
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

    // Pagination (table view)
    const totalPages = Math.max(1, Math.ceil(filteredRequests.length / itemsPerPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedRequests = filteredRequests.slice(startIndex, endIndex);
    const startDisplay = filteredRequests.length === 0 ? 0 : startIndex + 1;
    const endDisplay = Math.min(endIndex, filteredRequests.length);

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
            appointment_time: request.appointment_time || '',
            state: request.state || 'pending',
        });
        setEditModal(request);
        setEditError("");
        setShowDonorMap(false);
    };

    const handleSaveEdit = async () => {
        if (!editModal) return;

        setEditLoading(true);
        setEditError("");

        try {
            await api.get("/sanctum/csrf-cookie");

            // Update booking record (home/hospital) for this hospital
            const response = await api.put(
                `/api/hospital/dashboard/appointments/bookings/${editModal.type}/${editModal.id}`,
                editFormData
            );
            
            if (response.data?.success) {
                setEditModal(null);
                fetchDonorRequests();
            }
        } catch (err) {
            console.error('Error updating appointment:', err);
            const detail = err.response?.data?.error_detail;
            const msg = err.response?.data?.message || err.message || "Failed to update appointment";
            setEditError(detail ? `${msg}: ${detail}` : msg);
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
                api.delete(`/api/hospital/dashboard/appointments/${requestId}`)
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
                            paginatedRequests.map((request) => {
                                const donorName = `${request.donor?.user?.first_name || ''} ${request.donor?.user?.last_name || ''}`.trim() || 'Unknown Donor';
                                const donationType = request.donation_type || '';
                                const isHome = donationType.includes('Home');
                                const isHospital = donationType.includes('Hospital');
                                
                                return (
                                    <tr key={request.id}>
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
                                                        className="icon-btn text-red-500" 
                                                        title="Delete"
                                                        onClick={() => {
                                                            setDeleteConfirm({ requestIds: [request.id], count: 1 });
                                                            setDeleteError("");
                                                        }}
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
                                <td colSpan="7" style={{ textAlign: "center", padding: "40px" }}>
                                    {searchTerm ? "No donor requests found matching your search" : "No donor requests at this time"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {filteredRequests.length > 0 && (
                    <div className="pagination">
                        <div className="showing">
                            <small className="muted">
                                Showing {startDisplay} to {endDisplay} of {filteredRequests.length} requests
                            </small>
                        </div>
                        <div className="pagination-controls">
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                disabled={safeCurrentPage === 1}
                                className="pagination-btn"
                            >
                                Previous
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`pagination-btn ${safeCurrentPage === pageNum ? 'active' : ''}`}
                                >
                                    {pageNum}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                disabled={safeCurrentPage === totalPages}
                                className="pagination-btn"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <ConfirmDeleteDialog
                    title="Delete Record"
                    description={`You are going to delete ${deleteConfirm.count === 1 ? "this request" : `${deleteConfirm.count} requests`}. Are you sure?`}
                    confirmText="Yes, Delete"
                    cancelText="No, Keep It"
                    loading={deleteLoading}
                    error={deleteError}
                    onClose={handleDeleteCancel}
                    onConfirm={handleDeleteConfirm}
                />
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
                <div className="modal-overlay" onClick={() => !editLoading && setEditModal(null)}>
                    <div
                        className="modal-container modal-modern"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        style={{ maxWidth: 560 }}
                    >
                        <div className="modal-modern-header">
                            <div className="modal-modern-title">
                                <h2>Edit Urgent Request</h2>
                                <div className="modal-modern-subtitle">
                                    <span className="muted">
                                        {`${editModal.donor?.user?.first_name || ''} ${editModal.donor?.user?.last_name || ''}`.trim() || 'Unknown Donor'}
                                        {editModal.donation_type ? ` • ${editModal.donation_type}` : ''}
                                        {editModal.appointment_date ? ` • ${editModal.appointment_date}` : ''}
                                    </span>
                                </div>
                            </div>
                            <button
                                className="modal-icon-btn"
                                onClick={() => !editLoading && setEditModal(null)}
                                aria-label="Close"
                                disabled={editLoading}
                            >
                                <IoClose />
                            </button>
                        </div>

                        <div className="modal-modern-body">
                            <div className="modal-note" style={{ marginBottom: 12 }}>
                                <strong>Request:</strong> {editModal.code || `REQ-${editModal.id}`}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                        Appointment Time
                                    </label>
                                    <input
                                        type="time"
                                        value={editFormData.appointment_time}
                                        onChange={(e) => setEditFormData({ ...editFormData, appointment_time: e.target.value })}
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
                                        onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
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

                                {isHomeAppointment(editModal) && (
                                    <div style={{ marginTop: 4 }}>
                                        <button
                                            type="button"
                                            className="btn-cancel"
                                            onClick={() => setShowDonorMap((prev) => !prev)}
                                            style={{ width: "100%" }}
                                        >
                                            {showDonorMap ? "Hide Donor Location Map" : "Show Donor Location Map"}
                                        </button>

                                        {showDonorMap ? (
                                            (() => {
                                                const coords = getDonorCoords(editModal);
                                                if (!coords) {
                                                    return (
                                                        <div className="modal-note" style={{ marginTop: 10 }}>
                                                            Donor coordinates are not available for this request.
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div style={{ marginTop: 10, height: 280, borderRadius: 12, overflow: "hidden" }}>
                                                        <MapContainer
                                                            center={[coords.lat, coords.lng]}
                                                            zoom={15}
                                                            style={{ height: "100%", width: "100%" }}
                                                            scrollWheelZoom={true}
                                                        >
                                                            <TileLayer
                                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                            />
                                                            <CircleMarker center={[coords.lat, coords.lng]} radius={10} pathOptions={{ color: "#F12C31" }}>
                                                                <Popup>
                                                                    {`${editModal.donor?.user?.first_name || ''} ${editModal.donor?.user?.last_name || ''}`.trim() ||
                                                                        "Donor"}{" "}
                                                                    location
                                                                </Popup>
                                                            </CircleMarker>
                                                        </MapContainer>
                                                    </div>
                                                );
                                            })()
                                        ) : null}
                                    </div>
                                )}
                            </div>

                            {editError && (
                                <div className="error-message modal-error-container" style={{ marginTop: '15px' }}>
                                    {editError}
                                </div>
                            )}
                        </div>

                        <div className="modal-modern-footer">
                            <button
                                type="button"
                                onClick={() => !editLoading && setEditModal(null)}
                                disabled={editLoading}
                                className="btn-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveEdit}
                                disabled={editLoading}
                                className="submit-btn"
                            >
                                {editLoading ? (
                                    <span style={{ display: "inline-flex", alignItems: "center" }}>
                                        <SpinnerDotted size={18} thickness={120} speed={100} color="#fff" className="spinner-inline" />
                                        Saving...
                                    </span>
                                ) : (
                                    "Save Changes"
                                )}
                            </button>
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
