import { useState, useEffect } from "react"
import { FaHospital, FaTint, FaClock, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import api from "../../api/axios";

import HospitalAppointmentTable from "./hospitalAppointmentComponents/HospitalAppointmentTable"
import HospitalAppTable from "./hospitalAppointmentComponents/HospitalAppTable"
import AddHospitalApp from "./hospitalAppointmentComponents/AddHospitalApp"

export default function HospitalAppointments(){
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [appointmentData, setAppointmentData] = useState([]);
    const [hospitalAppointmentSlots, setHospitalAppointmentSlots] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [dashboard, setDashboard] = useState(true);
    const [appointmentManagement, setAppointmentManagement] = useState(false);
    const [activeFilters, setActiveFilters] = useState({
        hospital: 'all-hospitals',
        donationType: 'all-types',
        status: 'all-states',
        dateRange: 'all-dates'
    });

    const fetchData = () => {
        setLoading(true);
        setError("");
        
        // Fetch hospitals
        api.get('/api/admin/dashboard/get-hospitals')
            .then((res) => {
                const hospitalsData = res.data.hospitals || res.data || [];
                setHospitals(Array.isArray(hospitalsData) ? hospitalsData : []);
            })
            .catch(err => {
                console.error('Error fetching hospitals:', err);
            });

        // Fetch hospital appointments
        api.get('/api/admin/dashboard/hospital-appointments')
            .then((res) => {
                const appointmentsData = res.data.appointments || res.data || [];
                setAppointmentData(Array.isArray(appointmentsData) ? appointmentsData : []);
            })
            .catch(err => {
                console.error('Error fetching hospital appointments:', err);
                setError(err.response?.data?.message || err.message || "An error occurred while fetching appointments")
            });

        // Fetch hospital visit appointments (slots)
        api.get('/api/admin/dashboard/hospital-visit-appointments')
            .then((res) => {
                const slotsData = res.data.appointments || res.data || [];
                setHospitalAppointmentSlots(Array.isArray(slotsData) ? slotsData : []);
            })
            .catch(err => {
                console.error('Error fetching hospital visit appointments:', err);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, [])

    // Calculate statistics from appointment data
    const calculateStatistics = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayString = today.toISOString().split('T')[0];
        
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        oneWeekAgo.setHours(0, 0, 0, 0);
        
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        oneMonthAgo.setHours(0, 0, 0, 0);

        const todayAppointments = appointmentData.filter(apt => {
            if (!apt.date) return false;
            const aptDate = new Date(apt.date);
            aptDate.setHours(0, 0, 0, 0);
            return aptDate.getTime() === today.getTime();
        });
        
        const weekAppointments = appointmentData.filter(apt => {
            if (!apt.date) return false;
            const aptDate = new Date(apt.date);
            aptDate.setHours(0, 0, 0, 0);
            return aptDate >= oneWeekAgo;
        });
        
        const monthAppointments = appointmentData.filter(apt => {
            if (!apt.date) return false;
            const aptDate = new Date(apt.date);
            aptDate.setHours(0, 0, 0, 0);
            return aptDate >= oneMonthAgo;
        });

        const pendingRequests = appointmentData.filter(apt => {
            const status = (apt.status || '').toLowerCase();
            return status === 'pending';
        }).length;
        
        const approvedDonations = appointmentData.filter(apt => {
            const status = (apt.status || '').toLowerCase();
            return status === 'approved' || status === 'completed';
        }).length;
        
        const cancelledAppointments = appointmentData.filter(apt => {
            const status = (apt.status || '').toLowerCase();
            return status === 'cancelled' || status === 'canceled';
        }).length;

        return {
            totalToday: todayAppointments.length,
            totalWeek: weekAppointments.length,
            totalMonth: monthAppointments.length,
            pendingRequests: pendingRequests,
            approvedDonations: approvedDonations,
            cancelledAppointments: cancelledAppointments,
            criticalShortages: 0 // Placeholder - would come from backend
        };
    };

    const statistics = calculateStatistics();
    const totalAppointments = appointmentData.length;

    // Metric cards (same design system as Phlebotomist.jsx)
    const metricsData = [
        {
            title: "Today's Donations",
            value: statistics.totalToday.toString(),
            change: "Scheduled for today",
            icon: <FaTint className="text-3xl" />,
            bgColor: "#EBEAFF",
            iconColor: "#285BFF",
        },
        {
            title: "Pending Requests",
            value: statistics.pendingRequests.toString(),
            change: "Awaiting approval",
            icon: <FaClock className="text-3xl" />,
            bgColor: "#FFF7D6",
            iconColor: "#B45309",
        },
        {
            title: "Approved Donations",
            value: statistics.approvedDonations.toString(),
            change: "Approved or completed",
            icon: <FaCheckCircle className="text-3xl" />,
            bgColor: "#EAFFE5",
            iconColor: "#16a34a",
        },
        {
            title: "Cancelled",
            value: statistics.cancelledAppointments.toString(),
            change: "Cancelled/canceled",
            icon: <FaTimesCircle className="text-3xl" />,
            bgColor: "#FFE5E5",
            iconColor: "#F12C31",
        },
    ];

    // Handle tab switching
    const handleDashboardClick = () => {
        setDashboard(true);
        setAppointmentManagement(false);
    };

    const handleAppointmentManagementClick = () => {
        setDashboard(false);
        setAppointmentManagement(true);
    };

    // Handle status update
    const handleStatusUpdate = (appointmentId, newStatus) => {
        // Placeholder - would call API to update status
        console.log('Updating status:', appointmentId, newStatus);
        // Update local state
        setAppointmentData(prev => prev.map(apt => 
            apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        ));
        // In real implementation, would call: axios.put(`/api/admin/dashboard/hospital-appointments/${appointmentId}`, { status: newStatus })
    };

    // Handle filter changes
    const handleFilterChange = (filterType, value) => {
        setActiveFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    // Handle clear filters
    const handleClearFilters = () => {
        setActiveFilters({
            hospital: 'all-hospitals',
            donationType: 'all-types',
            status: 'all-states',
            dateRange: 'all-dates'
        });
    };

    // Get unique hospitals from appointment data
    const uniqueHospitals = Array.from(new Set(appointmentData.map(apt => apt.hospital_name).filter(Boolean))).sort();

    const onClose = () => {
        setOpenModal(false);
    };

    return(
        <section className="home-visit-section">
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <FaHospital className="icon-size"/>
                        <h2>Hospital Donation Control</h2>
                    </div>
                    <p>Monitor, manage, and control donation activities linked to hospitals</p>
                </div>
                <div className="mb-2">
                    {dashboard && 
                        <h3>Total Appointments: {totalAppointments}</h3>
                    }
                    {appointmentManagement && 
                        <h3>Total Registered Hospitals: {hospitalAppointmentSlots.length}</h3>
                    }
                </div>
            </div>

            <div className="financial-tabs">
                <button
                    className={dashboard ? "tab-active-admin" : "tab-inactive"}
                    onClick={handleDashboardClick}
                >
                    Hospital Donation Control
                </button>
                <button
                    className={appointmentManagement ? "tab-active-admin" : "tab-inactive"}
                    onClick={handleAppointmentManagementClick}
                >
                    Appointment Management
                </button>
            {appointmentManagement && 
                <div className="add-btn" style={{ marginLeft: 'auto' }}>
                    <button type="button" onClick={() => setOpenModal(true)}>+ Add New Hospital Appointment</button>
                </div>
            }
            </div>


            {dashboard && (
                <>
                    {/* Metrics Grid (same design as Phlebotomist.jsx) */}
                    <div className="metrics-grid-4">
                        {metricsData.map((metric, index) => (
                            <div key={index} className="metric-card">
                                <div className="metric-content">
                                    <div className="metric-info">
                                        <p className="metric-title">{metric.title}</p>
                                        <h3 className="metric-value">{metric.value}</h3>
                                        <span className="metric-change">{metric.change}</span>
                                    </div>
                                    <div
                                        className="metric-icon"
                                        style={{ backgroundColor: metric.bgColor, color: metric.iconColor }}
                                    >
                                        {metric.icon}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Filters Section */}
                    <div className="control-panel" style={{ marginBottom: '20px', padding: '20px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end' }}>
                            {/* Hospital Filter */}
                            <div style={{ flex: '1', minWidth: '200px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                                    Hospital
                                </label>
                                <select
                                    value={activeFilters.hospital}
                                    onChange={(e) => handleFilterChange('hospital', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        backgroundColor: '#fff'
                                    }}
                                >
                                    <option value="all-hospitals">All Hospitals</option>
                                    {uniqueHospitals.map(hosp => (
                                        <option key={hosp} value={hosp}>{hosp}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Donation Type Filter */}
                            <div style={{ flex: '1', minWidth: '200px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                                    Donation Type
                                </label>
                                <select
                                    value={activeFilters.donationType}
                                    onChange={(e) => handleFilterChange('donationType', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        backgroundColor: '#fff'
                                    }}
                                >
                                    <option value="all-types">All Types</option>
                                    <option value="Hospital Blood Donation">Hospital Blood Donation</option>
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div style={{ flex: '1', minWidth: '200px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                                    Status
                                </label>
                                <select
                                    value={activeFilters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        backgroundColor: '#fff'
                                    }}
                                >
                                    <option value="all-states">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            {/* Clear Filters Button */}
                            <div>
                                <button
                                    onClick={handleClearFilters}
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
                        {(activeFilters.hospital !== 'all-hospitals' || activeFilters.donationType !== 'all-types' || activeFilters.status !== 'all-states') && (
                            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '6px', fontSize: '13px' }}>
                                <strong>Active Filters:</strong>
                                {activeFilters.hospital !== 'all-hospitals' && <span style={{ marginLeft: '10px', padding: '4px 8px', backgroundColor: '#fff', borderRadius: '4px' }}>Hospital: {activeFilters.hospital}</span>}
                                {activeFilters.donationType !== 'all-types' && <span style={{ marginLeft: '10px', padding: '4px 8px', backgroundColor: '#fff', borderRadius: '4px' }}>Type: {activeFilters.donationType}</span>}
                                {activeFilters.status !== 'all-states' && <span style={{ marginLeft: '10px', padding: '4px 8px', backgroundColor: '#fff', borderRadius: '4px' }}>Status: {activeFilters.status}</span>}
                            </div>
                        )}
                    </div>

                    {/* Table and Calendar View */}
                    <HospitalAppointmentTable 
                        appointments={appointmentData} 
                        loading={loading} 
                        error={error}
                        onAppointmentsUpdate={fetchData}
                        searchTerm={searchTerm}
                        filters={activeFilters}
                        onStatusUpdate={handleStatusUpdate}
                    />

                </>
            )}

            {appointmentManagement && (
                <HospitalAppTable 
                    hospitals={hospitals}
                    loading={loading} 
                    error={error}
                    onAppointmentsUpdate={fetchData}
                />
            )}

            {/* Add Hospital Appointment Modal */}
            {openModal && 
                <AddHospitalApp onClose={onClose} hospitals={hospitals} onAppointmentAdded={fetchData} />
            }
        </section>
    )
}
