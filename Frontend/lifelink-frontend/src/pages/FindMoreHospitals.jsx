import { useState } from "react";
import { FaTint, FaArrowRight } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import { MdOutlineLocationOn } from "react-icons/md";
import { LuPhone } from "react-icons/lu";
import { MdOutlineMail } from "react-icons/md";
import Navbar from "../components/Navbar";
import { useHospitals } from "../context/HospitalsContext";
import "../components/home/RegisteredHospitals.css";
import { useNavigate } from "react-router-dom";

export default function FindMoreHospitals() {
    const navigate = useNavigate();
    const { hospitals, loading, error } = useHospitals();
    const [searchTerm, setSearchTerm] = useState("");

    const handleDonateBlood = (hospitalId) => {
        navigate(`/donation/hospital-blood-donation`);
    };

    const handleLearnMore = (hospitalId) => {
        navigate(`/hospitals/${hospitalId}`);
    };

    // Filter hospitals based on search term
    const filteredHospitals = hospitals.filter(hospital =>
        hospital.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospital.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospital.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospital.phone_nb?.includes(searchTerm)
    );

    return (
        <>
            <section className="partner-hospitals-page">
                <Navbar />
                <div className="partner-hospitals-section">
                    <div className="partner-hospitals-header">
                        <div className="partner-hospitals-header-content">
                            <h1 className="partner-hospitals-title">Partner Hospitals</h1>
                            <p className="partner-hospitals-description">
                                Our network of trusted healthcare partners working together to save lives through blood donation and organ transplant programs.
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div className="partner-hospitals-search">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search hospitals..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>
                            <p>Loading hospitals...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <div style={{ textAlign: 'center', padding: '4rem', color: '#F12C31' }}>
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Hospitals Grid */}
                    {!loading && !error && (
                        <div className="partner-hospitals-grid hospital-grid">
                            {filteredHospitals.length > 0 ? (
                                filteredHospitals.map((hospital) => {
                                    const imageSrc = hospital.image 
                                        ? (hospital.image.startsWith('http') ? hospital.image : `/image.png`)
                                        : '/image.png';
                                    const urgentNeeds = hospital.urgent_needs || [];
                                    
                                    return (
                                        <div key={hospital.id} className="partner-hospital-card">
                                            <div className="partner-hospital-image">
                                                <img 
                                                    src={imageSrc} 
                                                    alt={hospital.name}
                                                    onError={(e) => {
                                                        e.target.src = '/image.png';
                                                    }}
                                                />
                                            </div>

                                            <div className="partner-hospital-content">
                                                <h2 className="partner-hospital-name">{hospital.name}</h2>

                                                <div className="partner-hospital-contact">
                                                    <div className="partner-hospital-contact-item">
                                                        <MdOutlineLocationOn className="partner-hospital-contact-icon" />
                                                        <span>{hospital.address}</span>
                                                    </div>
                                                    <div className="partner-hospital-contact-item">
                                                        <LuPhone className="partner-hospital-contact-icon" />
                                                        <span>{hospital.phone_nb}</span>
                                                    </div>
                                                    <div className="partner-hospital-contact-item">
                                                        <MdOutlineMail className="partner-hospital-contact-icon" />
                                                        <span>{hospital.email}</span>
                                                    </div>
                                                </div>

                                                {urgentNeeds.length > 0 && (
                                                    <div className="partner-hospital-urgent-needs">
                                                        <div className="partner-hospital-urgent-needs-label">Urgent Needs</div>
                                                        <div className="partner-hospital-urgent-needs-buttons">
                                                            {urgentNeeds.map((bloodType, index) => (
                                                                <button key={index} className="partner-hospital-urgent-button animate-pulse">
                                                                    {bloodType}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="partner-hospital-actions">
                                                    <button 
                                                        className="partner-hospital-donate-button"
                                                        onClick={() => handleDonateBlood(hospital.id)}
                                                    >
                                                        <FaTint className="partner-hospital-button-icon" />
                                                        Donate Blood
                                                    </button>
                                                    <button 
                                                        className="partner-hospital-learn-button"
                                                        onClick={() => handleLearnMore(hospital.id)}
                                                    >
                                                        Learn More 
                                                        <FaArrowRight className="partner-hospital-button-icon" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="partner-hospitals-no-results">
                                    <p>{searchTerm ? 'No hospitals found matching your search.' : 'No hospitals available at the moment.'}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
