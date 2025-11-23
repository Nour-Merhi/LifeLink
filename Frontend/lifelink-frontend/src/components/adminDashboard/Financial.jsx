import { useState } from "react";

import { LuCircleDollarSign } from "react-icons/lu";
import { PiHandHeart } from "react-icons/pi";
import { RiMegaphoneLine } from "react-icons/ri";
import { BiSolidBadgeDollar } from "react-icons/bi";
import { RiUserHeartLine } from "react-icons/ri";

import FinancialDashboard from "./financialComponents/FinancialDashboard";
import PatientFunding from "./financialComponents/PatientFunding";
import Transactions from "./financialComponents/Transactions";

export default function Financial() {
    const [activeTab, setActiveTab] = useState("dashboard");

    const metricsData = [
        {
            title: "Total Funds Raised",
            value: "$2,847,392",
            change: "+12.23% vs last month",
            icon: <LuCircleDollarSign />,
            bgColor: "#EAFFE5",
            iconColor: "#16a34a"
        },
        {
            title: "Monthly Donations",
            value: "$156,240",
            change: "+8.2% vs last month",
            icon: <PiHandHeart />,
            bgColor: "#F5E9FF",
            iconColor: "#6132BE"
        },
        {
            title: "Active Campaigns",
            value: "23",
            change: "+12.23% vs last month",
            icon: <RiMegaphoneLine />,
            bgColor: "#EBEAFF",
            iconColor: "#285BFF"
        },
        {
            title: "Patients Funded",
            value: "847",
            change: "+12.23% vs last month",
            icon: <RiUserHeartLine />,
            bgColor: "#FFE5E5",
            iconColor: "#F12C31"
        }
    ];

    const topDonors = [
        { name: "Nour Merhi", date: "2025-04-34", amount: "$50,000" },
        { name: "Ahmad Hassan", date: "2025-04-30", amount: "$50" },
        { name: "Sara Khaled", date: "2025-04-29", amount: "$100" },
        { name: "Ali Mohamad", date: "2025-04-28", amount: "$75" }
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
        }
    ];
    const patientCases = [
        {
            id: "PC001",
            patientName: "ALI Rida Abed Sater",
            condition: "Congenital Heart Defect",
            description: "Ali has been on dialysis for more than 2 years and urgently needs a kidney transplant now. His family cannot afford the surgery costs.",
            age: 8,
            currentFunding: 52090,
            targetFunding: 75000,
            donorsCount: 234,
            hospital: "Children's Medical Center",
            daysRemaining: 12,
            status: "active",
            severity: "high",
            created_at: "2025-01-25",
        },
        {
            id: "PC002",
            patientName: "Fatima Zahra",
            condition: "Kidney Transplant",
            description: "Fatima has been on dialysis for more than 2 years and urgently needs a kidney transplant now. Her family cannot afford the surgery costs.",
            age: 12,
            currentFunding: 38500,
            targetFunding: 60000,
            donorsCount: 156,
            hospital: "University Medical Center",
            daysRemaining: 18,
            status: "done",
            severity: "medium",
            created_at: "2025-01-25",
        },
        {
            id: "PC003",
            patientName: "Mohammad Ali",
            condition: "Cancer Treatment",
            description: "Mohammad has been on dialysis for more than 2 years and urgently needs a kidney transplant now. His family cannot afford the surgery costs.",
            age: 6,
            currentFunding: 45200,
            targetFunding: 80000,
            donorsCount: 189,
            hospital: "Pediatric Hospital",
            daysRemaining: 25,
            status: "cancelled",
            severity: "low",
            created_at: "2025-01-25",
        },
        {
            id: "PC023",
            patientName: "Mohammad Ali",
            condition: "Cancer Treatment",
            description: "Mohammad has been on dialysis for more than 2 years and urgently needs a kidney transplant now. His family cannot afford the surgery costs.",
            age: 6,
            currentFunding: 45200,
            targetFunding: 80000,
            donorsCount: 189,
            hospital: "Pediatric Hospital",
            daysRemaining: 25,
            status: "cancelled",
            severity: "low",
            created_at: "2025-01-25",
        },
        {
            id: "PC013",
            patientName: "Mohammad Ali",
            condition: "Cancer Treatment",
            description: "Mohammad has been on dialysis for more than 2 years and urgently needs a kidney transplant now. His family cannot afford the surgery costs.",
            age: 6,
            currentFunding: 45200,
            targetFunding: 80000,
            donorsCount: 189,
            hospital: "Pediatric Hospital",
            daysRemaining: 25,
            status: "cancelled",
            severity: "low",
            created_at: "2025-01-25",
        },
        {
            id: "PC043",
            patientName: "Mohammad Ali",
            condition: "Cancer Treatment",
            description: "Mohammad has been on dialysis for more than 2 years and urgently needs a kidney transplant now. His family cannot afford the surgery costs.",
            age: 6,
            currentFunding: 45200,
            targetFunding: 80000,
            donorsCount: 189,
            hospital: "Pediatric Hospital",
            daysRemaining: 25,
            status: "cancelled",
            severity: "low",
            created_at: "2025-01-25",
        },
        {
            id: "PC006",
            patientName: "Mohammad Ali",
            condition: "Cancer Treatment",
            description: "Mohammad has been on dialysis for more than 2 years and urgently needs a kidney transplant now. His family cannot afford the surgery costs.",
            age: 6,
            currentFunding: 45200,
            targetFunding: 80000,
            donorsCount: 189,
            hospital: "Pediatric Hospital",
            daysRemaining: 25,
            status: "cancelled",
            severity: "low",
            created_at: "2025-01-25",
        },
        {
            id: "PC007",
            patientName: "Mohammad Ali",
            condition: "Cancer Treatment",
            description: "Mohammad has been on dialysis for more than 2 years and urgently needs a kidney transplant now. His family cannot afford the surgery costs.",
            age: 6,
            currentFunding: 45200,
            targetFunding: 80000,
            donorsCount: 189,
            hospital: "Pediatric Hospital",
            daysRemaining: 25,
            status: "cancelled",
            severity: "low",
            created_at: "2025-01-25",
        }
    ];
    const transactions = [
        {
            id: "T001",
            donor_name: "Nour Merhi",
            donor_id: "D001",
            beneficiary_name: "John Doe",
            hospital_name: "General Hospital",
            transactionType: "Donation",
            status: "completed",
            amount: 10000,
            date: "2025-01-25",
            time: "10:00 AM",
            payment_method: "cash",
            created_at: "2025-01-25",
        },
        {
            id: "T002",
            donor_name: "Nour Merhi",
            donor_id: "D001",
            beneficiary_name: "General Funding",
            hospital_name: "General Hospital",
            transactionType: "Donation",
            status: "failed",
            amount: 100,
            date: "2025-01-25",
            time: "10:00 AM",
            payment_method: "credit_card",
            created_at: "2025-01-25",
        },
        {
            id: "T003",
            donor_name: "Nour Merhi",
            donor_id: "D001",
            beneficiary_name: "John Doe",
            hospital_name: "AL Rasool Al Azaam Hospital",
            transactionType: "Donation",
            status: "completed",
            amount: 100,
            date: "2025-01-25",
            time: "10:00 AM",
            payment_method: "wish_money",
            created_at: "2025-01-25",
        }

    ];

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
                <FinancialDashboard metricsData={metricsData} topDonors={topDonors} activeCases={activeCases} />
            }

            {activeTab === "patient-funding" && 
                <PatientFunding patientCases={patientCases} />
            }
            {activeTab === "transactions" && 
                <Transactions transactions={transactions} />
            }


        </section>
    );
}

