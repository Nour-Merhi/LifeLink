import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IoArrowBack, IoTimeOutline } from "react-icons/io5";
import { FaTint } from "react-icons/fa";
import { MdOutlineLocationOn } from "react-icons/md";
import { LuPhone } from "react-icons/lu";
import { MdOutlineMail } from "react-icons/md";
import Navbar from "../components/Navbar";
import { useHospitals } from "../context/HospitalsContext";
import MapIntegration from "../components/MapIntegration";
import "../components/home/RegisteredHospitals.css";

import api from "../api/axios";
import { getApiBaseUrl } from "../config/api";

const API_BASE_URL = getApiBaseUrl();

export default function HospitalDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hospitals, getHospitalById } = useHospitals();
    const [hospital, setHospital] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchHospital = async () => {
            try {
                setLoading(true);
                setError("");
                
                // First try to get from context (shared hospitals)
                let hospitalData = getHospitalById(id);
                
                // If not in context, fetch from API
                if (!hospitalData) {
                    const response = await api.get(`/api/hospital/${id}`);
                    hospitalData = response.data.hospital || response.data;
                }
                
                setHospital(hospitalData);
            } catch (err) {
                console.error('Error fetching hospital:', err);
                setError(err.response?.data?.message || 'Failed to load hospital');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchHospital();
        }
    }, [id, hospitals, getHospitalById]);

    const handleDonateBlood = () => {
        navigate(`/donation/hospital-blood-donation`);
    };

    if (loading) {
        return (
            <>
                <section className="partner-hospitals-page">
                    <Navbar />
                    <div className="hospital-detail-loading" style={{ padding: '4rem', textAlign: 'center', color: '#999' }}>
                        <p>Loading hospital information...</p>
                    </div>
                </section>
            </>
        );
    }

    if (error || !hospital) {
        return (
            <>
                <section className="partner-hospitals-page">
                    <Navbar />
                    <div className="hospital-detail-error" style={{ padding: '4rem', textAlign: 'center' }}>
                        <h2>Hospital Not Found</h2>
                        <p>{error || "The hospital you're looking for doesn't exist."}</p>
                        <button onClick={() => navigate('/hospitals')} className="back-to-hospitals-btn" style={{
                            marginTop: '1rem',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#F12C31',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}>
                            Back to Hospitals
                        </button>
                    </div>
                </section>
            </>
        );
    }

    const getImageSrc = () => {
        if (!hospital?.image) return null;
        // Handle base64 images
        if (hospital.image.startsWith('data:image')) {
            return hospital.image;
        }
        // Handle full URLs
        if (hospital.image.startsWith('http://') || hospital.image.startsWith('https://')) {
            return hospital.image;
        }
        // Handle relative paths
        return `${API_BASE_URL}/${hospital.image}`;
    };

    const imageSrc = getImageSrc();
    const services = Array.isArray(hospital.services) ? hospital.services : [];
    const urgentNeeds = Array.isArray(hospital.urgent_needs) ? hospital.urgent_needs : [];

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
                        {hospital.description && (
                            <p className="hospital-detail-subtitle">{hospital.description}</p>
                        )}
                    </div>

                    {/* Hospital Image */}
                    {imageSrc ? (
                        <div className="hospital-detail-image-container">
                            <img
                                src={imageSrc}
                                alt={hospital.name}
                                className="hospital-detail-image"
                                onError={(e) => {
                                    console.error('Image failed to load:', imageSrc);
                                    e.target.src = '/image.png';
                                }}
                            />
                        </div>
                    ) : (
                        <div className="hospital-detail-image-container">
                            <div style={{
                                width: '100%',
                                height: '400px',
                                backgroundColor: '#2a2a2a',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '12px',
                                color: '#999'
                            }}>
                                No image available
                            </div>
                        </div>
                    )}

                    {/* Hospital Information Grid */}
                    <div className="hospital-detail-grid">
                        {/* Contact Information and Location Map Side by Side */}
                        <div className="hospital-detail-contact-map-wrapper">
                            {/* Contact Information */}
                            <div className="hospital-detail-section">
                                <h2 className="hospital-detail-section-title">Contact Information</h2>
                                <div className="hospital-detail-contact-list">
                                    <div className="hospital-detail-contact-item">
                                        <MdOutlineLocationOn className="hospital-detail-contact-icon" />
                                        <div>
                                            <strong>Address</strong>
                                            <p>{hospital.address || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="hospital-detail-contact-item">
                                        <LuPhone className="hospital-detail-contact-icon" />
                                        <div>
                                            <strong>Phone</strong>
                                            <p>{hospital.phone_nb || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="hospital-detail-contact-item">
                                        <MdOutlineMail className="hospital-detail-contact-icon" />
                                        <div>
                                            <strong>Email</strong>
                                            <p>{hospital.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                    {hospital.hours && (
                                        <div className="hospital-detail-contact-item">
                                            <IoTimeOutline className="hospital-detail-contact-icon" />
                                            <div>
                                                <strong>Operating Hours</strong>
                                                <p>{hospital.hours}</p>
                                            </div>
                                        </div>
                                    )}
                                    {(hospital.latitude && hospital.longitude) && (
                                        <div className="hospital-detail-contact-item">
                                            <MdOutlineLocationOn className="hospital-detail-contact-icon" />
                                            <div>
                                                <strong>Coordinates</strong>
                                                <p>Lat: {parseFloat(hospital.latitude).toFixed(6)}, Lng: {parseFloat(hospital.longitude).toFixed(6)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Location Map */}
                            {hospital.latitude && hospital.longitude && (
                                <div className="hospital-detail-section hospital-detail-map-section">
                                    <h2 className="hospital-detail-section-title">Location</h2>
                                    <div className="hospital-detail-map-container">
                                        <MapIntegration
                                            latitude={parseFloat(hospital.latitude)}
                                            longitude={parseFloat(hospital.longitude)}
                                            height="300px"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Urgent Needs */}
                        {urgentNeeds.length > 0 && (
                            <div className="hospital-detail-section">
                                <h2 className="hospital-detail-section-title">Urgent Needs</h2>
                                <div className="hospital-detail-urgent-needs">
                                    {urgentNeeds.map((bloodType, index) => (
                                        <button key={index} className="hospital-detail-urgent-button animate-pulse">
                                            {bloodType}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Hospital Information */}
                        {(hospital.established || hospital.code || hospital.status) && (
                            <div className="hospital-detail-section">
                                <h2 className="hospital-detail-section-title">Hospital Information</h2>
                                <div className="hospital-detail-info-list">
                                    {hospital.established && (
                                        <div className="hospital-detail-info-item">
                                            <strong>Established:</strong>
                                            <span>{hospital.established}</span>
                                        </div>
                                    )}
                                    {hospital.status && (
                                        <div className="hospital-detail-info-item">
                                            <strong>Status:</strong>
                                            <span style={{
                                                color: hospital.status === 'verified' ? '#16a34a' : '#dc2626',
                                                fontWeight: '600'
                                            }}>
                                                {hospital.status === 'verified' ? 'Verified' : 'Unverified'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Services */}
                        {services.length > 0 && (
                            <div className="hospital-detail-section hospital-detail-section-full">
                                <h2 className="hospital-detail-section-title">Services Offered</h2>
                                <ul className="hospital-detail-services-list">
                                    {services.map((service, index) => (
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
        </>
    );
}

