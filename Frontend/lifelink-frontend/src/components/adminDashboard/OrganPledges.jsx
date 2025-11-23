import { useState, useEffect } from "react";
import axios from "axios";

import { RiUserHeartLine } from "react-icons/ri";
import { MdOutlineHealthAndSafety } from "react-icons/md";
import { PiHeartbeat, PiHeartbeatFill } from "react-icons/pi";
import { PiSealCheckLight } from "react-icons/pi";


import LivingDonors from "./organPledgesComponents/LivingDonors";
import AfterDeathPledges from "./organPledgesComponents/AfterDeathPledges";

export default function OrganPledges() {
    const [activeTab, setActiveTab] = useState("living-donors");
    const [livingDonorsData, setLivingDonorsData] = useState([]);
    const [afterDeathPledgesData, setAfterDeathPledgesData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingAfterDeath, setLoadingAfterDeath] = useState(false);
    const [error, setError] = useState("");
    const [errorAfterDeath, setErrorAfterDeath] = useState("");

    // Calculate metrics from data
    const livingDonorsMetrics = [
        {
            title: "Total Pledges",
            value: livingDonorsData.length.toString(),
            change: "All time pledges",
            icon: <RiUserHeartLine />,
            bgColor: "#EAFFE5",
            iconColor: "#16a34a"
        },
        {
            title: "Active Pledges",
            value: livingDonorsData.filter(d => d.medical_status === 'cleared' || d.medical_status === 'in_progress').length.toString(),
            change: "Cleared or in progress",
            icon: <PiHeartbeat />,
            bgColor: "#F5E9FF",
            iconColor: "#6132BE"
        },
        {
            title: "Cleared Pledges",
            value: livingDonorsData.filter(d => d.medical_status === 'cleared').length.toString(),
            change: "Medically cleared",
            icon: <MdOutlineHealthAndSafety />,
            bgColor: "#EBEAFF",
            iconColor: "#285BFF"
        },
        {
            title: "This Month Registrations",
            value: livingDonorsData.filter(d => {
                if (!d.created_at) return false;
                const createdDate = new Date(d.created_at);
                const now = new Date();
                return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
            }).length.toString(),
            change: "New this month",
            icon: <PiSealCheckLight />,
            bgColor: "#FFE5E5",
            iconColor: "#F12C31"
        }
    ];

    // Fetch data from backend based on active tab
    useEffect(() => {
        if (activeTab === "living-donors") {
            fetchLivingDonors();
        } else if (activeTab === "after-death") {
            fetchAfterDeathPledges();
        }
    }, [activeTab]);

    const fetchLivingDonors = () => {
        setLoading(true);
        setError("");
        axios.get("http://localhost:8000/api/admin/dashboard/living-donors")
            .then(res => {
                setLivingDonorsData(res.data.living_donors || []);
            })
            .catch(err => {
                console.error("Error fetching living donors:", err);
                setError(err.response?.data?.message || "Failed to fetch living donors");
                setLivingDonorsData([]);
            })
            .finally(() => setLoading(false));
    };

    const fetchAfterDeathPledges = () => {
        setLoadingAfterDeath(true);
        setErrorAfterDeath("");
        axios.get("http://localhost:8000/api/admin/dashboard/after-death-pledges")
            .then(res => {
                setAfterDeathPledgesData(res.data.after_death_pledges || []);
            })
            .catch(err => {
                console.error("Error fetching after-death pledges:", err);
                setErrorAfterDeath(err.response?.data?.message || "Failed to fetch after-death pledges");
                setAfterDeathPledgesData([]);
            })
            .finally(() => setLoadingAfterDeath(false));
    };

    // Calculate metrics from data
    const afterDeathMetrics = [
        {
            title: "Total Pledges",
            value: afterDeathPledgesData.length.toString(),
            change: "All time pledges",
            icon: <RiUserHeartLine />,
            bgColor: "#EAFFE5",
            iconColor: "#16a34a"
        },
        {
            title: "Active Pledges",
            value: afterDeathPledgesData.filter(p => p.status === 'active').length.toString(),
            change: "Currently active",
            icon: <PiHeartbeat />,
            bgColor: "#F5E9FF",
            iconColor: "#6132BE"
        },
        {
            title: "Cancelled Pledges",
            value: afterDeathPledgesData.filter(p => p.status === 'cancelled').length.toString(),
            change: "Cancelled pledges",
            icon: <MdOutlineHealthAndSafety />,
            bgColor: "#EBEAFF",
            iconColor: "#285BFF"
        },
        {
            title: "This Month Registrations",
            value: afterDeathPledgesData.filter(p => {
                if (!p.created_at) return false;
                const createdDate = new Date(p.created_at);
                const now = new Date();
                return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
            }).length.toString(),
            change: "New this month",
            icon: <PiSealCheckLight />,
            bgColor: "#FFE5E5",
            iconColor: "#F12C31"
        }
    ];

    return (
        <section className="financial-section">
            {/* Header */}
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <PiHeartbeatFill className="icon-size"/>
                        <h2>Organ Coordination</h2>
                    </div>
                    <p>Manage living donor applications, after-death registry, and organ matching</p>
                </div>
                { activeTab === "living-donors" && 
                    <div>
                        <h3>Total Pledges: {livingDonorsMetrics[0].value}</h3>
                    </div>
                }
                { activeTab === "after-death" && 
                    <div>
                        <h3>Total Pledges: {afterDeathMetrics[0].value}</h3>
                    </div>
                }
            </div>

            {/* Navigation Tabs */}
            <div className="financial-tabs">
                <button
                    className={activeTab === "living-donors" ? "tab-active" : "tab-inactive"}
                    onClick={() => setActiveTab("living-donors")}
                >
                    Living Donors
                </button>
                <button
                    className={activeTab === "after-death" ? "tab-active" : "tab-inactive"}
                    onClick={() => setActiveTab("after-death")}
                >
                    After Death Pledges
                </button>
                <button
                    className={activeTab === "matching" ? "tab-active" : "tab-inactive"}
                    onClick={() => setActiveTab("matching")}
                >
                    Matching Interface
                </button>
            </div>

          

            {activeTab === "living-donors" && 
                <LivingDonors 
                    livingDonors={livingDonorsData} 
                    metricsData={livingDonorsMetrics}
                    loading={loading}
                    error={error}
                    onRefresh={fetchLivingDonors}
                />
            }

            {activeTab === "after-death" && 
                <AfterDeathPledges 
                    afterDeathPledges={afterDeathPledgesData} 
                    metricsData={afterDeathMetrics}
                    loading={loadingAfterDeath}
                    error={errorAfterDeath}
                    onRefresh={fetchAfterDeathPledges}
                />
            }

            {activeTab === "matching" && 
                <div style={{ padding: "20px", textAlign: "center" }}>
                    <h3>Matching Interface - Coming Soon</h3>
                </div>
            }

        </section>
    );
}

