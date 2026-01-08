import { useState, useEffect } from "react";
import { IoSearchSharp } from "react-icons/io5";
import { IoChevronDown } from "react-icons/io5";
import { FiEye } from "react-icons/fi";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import "../../styles/Dashboard.css";
import api from "../../api/axios";

export default function MyAppointments(){
    const [activeTab, setActiveTab] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("date-desc");
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await api.get("/api/donor/my-appointments");
                setAppointments(response.data.appointments || []);
            } catch (err) {
                console.error("Error fetching appointments:", err);
                setError(err.response?.data?.message || "Failed to load appointments");
                setAppointments([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, []);

    useEffect(() => {
        // Reset to first page when search or sort changes
        // (If you add pagination later)
    }, [searchTerm, sortBy]);

    // Filter appointments based on search term and active tab
    const filteredAppointments = appointments.filter((appointment) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (appointment.hospitalName && appointment.hospitalName.toLowerCase().includes(searchLower)) || 
                             (appointment.donationType && appointment.donationType.toLowerCase().includes(searchLower));
        
        // Filter by tab
        let matchesTab = true;
        if (activeTab !== "All") {
            matchesTab = (appointment.status && appointment.status.toLowerCase() === activeTab.toLowerCase());
        }
        
        return matchesSearch && matchesTab;
    });

    // Helper function to parse date strings like "Jan 25, 2025"
    const parseDate = (dateString) => {
        if (!dateString || dateString === 'N/A') return new Date(0);
        try {
            return new Date(dateString);
        } catch {
            return new Date(0);
        }
    };

    // Sort filtered appointments
    const sortedAppointments = [...filteredAppointments].sort((a, b) => {
        switch (sortBy) {
            case 'date-desc':
                // Sort by date (newest first)
                return parseDate(b.date) - parseDate(a.date);
            case 'date-asc':
                // Sort by date (oldest first)
                return parseDate(a.date) - parseDate(b.date);
            case 'type-asc':
                // Sort by donation type (A-Z)
                return (a.donationType || '').localeCompare(b.donationType || '');
            case 'type-desc':
                // Sort by donation type (Z-A)
                return (b.donationType || '').localeCompare(a.donationType || '');
            case 'hospital-asc':
                // Sort by hospital name (A-Z)
                return (a.hospitalName || '').localeCompare(b.hospitalName || '');
            case 'hospital-desc':
                // Sort by hospital name (Z-A)
                return (b.hospitalName || '').localeCompare(a.hospitalName || '');
            default:
                return 0;
        }
    });

    const getSortLabel = () => {
        switch (sortBy) {
            case 'date-desc':
                return 'Date (Newest)';
            case 'date-asc':
                return 'Date (Oldest)';
            case 'type-asc':
                return 'Type (A-Z)';
            case 'type-desc':
                return 'Type (Z-A)';
            case 'hospital-asc':
                return 'Hospital (A-Z)';
            case 'hospital-desc':
                return 'Hospital (Z-A)';
            default:
                return 'Sort By';
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showSortDropdown && !event.target.closest('.sort-dropdown-container')) {
                setShowSortDropdown(false);
            }
        };
        if (showSortDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSortDropdown]);

    // Handle view click
    const handleViewClick = (appointmentId) => {
        console.log('View appointment:', appointmentId);
        // Add view functionality here
    };

    // Handle edit click
    const handleEditClick = (appointmentId) => {
        console.log('Edit appointment:', appointmentId);
        // Add edit functionality here
    };

    // Handle delete click
    const handleDeleteClick = (appointmentId) => {
        console.log('Delete appointment:', appointmentId);
        // Add delete functionality here
    };

    if (loading) {
        return (
            <section className="donor-section">
                <div className="dashboard-title">
                    <h2 className="text-2xl font-bold">Appointments</h2>
                </div>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading appointments...</p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="donor-section">
                <div className="dashboard-title">
                    <h2 className="text-2xl font-bold">Appointments</h2>
                </div>
                <div className="flex items-center justify-center h-64">
                    <p className="text-red-500">Error: {error}</p>
                </div>
            </section>
        );
    }

    return (
        <section className="donor-section">
            <div className="dashboard-title">
                <div>
                    <h2 className="text-2xl font-bold">Appointments</h2>
                </div>
                <p className="text-gray-500 !text-lg">Total Appointments: {appointments.length}</p>
            </div>

            <div className="control-panel">
                <div className="control-panel-layout">
                    <div className="control-panel-layout-left">
                        <div className="search-input">
                            <IoSearchSharp />
                            <input 
                                type="search" 
                                placeholder="Search by hospital or type" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="filter-gap">
                        <div className="sort-dropdown-container">
                            <button 
                                className="filters sort-button"
                                onClick={() => setShowSortDropdown(!showSortDropdown)}
                            >
                                {getSortLabel()} <IoChevronDown />
                            </button>
                            {showSortDropdown && (
                                <div className="sort-dropdown">
                                    <button onClick={() => { setSortBy('date-desc'); setShowSortDropdown(false); }}>
                                        Date (Newest)
                                    </button>
                                    <button onClick={() => { setSortBy('date-asc'); setShowSortDropdown(false); }}>
                                        Date (Oldest)
                                    </button>
                                    <button onClick={() => { setSortBy('type-asc'); setShowSortDropdown(false); }}>
                                        Type (A-Z)
                                    </button>
                                    <button onClick={() => { setSortBy('type-desc'); setShowSortDropdown(false); }}>
                                        Type (Z-A)
                                    </button>
                                    <button onClick={() => { setSortBy('hospital-asc'); setShowSortDropdown(false); }}>
                                        Hospital (A-Z)
                                    </button>
                                    <button onClick={() => { setSortBy('hospital-desc'); setShowSortDropdown(false); }}>
                                        Hospital (Z-A)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="table-design">
                <table className="h1-table">
                    <thead>
                        <tr>
                            <th className="col-select"></th>
                            <th className="text-left col-donation-type">Donation Type</th>
                            <th className="text-left col-hospital">Hospital Name</th>
                            <th className="col-date">Date</th>
                            <th className="col-time">Time</th>
                            <th className="col-status">Status</th>
                            <th className="col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAppointments.length > 0 ? sortedAppointments.map((appointment) => (
                            <tr key={appointment.id}>
                                <td className="col-select">
                                    <input 
                                        className="ml-3" 
                                        type="checkbox" 
                                        aria-label={`select appointment ${appointment.id}`}
                                    />
                                </td>
                                <td className="col-donation-type text-left">{appointment.donationType}</td>
                                <td className="col-hospital text-left">{appointment.hospitalName}</td>
                                <td className="col-date">{appointment.date}</td>
                                <td className="col-time">{appointment.time}</td>
                                <td className="col-status">
                                    <span className={`status-badge status-${appointment.status?.toLowerCase() || 'pending'}`}>
                                        {appointment.status || 'Pending'}
                                    </span>
                                </td>
                                <td className="col-actions">
                                    <div className="row-actions">
                                        <button 
                                            className="icon-btn text-blue-800" 
                                            title="View Details"
                                            onClick={() => handleViewClick(appointment.id)}
                                        >
                                            <FiEye />
                                        </button>
                                        <button 
                                            className="icon-btn text-green-600" 
                                            title="Edit"
                                            onClick={() => handleEditClick(appointment.id)}
                                        >
                                            <FiEdit />
                                        </button>
                                        <button 
                                            className="icon-btn text-red-500" 
                                            title="Delete"
                                            onClick={() => handleDeleteClick(appointment.id)}
                                        >
                                            <RiDeleteBin6Line />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" className="text-center">No appointments found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    )
}
