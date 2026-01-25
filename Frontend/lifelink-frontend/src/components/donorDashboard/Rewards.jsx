import { useState, useEffect } from "react";
import { TbDroplet } from "react-icons/tb";
import { BiDonateHeart } from "react-icons/bi";
import { RiHeart3Line } from "react-icons/ri";
import { MdCardGiftcard } from "react-icons/md";
import { HiDownload } from "react-icons/hi";

import "../../styles/Dashboard.css";
import Quality from "../../assets/imgs/quality.svg";
import Level2 from "../../assets/levelsIcons/level-2.svg";
import xpIcon from "../../assets/imgs/xpIcon.svg";
import level3 from "../../assets/levelsIcons/level-3.svg";
import api from "../../api/axios";

export default function Rewards() {
    const [rewardsData, setRewardsData] = useState(null);
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [certificatesLoading, setCertificatesLoading] = useState(true);
    const [error, setError] = useState("");
    const [certificatesError, setCertificatesError] = useState("");

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

        const fetchCertificates = async () => {
            try {
                setCertificatesLoading(true);
                setCertificatesError("");
                const response = await api.get("/api/donor/certificates");
                setCertificates(response.data.certificates || []);
            } catch (err) {
                console.error("Error fetching certificates:", err);
                setCertificatesError(err.response?.data?.message || "Failed to load certificates");
            } finally {
                setCertificatesLoading(false);
            }
        };

        fetchRewardsData();
        fetchCertificates();
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

    // Helper function to format date
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
            return "N/A";
        }
    };

    // Download certificate image
    const downloadCertificate = async (certificate) => {
        if (!certificate.id) return;
        
        try {
            // Use the API endpoint to download with proper headers
            const response = await api.get(`/api/donor/certificates/${certificate.id}/download`, {
                responseType: 'blob', // Important: tell axios to expect binary data
            });
            
            // response.data is already a Blob when responseType is 'blob'
            const blob = response.data;
            
            // Create object URL from blob
            const blobUrl = URL.createObjectURL(blob);
            
            // Create download link
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `certificate.png`;
            link.style.display = 'none';
            
            // Append to body
            document.body.appendChild(link);
            
            // Trigger download
            link.click();
            
            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(blobUrl);
            }, 100);
        } catch (error) {
            console.error('Error downloading certificate:', error);
            alert('Failed to download certificate. Please try again.');
        }
    };

    const { level_progress = {}, xp_rules = [] } = rewardsData || {};

    return (
        <section className="donor-section">
            <div className="donor-container max-w-[450px] mb-5 p-5">
                <div className="certificates-header">
                    <img src={Quality} alt="Quality" className="quality-1" />
                    <div>
                        <h2 className="certificates-title">Your Certificates</h2>
                        <p className="certificates-description">Recognition certificates issued by administrators</p>
                    </div>
                </div>
            </div>

            {/* Certificates Section - Modern Design */}
            {certificatesLoading ? (
                <div className="flex items-center justify-center h-64 mb-8">
                    <p className="text-gray-500">Loading certificates...</p>
                </div>
            ) : certificatesError ? (
                <div className="flex items-center justify-center h-64 mb-8">
                    <p className="text-red-500">Error: {certificatesError}</p>
                </div>
            ) : certificates.length === 0 ? (
                <div className="donor-container mb-8 p-8 text-center">
                    <MdCardGiftcard className="mx-auto text-6xl text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">No certificates yet</p>
                    <p className="text-gray-400 text-sm mt-2">Certificates will appear here once issued by administrators</p>
                </div>
            ) : (
                <div className="mb-8 modern-certificates-grid">
                    {certificates.map((certificate) => (
                        <div key={certificate.id} className="modern-certificate-card">
                            {certificate.image_url ? (
                                <div className="modern-certificate-image-wrapper">
                                    <img 
                                        src={certificate.image_url} 
                                        alt={certificate.description_option || "Certificate"}
                                        className="modern-certificate-image"
                                    />
                                    <div className="modern-certificate-overlay">
                                        <button
                                            onClick={() => downloadCertificate(certificate)}
                                            className="modern-certificate-download-btn"
                                            title="Download certificate"
                                        >
                                            <HiDownload />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="modern-certificate-placeholder">
                                    <MdCardGiftcard className="text-5xl text-gray-300 mb-2" />
                                    <p className="text-sm text-gray-400">No image</p>
                                </div>
                            )}
                            <div className="modern-certificate-info">
                                <h3 className="modern-certificate-title">{certificate.description_option || "Certificate"}</h3>
                                <p className="modern-certificate-date">{formatDate(certificate.certificate_date || certificate.created_at)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Level Progress & XP System */}
            {loading ? (
                <div className="flex items-center justify-center h-64 mt-5">
                    <p className="text-gray-500">Loading rewards...</p>
                </div>
            ) : error ? (
                <div className="flex items-center justify-center h-64 mt-5">
                    <p className="text-red-500">Error: {error}</p>
                </div>
            ) : !rewardsData ? (
                <div className="flex items-center justify-center h-64 mt-5">
                    <p className="text-gray-500">No rewards data available</p>
                </div>
            ) : (
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
                                    <span className="earn-xp-amount">{ index !== 3 ?formatXpAmount(rule.xp_amount) : "Dependant on Donation Amount"}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            )}
        </section>
    );
}
