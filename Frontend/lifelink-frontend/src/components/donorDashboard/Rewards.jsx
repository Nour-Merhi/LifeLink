import { TbDroplet } from "react-icons/tb";
import { BiDonateHeart } from "react-icons/bi";
import { RiHeart3Line } from "react-icons/ri";
import { IoIosLock } from "react-icons/io";

import "../../styles/Dashboard.css";
import Quality from "../../assets/imgs/quality.svg";
import Level2 from "../../assets/levelsIcons/level-2.svg";
import xpIcon from "../../assets/imgs/xpIcon.svg";
import level3 from "../../assets/levelsIcons/level-3.svg";

export default function Rewards() {
    // Sample data - replace with actual API data
    const certificates = Array.from({ length: 14 }, (_, i) => ({ id: i + 1 }));

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
                    <div key={certificate.id} class=" certificate-card"><div className="certificate-placeholder"><IoIosLock className="text-2xl text-gray-500" /></div></div>
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
                        <img src={Level2} alt="Level 2" />
                        <div>
                            <div className="xp-card-value text-purple-500">Level 2</div>
                            <div className="xp-card-label">Current level</div>
                        </div>
                    </div>

                    <div className="xp-card xp-total-card">
                        <img src={xpIcon} alt="XP Icon" className="pb-2"/>
                        <div>
                            <div className="xp-card-value text-blue-600">600</div>
                            <div className="xp-card-label">Total XP Earned</div>
                        </div>
                    </div>

                    <div className="xp-card xp-next-card">
                        <img src={level3} alt="Level 3"/>
                        <div>
                            <div className="xp-card-value !mt-[-20px] text-green-600">400</div>
                            <div className="xp-card-label">XP to Next Level</div>
                        </div>
                    </div>
                </div>
                {/* How to Earn XP */}
                <div>
                    <h2 className="earn-xp-title">How to Earn XP Through Donations</h2>
                    <div className="earn-xp-list">
                        <div className="earn-xp-item">
                            <TbDroplet className="earn-xp-icon" style={{ color: '#F12C31' }} />
                            <span className="earn-xp-name">Blood Donation</span>
                            <span className="earn-xp-amount">+150 XP</span>
                        </div>
                        <div className="earn-xp-item">
                            <RiHeart3Line className="earn-xp-icon" style={{ color: '#F12C31' }} />
                            <span className="earn-xp-name">Organ Registration</span>
                            <span className="earn-xp-amount">+200 XP</span>
                        </div>
                        <div className="earn-xp-item">
                            <BiDonateHeart className="earn-xp-icon" style={{ color: '#2196F3' }} />
                            <span className="earn-xp-name">Financial Donation ($100+)</span>
                            <span className="earn-xp-amount">+100 XP</span>
                        </div>
                        <div className="earn-xp-item">
                            <BiDonateHeart className="earn-xp-icon" style={{ color: '#4CAF50' }} />
                            <span className="earn-xp-name">Financial Donation ($50+)</span>
                            <span className="earn-xp-amount">+50 XP</span>
                        </div>
                    </div>
                </div>
            </div>

        </section>
    );
}

