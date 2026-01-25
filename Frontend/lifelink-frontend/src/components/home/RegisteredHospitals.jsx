import { FaTint, FaArrowRight } from "react-icons/fa";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { MdOutlineLocationOn } from "react-icons/md";
import { LuPhone } from "react-icons/lu";
import { MdOutlineMail } from "react-icons/md";
import { useHospitals } from "../../context/HospitalsContext";
import { useNavigate } from "react-router-dom";
import AnimatedSection from "../common/AnimatedSection";
import "./RegisteredHospitals.css";

export default function RegisteredHospitals() {
    const navigate = useNavigate();
    const { hospitals, loading } = useHospitals();

    // Limit to 6 hospitals for home page
    const displayedHospitals = hospitals.slice(0, 6);

    const handleDonateBlood = (hospitalId) => {
        navigate(`/donation/hospital-blood-donation`);
    };

    const handleLearnMore = (hospitalId) => {
        navigate(`/hospitals/${hospitalId}`);
    };

    return (
        <AnimatedSection className="partner-hospitals-section" animation="fade-up">
            <div className="partner-hospitals-header">
                <h1 className="partner-hospitals-title">Partner Hospitals</h1>
                <p className="partner-hospitals-description">
                    Our network of trusted healthcare partners working together to save lives through blood donation and organ transplant programs.
                </p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                    <p>Loading hospitals...</p>
                </div>
            ) : (
                <div className="partner-hospitals-grid">
                    {displayedHospitals.length > 0 ? (
                        displayedHospitals.map((hospital) => {
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
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                            <p>No hospitals available at the moment.</p>
                        </div>
                    )}
                </div>
            )}

            <div className="partner-hospitals-footer">
                <button 
                    className="partner-hospitals-find-more-button"
                    onClick={() => navigate("/hospitals")}
                >
                    <FaMagnifyingGlass className="partner-hospitals-find-more-icon" />
                    Find More Partner Hospitals
                </button>
            </div>
        </AnimatedSection>
    );
}
