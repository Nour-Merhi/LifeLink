import { useState, useEffect } from "react";
import { TbDroplet } from "react-icons/tb";
import { BiDonateHeart } from "react-icons/bi";
import { RiHeart3Line } from "react-icons/ri";
import { IoIosLock } from "react-icons/io";

import "../../styles/Dashboard.css";
import Quality from "../../assets/imgs/quality.svg";
import Level2 from "../../assets/levelsIcons/level-2.svg";
import xpIcon from "../../assets/imgs/xpIcon.svg";
import level3 from "../../assets/levelsIcons/level-3.svg";
import api from "../../api/axios";

export default function Rewards() {
    const [rewardsData, setRewardsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchRewardsData = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await api.get("/api/donor/rewards");
                setRewardsData(response.data);
            } catch (err) {
                console.error("Error fetching rewards data:", err);
                setError(err.response?.data?.message || "Failed to load rewards data");
            } finally {
                setLoading(false);
            }
        };

        fetchRewardsData();
    }, []);

    // Helper function to get level icon (you may need to adjust based on available icons)
    const getLevelIcon = (level) => {
        // For now, using Level2 for all levels - you can implement logic to get different icons
        return Level2;
    };

    // Helper function to format XP amounts
    const formatXpAmount = (amount) => {
        if (typeof amount === 'string') return amount;
        return `+${amount} XP`;
    };

    // Helper function to get certificate image/icon based on certificate type and level
    const getCertificateImage = (certificate) => {
        if (certificate.type === 'level') {
            // For level certificates, use the level icon
            // Certificate ID corresponds to level number (1-20)
            const level = certificate.id;
            // Since we only have level-2 and level-3 icons, use level-2 for levels 1-2, level-3 for 3+
            if (level <= 2) {
                return Level2;
            } else {
                return level3;
            }
        } else if (certificate.type === 'xp_milestone') {
            // For XP milestones, use level icon as placeholder
            return level3;
        }
        return Level2;
    };

    if (loading) {
        return (
            <section className="donor-section">
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading rewards...</p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="donor-section">
                <div className="flex items-center justify-center h-64">
                    <p className="text-red-500">Error: {error}</p>
                </div>
            </section>
        );
    }

    if (!rewardsData) {
        return (
            <section className="donor-section">
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">No rewards data available</p>
                </div>
            </section>
        );
    }

    const { level_progress = {}, xp_rules = [], certificates = [] } = rewardsData;

    return (
        <section className="donor-section">
            <div className="donor-container max-w-[450px] mb-5 p-5">
                <div className="certificates-header">
                    <img src={Quality} alt="Quality" className="quality-1" />
                    <div>
                        <h2 className="certificates-title">Your Certificates</h2>
                        <p className="certificates-description">Achievements and recognition for your donations</p>
                    </div>
                </div>
            </div>

            {/* Certificates Section */}
            <div className="mb-8 certificates-grid">
                {certificates.map((certificate) => (
                    <div key={certificate.id} className="certificate-card">
                        {certificate.unlocked ? (
                            <div className="certificate-placeholder certificate-unlocked">
                                <img 
                                    src={getCertificateImage(certificate)} 
                                    alt={certificate.name}
                                    className="certificate-image"
                                />
                            </div>
                        ) : (
                            <div className="certificate-placeholder">
                                <IoIosLock className="text-2xl text-gray-500" />
                                <p className="text-xs mt-2 text-center text-gray-400">{certificate.requirement}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            {/* Level Progress & XP System */}
            <div className="donor-container mt-5 p-10">
                <div className="xp-section-header">
                    <h2 className="xp-section-title">Level Progress & Xp System</h2>
                    <p className="xp-section-subtitle">Earn XP for each donate and unlock new levels</p>
                </div>

                <div className="xp-progress-cards">
                    <div className="xp-card level-card">
                        <img src={getLevelIcon(level_progress.current_level)} alt={`Level ${level_progress.current_level}`} />
                        <div>
                            <div className="xp-card-value text-purple-500">Level {level_progress.current_level || 1}</div>
                            <div className="xp-card-label">Current level</div>
                        </div>
                    </div>

                    <div className="xp-card xp-total-card">
                        <img src={xpIcon} alt="XP Icon" className="pb-2"/>
                        <div>
                            <div className="xp-card-value text-blue-600">{level_progress.current_xp || 0}</div>
                            <div className="xp-card-label">Total XP Earned</div>
                        </div>
                    </div>

                    <div className="xp-card xp-next-card">
                        <img src={level3} alt={`Level ${level_progress.next_level || 2}`}/>
                        <div>
                            <div className="xp-card-value !mt-[-20px] text-green-600">{level_progress.xp_until_next_level || 1000}</div>
                            <div className="xp-card-label">XP to Next Level</div>
                        </div>
                    </div>
                </div>

                {/* How to Earn XP */}
                <div>
                    <h2 className="earn-xp-title">How to Earn XP Through Donations</h2>
                    <div className="earn-xp-list">
                        {xp_rules.map((rule, index) => {
                            // Map rule names to icons
                            let icon = null;
                            let iconColor = '#F12C31';
                            
                            if (rule.name.toLowerCase().includes('blood')) {
                                icon = <TbDroplet className="earn-xp-icon" style={{ color: iconColor }} />;
                            } else if (rule.name.toLowerCase().includes('organ')) {
                                icon = <RiHeart3Line className="earn-xp-icon" style={{ color: iconColor }} />;
                            } else if (rule.name.toLowerCase().includes('financial')) {
                                icon = <BiDonateHeart className="earn-xp-icon" style={{ color: '#2196F3' }} />;
                            }

                            return (
                                <div key={index} className="earn-xp-item">
                                    {icon}
                                    <span className="earn-xp-name">{rule.name}</span>
                                    <span className="earn-xp-amount">{formatXpAmount(rule.xp_amount)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
