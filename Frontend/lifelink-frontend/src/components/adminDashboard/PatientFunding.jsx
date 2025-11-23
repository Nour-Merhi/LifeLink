import { useState } from "react";
import { FaDollarSign, FaUserInjured, FaHospital, FaCheckCircle } from "react-icons/fa";
import { IoPersonCircle } from "react-icons/io5";
import { BsArrowRight } from "react-icons/bs";

export default function PatientFunding() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [selectedPeriod, setSelectedPeriod] = useState("last-month");
    const [caseFilter, setCaseFilter] = useState("all");

    const metricsData = [
        {
            title: "Total Cases",
            value: "156",
            change: "+23 new cases",
            icon: <FaUserInjured />,
            bgColor: "#EAFFE5",
            iconColor: "#16a34a"
        },
        {
            title: "Total Funds Needed",
            value: "$4,250,000",
            change: "+12.23% vs last month",
            icon: <FaDollarSign />,
            bgColor: "#F5E9FF",
            iconColor: "#6132BE"
        },
        {
            title: "Funded Cases",
            value: "89",
            change: "57% completion rate",
            icon: <FaCheckCircle />,
            bgColor: "#EBEAFF",
            iconColor: "#285BFF"
        },
        {
            title: "Partner Hospitals",
            value: "34",
            change: "+5 new partners",
            icon: <FaHospital />,
            bgColor: "#FFE5E5",
            iconColor: "#F12C31"
        }
    ];

    const recentDonations = [
        { name: "Ahmad Khalil", case: "Heart Surgery", amount: "$15,000", date: "2025-01-10" },
        { name: "Sara Mohamad", case: "Cancer Treatment", amount: "$8,500", date: "2025-01-09" },
        { name: "Fatima Hassan", case: "Kidney Transplant", amount: "$12,000", date: "2025-01-08" },
        { name: "Ali Mahmoud", case: "Bone Marrow", amount: "$6,200", date: "2025-01-07" }
    ];

    const activeCases = [
        {
            id: "PC001",
            patientName: "ALI Rida Abed Sater",
            condition: "Congenital Heart Defect",
            age: 8,
            currentFunding: 52090,
            targetFunding: 75000,
            donorsCount: 234,
            medicalCenter: "Children's Medical Center",
            daysRemaining: 12
        },
        {
            id: "PC002",
            patientName: "Fatima Zahra",
            condition: "Kidney Transplant",
            age: 12,
            currentFunding: 38500,
            targetFunding: 60000,
            donorsCount: 156,
            medicalCenter: "University Medical Center",
            daysRemaining: 18
        },
        {
            id: "PC003",
            patientName: "Mohammad Ali",
            condition: "Cancer Treatment",
            age: 6,
            currentFunding: 45200,
            targetFunding: 80000,
            donorsCount: 189,
            medicalCenter: "Pediatric Hospital",
            daysRemaining: 25
        },
        {
            id: "PC004",
            patientName: "Nour Merhi",
            condition: "Spinal Surgery",
            age: 15,
            currentFunding: 28900,
            targetFunding: 50000,
            donorsCount: 98,
            medicalCenter: "Orthopedic Center",
            daysRemaining: 30
        },
        {
            id: "PC005",
            patientName: "Hassan Youssef",
            condition: "Liver Transplant",
            age: 10,
            currentFunding: 65000,
            targetFunding: 90000,
            donorsCount: 312,
            medicalCenter: "Transplant Hospital",
            daysRemaining: 8
        },
        {
            id: "PC006",
            patientName: "Layla Ahmad",
            condition: "Brain Tumor Surgery",
            age: 7,
            currentFunding: 41500,
            targetFunding: 70000,
            donorsCount: 178,
            medicalCenter: "Neurology Institute",
            daysRemaining: 20
        }
    ];

    return (
        <section className="financial-section">
            {/* Header */}
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <div className="financial-icon-circle">
                            <FaDollarSign />
                        </div>
                        <h2>Financial Management</h2>
                    </div>
                    <p>Manage donations, campaigns, and patient funding</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="financial-tabs">
                <button
                    className={activeTab === "dashboard" ? "tab-active" : "tab-inactive"}
                    onClick={() => setActiveTab("dashboard")}
                >
                    Dashboard
                </button>
                <button
                    className={activeTab === "patient-funding" ? "tab-active" : "tab-inactive"}
                    onClick={() => setActiveTab("patient-funding")}
                >
                    Patient Funding
                </button>
                <button
                    className={activeTab === "transactions" ? "tab-active" : "tab-inactive"}
                    onClick={() => setActiveTab("transactions")}
                >
                    Transactions
                </button>
            </div>

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

            {/* Funding Overview & Recent Donations Section */}
            <div className="financial-panels">
                {/* Funding Overview Chart */}
                <div className="donation-trends">
                    <div className="panel-header">
                        <h3>Funding Overview</h3>
                        <div className="select-des">
                            <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
                                <option value="last-week">Last Week</option>
                                <option value="last-month">Last Month</option>
                                <option value="last-quarter">Last Quarter</option>
                                <option value="last-year">Last Year</option>
                            </select>
                        </div>
                    </div>
                    <div className="chart-placeholder">
                        <p className="placeholder-text">Funding trends chart visualization</p>
                    </div>
                </div>

                {/* Recent Donations */}
                <div className="top-donors">
                    <h3 className="panel-header">Recent Donations</h3>
                    <div className="donors-list">
                        {recentDonations.map((donation, index) => (
                            <div key={index} className="donor-item">
                                <div className="donor-info">
                                    <IoPersonCircle className="donor-avatar" />
                                    <div className="donor-details">
                                        <span className="donor-name">{donation.name}</span>
                                        <small className="donor-date">{donation.case}</small>
                                    </div>
                                </div>
                                <span className="donor-amount">{donation.amount}</span>
                            </div>
                        ))}
                    </div>
                    <a href="#" className="view-all-link">
                        View All Donations <BsArrowRight />
                    </a>
                </div>
            </div>

            {/* Active Cases Section */}
            <div className="active-cases-section">
                <div className="section-header">
                    <h3>Active Cases</h3>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div className="filters">
                            <select value={caseFilter} onChange={(e) => setCaseFilter(e.target.value)}>
                                <option value="all">All Cases</option>
                                <option value="urgent">Urgent Cases</option>
                                <option value="nearly-funded">Nearly Funded</option>
                                <option value="new">New Cases</option>
                            </select>
                        </div>
                        <div className="add-btn">
                            <button>+ Create Patient Case</button>
                        </div>
                    </div>
                </div>

                <div className="cases-grid">
                    {activeCases.map((caseItem) => {
                        const fundingPercentage = Math.round((caseItem.currentFunding / caseItem.targetFunding) * 100);
                        
                        return (
                            <div key={caseItem.id} className="case-card">
                                <div className="case-header">
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
        </section>
    );
}

