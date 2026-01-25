import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
    IoPerson, 
    IoMailOutline, 
    IoCallOutline, 
    IoLocationOutline,
    IoTimeOutline,
    IoChatbubbleOutline,
    IoArrowBack
} from "react-icons/io5";
import { FaGamepad, FaTrophy, FaChartLine } from "react-icons/fa";
import { AiFillThunderbolt } from "react-icons/ai";
import { IoMdCheckmark } from "react-icons/io";
import { RiLock2Fill } from "react-icons/ri";
import { SpinnerDotted } from 'spinners-react';
import api from "../../../api/axios";

export default function DonorDetail() {
    const { donorCode } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("activity");
    const [donorData, setDonorData] = useState(null);
    const [gamingData, setGamingData] = useState(null);
    const [gamingLoading, setGamingLoading] = useState(false);
    const [gamingError, setGamingError] = useState("");
    const [rewardsData, setRewardsData] = useState(null);
    const [rewardsLoading, setRewardsLoading] = useState(false);
    const [rewardsError, setRewardsError] = useState("");

    useEffect(() => {
        fetchDonorDetails();
    }, [donorCode]);

    const fetchDonorDetails = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await api.get(
                `/api/admin/dashboard/donors/${donorCode}`
            );
            setDonorData(response.data);
        } catch (err) {
            console.error('Error fetching donor details:', err);
            setError(err.response?.data?.message || "Failed to fetch donor details");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        } catch {
            return dateString;
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'badge-success';
            case 'pending':
                return 'badge-pending';
            case 'canceled':
            case 'cancelled':
                return 'badge-danger';
            default:
                return 'badge-pending';
        }
    };

    const formatGameType = (gameType) => {
        const names = {
            'tictactoe': 'Tic Tac Toe',
            'hangman': 'Hangman',
            'memory': 'Memory Game'
        };
        const s = String(gameType || '').toLowerCase();
        return names[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : 'N/A');
    };

    const fetchGamingDetails = async () => {
        if (!donorCode) return;
        setGamingLoading(true);
        setGamingError("");
        try {
            const res = await api.get(`/api/admin/dashboard/donors/${donorCode}/quiz-history`);
            setGamingData(res.data || null);
        } catch (err) {
            setGamingError(err.response?.data?.message || "Failed to fetch gaming details");
            setGamingData(null);
        } finally {
            setGamingLoading(false);
        }
    };

    const fetchRewardsSummary = async () => {
        if (!donorCode) return;
        setRewardsLoading(true);
        setRewardsError("");
        try {
            const res = await api.get(`/api/admin/dashboard/donors/${donorCode}/rewards`);
            setRewardsData(res.data || null);
        } catch (err) {
            setRewardsError(err.response?.data?.message || "Failed to fetch rewards");
            setRewardsData(null);
        } finally {
            setRewardsLoading(false);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === "gaming" && !gamingData && !gamingLoading) {
            fetchGamingDetails();
        }
        if (tab === "rewards" && !rewardsData && !rewardsLoading) {
            fetchRewardsSummary();
        }
    };

    if (loading) {
        return (
            <div className="loader">
                <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />
                <h3>Loading Donor Details...</h3>
            </div>
        );
    }

    if (error || !donorData) {
        return (
            <div className="error-container">
                <p>Error: {error || "Donor not found"}</p>
                <button onClick={() => navigate('/admin/donors')} className="btn-cancel">
                    Back to Donor List
                </button>
            </div>
        );
    }

    const { donor, contact, organ_pledges, appointments, medical_conditions } = donorData;

    return (
        <section className="donor-detail-section">
            {/* Back Button */}
            <div className="donor-detail-back">
                <button onClick={() => navigate('/admin/donors')} className="back-link">
                    <IoArrowBack />
                    <span>Back to Donor List</span>
                </button>
            </div>

            {/* Donor Profile Card */}
            <div className="donor-profile-card">
                <div className="donor-profile-header">
                    <div className="donor-profile-info">
                        <div className="donor-avatar">
                            <IoPerson />
                        </div>
                        <div className="donor-basic-info">
                            <h2 className="donor-name">{donor.name}</h2>
                            <div className="donor-stats">
                                <span>Age {donor.age}</span>
                                <span>Blood Type: {donor.blood_type}</span>
                                <span>Total Donations: {donor.total_donations}</span>
                                <span>Last Donation: {formatDate(donor.last_donation) || 'Never'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="donor-actions">
                        <button className="btn-suspend">Suspend</button>
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            <div className="donor-info-cards">
                {/* Contact Information */}
                <div className="info-card">
                    <h3 className="info-card-title">Contact Information</h3>
                    <div className="info-card-content">
                        <div className="info-item">
                            <IoCallOutline className="info-icon" />
                            <span>{contact.phone}</span>
                        </div>
                        <div className="info-item">
                            <IoMailOutline className="info-icon" />
                            <span>{contact.email}</span>
                        </div>
                        <div className="info-item">
                            <IoLocationOutline className="info-icon" />
                            <span>{contact.address}</span>
                        </div>
                    </div>
                </div>

                {/* Organ Pledge Status */}
                <div className="info-card">
                    <h3 className="info-card-title">Organ Pledge Status</h3>
                    <div className="info-card-content">
                        <div className="info-item">
                            <span className="info-label">Living Donation:</span>
                            <span className={organ_pledges.living_donation === 'Yes' ? 'text-success' : 'text-danger'}>
                                {organ_pledges.living_donation}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">After Death:</span>
                            <span className={organ_pledges.after_death === 'Yes' ? 'text-success' : 'text-danger'}>
                                {organ_pledges.after_death}
                            </span>
                        </div>
                        {organ_pledges.pledged_organs && organ_pledges.pledged_organs.length > 0 && (
                            <div className="info-item">
                                <span className="info-label">Pledged Organs:</span>
                                <div className="organ-badges">
                                    {organ_pledges.pledged_organs.map((organ, idx) => (
                                        <span key={idx} className="badge badge-success">
                                            {organ}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Registration Details */}
                <div className="info-card">
                    <h3 className="info-card-title">Registration Details</h3>
                    <div className="info-card-content">
                        <div className="info-item">
                            <span className="info-label">Registration Date:</span>
                            <span>{donor.registration_date}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Verification Status:</span>
                            <span className="text-success">{donor.verification_status}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Account Status:</span>
                            <span className={`badge ${donor.account_status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                                {donor.account_status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="donor-detail-tabs">
                <button 
                    className={`tab-button ${activeTab === 'activity' ? 'active' : ''}`}
                    onClick={() => handleTabChange('activity')}
                >
                    <IoTimeOutline />
                    <span>Activity & Donations</span>
                </button>
                <button 
                    className={`tab-button ${activeTab === 'rewards' ? 'active' : ''}`}
                    onClick={() => handleTabChange('rewards')}
                >
                    <FaTrophy />
                    <span>Level & Rewards</span>
                </button>
                <button 
                    className={`tab-button ${activeTab === 'gaming' ? 'active' : ''}`}
                    onClick={() => handleTabChange('gaming')}
                >
                    <FaGamepad />
                    <span>Gaming Details</span>
                </button>
            </div>

            {/* Tab Content */}
            <div className="donor-tab-content">
                {activeTab === 'activity' && (
                    <div className="activity-list">
                        {appointments && appointments.length > 0 ? (
                            appointments.map((appt, idx) => (
                                <div key={idx} className="activity-item">
                                    <div className="activity-header">
                                        <div className="activity-date">{formatDate(appt.date)}</div>
                                        <span className={`badge ${getStatusBadgeClass(appt.status)}`}>
                                            {appt.status?.charAt(0).toUpperCase() + appt.status?.slice(1)}
                                        </span>
                                    </div>
                                    <div className="activity-details">
                                        <div className="activity-detail-item">
                                            <strong>Hospital:</strong> {appt.hospital}
                                        </div>
                                        <div className="activity-detail-item">
                                            <strong>Donation Type:</strong> {appt.type}
                                        </div>
                                        {appt.time && (
                                            <div className="activity-detail-item">
                                                <strong>Time:</strong> {appt.time}
                                            </div>
                                        )}
                                        <div className="activity-detail-item">
                                            <strong>Notes:</strong> {appt.notes}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-activity">
                                <p>No donation history available</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'rewards' && (
                    <div >
                        {rewardsLoading ? (
                            <div className="flex items-center justify-center h-40">
                                <p className="text-gray-500">Loading rewards...</p>
                            </div>
                        ) : rewardsError ? (
                            <div className="text-red-500">{rewardsError}</div>
                        ) : !rewardsData ? (
                            <div className="muted">No rewards data available</div>
                        ) : (
                            (() => {
                                const levelProgress = rewardsData.level_progress || {};
                                const certificates = Array.isArray(rewardsData.certificates) ? rewardsData.certificates : [];
                                const unlockedCount = certificates.filter((c) => c.unlocked).length;

                                return (
                                    <>
                                        <div className="dashboard-title" style={{ marginBottom: "12px" }}>
                                            <div className="icon-title">
                                                <FaTrophy />
                                                <h2 className="!text-xl !font-bold">Level & Rewards Summary</h2>
                                            </div>
                                            <p className="text-gray-500 !text-sm">Quick summary of this donor's current progress</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                                            <div className="p-4 rounded-xl bg-white border border-gray-500">
                                                <div className="text-sm text-gray-500">Current Level</div>
                                                <div className="text-2xl font-bold text-purple-600">Level {levelProgress.current_level ?? "N/A"}</div>
                                            </div>
                                            <div className="p-4 rounded-xl bg-white border border-gray-500">
                                                <div className="text-sm text-gray-500">Total XP</div>
                                                <div className="text-2xl font-bold text-blue-600">{levelProgress.current_xp ?? "N/A"}</div>
                                            </div>
                                            <div className="p-4 rounded-xl bg-white border border-gray-500">
                                                <div className="text-sm text-gray-500">Unlocked Certificates</div>
                                                <div className="text-2xl font-bold text-green-600">{unlockedCount}</div>
                                            </div>
                                        </div>

                                        <div className="mt-4 p-4 rounded-xl bg-white border border-gray-500">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <div className="text-sm text-gray-600">
                                                    XP until next level:{" "}
                                                    <span className="font-semibold">{levelProgress.xp_until_next_level ?? "N/A"}</span>
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    Next level:{" "}
                                                    <span className="font-semibold">Level {levelProgress.next_level ?? "N/A"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()
                        )}
                    </div>
                )}

                {activeTab === 'gaming' && (
                    <div >
                        {gamingLoading ? (
                            <div className="flex items-center justify-center h-40">
                                <p className="text-gray-500">Loading gaming details...</p>
                            </div>
                        ) : gamingError ? (
                            <div className="text-red-500">{gamingError}</div>
                        ) : !gamingData ? (
                            <div className="muted">No gaming data available</div>
                        ) : (
                            (() => {
                                const {
                                    current_level: donor_xp_level,
                                    completed_levels = [],
                                    total_xp = 0,
                                    session_logs = [],
                                    minigame_stats = {},
                                    minigame_logs = []
                                } = gamingData;

                                const totalLevels = 10;
                                const completedQuizLevels = Array.isArray(completed_levels) ? completed_levels : [];
                                const quizMaxCompleted = completedQuizLevels.length ? Math.max(...completedQuizLevels) : 0;
                                const quizCurrentLevel = Math.min(totalLevels, Math.max(1, quizMaxCompleted + 1));
                                const quizProgressPercentage = Math.min(
                                  100,
                                  Math.max(0, (completedQuizLevels.length / totalLevels) * 100)
                                );

                                return (
                                    <>
                                        <div className="dashboard-title" style={{ marginBottom: 12 }}>
                                            <div className="icon-title">
                                                <FaGamepad />
                                                <h2 className="!text-xl !font-bold">Gaming Details</h2>
                                            </div>
                                            <p className="text-gray-500 !text-sm">Quiz progress, minigame stats, and history</p>
                                        </div>

                                        {/* Current Level & Progress */}
                                        <div className="p-4 rounded-xl bg-white border border-gray-500 mb-4">
                                            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                                <div>
                                                     <h2 className="text-xl font-bold text-gray-800">Quiz Level {quizCurrentLevel}</h2>
                                                     <p className="text-gray-600 !text-sm">Current Quiz Level (1–10)</p>
                                                </div>
                                                <div className="text-right">
                                                     <div className="text-2xl font-bold text-purple-600">{completedQuizLevels.length}/{totalLevels}</div>
                                                     <div className="text-sm text-gray-600 !text-sm">Quiz levels completed</div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                                    <span>Quiz completion</span>
                                                    <span>{quizProgressPercentage.toFixed(1)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-3">
                                                    <div
                                                        className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                                                          style={{ width: `${quizProgressPercentage}%` }}
                                                    ></div>
                                                </div>
                                                 <p className="text-sm text-gray-500 mt-2 !text-sm">
                                                   Donor XP: <span className="font-semibold">{total_xp}</span> • Donor Level:{" "}
                                                   <span className="font-semibold">Level {donor_xp_level ?? "N/A"}</span>
                                                 </p>
                                            </div>
                                        </div>

                                        {/* Levels Overview */}
                                        <div className="p-4 rounded-xl bg-white border border-gray-500 mb-4">
                                            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                                <FaTrophy className="text-yellow-500" />
                                                Completed Levels
                                            </h3>
                                            <div className="grid grid-cols-5 gap-3">
                                                {Array.from({ length: totalLevels }, (_, i) => {
                                                    const level = i + 1;
                                                    const isCompleted = completedQuizLevels.includes(level);
                                                    const isCurrent = level === quizCurrentLevel;
                                                    return (
                                                        <div
                                                            key={level}
                                                            className={`p-3 rounded-lg border-2 text-center ${
                                                                isCompleted
                                                                    ? 'bg-green-50 border-green-500'
                                                                    : isCurrent
                                                                    ? 'bg-purple-50 border-purple-500'
                                                                    : 'bg-gray-50 border-gray-300'
                                                            }`}
                                                        >
                                                            <div className="text-xl mb-1">
                                                                {isCompleted ? (
                                                                    <IoMdCheckmark className="text-green-600 mx-auto" />
                                                                ) : (
                                                                    <RiLock2Fill className="text-gray-400 mx-auto" />
                                                                )}
                                                            </div>
                                                            <div className={`font-bold ${isCompleted ? 'text-green-700' : isCurrent ? 'text-purple-700' : 'text-gray-500'}`}>
                                                                L{level}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Minigame Statistics */}
                                        <div className="p-4 rounded-xl bg-white border border-gray-500 mb-4">
                                            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                                <AiFillThunderbolt className="text-purple-500" />
                                                Minigame Statistics
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                {Object.entries(minigame_stats || {}).map(([gameType, stats]) => (
                                                    <div
                                                        key={gameType}
                                                        className={`p-3 rounded-lg border ${
                                                            stats?.unlocked ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200 opacity-70'
                                                        }`}
                                                    >
                                                        <div className="font-bold text-gray-800 mb-2">{formatGameType(gameType)}</div>
                                                        <div className="text-sm text-gray-700 space-y-1">
                                                            <div className="flex justify-between"><span>Plays</span><span className="font-semibold">{stats?.total_plays ?? 0}</span></div>
                                                            <div className="flex justify-between"><span>Wins</span><span className="font-semibold text-green-600">{stats?.wins ?? 0}</span></div>
                                                            <div className="flex justify-between"><span>Losses</span><span className="font-semibold text-red-600">{stats?.losses ?? 0}</span></div>
                                                            <div className="flex justify-between"><span>Win Rate</span><span className="font-semibold">{stats?.win_rate ?? 0}%</span></div>
                                                            <div className="flex justify-between border-t pt-1 mt-1"><span>Total XP</span><span className="font-semibold text-blue-600">+{stats?.total_xp ?? 0}</span></div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {Object.keys(minigame_stats || {}).length === 0 && (
                                                    <div className="muted">No minigame stats available</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Session Logs */}
                                        <div className="p-4 rounded-xl bg-white border border-gray-500 mb-4">
                                            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                                <FaChartLine className="text-blue-500" />
                                                Quiz History
                                            </h3>
                                            {Array.isArray(session_logs) && session_logs.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr className="border-b-2 border-gray-200">
                                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Level</th>
                                                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Correct</th>
                                                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Wrong</th>
                                                                <th className="text-right py-3 px-4 font-semibold text-gray-700">XP Earned</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {session_logs.map((log, index) => (
                                                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                                    <td className="py-3 px-4 text-gray-700">
                                                                        {new Date(log.created_at || log.date).toLocaleDateString('en-US', {
                                                                            year: 'numeric',
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                        })}
                                                                    </td>
                                                                    <td className="py-3 px-4">
                                                                        <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
                                                                            Level {log.level}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-3 px-4 text-center">
                                                                        <span className="text-green-600 font-semibold">{log.correct_answers ?? 0}</span>
                                                                    </td>
                                                                    <td className="py-3 px-4 text-center">
                                                                        <span className="text-red-600 font-semibold">{log.wrong_answers ?? 0}</span>
                                                                    </td>
                                                                    <td className="py-3 px-4 text-right">
                                                                        <span className="text-blue-600 font-semibold">+{log.total_xp ?? 0} XP</span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    <p className="!text-lg">No quiz history yet.</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Minigame Logs */}
                                        {Array.isArray(minigame_logs) && minigame_logs.length > 0 && (
                                            <div className="p-4 rounded-xl bg-white border border-gray-500 ">
                                                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                                    <AiFillThunderbolt className="text-purple-500" />
                                                    Minigame History
                                                </h3>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr className="border-b-2 border-gray-200">
                                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Game</th>
                                                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Plays</th>
                                                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Wins</th>
                                                                <th className="text-right py-3 px-4 font-semibold text-gray-700">XP Earned</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {minigame_logs.map((log, index) => (
                                                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                                    <td className="py-3 px-4 text-gray-700">
                                                                        {new Date(log.created_at || log.date).toLocaleDateString('en-US', {
                                                                            year: 'numeric',
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                        })}
                                                                    </td>
                                                                    <td className="py-3 px-4">
                                                                        <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
                                                                            {formatGameType(log.game_type)}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-3 px-4 text-center">
                                                                        <span className="text-gray-700 font-semibold">{log.plays ?? 0}</span>
                                                                    </td>
                                                                    <td className="py-3 px-4 text-center">
                                                                        <span className="text-green-600 font-semibold">{log.wins ?? 0}</span>
                                                                    </td>
                                                                    <td className="py-3 px-4 text-right">
                                                                        <span className="text-blue-600 font-semibold">+{log.xp_earned ?? 0} XP</span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                );
                            })()
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}

