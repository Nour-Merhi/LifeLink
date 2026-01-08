import { useState, useEffect } from "react";
import { IoSearchSharp } from "react-icons/io5";
import { IoChevronDown } from "react-icons/io5";
import "../../styles/Dashboard.css";
import api from "../../api/axios";

export default function MyDonations(){
    const [activeTab, setActiveTab] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("date-desc");
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDonations = async () => {
            try {
                setLoading(true);
                const response = await api.get("/api/donor/my-donations");
                setDonations(response.data.donations || []);
            } catch (err) {
                console.error("Error fetching donations:", err);
                setError(err.response?.data?.message || "Failed to load donations");
                setDonations([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDonations();
    }, []);

    // Filter donations based on search term and active tab
    const filteredDonations = donations.filter((donation) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = donation.hospitalName.toLowerCase().includes(searchLower) || 
                             donation.donationType.toLowerCase().includes(searchLower);
        
        // Filter by tab (if you add more tabs later)
        let matchesTab = true;
        if (activeTab !== "All") {
            matchesTab = donation.status.toLowerCase() === activeTab.toLowerCase();
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

    // Sort filtered donations
    const sortedDonations = [...filteredDonations].sort((a, b) => {
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
            case 'xp-desc':
                // Sort by XP (highest first) - extract number from string like "+150 xp"
                const xpA = parseInt(a.xpEarned.replace(/[^0-9-]/g, '')) || 0;
                const xpB = parseInt(b.xpEarned.replace(/[^0-9-]/g, '')) || 0;
                return xpB - xpA;
            case 'xp-asc':
                // Sort by XP (lowest first)
                const xpALow = parseInt(a.xpEarned.replace(/[^0-9-]/g, '')) || 0;
                const xpBLow = parseInt(b.xpEarned.replace(/[^0-9-]/g, '')) || 0;
                return xpALow - xpBLow;
            default:
                return 0;
        }
    });

    const getStatusClass = (status) => {
        if (!status) return '';
        switch(status.toLowerCase()) {
            case 'completed':
                return 'status-completed';
            case 'pending':
                return 'status-pending';
            case 'canceled':
            case 'cancelled':
                return 'status-canceled';
            default:
                return '';
        }
    };

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
            case 'xp-desc':
                return 'XP (Highest)';
            case 'xp-asc':
                return 'XP (Lowest)';
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

    if (loading) {
        return (
            <section className="donor-section">
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading donations...</p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="donor-section">
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
                    <h2 className="text-2xl font-bold">Donations</h2>
                </div>
                <p className="text-gray-500 !text-lg">Total Donations: {donations.length}</p>
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
                                    <button onClick={() => { setSortBy('xp-desc'); setShowSortDropdown(false); }}>
                                        XP (Highest)
                                    </button>
                                    <button onClick={() => { setSortBy('xp-asc'); setShowSortDropdown(false); }}>
                                        XP (Lowest)
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
                            <th className="col-reward">Xp Earned</th>
                            <th className="col-status">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedDonations.length > 0 ? sortedDonations.map((donation, index) => (
                            <tr key={donation.id}>
                                <td className="col-select">
                                    
                                        <input 
                                            className="ml-3" 
                                            type="checkbox" 
                                            aria-label={`select donation ${donation.id}`}
                                        />
                                    
                                </td>
                                <td className="col-donation-type text-left">{donation.donationType}</td>
                                <td className="col-hospital text-left">{donation.hospitalName}</td>
                                <td className="col-date">{donation.date}</td>
                                <td className="col-reward">{donation.xpEarned}</td>
                                <td className="col-status">
                                    <span className={`status-badge ${getStatusClass(donation.status)}`}>
                                        {donation.status || 'N/A'}
                                    </span>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="6" className="text-center">No donations found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    )
}