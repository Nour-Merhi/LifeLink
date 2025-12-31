import { FaTint, FaArrowRight } from "react-icons/fa";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { MdOutlineLocationOn } from "react-icons/md";
import { LuPhone } from "react-icons/lu";
import { MdOutlineMail } from "react-icons/md";
import RasoolImage from "../../assets/imgs/HospitalsImage/Rasoul-Aazam-Hospital.png"
import "./RegisteredHospitals.css";

import { useNavigate } from "react-router-dom";

export default function RegisteredHospitals() {
    const navigate = useNavigate();

    // Sample hospital data - replace with actual data from API
    const hospitals = [
        {
            id: 1,
            name: "Alrasol Al Aazam Hospital",
            image: RasoolImage, // Replace with actual image path
            address: "airport street, main road",
            phone: "+961 1455456",
            email: "alrasol.alaazam@hospital.org.lb",
            bloodTypesNeeded: 3, // Number of blood type icons to show
            urgentNeeds: ["AB-ve", "B+ve"]
        },
        {
            id: 2,
            name: "Alrasol Al Aazam Hospital",
            image: RasoolImage,
            address: "airport street, main road",
            phone: "+961 1455456",
            email: "alrasol.alaazam@hospital.org.lb",
            bloodTypesNeeded: 3,
            urgentNeeds: ["AB-ve", "B+ve"]
        },
        {
            id: 3,
            name: "Alrasol Al Aazam Hospital",
            image: RasoolImage,
            address: "airport street, main road",
            phone: "+961 1455456",
            email: "alrasol.alaazam@hospital.org.lb",
            bloodTypesNeeded: 3,
            urgentNeeds: ["AB-ve", "B+ve"]
        },
        {
            id: 4,
            name: "Alrasol Al Aazam Hospital",
            image: RasoolImage,
            address: "airport street, main road",
            phone: "+961 1455456",
            email: "alrasol.alaazam@hospital.org.lb",
            bloodTypesNeeded: 3,
            urgentNeeds: ["AB-ve", "B+ve"]
        },
        {
            id: 5,
            name: "Alrasol Al Aazam Hospital",
            image: RasoolImage,
            address: "airport street, main road",
            phone: "+961 1455456",
            email: "alrasol.alaazam@hospital.org.lb",
            bloodTypesNeeded: 3,
            urgentNeeds: ["AB-ve", "B+ve"]
        },
        {
            id: 6,
            name: "Alrasol Al Aazam Hospital",
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

    return (
        <div className="partner-hospitals-section">
            <div className="partner-hospitals-header">
                <h1 className="partner-hospitals-title">Partner Hospitals</h1>
                <p className="partner-hospitals-description">
                    Our network of trusted healthcare partners working together to save lives through blood donation and organ transplant programs.
                </p>
            </div>

            <div className="partner-hospitals-grid">
                {hospitals.map((hospital) => (
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
                ))}
            </div>

            <div className="partner-hospitals-footer">
                <button 
                    className="partner-hospitals-find-more-button"
                    onClick={() => navigate("/hospitals")}
                >
                    <FaMagnifyingGlass className="partner-hospitals-find-more-icon" />
                    Find More Partner Hospitals
                </button>
            </div>
        </div>
    );
}
