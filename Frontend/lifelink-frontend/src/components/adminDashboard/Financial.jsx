import { useState, useEffect } from "react";

import { LuCircleDollarSign } from "react-icons/lu";
import { PiHandHeart } from "react-icons/pi";
import { RiMegaphoneLine } from "react-icons/ri";
import { BiSolidBadgeDollar } from "react-icons/bi";
import { RiUserHeartLine } from "react-icons/ri";

import FinancialDashboard from "./financialComponents/FinancialDashboard";
import PatientFunding from "./financialComponents/PatientFunding";
import Transactions from "./financialComponents/Transactions";
import api from "../../api/axios";

export default function Financial() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [metricsData, setMetricsData] = useState([]);
    const [topDonors, setTopDonors] = useState([]);
    const [activeCases, setActiveCases] = useState([]);
    const [patientCases, setPatientCases] = useState([]);
    const [transactions, setTransactions] = useState([]);

    // Fetch all financial data (resilient: show page with partial data if some requests fail)
    const fetchFinancialData = async () => {
        setLoading(true);
        setError(null);

        const endpoints = [
            { key: 'metrics', url: '/api/admin/dashboard/financial/metrics' },
            { key: 'topDonors', url: '/api/admin/dashboard/financial/top-donors' },
            { key: 'activeCases', url: '/api/admin/dashboard/financial/active-cases' },
            { key: 'patientCases', url: '/api/admin/dashboard/financial/patient-cases' },
            { key: 'transactions', url: '/api/admin/dashboard/financial/transactions' },
        ];

        const results = await Promise.allSettled(
            endpoints.map(({ url }) => api.get(url))
        );

        const errors = [];
        let metrics = [];
        let topDonors = [];
        let activeCases = [];
        let patientCases = [];
        let transactions = [];

        results.forEach((result, index) => {
            const { key } = endpoints[index];
            if (result.status === 'fulfilled' && result.value?.data) {
                const data = result.value.data;
                if (key === 'metrics') metrics = data.metrics || [];
                else if (key === 'topDonors') topDonors = data.topDonors || [];
                else if (key === 'activeCases') activeCases = data.activeCases || [];
                else if (key === 'patientCases') patientCases = data.patientCases || [];
                else if (key === 'transactions') transactions = data.transactions || [];
            } else {
                const err = result.status === 'rejected' ? result.reason : null;
                if (err) {
                    console.error(`Financial ${key} failed:`, err);
                    errors.push(`${key}: ${err.response?.data?.error || err.message || 'Failed'}`);
                }
            }
        });

        // Add icons to metrics
        const metricsWithIcons = metrics.map((metric, index) => {
            const icons = [
                <LuCircleDollarSign key="1" />,
                <PiHandHeart key="2" />,
                <RiMegaphoneLine key="3" />,
                <RiUserHeartLine key="4" />
            ];
            const bgColors = ["#EAFFE5", "#F5E9FF", "#EBEAFF", "#FFE5E5"];
            const iconColors = ["#16a34a", "#6132BE", "#285BFF", "#F12C31"];
            return {
                ...metric,
                icon: icons[index] || <BiSolidBadgeDollar key="0" />,
                bgColor: bgColors[index] || "#EAFFE5",
                iconColor: iconColors[index] || "#16a34a"
            };
        });

        setMetricsData(metricsWithIcons);
        setTopDonors(topDonors);
        setActiveCases(activeCases);
        setPatientCases(patientCases);
        setTransactions(transactions);
        setError(errors.length > 0 ? errors.join('; ') : null);
        setLoading(false);
    };

    useEffect(() => {
        fetchFinancialData();
    }, []);

    if (loading) {
        return (
            <section className="financial-section">
                <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>
                    <p>Loading financial data...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="financial-section">
            {error && (
                <div style={{
                    marginBottom: '1rem',
                    padding: '0.75rem 1rem',
                    background: '#fef2f2',
                    color: '#b91c1c',
                    borderRadius: '8px',
                    fontSize: '14px',
                }}>
                    Some data could not be loaded: {error}
                </div>
            )}
            {/* Header */}
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <BiSolidBadgeDollar className="icon-size"/>
                        <h2>Financial Management</h2>
                    </div>
                    <p>Manage donations, campaigns, and patient funding</p>
                </div>
                { activeTab === "patient-funding" && 
                    <div>
                        <h3>Total Patient Cases: {patientCases.length}</h3>
                    </div>
                }
                { activeTab === "transactions" && 
                    <div>
                        <h3>Total Transactions: {transactions.length}</h3>
                    </div>
                }
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


            {activeTab === "dashboard" && 
                <FinancialDashboard 
                    metricsData={metricsData} 
                    topDonors={topDonors} 
                    activeCases={activeCases}
                    transactions={transactions}
                    onPatientCaseAdded={fetchFinancialData}
                />
            }

            {activeTab === "patient-funding" && 
                <PatientFunding patientCases={patientCases} onPatientCaseUpdated={fetchFinancialData} />
            }
            {activeTab === "transactions" && 
                <Transactions transactions={transactions} onTransactionUpdated={fetchFinancialData} />
            }


        </section>
    );
}

