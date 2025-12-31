import { useState, useEffect } from "react";
import { IoSearchSharp } from "react-icons/io5";
import { IoChevronDown } from "react-icons/io5";
import { FiEye } from "react-icons/fi";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import "../../styles/Dashboard.css";

export default function MyAppointments(){
    const [activeTab, setActiveTab] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("date-desc");
    const [showSortDropdown, setShowSortDropdown] = useState(false);

    // Sample data - replace with actual API data
    const appointments = [
        {
            id: 1,
            donationType: "Home Donation",
            hospitalName: "Al Harire Hospital",
            date: "Jan 25, 2025",
            time: "10:00 AM",
        },
        {
            id: 2,
            donationType: "Home Donation",
            hospitalName: "Al Rasool Al Azaam Hospital",
            date: "Jul 23, 2025",
            time: "12:30 PM",
        },
        {
            id: 3,
            donationType: "Hospital Donation",
            hospitalName: "Al Zahrani Hospital",
            date: "Aug 01, 2023",
            time: "3:00 PM",
        },
        {
            id: 4,
            donationType: "Live Organ Donation",
            hospitalName: "Saint Goarge Hospital",
            date: "Sep 01, 2023",
            time: "3:30 AM",
        },
        {
            id: 5,
            donationType: "Home Donation",
            hospitalName: "Saint Goarge Hospital",
            date: "Sep 01, 2023",
            time: "5:45 PM",
        },
        {
            id: 6,
            donationType: "Home Donation",
            hospitalName: "Saint Goarge Hospital",
            date: "Sep 01, 2023",
            time: "9:00 AM",
        },
        {
            id: 7,
            donationType: "Home Donation",
            hospitalName: "Saint Goarge Hospital",
            date: "Sep 01, 2023",
            time: "8:30 PM",
        },
        {
            id: 8,
            donationType: "Home Donation",
            hospitalName: "Saint Goarge Hospital",
            date: "Sep 01, 2023",
            time: "8:30 AM",
        }
    ];

    useEffect(() => {
        // Reset to first page when search or sort changes
        // (If you add pagination later)
    }, [searchTerm, sortBy]);

    // Filter appointments based on search term and active tab
    const filteredAppointments = appointments.filter((appointment) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = appointment.hospitalName.toLowerCase().includes(searchLower) || 
                             appointment.donationType.toLowerCase().includes(searchLower);
        
        // Filter by tab (if you add more tabs later)
        let matchesTab = true;
        if (activeTab !== "All") {
            matchesTab = appointment.status?.toLowerCase() === activeTab.toLowerCase();
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
                return a.donationType.localeCompare(b.donationType);
            case 'type-desc':
                // Sort by donation type (Z-A)
                return b.donationType.localeCompare(a.donationType);
            case 'hospital-asc':
                // Sort by hospital name (A-Z)
                return a.hospitalName.localeCompare(b.hospitalName);
            case 'hospital-desc':
                // Sort by hospital name (Z-A)
                return b.hospitalName.localeCompare(a.hospitalName);
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

    return (
        <section className="donor-section">
            <div className="dashboard-title">
                <div>
                    <h2 className="text-2xl font-bold">Upcoming Appointments</h2>
                </div>
                <p className="text-gray-500 !text-lg">Total Donations: {appointments.length}</p>
            </div>

            <div className="control-panel">
                <div className="control-panel-layout">
                    <div className="control-panel-layout-left">
                        <div className="search-input">
                            <IoSearchSharp />
                            <input 
                                type="search" 
                                placeholder="Search by hospital" 
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
                            <th className="col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAppointments.length > 0 ? sortedAppointments.map((appointment, index) => (
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
                                <td colSpan="6" className="text-center">No appointments found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    )
}
