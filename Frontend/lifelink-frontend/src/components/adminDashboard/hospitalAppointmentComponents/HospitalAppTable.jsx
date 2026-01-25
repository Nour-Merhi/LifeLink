import { useState, useEffect } from "react"
import { FiTrash2 } from "react-icons/fi";
import { IoSearchSharp } from "react-icons/io5";
import { BsCalendar3, BsClock } from "react-icons/bs";
import { MdLocationOn } from "react-icons/md";
import { SpinnerDotted } from 'spinners-react';
import api from "../../../api/axios";
import EditAppointmentModal from "../homeVisitComponents/EditAppointmentModal";
import ConfirmDeleteDialog from "../../common/ConfirmDeleteDialog";

export default function HospitalAppTable({ hospitals = [], loading = false, error = "", onAppointmentsUpdate }){
    const [selectedHospitalId, setSelectedHospitalId] = useState("");
    const [hospitalData, setHospitalData] = useState(null);
    const [activeTab, setActiveTab] = useState("urgent"); // 'urgent' or 'regular'
    const [loadingAppointments, setLoadingAppointments] = useState(false);
    const [appointmentError, setAppointmentError] = useState("");
    const [expandedDates, setExpandedDates] = useState({});
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [editAppointmentModal, setEditAppointmentModal] = useState(null);

    useEffect(() => {
        if (selectedHospitalId) {
            fetchHospitalAppointments(selectedHospitalId);
        } else {
            setHospitalData(null);
        }
    }, [selectedHospitalId]);

    const fetchHospitalAppointments = (hospitalId) => {
        setLoadingAppointments(true);
        setAppointmentError("");
        
        api.get(`/api/admin/dashboard/hospital-visit-appointments/hospital/${hospitalId}`)
            .then((res) => {
                setHospitalData(res.data);
            })
            .catch(err => {
                console.error('Error fetching hospital appointments:', err);
                setAppointmentError(err.response?.data?.message || "Failed to fetch appointments");
                setHospitalData(null);
            })
            .finally(() => setLoadingAppointments(false));
    };

    const toggleDate = (date) => {
        setExpandedDates(prev => ({
            ...prev,
            [date]: !prev[date]
        }));
    };

    const handleDeleteClick = (e, date, appointmentIds) => {
        e.stopPropagation();
        setDeleteConfirm({ date, appointmentIds });
        setDeleteError("");
    };

    const handleDeleteCancel = () => {
        setDeleteConfirm(null);
        setDeleteError("");
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm || !deleteConfirm.appointmentIds || deleteConfirm.appointmentIds.length === 0) {
            setDeleteError("No appointments to delete");
            return;
        }

        setDeleteLoading(true);
        setDeleteError("");

        try {
            await api.get("/sanctum/csrf-cookie");
            
            const deletePromises = deleteConfirm.appointmentIds.map(appointmentId => 
                api.delete(`/api/admin/dashboard/appointments/${appointmentId}`)
            );

            const results = await Promise.allSettled(deletePromises);
            
            const failures = results.filter(r => r.status === 'rejected');
            if (failures.length > 0) {
                const errorMessages = failures.map(f => f.reason?.response?.data?.message || f.reason?.message || 'Unknown error');
                setDeleteError(errorMessages.join(', '));
                
                if (failures.length === results.length) {
                    setDeleteLoading(false);
                    return;
                }
            }

            setDeleteConfirm(null);
            if (onAppointmentsUpdate) {
                onAppointmentsUpdate();
            }
            if (selectedHospitalId) {
                fetchHospitalAppointments(selectedHospitalId);
            }
        } catch (error) {
            console.error('Error deleting appointments:', error);
            setDeleteError(error.response?.data?.message || error.message || "Failed to delete appointments");
        } finally {
            setDeleteLoading(false);
        }
    };

    const currentAppointments = hospitalData 
        ? (activeTab === "urgent" ? hospitalData.urgent_appointments : hospitalData.regular_appointments)
        : [];

    if (loading) {
        return (
            <div className="loader">
                <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />                
                <h3>Loading...</h3>
            </div>
        );
    }

    if (error && !loading) {
        return (
            <div className="error-container">
                <p>Error: {error}</p>
            </div>
        );
    }

    return(
        <section className="hospital-table-section">
            {/* Hospital Selector */}
            <div className="control-panel" style={{ marginBottom: '20px' }}>
                <div className="control-panel-layout">
                    <div>
                        <label htmlFor="hospital-select" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                            Select Hospital
                        </label>
                        <select
                            id="hospital-select"
                            value={selectedHospitalId}
                            onChange={(e) => setSelectedHospitalId(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                fontSize: '14px',
                                border: '1px solid #ddd',
                                borderRadius: '5px'
                            }}
                        >
                            <option value="">-- Select a Hospital --</option>
                            {hospitals.map(hospital => (
                                <option key={hospital.id} value={hospital.id}>
                                    {hospital.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {appointmentError && (
                <div className="control-panel" style={{ marginBottom: '20px', backgroundColor: '#FDE8E8', border: '1px solid #E92C30' }}>
                    <p style={{ color: '#E92C30', margin: 0 }}>{appointmentError}</p>
                </div>
            )}

            {/* Hospital Info and Tabs */}
            {hospitalData && hospitalData.hospital && (
                <>
                    <div className="control-panel" style={{ marginBottom: '20px' }}>
                        <div className="mb-10">
                            <h3 style={{ margin: '0 0 10px 0' }}>{hospitalData.hospital.name}</h3>
                            {hospitalData.hospital.location && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#666' }}>
                                    <MdLocationOn />
                                    <span>{hospitalData.hospital.location}</span>
                                </div>
                            )}
                        </div>

                    {/* Tabs */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setActiveTab("urgent")}
                                style={{
                                    padding: '10px 20px',
                                    border: 'none',
                                    background: 'transparent',
                                    borderBottom: activeTab === "urgent" ? '3px solid #f01010' : '3px solid transparent',
                                    color: activeTab === "urgent" ? '#f01010' : '#666',
                                    fontWeight: activeTab === "urgent" ? '600' : '400',
                                    cursor: 'pointer'
                                }}
                            >
                                Urgent Appointments ({hospitalData.urgent_appointments?.length || 0})
                            </button>
                            <button
                                onClick={() => setActiveTab("regular")}
                                style={{
                                    padding: '10px 20px',
                                    border: 'none',
                                    background: 'transparent',
                                    borderBottom: activeTab === "regular" ? '3px solid #2349C2' : '3px solid transparent',
                                    color: activeTab === "regular" ? '#2349C2' : '#666',
                                    fontWeight: activeTab === "regular" ? '600' : '400',
                                    cursor: 'pointer'
                                }}
                            >
                                Regular Appointments ({hospitalData.regular_appointments?.length || 0})
                            </button>
                        </div>
                    </div>

                    {/* Appointments List */}
                    {loadingAppointments ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                            <SpinnerDotted size={60} thickness={125} speed={100} color="#2349C2" />
                        </div>
                    ) : currentAppointments.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {currentAppointments.map((slot) => {
                                const isExpanded = expandedDates[slot.date];
                                const availableCount = slot.times?.filter(t => t.available).length || 0;
                                
                                return (
                                    <div key={slot.date} style={{
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        overflow: 'hidden'
                                    }}>
                                        <div
                                            onClick={() => toggleDate(slot.date)}
                                            style={{
                                                padding: '15px',
                                                backgroundColor: '#f8f9fa',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <BsCalendar3 />
                                                <span style={{ fontWeight: '500' }}>{slot.date}</span>
                                                <span style={{ color: '#666', fontSize: '14px' }}>
                                                    ({availableCount} available of {slot.times?.length || 0})
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <button
                                                    onClick={(e) => handleDeleteClick(e, slot.date, slot.appointment_ids || [])}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#E92C30',
                                                        cursor: 'pointer',
                                                        padding: '5px',
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                    title="Delete this date"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                                <span>{isExpanded ? '▲' : '▼'}</span>
                                            </div>
                                        </div>
                                        
                                        {isExpanded && (
                                            <div style={{ padding: '15px', backgroundColor: 'white' }}>
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                                    gap: '10px'
                                                }}>
                                                    {slot.times?.map((time, idx) => (
                                                        <div
                                                            key={idx}
                                                            style={{
                                                                padding: '8px 12px',
                                                                border: `1px solid ${time.available ? '#2349C2' : '#ccc'}`,
                                                                borderRadius: '5px',
                                                                backgroundColor: time.available ? '#f0f4ff' : '#f5f5f5',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '5px',
                                                                fontSize: '14px'
                                                            }}
                                                        >
                                                            <BsClock />
                                                            <span>{time.time}</span>
                                                            {!time.available && (
                                                                <span style={{ color: '#999', fontSize: '12px' }}>(Booked)</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                            <p>No {activeTab} appointments found for this hospital</p>
                        </div>
                    )}
                </>
            )}

            {!hospitalData && !loadingAppointments && selectedHospitalId && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    <p>No appointments found for this hospital</p>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <ConfirmDeleteDialog
                    title="Delete Appointments"
                    description={`You are going to delete all appointments for ${deleteConfirm.date}. Are you sure?`}
                    details={`${deleteConfirm.appointmentIds?.length || 0} record(s) • Note: Deletion may be blocked if there are active bookings.`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    loading={deleteLoading}
                    error={deleteError}
                    onClose={handleDeleteCancel}
                    onConfirm={handleDeleteConfirm}
                />
            )}

            {/* Edit Appointment Modal */}
            {editAppointmentModal && (
                <EditAppointmentModal
                    onClose={() => setEditAppointmentModal(null)}
                    onAppointmentUpdated={() => {
                        setEditAppointmentModal(null);
                        if (onAppointmentsUpdate) {
                            onAppointmentsUpdate();
                        }
                        if (selectedHospitalId) {
                            fetchHospitalAppointments(selectedHospitalId);
                        }
                    }}
                    appointmentIds={editAppointmentModal.appointmentIds}
                    hospitalId={editAppointmentModal.hospitalId}
                    date={editAppointmentModal.date}
                    hospitals={hospitals}
                />
            )}
        </section>
    )
}
