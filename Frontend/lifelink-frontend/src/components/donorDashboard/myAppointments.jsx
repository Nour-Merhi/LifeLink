import { useState, useEffect } from "react";
import { IoSearchSharp } from "react-icons/io5";
import { IoChevronDown } from "react-icons/io5";
import { FiEye } from "react-icons/fi";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoCalendar } from "react-icons/io5";
import "../../styles/Dashboard.css";
import api from "../../api/axios";

export default function MyAppointments(){
    const [activeTab, setActiveTab] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("date-desc");
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [appointments, setAppointments] = useState([]);
    const [organAppointments, setOrganAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [organChoiceByCode, setOrganChoiceByCode] = useState({});
    const [organSubmitLoading, setOrganSubmitLoading] = useState(false);
    const [organSubmitError, setOrganSubmitError] = useState("");
    const [organSubmitSuccess, setOrganSubmitSuccess] = useState("");

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await api.get("/api/donor/my-appointments");
                setAppointments(response.data.appointments || []);
                setOrganAppointments(response.data.organ_appointments || []);
            } catch (err) {
                console.error("Error fetching appointments:", err);
                setError(err.response?.data?.message || "Failed to load appointments");
                setAppointments([]);
                setOrganAppointments([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, []);

    useEffect(() => {
        // If deep-linked from email: /donor/my-appointments?focus=living&code=LO-XXXX
        const params = new URLSearchParams(window.location.search);
        if (params.get("focus") === "living") {
            const code = params.get("code");
            if (code) {
                // preselect first option if available
                const item = (organAppointments || []).find((x) => x.code === code);
                const first = item?.suggested_appointments?.[0];
                if (first) {
                    setOrganChoiceByCode((prev) => ({ ...prev, [code]: first }));
                }
            }
        }
    }, [organAppointments]);

    useEffect(() => {
        // Reset to first page when search or sort changes
        // (If you add pagination later)
    }, [searchTerm, sortBy]);

    // Filter appointments based on search term and active tab
    const filteredAppointments = appointments.filter((appointment) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (appointment.hospitalName && appointment.hospitalName.toLowerCase().includes(searchLower)) || 
                             (appointment.donationType && appointment.donationType.toLowerCase().includes(searchLower)) ||
                             (appointment.phlebotomist?.name && appointment.phlebotomist.name.toLowerCase().includes(searchLower));
        
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

    const submitOrganAppointmentChoice = async (code) => {
        const selected = organChoiceByCode[code];
        if (!selected) {
            setOrganSubmitError("Please select an appointment option first.");
            return;
        }
        setOrganSubmitLoading(true);
        setOrganSubmitError("");
        setOrganSubmitSuccess("");
        try {
            await api.post(`/api/donor/living-donors/${code}/choose-appointment`, {
                selected_appointment_at: selected,
            });
            setOrganSubmitSuccess("Your appointment choice has been submitted successfully.");
            // refresh
            const response = await api.get("/api/donor/my-appointments");
            setAppointments(response.data.appointments || []);
            setOrganAppointments(response.data.organ_appointments || []);
        } catch (e) {
            setOrganSubmitError(e.response?.data?.message || "Failed to submit appointment choice.");
        } finally {
            setOrganSubmitLoading(false);
        }
    };

    if (loading) {
        return (
            <section className="donor-section">
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading appointments...</p>
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
                        <IoCalendar />
                        <h2 className="text-2xl !font-bold">Pending Appointments</h2>
                    </div>
                    <p className="text-gray-500 !text-lg">Manage your upcoming appointments and stay informed</p>
                </div>
                <p className="text-gray-500 !text-lg">Total Appointments: {appointments.length}</p>
            </div>

            {/* Living Organ Donation appointment choices panel */}
            {organAppointments?.length > 0 && (
                <div className="control-panel" style={{ marginBottom: 14 }}>
                    <div className="control">
                        <div>
                            <h4>Living Organ Donation — Appointment Choices</h4>
                            <span className="text-sm text-gray-500">
                                If you received an email with appointment options, choose one here.
                            </span>
                        </div>
                    </div>

                    {organSubmitError && (
                        <div style={{ color: "#F12C31", marginTop: 10 }}>{organSubmitError}</div>
                    )}
                    {organSubmitSuccess && (
                        <div style={{ color: "#16a34a", marginTop: 10 }}>{organSubmitSuccess}</div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginTop: 12 }}>
                        {organAppointments.map((o) => {
                            const canChoose = o.appointment_status === "awaiting_donor_choice" && Array.isArray(o.suggested_appointments) && o.suggested_appointments.length > 0;
                            return (
                                <div key={o.code} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 10, padding: 14 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                                        <div>
                                            <div style={{ fontWeight: 800 }}>Pledge {o.code}</div>
                                            <div className="muted" style={{ fontSize: 13 }}>
                                                Organ: {o.organ || "N/A"} • Ethics: {o.ethics_status} • Medical: {o.medical_status}
                                            </div>
                                        </div>
                                        <div>
                                            <span className={`status-badge status-${(o.appointment_status || "pending").toLowerCase()}`}>
                                                {o.appointment_status || "N/A"}
                                            </span>
                                        </div>
                                    </div>

                                    {o.selected_appointment_at && (
                                        <div style={{ marginTop: 10, fontSize: 14 }}>
                                            <b>Selected:</b> {new Date(o.selected_appointment_at).toLocaleString()}
                                        </div>
                                    )}

                                    {canChoose ? (
                                        <div style={{ marginTop: 12 }}>
                                            <div style={{ fontWeight: 700, marginBottom: 8 }}>Choose an option:</div>
                                            <div style={{ display: "grid", gap: 8 }}>
                                                {o.suggested_appointments.map((slot) => (
                                                    <label key={slot} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                        <input
                                                            type="radio"
                                                            name={`slot-${o.code}`}
                                                            checked={organChoiceByCode[o.code] === slot}
                                                            onChange={() => setOrganChoiceByCode((prev) => ({ ...prev, [o.code]: slot }))}
                                                        />
                                                        <span>{slot}</span>
                                                    </label>
                                                ))}
                                            </div>

                                            <button
                                                className="btn-save"
                                                style={{ marginTop: 12, background: "linear-gradient(to right, #FF585D, #CA2529)" }}
                                                disabled={organSubmitLoading}
                                                onClick={() => submitOrganAppointmentChoice(o.code)}
                                            >
                                                {organSubmitLoading ? "Submitting..." : "Submit Appointment Choice"}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="muted" style={{ marginTop: 12, fontSize: 13 }}>
                                            {o.appointment_status === "awaiting_scheduling"
                                                ? "Your pledge is approved. Please wait for suggested appointment options."
                                                : o.appointment_status === "awaiting_approval"
                                                    ? "Your pledge is under review. Please wait for approval."
                                                    : "No appointment options available at the moment."}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

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
                            <th className="col-contact">Phlebotomist</th>
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
                                <td className="col-contact">
                                    {appointment.donationType === "Home Donation"
                                        ? (appointment.phlebotomist?.name || "Not assigned")
                                        : "—"}
                                </td>
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
                                <td colSpan="8" className="text-center">No appointments found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    )
}
