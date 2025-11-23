import { useState } from "react";
import { IoPersonCircle } from "react-icons/io5";
import { BsArrowRight } from "react-icons/bs";

import AddPatientCaseForm from "./AddPatientCaseForm"

export default function FinancialDashboard({ metricsData, topDonors, activeCases }){
    const [selectedPeriod, setSelectedPeriod] = useState("last-month");
    const [openModal, setOpenModal] = useState(false)

    const onClose = () => {
        setOpenModal(false)
    }

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
                    <div className="chart-placeholder">
                        {/* Chart will go here */}
                        <p className="placeholder-text">Chart visualization area</p>
                    </div>
                </div>

                {/* Top Donors */}
                <div className="top-donors">
                    <h3 className="panel-header">Top Donors This Month</h3>
                    <div className="donors-list">
                        {topDonors.map((donor, index) => (
                            <div key={index} className="donor-item">
                                <div className="donor-info">
                                    <IoPersonCircle className="donor-avatar" />
                                    <div className="donor-details">
                                        <span className="donor-name">{donor.name}</span>
                                        <small className="donor-date">{donor.date}</small>
                                    </div>
                                </div>
                                <span className="donor-amount">{donor.amount}</span>
                            </div>
                        ))}
                    </div>
                    <a href="#" className="view-all-link">
                        View All Donors <BsArrowRight />
                    </a>
                </div>
            </div>

            {/* Active Cases Section */}
            <div className="active-cases-section">
                <div className="section-header">
                    <h3>Active Cases</h3>
                    <button className="add-btn">
                        <button type="button" onClick={() => setOpenModal(true)}>+ Create Patient Case</button>
                    </button>
                </div>

                <div className="cases-grid">
                    {activeCases.map((caseItem) => {
                        const fundingPercentage = Math.round((caseItem.currentFunding / caseItem.targetFunding) * 100);
                        
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
                <AddPatientCaseForm onClose = { onClose } />
            }
        </section>
    )
}