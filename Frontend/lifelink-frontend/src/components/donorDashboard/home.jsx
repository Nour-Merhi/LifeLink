import { useState, useEffect } from "react";
import { FaHeartCirclePlus } from "react-icons/fa6";
import { FaHandsHoldingCircle } from "react-icons/fa6";
import { FaHandHoldingHeart } from "react-icons/fa";
import { IoMdArrowForward } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function Home(){
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await api.get("/api/donor/dashboard");
                
                console.log("Dashboard API response:", response.data);
                
                if (response.data) {
                    setDashboardData(response.data);
                } else {
                    setError("No data received from server");
                }
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                console.error("Error response:", err.response?.data);
                
                let errorMessage = "Failed to load dashboard data";
                if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (err.response?.status === 401) {
                    errorMessage = "Please log in to view your dashboard";
                } else if (err.response?.status === 403) {
                    errorMessage = "You don't have permission to access this page";
                } else if (err.response?.status === 404) {
                    errorMessage = "Donor profile not found. Please complete your registration.";
                } else if (err.message) {
                    errorMessage = err.message;
                }
                
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 p-4">
                <p className="text-red-500 text-lg font-semibold mb-2">Error: {error}</p>
                <p className="text-gray-600 text-sm">
                    Please check your browser console for more details, or contact support if the issue persists.
                </p>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">No dashboard data available</p>
            </div>
        );
    }

    // Destructure with defaults to prevent errors
    const { 
        level_progress = { current_level: 1, current_xp: 0, xp_until_next_level: 1000, progress_percentage: 0 },
        progress_info = { donations_count: 0, lives_saved: 0, total_xp: 0 },
        upcoming_appointments = [],
        donation_history = []
    } = dashboardData;
    return (
        <>
        <div className="home-layout ">
            <div className="home-action div-1 donor-container p-5">
                <button onClick={() => navigate('/donation/home-blood-donation')}>
                    <FaHeartCirclePlus className="text-5xl text-red-600 mb-4"/>
                    <h2 className="text-2xl text-left font-bold">Schedule<br/>Blood Donation</h2>
                    <p className="text-gray-500 !text-sm !text-left">Register blood donation appointment</p>
                </button>
            </div>
            <div className="home-action div-2 donor-container p-5">
                <button onClick={() => navigate('/donation/alive-organ-donation')}>
                    <FaHandsHoldingCircle className="text-5xl text-green-600 mb-4"/>
                    <h2 className="text-2xl text-left font-bold">Register<br/>Organ Donation</h2>
                    <p className="text-gray-500 !text-sm !text-left">Pledge to save lives</p>
                </button>
            </div>
            <div className="home-action div-3 donor-container p-5">
                <button onClick={() => navigate('/donation/financial-support')}>
                    <FaHandHoldingHeart className="text-5xl text-purple-600 mb-4"/>
                    <h2 className="text-2xl text-left font-bold">Provide<br/>Financial Support</h2>
                    <p className="text-gray-500 !text-sm !text-left">Contribute to patient care</p>
                </button>
            </div>

            <div className="level-progress div-4 donor-container p-5">
                <div className="level-progress-header">
                    <div className="level-progress-title-section">
                        <h2 className="level-progress-title">Level {level_progress.current_level} Progress</h2>
                        <p className="level-progress-subtitle">{level_progress.xp_until_next_level} Xp until level {level_progress.current_level + 1}</p>
                    </div>
                    <div className="level-progress-xp-section">
                        <p className="level-progress-xp-value">{level_progress.current_xp}</p>
                        <p className="level-progress-xp-label">Total XP</p>
                    </div>
                </div>
                <div className="level-progress-bar">
                    <div className="level-progress-bar-fill" style={{ width: `${level_progress.progress_percentage}%` }}></div>
                </div>
            </div>
            <div className="level-progress-info div-5 donor-container p-5">
                <h2 className="text-xl font-bold mb-4">Progress</h2>
                <div className="progress-details">
                    <div className="progress-metric">
                        <p className="progress-label">You have donated</p>
                        <p className="progress-value">{progress_info.donations_count} times</p>
                    </div>
                    <div className="progress-metric">
                        <p className="progress-label">You've saved</p>
                        <p className="progress-value">{progress_info.lives_saved} lives</p>
                    </div>
                    <div className="progress-metric">
                        <p className="progress-label">Total XP earned</p>
                        <p className="progress-value">{progress_info.total_xp} xp</p>
                    </div>
                </div>
            </div>

            <div className="upcoming-appointments div-6">
                <h2 className="text-xl font-bold mb-3 pl-2">Upcoming Appointments</h2>
                <div className="donor-container table-design ">
                    <table className="h1-table p-2">
                        <thead>
                            <tr>
                                <th className="col-hospital text-left">Hospital</th>
                                <th className="col-date">Date</th>
                                <th className="col-time">Time</th>
                                <th className="col-actions"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {upcoming_appointments && upcoming_appointments.length > 0 ? (
                                upcoming_appointments.map((appt, index) => (
                                    <tr key={index}>
                                        <td className="col-hospital">{appt.hospital}</td>
                                        <td className="col-date">{appt.date}</td>
                                        <td className="col-time">{appt.time}</td>
                                <td className="col-actions">
                                    <IoMdArrowForward className="cursor-pointer" />
                                </td>
                            </tr>
                                ))
                            ) : (
                            <tr>
                                    <td colSpan="4" className="text-center text-gray-500">No upcoming appointments</td>
                            </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="donation-history div-7">
                <h2 className="text-xl font-bold mb-3 pl-2">Donation History</h2>
                <div className="donor-container table-design">
                    <table className="h1-table p-2">
                        <thead>
                            <tr>
                                <th className="col-donation-type text-left">Donation Type</th>
                                <th className="col-status">Status</th>
                                <th className="col-date">Date</th>
                                <th className="col-reward">Reward</th>
                            </tr>
                        </thead>
                        <tbody>
                            {donation_history && donation_history.length > 0 ? (
                                donation_history.slice(0, 4).map((donation, index) => (
                                    <tr key={index}>
                                        <td className="col-donation-type">{donation.donation_type}</td>
                                <td className="col-status">
                                            <span style={{ color: donation.status_color || '#666666' }}>{donation.status}</span>
                                </td>
                                        <td className="col-date">{donation.date}</td>
                                        <td className="col-reward">{donation.reward}</td>
                            </tr>
                                ))
                            ) : (
                            <tr>
                                    <td colSpan="4" className="text-center text-gray-500">No donation history</td>
                            </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        </>
    )
}