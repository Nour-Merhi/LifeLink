import { useState, useEffect } from "react"
import { FaHospital } from "react-icons/fa";
import api from "../../api/axios";

import HospitalAppointmentTable from "./hospitalAppointmentComponents/HospitalAppointmentTable"
import HospitalAppTable from "./hospitalAppointmentComponents/HospitalAppTable"
import StatisticsCards from "./hospitalAppointmentComponents/StatisticsCards"
import HospitalRequestsPanel from "./hospitalAppointmentComponents/HospitalRequestsPanel"
import CriticalAppointments from "./hospitalAppointmentComponents/CriticalAppointments"
import ActivityLog from "./hospitalAppointmentComponents/ActivityLog"
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
            .finally(() => setLoading(false))
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

    // Handle request actions
    const handleApproveRequest = (request) => {
        console.log('Approving request:', request);
        // Placeholder - would call API
    };

    const handleRejectRequest = (request) => {
        console.log('Rejecting request:', request);
        // Placeholder - would call API
    };

    const handleViewDetails = (request) => {
        console.log('Viewing details:', request);
        // Placeholder - would open modal or navigate
    };

    // Handle filter changes
    const handleFilterChange = (filters) => {
        setActiveFilters(filters);
        // Filters are applied in the table component
    };

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

            <div className="scroll-btn"> 
                <div className="chose-page">
                    <div className={`sliding-indicator ${dashboard ? 'slide-left' : 'slide-right'}`}></div>
                    <button 
                        className={dashboard ? 'active-btn' : 'inactive-btn'}
                        onClick={handleDashboardClick}
                    >
                        Hospital Donation Control
                    </button>
                    <button 
                        className={appointmentManagement ? 'active-btn' : 'inactive-btn'}
                        onClick={handleAppointmentManagementClick}
                    >
                        Appointment Management
                    </button>
                </div>
                
                {appointmentManagement && 
                    <div className="add-btn">
                        <button type="button" onClick={() => setOpenModal(true)}>+ Add New Hospital Appointment</button>
                    </div>
                }
            </div>

            {dashboard && (
                <>
                    {/* Statistics Cards */}
                    <StatisticsCards statistics={statistics} />

                    {/* Two-column layout for requests and critical appointments */}
                    <div className="hospital-donation-layout">
                        <div className="hospital-donation-left">
                            {/* Hospital Donation Requests Panel */}
                            <HospitalRequestsPanel 
                                requests={appointmentData}
                                loading={loading}
                                onApprove={handleApproveRequest}
                                onReject={handleRejectRequest}
                                onViewDetails={handleViewDetails}
                            />
                        </div>
                        <div className="hospital-donation-right">
                            {/* Upcoming Critical Appointments */}
                            <CriticalAppointments appointments={appointmentData} />
                        </div>
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

                    {/* Activity / Audit Log */}
                    <ActivityLog activities={[]} />
                </>
            )}

            {appointmentManagement && (
                <HospitalAppTable 
                    appointments={hospitalAppointmentSlots} 
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
