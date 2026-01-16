import { useState, useEffect } from "react";
import { FiBarChart2 } from "react-icons/fi";
import { FiDownload } from "react-icons/fi";
import axios from "axios";

export default function AnalyticsReports() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState("month");

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

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
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <FiBarChart2 className="icon-size" />
                        <h2>Analytics & Reports</h2>
                    </div>
                    <p>View performance metrics and generate exportable reports</p>
                </div>
                <div className="add-btn">
                    <button type="button" onClick={handleExportPDF}>
                        <FiDownload /> Export PDF
                    </button>
                    <button type="button" onClick={handleExportCSV} style={{ marginLeft: '10px' }}>
                        <FiDownload /> Export CSV
                    </button>
                </div>
            </div>

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

            {/* Analytics Cards */}
            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-content">
                        <div className="metric-info">
                            <p className="metric-title">Monthly Donations</p>
                            <h3 className="metric-value">{analytics?.monthlyDonations || 0}</h3>
                            <span className="metric-change">Total donations this month</span>
                        </div>
                        <div className="metric-icon" style={{ backgroundColor: "#EAFFE5", color: "#16a34a" }}>
                            <FiBarChart2 />
                        </div>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-content">
                        <div className="metric-info">
                            <p className="metric-title">Donor Retention Rate</p>
                            <h3 className="metric-value">{analytics?.donorRetention || 0}%</h3>
                            <span className="metric-change">Returning donors</span>
                        </div>
                        <div className="metric-icon" style={{ backgroundColor: "#EBEAFF", color: "#285BFF" }}>
                            <FiBarChart2 />
                        </div>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-content">
                        <div className="metric-info">
                            <p className="metric-title">Organ Match Success</p>
                            <h3 className="metric-value">{analytics?.organMatchSuccess || 0}%</h3>
                            <span className="metric-change">Successful matches</span>
                        </div>
                        <div className="metric-icon" style={{ backgroundColor: "#F5E9FF", color: "#6132BE" }}>
                            <FiBarChart2 />
                        </div>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-content">
                        <div className="metric-info">
                            <p className="metric-title">Phlebotomist Performance</p>
                            <h3 className="metric-value">{analytics?.phlebotomistPerformance || 0}/5</h3>
                            <span className="metric-change">Average rating</span>
                        </div>
                        <div className="metric-icon" style={{ backgroundColor: "#FFE5E5", color: "#F12C31" }}>
                            <FiBarChart2 />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Placeholder */}
            <div className="financial-panels">
                <div className="donation-trends">
                    <div className="panel-header">
                        <h3>Donation Trends</h3>
                    </div>
                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B6B6B' }}>
                        Chart visualization would go here (Chart.js, Recharts, etc.)
                    </div>
                </div>
                <div className="top-donors">
                    <div className="panel-header">
                        <h3>Hospital Utilization</h3>
                    </div>
                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B6B6B' }}>
                        Utilization chart would go here
                    </div>
                </div>
            </div>
        </section>
    );
}

