import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { FaTint } from "react-icons/fa";
import { MdOutlineLocationOn } from "react-icons/md";
import { LuPhone } from "react-icons/lu";
import { MdOutlineMail } from "react-icons/md";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RasoolImage from "../assets/imgs/HospitalsImage/Rasoul-Aazam-Hospital.png";
import "../components/home/RegisteredHospitals.css";

export default function HospitalDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [hospital, setHospital] = useState(null);
    const [loading, setLoading] = useState(true);

    // Sample hospitals data - in production, this would come from an API
    const hospitalsData = [
        {
            id: 1,
            name: "Rasoul Aazam Hospital",
            image: RasoolImage,
            address: "airport street, main road",
            phone: "+961 1455456",
            email: "alrasol.alaazam@hospital.org.lb",
            bloodTypesNeeded: ["A+", "B+", "O+"],
            urgentNeeds: ["AB-ve", "B+ve"],
            description: "Rasoul Aazam Hospital is a leading healthcare institution dedicated to providing exceptional medical care and serving our community through comprehensive blood donation and organ transplant programs. We are committed to saving lives and improving health outcomes for all patients.",
            services: [
                "Blood Donation Center",
                "Organ Transplant Services",
                "Emergency Care",
                "Surgery Department",
                "Intensive Care Unit"
            ],
            hours: "Mon-Fri: 8AM-8PM",
            established: "1985"
        },
        // Add more hospitals with full details as needed
    ];

    useEffect(() => {
        // Simulate API call - in production, fetch from backend
        const foundHospital = hospitalsData.find(h => h.id === parseInt(id));
        if (foundHospital) {
            setHospital(foundHospital);
        }
        setLoading(false);
    }, [id]);

    const handleDonateBlood = () => {
        navigate(`/donation/hospital-blood-donation`);
    };

    if (loading) {
        return (
            <>
                <section className="partner-hospitals-page">
                    <Navbar />
                    <div className="hospital-detail-loading">
                        <p>Loading hospital information...</p>
                    </div>
                </section>
            </>
        );
    }

    if (!hospital) {
        return (
            <>
                <section className="partner-hospitals-page">
                    <Navbar />
                    <div className="hospital-detail-error">
                        <h2>Hospital Not Found</h2>
                        <p>The hospital you're looking for doesn't exist.</p>
                        <button onClick={() => navigate('/hospitals')} className="back-to-hospitals-btn">
                            Back to Hospitals
                        </button>
                    </div>
                </section>
            </>
        );
    }

    return (
        <>
            <section className="partner-hospitals-page">
                <Navbar />
                <div className="hospital-detail-container">
                    {/* Back Button */}
                    <button onClick={() => navigate('/hospitals')} className="hospital-detail-back-button">
                        <IoArrowBack />
                        Back to Hospitals
                    </button>

                    {/* Hospital Header */}
                    <div className="hospital-detail-header">
                        <h1 className="hospital-detail-title">{hospital.name}</h1>
                        <p className="hospital-detail-subtitle">{hospital.description}</p>
                    </div>

                    {/* Hospital Image */}
                    <div className="hospital-detail-image-container">
                        <img
                            src={hospital.image}
                            alt={hospital.name}
                            className="hospital-detail-image"
                            onError={(e) => {
                                e.target.src = '/placeholder-hospital.jpg';
                            }}
                        />
                    </div>

                    {/* Hospital Information Grid */}
                    <div className="hospital-detail-grid">
                        {/* Contact Information */}
                        <div className="hospital-detail-section">
                            <h2 className="hospital-detail-section-title">Contact Information</h2>
                            <div className="hospital-detail-contact-list">
                                <div className="hospital-detail-contact-item">
                                    <MdOutlineLocationOn className="hospital-detail-contact-icon" />
                                    <div>
                                        <strong>Address</strong>
                                        <p>{hospital.address}</p>
                                    </div>
                                </div>
                                <div className="hospital-detail-contact-item">
                                    <LuPhone className="hospital-detail-contact-icon" />
                                    <div>
                                        <strong>Phone</strong>
                                        <p>{hospital.phone}</p>
                                    </div>
                                </div>
                                <div className="hospital-detail-contact-item">
                                    <MdOutlineMail className="hospital-detail-contact-icon" />
                                    <div>
                                        <strong>Email</strong>
                                        <p>{hospital.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Blood Types Needed */}
                        <div className="hospital-detail-section">
                            <h2 className="hospital-detail-section-title">Blood Types Needed</h2>
                            <div className="hospital-detail-blood-types">
                                {hospital.bloodTypesNeeded.map((bloodType, index) => (
                                    <div key={index} className="hospital-detail-blood-type-badge">
                                        {bloodType}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Urgent Needs */}
                        {hospital.urgentNeeds && hospital.urgentNeeds.length > 0 && (
                            <div className="hospital-detail-section">
                                <h2 className="hospital-detail-section-title">Urgent Needs</h2>
                                <div className="hospital-detail-urgent-needs">
                                    {hospital.urgentNeeds.map((bloodType, index) => (
                                        <button key={index} className="hospital-detail-urgent-button animate-pulse">
                                            {bloodType}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Additional Information */}
                        <div className="hospital-detail-section">
                            <h2 className="hospital-detail-section-title">Hospital Information</h2>
                            <div className="hospital-detail-info-list">
                                {hospital.hours && (
                                    <div className="hospital-detail-info-item">
                                        <strong>Operating Hours:</strong>
                                        <span>{hospital.hours}</span>
                                    </div>
                                )}
                                {hospital.established && (
                                    <div className="hospital-detail-info-item">
                                        <strong>Established:</strong>
                                        <span>{hospital.established}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Services */}
                        {hospital.services && hospital.services.length > 0 && (
                            <div className="hospital-detail-section hospital-detail-section-full">
                                <h2 className="hospital-detail-section-title">Services Offered</h2>
                                <ul className="hospital-detail-services-list">
                                    {hospital.services.map((service, index) => (
                                        <li key={index}>{service}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Action Button */}
                        <div className="hospital-detail-section hospital-detail-section-full">
                            <button 
                                className="hospital-detail-donate-button"
                                onClick={handleDonateBlood}
                            >
                                <FaTint className="hospital-detail-button-icon" />
                                Donate Blood at This Hospital
                            </button>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </>
    );
}

