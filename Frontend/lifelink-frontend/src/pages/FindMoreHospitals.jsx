import { useState } from "react";
import { FaTint, FaArrowRight } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import { MdOutlineLocationOn } from "react-icons/md";
import { LuPhone } from "react-icons/lu";
import { MdOutlineMail } from "react-icons/md";
import RasoolImage from "../assets/imgs/HospitalsImage/Rasoul-Aazam-Hospital.png";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../components/home/RegisteredHospitals.css";
import { useNavigate } from "react-router-dom";

export default function FindMoreHospitals() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");

    // Sample hospital data - replace with actual data from API
    // This page should show more hospitals (can be paginated or show all)
    const hospitals = [
        {
            id: 1,
            name: "Rasoul Aazam Hospital",
            image: RasoolImage,
            address: "airport street, main road",
            phone: "+961 1455456",
            email: "alrasol.alaazam@hospital.org.lb",
            bloodTypesNeeded: 3,
            urgentNeeds: ["AB-ve", "B+ve"]
        },
        {
            id: 2,
            name: "Rasoul Aazam Hospital",
            image: RasoolImage,
            address: "airport street, main road",
            phone: "+961 1455456",
            email: "alrasol.alaazam@hospital.org.lb",
            bloodTypesNeeded: 3,
            urgentNeeds: ["AB-ve", "B+ve"]
        },
        {
            id: 3,
            name: "Rasoul Aazam Hospital",
            image: RasoolImage,
            address: "airport street, main road",
            phone: "+961 1455456",
            email: "alrasol.alaazam@hospital.org.lb",
            bloodTypesNeeded: 3,
            urgentNeeds: ["AB-ve", "B+ve"]
        },
        {
            id: 4,
            name: "Rasoul Aazam Hospital",
            image: RasoolImage,
            address: "airport street, main road",
            phone: "+961 1455456",
            email: "alrasol.alaazam@hospital.org.lb",
            bloodTypesNeeded: 3,
            urgentNeeds: ["AB-ve", "B+ve"]
        },
        {
            id: 5,
            name: "Rasoul Aazam Hospital",
            image: RasoolImage,
            address: "airport street, main road",
            phone: "+961 1455456",
            email: "alrasol.alaazam@hospital.org.lb",
            bloodTypesNeeded: 3,
            urgentNeeds: ["AB-ve", "B+ve"]
        },
        {
            id: 6,
            name: "Rasoul Aazam Hospital",
            image: RasoolImage,
            address: "airport street, main road",
            phone: "+961 1455456",
            email: "alrasol.alaazam@hospital.org.lb",
            bloodTypesNeeded: 3,
            urgentNeeds: ["AB-ve", "B+ve"]
        },
        {
            id: 7,
            name: "Rasoul Aazam Hospital",
            image: RasoolImage,
            address: "airport street, main road",
            phone: "+961 1455456",
            email: "alrasol.alaazam@hospital.org.lb",
            bloodTypesNeeded: 3,
            urgentNeeds: ["AB-ve", "B+ve"]
        },
        {
            id: 8,
            name: "Rasoul Aazam Hospital",
            image: RasoolImage,
            address: "airport street, main road",
            phone: "+961 1455456",
            email: "alrasol.alaazam@hospital.org.lb",
            bloodTypesNeeded: 3,
            urgentNeeds: ["AB-ve", "B+ve"]
        },
        {
            id: 9,
            name: "Rasoul Aazam Hospital",
            image: RasoolImage,
            address: "airport street, main road",
            phone: "+961 1455456",
            email: "alrasol.alaazam@hospital.org.lb",
            bloodTypesNeeded: 3,
            urgentNeeds: ["AB-ve", "B+ve"]
        },
        {
            id: 10,
            name: "Rasoul Aazam Hospital",
            image: RasoolImage,
            address: "airport street, main road",
            phone: "+961 1455456",
            email: "alrasol.alaazam@hospital.org.lb",
            bloodTypesNeeded: 3,
            urgentNeeds: ["AB-ve", "B+ve"]
        },
        {
            id: 11,
            name: "Rasoul Aazam Hospital",
            image: RasoolImage,
            address: "airport street, main road",
            phone: "+961 1455456",
            email: "alrasol.alaazam@hospital.org.lb",
            bloodTypesNeeded: 3,
            urgentNeeds: ["AB-ve", "B+ve"]
        },
        {
            id: 12,
            name: "Rasoul Aazam Hospital",
            image: RasoolImage,
            address: "airport street, main road",
            phone: "+961 1455456",
            email: "alrasol.alaazam@hospital.org.lb",
            bloodTypesNeeded: 3,
            urgentNeeds: ["AB-ve", "B+ve"]
        }
    ];

    const handleDonateBlood = (hospitalId) => {
        navigate(`/donation/hospital-blood-donation`);
    };

    const handleLearnMore = (hospitalId) => {
        navigate(`/hospitals/${hospitalId}`);
    };

    // Filter hospitals based on search term
    const filteredHospitals = hospitals.filter(hospital =>
        hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospital.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospital.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospital.phone.includes(searchTerm)
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

                    <div className="partner-hospitals-grid hospital-grid">
                        {filteredHospitals.length > 0 ? (
                            filteredHospitals.map((hospital) => (
                        <div key={hospital.id} className="partner-hospital-card">
                            <div className="partner-hospital-image">
                                <img src={hospital.image} alt={hospital.name} />
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
                                        <span>{hospital.phone}</span>
                                    </div>
                                    <div className="partner-hospital-contact-item">
                                        <MdOutlineMail className="partner-hospital-contact-icon" />
                                        <span>{hospital.email}</span>
                                    </div>
                                </div>

                                <div className="partner-hospital-blood-types">
                                    <div className="partner-hospital-blood-types-label">Blood Type Needed</div>
                                    <div className="partner-hospital-blood-types-icons">
                                        {Array.from({ length: hospital.bloodTypesNeeded }).map((_, index) => (
                                            <div key={index} className="partner-hospital-blood-type-icon">{index + 1}</div>
                                        ))}
                                    </div>
                                </div>

                                <div className="partner-hospital-urgent-needs">
                                    <div className="partner-hospital-urgent-needs-label">Urgent Needs</div>
                                    <div className="partner-hospital-urgent-needs-buttons">
                                        {hospital.urgentNeeds.map((bloodType, index) => (
                                            <button key={index} className="partner-hospital-urgent-button animate-pulse">
                                                {bloodType}
                                            </button>
                                        ))}
                                    </div>
                                </div>

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
                            ))
                        ) : (
                            <div className="partner-hospitals-no-results">
                                <p>No hospitals found matching your search.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
            <Footer />
        </>
    );
}

