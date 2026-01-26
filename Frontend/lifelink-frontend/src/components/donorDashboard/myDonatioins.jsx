import { useState, useEffect } from "react";
import { IoSearchSharp } from "react-icons/io5";
import { IoChevronDown } from "react-icons/io5";
import { IoHeart } from "react-icons/io5";
import { IoClose } from "react-icons/io5";
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

    // Rating modal state (home appointments only)
    const [ratingModalOpen, setRatingModalOpen] = useState(false);
    const [ratingTarget, setRatingTarget] = useState(null); // donation row
    const [ratingValue, setRatingValue] = useState(0);
    const [ratingComment, setRatingComment] = useState("");
    const [ratingSaving, setRatingSaving] = useState(false);
    const [ratingError, setRatingError] = useState("");

    const openRatingModal = (donationRow) => {
        setRatingTarget(donationRow);
        setRatingValue(donationRow?.rating?.rating || 0);
        setRatingComment(donationRow?.rating?.comment || "");
        setRatingError("");
        setRatingModalOpen(true);
    };

    const closeRatingModal = () => {
        setRatingModalOpen(false);
        setRatingTarget(null);
        setRatingValue(0);
        setRatingComment("");
        setRatingSaving(false);
        setRatingError("");
    };

    const renderStars = (value) => {
        const v = Number(value) || 0;
        return (
            <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                {Array.from({ length: 5 }, (_, i) => {
                    const filled = i < v;
                    return (
                        <span
                            key={i}
                            style={{
                                fontSize: '14px',
                                lineHeight: 1,
                                color: filled ? '#F5B301' : '#D1D5DB'
                            }}
                        >
                            ★
                        </span>
                    );
                })}
            </span>
        );
    };

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
                    <div className="icon-title">
                        <IoHeart />
                        <h2 className="text-2xl !font-bold">My Donations</h2>
                    </div>
                    <p className="text-gray-500 !text-lg">Manage your donations and stay informed</p>
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

            <div className="table-design overflow-x-auto">
                <table className="h1-table">
                    <thead>
                        <tr>
                            <th className="text-left col-donation-type">Donation Type</th>
                            <th className="text-left col-hospital">Hospital Name</th>
                            <th className="col-date">Date</th>
                            <th className="col-reward">Xp Earned</th>
                            <th className="col-status">Status</th>
                            <th className="col-actions">Rating</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedDonations.length > 0 ? sortedDonations.map((donation, index) => (
                            <tr key={donation.id}>
                                <td className="col-donation-type text-left">{donation.donationType}</td>
                                <td className="col-hospital text-left">{donation.hospitalName}</td>
                                <td className="col-date">{donation.date}</td>
                                <td className="col-reward">{donation.xpEarned}</td>
                                <td className="col-status">
                                    <span className={`status-badge ${getStatusClass(donation.status)}`}>
                                        {donation.status || 'N/A'}
                                    </span>
                                </td>
                                <td className="col-actions">
                                    {donation?.donationType === 'Home Donation' && donation?.canRate ? (
                                        donation?.rating?.rating ? (
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                {renderStars(donation.rating.rating)}
                                                <button
                                                    type="button"
                                                    onClick={() => openRatingModal(donation)}
                                                    style={{
                                                        padding: '6px 10px',
                                                        borderRadius: '8px',
                                                        border: '1px solid #e5e7eb',
                                                        background: '#fff',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => openRatingModal(donation)}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    background: '#3257CD',
                                                    color: '#fff',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Rate
                                            </button>
                                        )
                                    ) : (
                                        <span className="muted">—</span>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" className="text-center">No donations found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Rate Home Appointment Modal */}
            {ratingModalOpen && (
                <div className="modal-overlay" onClick={closeRatingModal}>
                    <div className="modal-container modal-modern" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-modern-header">
                            <div className="modal-modern-title">
                                <h2>Rate your Home Donation</h2>
                                <div className="modal-modern-subtitle">
                                    <span>Appointment ID: {ratingTarget?.id || 'N/A'}</span>
                                </div>
                            </div>
                            <button className="modal-icon-btn" onClick={closeRatingModal} aria-label="Close">
                                <IoClose />
                            </button>
                        </div>

                        <div className="modal-modern-body">
                            {ratingError && (
                                <div className="error-message modal-error-container">
                                    {ratingError}
                                </div>
                            )}

                            <div className="modal-section">
                                <h3 className="modal-section-title">Your Rating</h3>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    {Array.from({ length: 5 }, (_, i) => {
                                        const star = i + 1;
                                        const active = star <= ratingValue;
                                        return (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRatingValue(star)}
                                                style={{
                                                    border: 'none',
                                                    background: 'transparent',
                                                    cursor: 'pointer',
                                                    fontSize: '26px',
                                                    lineHeight: 1,
                                                    color: active ? '#F5B301' : '#D1D5DB'
                                                }}
                                                aria-label={`Rate ${star} star`}
                                            >
                                                ★
                                            </button>
                                        );
                                    })}
                                    <span className="muted">({ratingValue || 0}/5)</span>
                                </div>
                            </div>

                            <div className="modal-section">
                                <h3 className="modal-section-title">Comment (optional)</h3>
                                <textarea
                                    value={ratingComment}
                                    onChange={(e) => setRatingComment(e.target.value)}
                                    placeholder="Tell us about your experience..."
                                    style={{
                                        width: '100%',
                                        minHeight: '110px',
                                        padding: '10px 12px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '10px',
                                        outline: 'none',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>
                        </div>

                        <div className="modal-modern-footer">
                            <button type="button" className="btn-cancel" onClick={closeRatingModal} disabled={ratingSaving}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="submit-btn"
                                disabled={ratingSaving || !ratingTarget?.id || ratingValue < 1}
                                onClick={async () => {
                                    if (!ratingTarget?.id) return;
                                    if (ratingValue < 1) {
                                        setRatingError("Please select a rating (1 to 5 stars).");
                                        return;
                                    }
                                    setRatingSaving(true);
                                    setRatingError("");
                                    try {
                                        await api.get("/sanctum/csrf-cookie");
                                        const res = await api.put(
                                            `/api/donor/home-appointments/${ratingTarget.id}/rating`,
                                            { rating: ratingValue, comment: ratingComment || null }
                                        );

                                        const saved = res.data?.rating || null;
                                        setDonations((prev) =>
                                            (prev || []).map((d) => {
                                                if (String(d?.id) === String(ratingTarget.id)) {
                                                    return {
                                                        ...d,
                                                        rating: saved ? { rating: saved.rating, comment: saved.comment } : null,
                                                    };
                                                }
                                                return d;
                                            })
                                        );
                                        closeRatingModal();
                                    } catch (err) {
                                        console.error("Error saving rating:", err);
                                        setRatingError(err.response?.data?.message || err.response?.data?.error || err.message || "Failed to save rating");
                                    } finally {
                                        setRatingSaving(false);
                                    }
                                }}
                            >
                                {ratingSaving ? "Saving..." : "Save Rating"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}