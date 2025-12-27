import { FaTint, FaClock, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from "react-icons/fa";

export default function StatisticsCards({ statistics = {} }) {
    // Default statistics if not provided
    const stats = {
        totalToday: statistics.totalToday || 0,
        totalWeek: statistics.totalWeek || 0,
        totalMonth: statistics.totalMonth || 0,
        pendingRequests: statistics.pendingRequests || 0,
        approvedDonations: statistics.approvedDonations || 0,
        cancelledAppointments: statistics.cancelledAppointments || 0,
        criticalShortages: statistics.criticalShortages || 0
    };

    const statCards = [
        {
            title: "Today's Donations",
            value: stats.totalToday,
            icon: <FaTint className="stat-icon" />,
            color: "stat-card-blue",
        },
        {
            title: "Pending Requests",
            value: stats.pendingRequests,
            icon: <FaClock className="stat-icon" />,
            color: "stat-card-yellow",
        },
        {
            title: "Approved Donations",
            value: stats.approvedDonations,
            icon: <FaCheckCircle className="stat-icon" />,
            color: "stat-card-green",
        },
        {
            title: "Cancelled",
            value: stats.cancelledAppointments,
            icon: <FaTimesCircle className="stat-icon" />,
            color: "stat-card-red"
        },
        {
            title: "Critical Shortages",
            value: stats.criticalShortages,
            icon: <FaExclamationTriangle className="stat-icon" />,
            color: "stat-card-orange",
        }
    ];

    return (
        <div className="statistics-grid">
            {statCards.map((card, index) => (
                <div key={index} className={`stat-card ${card.color}`}>
                    <div className="stat-card-content">
                        <div className="stat-card-icon">
                            {card.icon}
                        </div>
                        <div className="stat-card-info">
                            <h3 className="stat-card-value">{card.value}</h3>
                            <p className="stat-card-title">{card.title}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

