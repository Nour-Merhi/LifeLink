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

    // Fetch all financial data
    const fetchFinancialData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all data in parallel
            const [metricsRes, topDonorsRes, activeCasesRes, patientCasesRes, transactionsRes] = await Promise.all([
                api.get('/api/admin/dashboard/financial/metrics'),
                api.get('/api/admin/dashboard/financial/top-donors'),
                api.get('/api/admin/dashboard/financial/active-cases'),
                api.get('/api/admin/dashboard/financial/patient-cases'),
                api.get('/api/admin/dashboard/financial/transactions'),
            ]);

            // Add icons to metrics
            const metricsWithIcons = (metricsRes.data.metrics || []).map((metric, index) => {
                const icons = [
                    <LuCircleDollarSign />,
                    <PiHandHeart />,
                    <RiMegaphoneLine />,
                    <RiUserHeartLine />
                ];
                const bgColors = ["#EAFFE5", "#F5E9FF", "#EBEAFF", "#FFE5E5"];
                const iconColors = ["#16a34a", "#6132BE", "#285BFF", "#F12C31"];

                return {
                    ...metric,
                    icon: icons[index] || <BiSolidBadgeDollar />,
                    bgColor: bgColors[index] || "#EAFFE5",
                    iconColor: iconColors[index] || "#16a34a"
                };
            });

            setMetricsData(metricsWithIcons);
            setTopDonors(topDonorsRes.data.topDonors || []);
            setActiveCases(activeCasesRes.data.activeCases || []);
            setPatientCases(patientCasesRes.data.patientCases || []);
            setTransactions(transactionsRes.data.transactions || []);

        } catch (err) {
            console.error('Error fetching financial data:', err);
            setError(err.response?.data?.error || 'Failed to load financial data');
        } finally {
            setLoading(false);
        }
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

    if (error) {
        return (
            <section className="financial-section">
                <div style={{ textAlign: 'center', padding: '4rem', color: '#F12C31' }}>
                    <p>Error: {error}</p>
                </div>
            </section>
        );
    }

    return (
        <section className="financial-section">
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

