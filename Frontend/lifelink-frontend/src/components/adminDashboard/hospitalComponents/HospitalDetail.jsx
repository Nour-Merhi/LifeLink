import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { FaTint, FaUserMd, FaCalendarCheck, FaAmbulance, FaUsers } from "react-icons/fa";
import { MdOutlineLocationOn } from "react-icons/md";
import { LuPhone } from "react-icons/lu";
import { MdOutlineMail } from "react-icons/md";
import { IoTimeOutline, IoPersonOutline, IoCalendarOutline, IoStatsChart } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import api from "../../../api/axios";
import { getApiBaseUrl } from "../../../config/api";
import MapIntegration from "../../MapIntegration";
import "../../../styles/Dashboard.css";

const API_BASE_URL = getApiBaseUrl();

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
            const response = await api.get(
                `/api/admin/dashboard/hospitals/${hospitalCode}`
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

    const getImageSrc = () => {
        if (!hospitalData?.image) {
            console.log('No image data found');
            return null;
        }
        
        const image = hospitalData.image;
        console.log('Image data type:', typeof image);
        console.log('Image data length:', image?.length);
        console.log('Image data preview:', image?.substring(0, 50));
        
        // Handle base64 images
        if (image.startsWith('data:image')) {
            console.log('Using base64 image');
            return image;
        }
        // Handle full URLs
        if (image.startsWith('http://') || image.startsWith('https://')) {
            console.log('Using full URL:', image);
            return image;
        }
        // Handle relative paths
        const fullPath = `${API_BASE_URL}/${image}`;
        console.log('Using relative path:', fullPath);
        return fullPath;
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
            <section className="hospital-detail-section-admin">
                <div className="hospital-detail-back-admin">
                    <button onClick={() => navigate('/admin/hospitals')} className="hospital-detail-back-button-admin">
                        <IoArrowBack />
                        <span>Back to Hospital List</span>
                    </button>
                </div>
                <div className="hospital-detail-error-admin">
                    <h2>Hospital Not Found</h2>
                    <p>{error || "The hospital you're looking for doesn't exist."}</p>
                    <button onClick={() => navigate('/admin/hospitals')} className="back-to-hospitals-btn-admin">
                        Back to Hospital List
                    </button>
                </div>
            </section>
        );
    }

    const imageSrc = getImageSrc();
    const services = Array.isArray(hospitalData.services) ? hospitalData.services : [];
    const urgentNeeds = Array.isArray(hospitalData.urgent_needs) ? hospitalData.urgent_needs : [];
    const stats = hospitalData.stats || {};
    const managerAdditionalInfo = hospitalData.manager_additional_info || {};
    const phlebotomists = hospitalData.mobile_phlebotomist || hospitalData.mobilePhlebotomist || [];

    return (
        <section>
            {/* Back Button */}
            <div className="hospital-detail-back-admin">
                <button onClick={() => navigate('/admin/hospitals')} className="hospital-detail-back-button-admin">
                    <IoArrowBack />
                    <span>Back to Hospital List</span>
                </button>
            </div>

            {/* Hospital Header */}
            <div className="hospital-detail-header-admin">
                <div className="hospital-detail-header-top">
                    <h1 className="hospital-detail-title-admin">{hospitalData.name || 'N/A'}</h1>
                    <span className={`badge ${hospitalData.status === "verified" ? "badge-success" : "badge-danger"}`}>
                        {hospitalData.status === "verified" ? "Verified" : "Unverified"}
                    </span>
                </div>
                <div className="hospital-detail-meta-admin">
                    <span className="hospital-code-admin">Code: {hospitalData.code || 'N/A'}</span>
                    {hospitalData.established && (
                        <span className="hospital-established-admin">
                            Established: {hospitalData.established}
                        </span>
                    )}
                </div>
            </div>

            {/* Hospital Image */}
            {imageSrc ? (
                <div className="hospital-detail-image-container-admin">
                    <img
                        src={imageSrc}
                        alt={hospitalData.name}
                        className="hospital-detail-image-admin"
                        onError={(e) => {
                            console.error('Image failed to load:', imageSrc);
                            e.target.src = '/image.png'; // Fallback image
                        }}
                    />
                </div>
            ) : (
                <div className="hospital-detail-image-container-admin">
                    <div style={{
                        width: '100%',
                        height: '300px',
                        backgroundColor: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        color: '#6b7280'
                    }}>
                        No image available
                    </div>
                </div>
            )}

            {/* Hospital Information Grid */}
            <div className="hospital-detail-grid-admin">
                {/* Contact Information and Location Map Side by Side */}
                <div className="hospital-detail-contact-map-wrapper-admin">
                    {/* Contact Information */}
                    <div className="hospital-detail-section-admin-card">
                        <h2 className="hospital-detail-section-title-admin">Contact Information</h2>
                        <div className="hospital-detail-contact-list-admin">
                            <div className="hospital-detail-contact-item-admin">
                                <MdOutlineLocationOn className="hospital-detail-contact-icon-admin" />
                                <div>
                                    <strong>Address</strong>
                                    <p>{hospitalData.address || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="hospital-detail-contact-item-admin">
                                <LuPhone className="hospital-detail-contact-icon-admin" />
                                <div>
                                    <strong>Phone</strong>
                                    <p>{hospitalData.phone_nb || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="hospital-detail-contact-item-admin">
                                <MdOutlineMail className="hospital-detail-contact-icon-admin" />
                                <div>
                                    <strong>Email</strong>
                                    <p>{hospitalData.email || 'N/A'}</p>
                                </div>
                            </div>
                            {hospitalData.hours && (
                                <div className="hospital-detail-contact-item-admin">
                                    <IoTimeOutline className="hospital-detail-contact-icon-admin" />
                                    <div>
                                        <strong>Operating Hours</strong>
                                        <p>{hospitalData.hours}</p>
                                    </div>
                                </div>
                            )}
                            {(hospitalData.latitude && hospitalData.longitude) && (
                                <div className="hospital-detail-contact-item-admin">
                                    <MdOutlineLocationOn className="hospital-detail-contact-icon-admin" />
                                    <div>
                                        <strong>Coordinates</strong>
                                        <p>Lat: {parseFloat(hospitalData.latitude).toFixed(6)}, Lng: {parseFloat(hospitalData.longitude).toFixed(6)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Location Map */}
                    <div className="hospital-detail-section-admin-card hospital-detail-map-section-admin">
                        <h2 className="hospital-detail-section-title-admin">Location</h2>
                        <div className="hospital-detail-map-container-admin">
                            {hospitalData.latitude && hospitalData.longitude ? (
                                <MapIntegration
                                    latitude={parseFloat(hospitalData.latitude)}
                                    longitude={parseFloat(hospitalData.longitude)}
                                    height="300px"
                                />
                            ) : (
                                <div className="map-error-admin">
                                    <p>Location coordinates not available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Statistics Card */}
                <div className="hospital-detail-section-admin-card">
                    <h2 className="hospital-detail-section-title-admin">
                        <IoStatsChart className="hospital-detail-contact-icon-admin" style={{ display: 'inline', marginRight: '8px' }} />
                        Statistics
                    </h2>
                    <div className="hospital-detail-stats-grid-admin">
                        <div className="hospital-detail-stat-item-admin">
                            <FaCalendarCheck className="stat-icon-admin" />
                            <div className="stat-content-admin">
                                <span className="stat-value-admin">{stats.total_appointments || 0}</span>
                                <span className="stat-label-admin">Total Appointments</span>
                            </div>
                        </div>
                        <div className="hospital-detail-stat-item-admin">
                            <FaUserMd className="stat-icon-admin" />
                            <div className="stat-content-admin">
                                <span className="stat-value-admin">{stats.hospital_appointments || 0}</span>
                                <span className="stat-label-admin">Hospital Appointments</span>
                            </div>
                        </div>
                        <div className="hospital-detail-stat-item-admin">
                            <FaAmbulance className="stat-icon-admin" />
                            <div className="stat-content-admin">
                                <span className="stat-value-admin">{stats.home_appointments || 0}</span>
                                <span className="stat-label-admin">Home Appointments</span>
                            </div>
                        </div>
                        <div className="hospital-detail-stat-item-admin">
                            <FaUsers className="stat-icon-admin" />
                            <div className="stat-content-admin">
                                <span className="stat-value-admin">{stats.total_phlebotomists || 0}</span>
                                <span className="stat-label-admin">Phlebotomists</span>
                            </div>
                        </div>
                        <div className="hospital-detail-stat-item-admin">
                            <FaTint className="stat-icon-admin" style={{ color: '#F12C31' }} />
                            <div className="stat-content-admin">
                                <span className="stat-value-admin">{stats.emergency_requests || 0}</span>
                                <span className="stat-label-admin">Emergency Requests</span>
                            </div>
                        </div>
                        <div className="hospital-detail-stat-item-admin">
                            <IoTimeOutline className="stat-icon-admin" />
                            <div className="stat-content-admin">
                                <span className="stat-value-admin">{stats.pending_appointments || 0}</span>
                                <span className="stat-label-admin">Pending</span>
                            </div>
                        </div>
                        <div className="hospital-detail-stat-item-admin">
                            <IoCalendarOutline className="stat-icon-admin" />
                            <div className="stat-content-admin">
                                <span className="stat-value-admin">{stats.completed_appointments || 0}</span>
                                <span className="stat-label-admin">Completed</span>
                            </div>
                        </div>
                        <div className="hospital-detail-stat-item-admin">
                            <FaCalendarCheck className="stat-icon-admin" />
                            <div className="stat-content-admin">
                                <span className="stat-value-admin">{hospitalData.requests || stats.requests || 0}</span>
                                <span className="stat-label-admin">Total Requests</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Urgent Needs */}
                {urgentNeeds.length > 0 && (
                    <div className="hospital-detail-section-admin-card">
                        <h2 className="hospital-detail-section-title-admin">Urgent Needs</h2>
                        <div className="hospital-detail-urgent-needs-admin">
                            {urgentNeeds.map((bloodType, index) => (
                                <button key={index} className="hospital-detail-urgent-button-admin animate-pulse">
                                    {bloodType}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Additional Information */}
                <div className="hospital-detail-section-admin-card">
                    <h2 className="hospital-detail-section-title-admin">Hospital Information</h2>
                    <div className="hospital-detail-info-list-admin">
                        {hospitalData.hours && (
                            <div className="hospital-detail-info-item-admin">
                                <strong>Operating Hours:</strong>
                                <span>{hospitalData.hours}</span>
                            </div>
                        )}
                        {hospitalData.established && (
                            <div className="hospital-detail-info-item-admin">
                                <strong>Established:</strong>
                                <span>{hospitalData.established}</span>
                            </div>
                        )}
                        <div className="hospital-detail-info-item-admin">
                            <strong>Date Added:</strong>
                            <span>{formatDate(hospitalData.created_at)}</span>
                        </div>
                        {hospitalData.updated_at && (
                            <div className="hospital-detail-info-item-admin">
                                <strong>Last Updated:</strong>
                                <span>{formatDate(hospitalData.updated_at)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Services */}
                {services.length > 0 && (
                    <div className="hospital-detail-section-admin-card hospital-detail-section-full-admin">
                        <h2 className="hospital-detail-section-title-admin">Services Offered</h2>
                        <ul className="hospital-detail-services-list-admin">
                            {services.map((service, index) => (
                                <li key={index}>{service}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Manager Information */}
                <div className="hospital-detail-section-admin-card hospital-detail-section-full-admin">
                    <h2 className="hospital-detail-section-title-admin">Manager Information</h2>
                    <div className="hospital-detail-contact-list-admin">
                        <div className="hospital-detail-contact-item-admin">
                            <IoPersonOutline className="hospital-detail-contact-icon-admin" />
                            <div>
                                <strong>Contact Person</strong>
                                <p>{getManagerName(hospitalData)}</p>
                            </div>
                        </div>
                        {hospitalData.health_center_manager?.user && (
                            <>
                                <div className="hospital-detail-contact-item-admin">
                                    <MdOutlineMail className="hospital-detail-contact-icon-admin" />
                                    <div>
                                        <strong>Manager Email</strong>
                                        <p>{hospitalData.health_center_manager.user.email || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="hospital-detail-contact-item-admin">
                                    <LuPhone className="hospital-detail-contact-icon-admin" />
                                    <div>
                                        <strong>Manager Phone</strong>
                                        <p>{hospitalData.health_center_manager.user.phone_nb || 'N/A'}</p>
                                    </div>
                                </div>
                            </>
                        )}
                        {hospitalData.health_center_manager && (
                            <>
                                {hospitalData.health_center_manager.start_time && hospitalData.health_center_manager.end_time && (
                                    <div className="hospital-detail-contact-item-admin">
                                        <IoTimeOutline className="hospital-detail-contact-icon-admin" />
                                        <div>
                                            <strong>Working Hours</strong>
                                            <p>
                                                {hospitalData.health_center_manager.start_time || 'N/A'} - {hospitalData.health_center_manager.end_time || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {managerAdditionalInfo.position && (
                                    <div className="hospital-detail-contact-item-admin">
                                        <IoPersonOutline className="hospital-detail-contact-icon-admin" />
                                        <div>
                                            <strong>Position</strong>
                                            <p>{managerAdditionalInfo.position}</p>
                                        </div>
                                    </div>
                                )}
                                {managerAdditionalInfo.office_location && (
                                    <div className="hospital-detail-contact-item-admin">
                                        <MdOutlineLocationOn className="hospital-detail-contact-icon-admin" />
                                        <div>
                                            <strong>Office Location</strong>
                                            <p>{managerAdditionalInfo.office_location}</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Phlebotomists */}
                {phlebotomists.length > 0 && (
                    <div className="hospital-detail-section-admin-card hospital-detail-section-full-admin">
                        <h2 className="hospital-detail-section-title-admin">Phlebotomists ({phlebotomists.length})</h2>
                        <div className="hospital-detail-phlebotomists-list-admin">
                            {phlebotomists.map((phleb, index) => {
                                const user = phleb.user || phleb;
                                const name = user.first_name && user.last_name 
                                    ? `${user.first_name} ${user.middle_name || ''} ${user.last_name}`.trim()
                                    : 'N/A';
                                return (
                                    <div key={phleb.id || index} className="hospital-detail-phlebotomist-item-admin">
                                        <FaUserMd className="phlebotomist-icon-admin" />
                                        <div className="phlebotomist-info-admin">
                                            <strong>{name}</strong>
                                            {user.email && <span>{user.email}</span>}
                                            {phleb.code && <span className="phlebotomist-code-admin">Code: {phleb.code}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Blood Stock Information */}
                {hospitalData.blood_stock && typeof hospitalData.blood_stock === 'object' && Object.keys(hospitalData.blood_stock).length > 0 && (
                    <div className="hospital-detail-section-admin-card hospital-detail-section-full-admin">
                        <h2 className="hospital-detail-section-title-admin">Blood Stock & Shortage States</h2>
                        <div className="hospital-detail-blood-stock-grid-admin">
                            {Object.entries(hospitalData.blood_stock).map(([type, count]) => {
                                const shortageState = hospitalData.shortage_states?.[type] || 'critical';
                                const getStateColor = (state) => {
                                    if (state === 'critical') return '#E92C30';
                                    if (state === 'low stock') return '#F5CF26';
                                    return '#16a34a';
                                };
                                const getStateBg = (state) => {
                                    if (state === 'critical') return '#FDE8E8';
                                    if (state === 'low stock') return '#fcf7d6';
                                    return '#e8f9ef';
                                };
                                return (
                                    <div key={type} className="hospital-detail-blood-stock-item-admin" style={{
                                        border: `2px solid ${getStateColor(shortageState)}`,
                                        backgroundColor: getStateBg(shortageState),
                                        borderRadius: '8px',
                                        padding: '12px'
                                    }}>
                                        <FaTint className="blood-type-icon-admin" style={{ color: getStateColor(shortageState) }} />
                                        <div className="blood-stock-info-admin">
                                            <span className="blood-type-admin">{type}</span>
                                            <span className="blood-count-admin">{count} units</span>
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: '600',
                                                color: getStateColor(shortageState),
                                                marginTop: '4px',
                                                textTransform: 'capitalize'
                                            }}>
                                                {shortageState}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

