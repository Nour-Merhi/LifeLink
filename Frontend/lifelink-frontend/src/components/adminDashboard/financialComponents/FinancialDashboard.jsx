import { useState, useMemo } from "react";
import { IoPersonCircle } from "react-icons/io5";
import { BsArrowRight } from "react-icons/bs";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

import AddPatientCaseForm from "./AddPatientCaseForm"

export default function FinancialDashboard({ metricsData, topDonors, activeCases, transactions = [], onPatientCaseAdded }){
    const [selectedPeriod, setSelectedPeriod] = useState("last-month");
    const [openModal, setOpenModal] = useState(false)

    const onClose = () => {
        setOpenModal(false)
    }

    const handlePatientCaseAdded = () => {
        if (onPatientCaseAdded) {
            onPatientCaseAdded();
        }
        setOpenModal(false);
    }

    // Build chart data from transactions (completed only), aggregated by date
    const chartData = useMemo(() => {
        const now = new Date();
        let startDate;
        switch (selectedPeriod) {
            case "last-week":
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 7);
                break;
            case "last-quarter":
                startDate = new Date(now);
                startDate.setMonth(startDate.getMonth() - 3);
                break;
            case "last-year":
                startDate = new Date(now);
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            default: // last-month
                startDate = new Date(now);
                startDate.setMonth(startDate.getMonth() - 1);
                break;
        }

        const completed = (transactions || []).filter(
            (t) => t.status === "completed" && new Date(t.date || t.created_at) >= startDate
        );

        const byDate = {};
        completed.forEach((t) => {
            const d = t.date || t.created_at || "";
            const key = d.slice(0, 10);
            if (!byDate[key]) byDate[key] = { date: key, amount: 0, count: 0 };
            byDate[key].amount += Number(t.amount) || 0;
            byDate[key].count += 1;
        });

        const sorted = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
        return sorted.map((d) => ({
            ...d,
            label: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }),
        }));
    }, [transactions, selectedPeriod]);

    // Top 5 donors by total amount (from API or derived from transactions)
    const topDonorsList = useMemo(() => {
        const apiList = Array.isArray(topDonors) ? topDonors : [];
        if (apiList.length > 0) return apiList.slice(0, 5);

        const completed = (transactions || []).filter((t) => t.status === "completed");
        const byDonor = {};
        completed.forEach((t) => {
            const key = (t.donor_name || t.name || "Anonymous").trim() || "Anonymous";
            if (!byDonor[key]) byDonor[key] = { name: key, amount: 0, date: t.date || t.created_at };
            byDonor[key].amount += Number(t.amount) || 0;
            if ((t.date || t.created_at) > (byDonor[key].date || "")) byDonor[key].date = t.date || t.created_at;
        });

        return Object.values(byDonor)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5)
            .map((d) => ({
                name: d.name,
                date: d.date ? String(d.date).slice(0, 10) : "",
                amount: "$" + Number(d.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            }));
    }, [topDonors, transactions]);

    return(
        <section className="financial-dashboard">
            {/* Metrics Cards */}
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

            {/* Donation Trends & Top Donors Section */}
            <div className="financial-panels">
                {/* Donation Trends */}
                <div className="donation-trends">
                    <div className="panel-header">
                        <h3>Donation Trends</h3>
                        <div className="select-des filters">
                            <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
                                <option value="last-week">Last Week</option>
                                <option value="last-month">Last Month</option>
                                <option value="last-quarter">Last Quarter</option>
                                <option value="last-year">Last Year</option>
                            </select>
                        </div>
                    </div>
                    <div className="chart-placeholder" style={{ minHeight: 280 }}>
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6132BE" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#6132BE" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#6b7280" />
                                    <YAxis
                                        tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v}`}
                                        tick={{ fontSize: 12 }}
                                        stroke="#6b7280"
                                    />
                                    <Tooltip
                                        formatter={(value) => [`$${Number(value).toLocaleString()}`, "Amount"]}
                                        labelFormatter={(label) => `Date: ${label}`}
                                        contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="amount"
                                        stroke="#6132BE"
                                        strokeWidth={2}
                                        fill="url(#colorAmount)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="placeholder-text">No donation data for the selected period</p>
                        )}
                    </div>
                </div>

                {/* Top Donors */}
                <div className="top-donors">
                    <h3 className="panel-header">Top 5 Donors</h3>
                    <div className="donors-list">
                        {topDonorsList.length === 0 ? (
                            <p className="placeholder-text" style={{ padding: "1rem", margin: 0 }}>No donors yet</p>
                        ) : (
                            topDonorsList.map((donor, index) => (
                                <div key={index} className="donor-item">
                                    <div className="donor-info">
                                        <IoPersonCircle className="transaction-donor-avatar" />
                                        <div className="transaction-donor-details">
                                            <span className="transaction-donor-name">{donor.name || "Anonymous"}</span>
                                            <small className="transaction-donor-date">{donor.date}</small>
                                        </div>
                                    </div>
                                    <span className="transaction-donor-amount">{donor.amount}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Active Cases Section */}
            <div className="active-cases-section">
                <div className="section-header">
                    <h3>Active Cases</h3>
                    <button type="button" className="add-btn" onClick={() => setOpenModal(true)}>+ Create Patient Case</button>
                </div>

                <div className="cases-grid">
                    {activeCases.map((caseItem) => {
                        const fundingPercentage = caseItem.targetFunding > 0
                            ? Math.round((caseItem.currentFunding / caseItem.targetFunding) * 100)
                            : 0;
                        
                        return (
                            <div key={caseItem.id} className="case-card">
                                <div className="case-header case-header-left">
                                    <IoPersonCircle className="case-avatar" />
                                    <div className="case-patient-info">
                                        <h4>{caseItem.patientName}</h4>
                                        <p>{caseItem.condition} • Age {caseItem.age}</p>
                                    </div>
                                </div>

                                <div className="case-body">
                                    <div className="funding-info">
                                        <span className="funding-label">Funding progress</span>
                                        <span className="funding-amount">
                                            ${caseItem.currentFunding.toLocaleString()} / ${caseItem.targetFunding.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill" 
                                            style={{ width: `${fundingPercentage}%` }}
                                        ></div>
                                    </div>

                                    <div className="funding-stats">
                                        <span>{caseItem.donorsCount} donors</span>
                                        <span>{fundingPercentage}% funded</span>
                                    </div>

                                    <div className="case-footer">
                                        <span className="medical-center">{caseItem.medicalCenter}</span>
                                        <span className="days-remaining">{caseItem.daysRemaining} days remaining</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {openModal && 
                <AddPatientCaseForm onClose={onClose} onPatientCaseAdded={handlePatientCaseAdded} />
            }
        </section>
    )
}