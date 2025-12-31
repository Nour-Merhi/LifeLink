import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
    IoArrowBack,
    IoLocationOutline,
    IoCallOutline,
    IoMailOutline,
    IoTimeOutline,
    IoPersonOutline
} from "react-icons/io5";
import { FaHospital } from "react-icons/fa";
import { SpinnerDotted } from 'spinners-react';
import axios from 'axios';
import MapIntegration from "../MapIntegration";
import "../../styles/Dashboard.css";

export default function HospitalDetail() {
    const { hospitalCode } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [hospitalData, setHospitalData] = useState(null);

    useEffect(() => {
        fetchHospitalDetails();
    }, [hospitalCode]);

    const fetchHospitalDetails = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await axios.get(
                `http://localhost:8000/api/admin/dashboard/hospitals/${hospitalCode}`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );
            setHospitalData(response.data.hospital || response.data);
        } catch (err) {
            console.error('Error fetching hospital details:', err);
            setError(err.response?.data?.message || "Failed to fetch hospital details");
        } finally {
            setLoading(false);
        }
    };


    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        } catch {
            return 'N/A';
        }
    };

    const getManagerName = (hospital) => {
        const manager = hospital.health_center_manager?.user || hospital.healthCenterManager?.user;
        if (manager) {
            const nameParts = [
                manager.first_name,
                manager.middle_name,
                manager.last_name
            ].filter(Boolean);
            return nameParts.join(' ') || 'N/A';
        }
        return 'N/A';
    };

    if (loading) {
        return (
            <div className="loader">
                <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />
                <h3>Loading Hospital Details...</h3>
            </div>
        );
    }

    if (error || !hospitalData) {
        return (
            <section className="hospital-detail-section">
                <div className="hospital-detail-back">
                    <button onClick={() => navigate('/admin/hospitals')} className="back-link">
                        <IoArrowBack />
                        <span>Back to Hospital List</span>
                    </button>
                </div>
                <div className="error-container">
                    <p>Error: {error || "Hospital not found"}</p>
                    <button onClick={() => navigate('/admin/hospitals')} className="btn-cancel">
                        Back to Hospital List
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="hospital-detail-section">
            {/* Back Button */}
            <div className="hospital-detail-back">
                <button onClick={() => navigate('/admin/hospitals')} className="back-link">
                    <IoArrowBack />
                    <span>Back to Hospital List</span>
                </button>
            </div>

            {/* Hospital Info and Map Container */}
            <div className="hospital-info-map-container">
                {/* Hospital Information Card */}
                <div className="detail-card hospital-info-card">
                    <div className="detail-card-header">
                        <div className="hospital-info-header">
                            <h2>{hospitalData.name || 'N/A'}</h2>
                            <div className="donor-stats">
                                <span>{hospitalData.code || 'N/A'}</span>
                            </div>
                        </div>
                        <span className={`badge ${hospitalData.status === "verified" ? "badge-success" : "badge-danger"}`}>
                            {hospitalData.status === "verified" ? "Verified" : "Unverified"}
                        </span>
                    </div>
                    
                    <div className="detail-card-body">
                        <div className="detail-info-item">
                            <div className="detail-icon">
                                <IoMailOutline />
                            </div>
                            <div className="info">
                                <span>Email</span>
                                <span className="detail-info-value">{hospitalData.email || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="detail-info-item">
                            <div className="detail-icon">
                                <IoLocationOutline />
                            </div>
                            <div className="info">
                                <span>Address</span>
                                <span className="detail-info-value">{hospitalData.address || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="detail-info-item">
                            <div className="detail-icon">
                                <IoCallOutline />
                            </div>
                            <div className="info">
                                <span>Phone Number</span>
                                <span className="detail-info-value">{hospitalData.phone_nb || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="detail-info-item">
                            <div className="detail-icon">
                                <IoTimeOutline />
                            </div>
                            <div className="info">
                                <span>Date Added</span>
                                <span className="detail-info-value">{formatDate(hospitalData.created_at) || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Map Card */}
                <div className="detail-card map-card">
                    <div className="map-container">
                        {hospitalData.latitude && hospitalData.longitude ? (
                            <MapIntegration
                                latitude={parseFloat(hospitalData.latitude)}
                                longitude={parseFloat(hospitalData.longitude)}
                                height="100%"
                            />
                        ) : (
                            <div className="map-error">
                                <p>Location coordinates not available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>


            {/* Blood Stock Information Card */}
            {hospitalData.blood_stock && typeof hospitalData.blood_stock === 'object' && (
                <div className="detail-card">
                    <div className="detail-card-header">
                        <h3>Blood Stock</h3>
                    </div>
                    
                    <div className="detail-card-body">
                        <div className="detail-info-grid">
                            {Object.keys(hospitalData.blood_stock).length > 0 ? (
                                Object.entries(hospitalData.blood_stock).map(([type, count]) => (
                                    <div key={type} className="detail-info-item">
                                        <div className="detail-info-label">
                                            <span>Blood Type {type}</span>
                                        </div>
                                        <div className="detail-info-value">
                                            <span className="badge">{count} units</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="detail-info-item full-width">
                                    <p>No stock data available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
