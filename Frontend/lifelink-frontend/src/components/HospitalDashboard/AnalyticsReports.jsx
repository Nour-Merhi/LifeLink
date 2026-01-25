import { useState, useEffect } from "react";
import { FiBarChart2, FiDownload, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { BiSolidBuildingHouse } from "react-icons/bi";
import { LiaUserNurseSolid } from "react-icons/lia";
import { PiHeartbeatFill } from "react-icons/pi";
import { MdOutlineHealthAndSafety } from "react-icons/md";
import { FaHospital } from "react-icons/fa";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    ComposedChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

function BloodTypeLegend({ payload = [] }) {
    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {payload.map((entry) => (
                <div
                    key={entry.value}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "4px 8px",
                        borderRadius: 8,
                        background: "rgba(0,0,0,0.03)",
                    }}
                >
                    <span
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: 3,
                            background: entry.color,
                            display: "inline-block",
                        }}
                    />
                    <span style={{ fontSize: 12, color: "#333", fontWeight: 600 }}>{entry.value}</span>
                </div>
            ))}
        </div>
    );
}

export default function AnalyticsReports() {
    const { user } = useAuth();

    const DEFAULT_METRICS = {
        urgentDonations: 0,
        regularAppointments: 0,
        phlebotomistsOnDuty: 0,
        criticalBloodShortages: 0,
        pendingOrganMatches: 0,
        totalOrganPledges: 0,
        liveOrganPledges: 0,
        afterDeathOrganPledges: 0,
    };

    const [hospitalInfo, setHospitalInfo] = useState(null);
    const [metrics, setMetrics] = useState(DEFAULT_METRICS);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [overviewLoading, setOverviewLoading] = useState(false);
    const [overviewError, setOverviewError] = useState("");
    const [dateRange, setDateRange] = useState("month");

    // Mock donation trends (swap with real API data later)
    const donationTrendsData = (() => {
        if (dateRange === "week") {
            return [
                { label: "Mon", home: 6, hospital: 10, after_death_organ: 2, live_organ: 1 },
                { label: "Tue", home: 8, hospital: 12, after_death_organ: 1, live_organ: 2 },
                { label: "Wed", home: 5, hospital: 9, after_death_organ: 3, live_organ: 1 },
                { label: "Thu", home: 7, hospital: 11, after_death_organ: 2, live_organ: 2 },
                { label: "Fri", home: 10, hospital: 14, after_death_organ: 4, live_organ: 2 },
                { label: "Sat", home: 4, hospital: 7, after_death_organ: 1, live_organ: 1 },
                { label: "Sun", home: 3, hospital: 6, after_death_organ: 1, live_organ: 0 },
            ];
        }
        if (dateRange === "quarter") {
            return [
                { label: "Jan", home: 62, hospital: 88, after_death_organ: 18, live_organ: 9 },
                { label: "Feb", home: 55, hospital: 81, after_death_organ: 16, live_organ: 8 },
                { label: "Mar", home: 70, hospital: 95, after_death_organ: 22, live_organ: 11 },
            ];
        }
        if (dateRange === "year") {
            return [
                { label: "Jan", home: 62, hospital: 88, after_death_organ: 18, live_organ: 9 },
                { label: "Feb", home: 55, hospital: 81, after_death_organ: 16, live_organ: 8 },
                { label: "Mar", home: 70, hospital: 95, after_death_organ: 22, live_organ: 11 },
                { label: "Apr", home: 64, hospital: 90, after_death_organ: 19, live_organ: 10 },
                { label: "May", home: 72, hospital: 98, after_death_organ: 24, live_organ: 12 },
                { label: "Jun", home: 60, hospital: 86, after_death_organ: 17, live_organ: 9 },
                { label: "Jul", home: 68, hospital: 92, after_death_organ: 20, live_organ: 10 },
                { label: "Aug", home: 74, hospital: 104, after_death_organ: 26, live_organ: 13 },
                { label: "Sep", home: 66, hospital: 91, after_death_organ: 19, live_organ: 10 },
                { label: "Oct", home: 71, hospital: 97, after_death_organ: 23, live_organ: 12 },
                { label: "Nov", home: 63, hospital: 89, after_death_organ: 18, live_organ: 9 },
                { label: "Dec", home: 76, hospital: 110, after_death_organ: 27, live_organ: 14 },
            ];
        }
        // month (default): last ~6 points
        return [
            { label: "W1", home: 14, hospital: 22, after_death_organ: 5, live_organ: 2 },
            { label: "W2", home: 18, hospital: 25, after_death_organ: 6, live_organ: 3 },
            { label: "W3", home: 12, hospital: 20, after_death_organ: 4, live_organ: 2 },
            { label: "W4", home: 20, hospital: 28, after_death_organ: 7, live_organ: 3 },
            { label: "W5", home: 16, hospital: 24, after_death_organ: 6, live_organ: 2 },
            { label: "W6", home: 19, hospital: 27, after_death_organ: 7, live_organ: 3 },
        ];
    })();

    const tooltipStyle = {
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.12)",
        borderRadius: 10,
        color: "#222222",
    };

    // Mock hospital utilization breakdown (percentage per area)
    const utilizationData = [
        { area: "ICU", utilization: 82 },
        { area: "ER", utilization: 74 },
        { area: "Wards", utilization: 68 },
        { area: "Blood Bank", utilization: 57 },
    ];

    // Mock blood type distribution (counts)
    const bloodTypeDistribution = [
        { type: "O+", count: 120 },
        { type: "A+", count: 95 },
        { type: "B+", count: 70 },
        { type: "AB+", count: 35 },
        { type: "O-", count: 30 },
        { type: "A-", count: 25 },
        { type: "B-", count: 18 },
        { type: "AB-", count: 10 },
    ];

    const getBloodTypeColor = (type) => {
        return (
            type === "O+" ? "#2E58DF" :
            type === "A+" ? "#1CC872" :
            type === "B+" ? "#F59E0B" :
            type === "AB+" ? "#6132BE" :
            type === "O-" ? "#0EA5E9" :
            type === "A-" ? "#16a34a" :
            type === "B-" ? "#F12C31" :
            "#6B6B6B"
        );
    };

    const bloodTypeLegendPayload = bloodTypeDistribution.map((item) => ({
        id: item.type,
        type: "square",
        value: item.type,
        color: getBloodTypeColor(item.type),
    }));

    // Mock home appointments status (completed/cancelled/pending) for donut chart
    const homeAppointmentsStatus = (() => {
        if (dateRange === "week") {
            return [
                { name: "Completed", value: 38 },
                { name: "Pending", value: 12 },
                { name: "Cancelled", value: 5 },
            ];
        }
        if (dateRange === "quarter") {
            return [
                { name: "Completed", value: 420 },
                { name: "Pending", value: 95 },
                { name: "Cancelled", value: 42 },
            ];
        }
        if (dateRange === "year") {
            return [
                { name: "Completed", value: 1680 },
                { name: "Pending", value: 280 },
                { name: "Cancelled", value: 160 },
            ];
        }
        // month (default)
        return [
            { name: "Completed", value: 165 },
            { name: "Pending", value: 34 },
            { name: "Cancelled", value: 18 },
        ];
    })();

    const HOME_APPT_COLORS = {
        Completed: "#1CC872",
        Pending: "#F59E0B",
        Cancelled: "#F12C31",
    };

    // Mock phlebotomists success rate trend (bar + line)
    const phlebotomistSuccessRateTrend = (() => {
        if (dateRange === "week") {
            return [
                { label: "Mon", completed: 9, success_rate: 92 },
                { label: "Tue", completed: 11, success_rate: 88 },
                { label: "Wed", completed: 8, success_rate: 90 },
                { label: "Thu", completed: 12, success_rate: 94 },
                { label: "Fri", completed: 14, success_rate: 91 },
                { label: "Sat", completed: 7, success_rate: 86 },
                { label: "Sun", completed: 6, success_rate: 89 },
            ];
        }
        if (dateRange === "quarter") {
            return [
                { label: "Jan", completed: 210, success_rate: 90 },
                { label: "Feb", completed: 198, success_rate: 88 },
                { label: "Mar", completed: 235, success_rate: 92 },
            ];
        }
        if (dateRange === "year") {
            return [
                { label: "Jan", completed: 210, success_rate: 90 },
                { label: "Feb", completed: 198, success_rate: 88 },
                { label: "Mar", completed: 235, success_rate: 92 },
                { label: "Apr", completed: 222, success_rate: 91 },
                { label: "May", completed: 248, success_rate: 93 },
                { label: "Jun", completed: 205, success_rate: 89 },
                { label: "Jul", completed: 230, success_rate: 91 },
                { label: "Aug", completed: 255, success_rate: 94 },
                { label: "Sep", completed: 218, success_rate: 90 },
                { label: "Oct", completed: 240, success_rate: 92 },
                { label: "Nov", completed: 226, success_rate: 90 },
                { label: "Dec", completed: 268, success_rate: 95 },
            ];
        }
        // month (default)
        return [
            { label: "W1", completed: 48, success_rate: 90 },
            { label: "W2", completed: 55, success_rate: 89 },
            { label: "W3", completed: 44, success_rate: 91 },
            { label: "W4", completed: 61, success_rate: 93 },
            { label: "W5", completed: 52, success_rate: 90 },
            { label: "W6", completed: 58, success_rate: 92 },
        ];
    })();

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    useEffect(() => {
        fetchOverview();
    }, [user]);

    const fetchOverview = () => {
        setOverviewLoading(true);
        setOverviewError("");

        // Prefer backend hospital resolution from authenticated user
        // Route supports optional param but backend can resolve hospital_id from auth
        api.get(`/api/hospital/dashboard/overview`)
            .then((res) => {
                if (res.data?.success) {
                    setHospitalInfo(res.data.hospitalInfo || {});
                    setMetrics({
                        ...DEFAULT_METRICS,
                        ...(res.data.metrics || {}),
                    });
                } else {
                    setOverviewError(res.data?.message || "Failed to fetch dashboard overview");
                }
            })
            .catch((err) => {
                console.error("Error fetching hospital overview:", err);
                setOverviewError(err.response?.data?.message || "Failed to fetch dashboard overview");
            })
            .finally(() => setOverviewLoading(false));
    };

    const fetchAnalytics = () => {
        setLoading(true);
        // In production: axios.get("/api/hospital/analytics", { params: { range: dateRange } })
        setTimeout(() => {
            setAnalytics({
                monthlyDonations: 245,
                donorRetention: 78.5,
                organMatchSuccess: 92.3,
                phlebotomistPerformance: 4.7,
                hospitalUtilization: 85.2
            });
            setLoading(false);
        }, 500);
    };

    const metricsData = [
        {
            title: "Today's Urgent Donations",
            value: String(metrics?.urgentDonations ?? 0),
            change: "24-hour window",
            icon: <FiAlertCircle />,
            bgColor: "#FFE5E5",
            iconColor: "#F12C31"
        },
        {
            title: "Regular Appointments",
            value: String(metrics?.regularAppointments ?? 0),
            change: "Scheduled today",
            icon: <FiCheckCircle />,
            bgColor: "#EAFFE5",
            iconColor: "#16a34a"
        },
        {
            title: "Phlebotomists On Duty",
            value: String(metrics?.phlebotomistsOnDuty ?? 0),
            change: "Currently active",
            icon: <LiaUserNurseSolid />,
            bgColor: "#F5E9FF",
            iconColor: "#6132BE"
        },
        {
            title: "Critical Blood Shortages",
            value: String(metrics?.criticalBloodShortages ?? 0),
            change: "Below threshold",
            icon: <PiHeartbeatFill />,
            bgColor: "#FFF5E5",
            iconColor: "#F59E0B"
        },
        {
            title: "Pending Organ Matches",
            value: String(metrics?.pendingOrganMatches ?? 0),
            change: "Awaiting approval",
            icon: <MdOutlineHealthAndSafety />,
            bgColor: "#E5F3FF",
            iconColor: "#0EA5E9"
        },
        {
            title: "Total Organ Pledges",
            value: String(metrics?.totalOrganPledges ?? 0),
            change: "This hospital",
            icon: <MdOutlineHealthAndSafety />,
            bgColor: "#FFE5E5",
            iconColor: "#F12C31"
        },
        {
            title: "Live Organ Pledges",
            value: String(metrics?.liveOrganPledges ?? 0),
            change: "This hospital",
            icon: <MdOutlineHealthAndSafety />,
            bgColor: "#EAFFE5",
            iconColor: "#16a34a"
        },
        {
            title: "After-death Organ Pledges",
            value: String(metrics?.afterDeathOrganPledges ?? 0),
            change: "This hospital",
            icon: <MdOutlineHealthAndSafety />,
            bgColor: "#EBEAFF",
            iconColor: "#285BFF"
        }
    ];

    const handleExportPDF = () => {
        // In production: axios.get("/api/hospital/analytics/export-pdf", { responseType: 'blob' })
        console.log("Export PDF");
    };

    const handleExportCSV = () => {
        // In production: axios.get("/api/hospital/analytics/export-csv", { responseType: 'blob' })
        console.log("Export CSV");
    };

    return (
        <section className="analytics-section">
            {/* Header */}
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <FaHospital className="icon-size" />
                        <div>
                            <h2>{hospitalInfo?.name || "Analytics & Reports"}</h2>
                        </div>
                            {hospitalInfo?.status && (
                                <span
                                    className={`status-badge ${
                                        String(hospitalInfo.status).toLowerCase() === "verified" ||
                                        String(hospitalInfo.status).toLowerCase() === "active"
                                            ? "status-active"
                                            : "status-inactive"
                                    }`}
                                >
                                    {String(hospitalInfo.status).toLowerCase() === "verified" ||
                                    String(hospitalInfo.status).toLowerCase() === "active"
                                        ? "● Verified"
                                        : "● Unverified"}
                                </span>
                            )}
                    </div>
                    <p>{hospitalInfo?.address || "View performance metrics and generate exportable reports"}</p>
                </div>
            </div>

            {/* Dashboard Overview Metrics (moved from HospitalDashboard.jsx) */}
            {overviewLoading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200, color: "#6B6B6B" }}>
                    Loading dashboard overview...
                </div>
            ) : overviewError ? (
                <div style={{ padding: "12px", background: "#fee", color: "#c33", borderRadius: "8px"}}>
                    <strong>Error:</strong> {overviewError}{" "}
                    <button
                        onClick={fetchOverview}
                        style={{ marginLeft: "10px", padding: "5px 10px", cursor: "pointer" }}
                    >
                        Retry
                    </button>
                </div>
            ) : (
                <div className="metrics-grid">
                    {metricsData.map((metric, index) => (
                        <div key={index} className="metric-card">
                            <div className="metric-content">
                                <div className="metric-info">
                                    <p className="metric-title">{metric.title}</p>
                                    <h3 className="metric-value">{metric.value}</h3>
                                    <span className="metric-change">{metric.change}</span>
                                </div>
                                <div className="metric-icon" style={{ backgroundColor: metric.bgColor, color: metric.iconColor }}>
                                    {metric.icon}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Date Range Filter */}
            <div className="control-panel">
                <div className="control-panel-layout">
                    <div className="filter-gap">
                        <div className="filters">
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                            >
                                <option value="week">Last 7 Days</option>
                                <option value="month">Last 30 Days</option>
                                <option value="quarter">Last 3 Months</option>
                                <option value="year">Last Year</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Charts Placeholder */}
                <div className="donation-trends lg:col-span-2">
                    <div className="panel-header">
                        <h3>Donation Trends</h3>
                    </div>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={donationTrendsData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                                <XAxis dataKey="label" tick={{ fill: "#6B6B6B", fontSize: 12 }} />
                                <YAxis tick={{ fill: "#6B6B6B", fontSize: 12 }} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Legend wrapperStyle={{ marginTop: 12 }} />
                                <Line
                                    type="monotone"
                                    dataKey="home"
                                    name="Home Donations"
                                    stroke="#1CC872"
                                    strokeWidth={3}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
            
                                />
                                <Line
                                    type="monotone"
                                    dataKey="hospital"
                                    name="Hospital Donations"
                                    stroke="#2E58DF"
                                    strokeWidth={3}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="after_death_organ"
                                    name="After-death Organ Donation"
                                    stroke="#F12C31"
                                    strokeWidth={3}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="live_organ"
                                    name="Living Organ Donation"
                                    stroke="#6132BE"
                                    strokeWidth={3}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Blood Type Distribution */}
                <div className="donation-trends lg:col-span-1">
                    <div className="panel-header !mb-2">
                        <h3>Blood Type Distribution</h3>
                    </div>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Tooltip
                                    contentStyle={tooltipStyle}
                                    labelFormatter={() => ""}
                                    formatter={(value, _name, props) => [
                                        value,
                                        props?.payload?.type ? `Blood Type (${props.payload.type})` : "Count",
                                    ]}
                                />
                                <Pie
                                    data={bloodTypeDistribution}
                                    dataKey="count"
                                    nameKey="type"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={0}
                                    outerRadius={115}
                                    paddingAngle={2}
                                    stroke="rgba(0,0,0,0.06)"
                                >
                                    {bloodTypeDistribution.map((entry) => (
                                        <Cell key={entry.type} fill={getBloodTypeColor(entry.type)} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Explicit labels under the chart (color -> blood type) */}
                    <div style={{ marginTop: 12 }}>
                        <BloodTypeLegend payload={bloodTypeLegendPayload} />
                    </div>
                </div>
            
                {/* Home Appointments Status (Donut) */}
                <div className="donation-trends lg:col-span-1">
                        <div className="panel-header">
                            <h3>Home Appointments Statistics</h3>
                        </div>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Legend />
                                    <Pie
                                        data={homeAppointmentsStatus}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={110}
                                        paddingAngle={3}
                                        stroke="rgba(0,0,0,0.06)"
                                    >
                                        {homeAppointmentsStatus.map((entry) => (
                                            <Cell key={entry.name} fill={HOME_APPT_COLORS[entry.name] || "#6B6B6B"} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                </div>

                {/* Phlebotomists Success Rate (Bar + Line) */}
                <div className="donation-trends lg:col-span-2">
                    <div className="panel-header">
                        <h3>Phlebotomists Success Rate</h3>
                    </div>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={phlebotomistSuccessRateTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                                <XAxis dataKey="label" tick={{ fill: "#6B6B6B", fontSize: 12 }} />
                                <YAxis yAxisId="left" tick={{ fill: "#6B6B6B", fontSize: 12 }} />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    domain={[0, 100]}
                                    tick={{ fill: "#6B6B6B", fontSize: 12 }}
                                    tickFormatter={(v) => `${v}%`}
                                />
                                <Tooltip
                                    contentStyle={tooltipStyle}
                                    formatter={(value, name) => {
                                        if (name === "success_rate") return [`${value}%`, "Success Rate"];
                                        if (name === "completed") return [value, "Completed"];
                                        return [value, name];
                                    }}
                                />
                                <Legend />
                                <Bar yAxisId="left" dataKey="completed" name="Completed" fill="#2E58DF" radius={[8, 8, 0, 0]} />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="success_rate"
                                    name="Success Rate"
                                    stroke="#1CC872"
                                    strokeWidth={3}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>   
            </div>
            
        </section>
    );
}

