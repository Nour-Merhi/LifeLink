import { useState, useEffect } from "react";
import { FiTrash2, FiEdit } from "react-icons/fi";
import { IoSearchSharp, IoClose } from "react-icons/io5";
import { BsCalendar3, BsClock } from "react-icons/bs";
import { MdLocationOn } from "react-icons/md";
import { SpinnerDotted } from 'spinners-react';
import api from "../../../api/axios";
import ConfirmDeleteDialog from "../../common/ConfirmDeleteDialog";

export default function HospitalAppRequestsTable({ hospitalId, loading = false, error = "", onAppointmentsUpdate }) {
    const [hospitalData, setHospitalData] = useState(null);
    const [activeTab, setActiveTab] = useState("urgent"); // 'urgent' or 'regular'
    const [loadingAppointments, setLoadingAppointments] = useState(false);
    const [appointmentError, setAppointmentError] = useState("");
    const [expandedDates, setExpandedDates] = useState({});
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [editSlotModal, setEditSlotModal] = useState(null); // { appointmentId, rawTime, displayTime, date }
    const [editSlotTime, setEditSlotTime] = useState("");
    const [editSlotLoading, setEditSlotLoading] = useState(false);
    const [editSlotError, setEditSlotError] = useState("");
    const [removeSlotConfirm, setRemoveSlotConfirm] = useState(null); // { appointmentId, rawTime, displayTime, date }
    const [removeSlotLoading, setRemoveSlotLoading] = useState(false);
    const [removeSlotError, setRemoveSlotError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (hospitalId) {
            fetchHospitalAppointments();
        } else {
            setHospitalData(null);
        }
    }, [hospitalId]);

    const fetchHospitalAppointments = () => {
        if (!hospitalId) {
            setAppointmentError("Hospital ID not found");
            return;
        }

        setLoadingAppointments(true);
        setAppointmentError("");
        
        api.get(`/api/hospital/dashboard/hospital-visit-appointments/${hospitalId}`)
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

    const openEditSlot = (e, slotDate, timeObj) => {
        e.stopPropagation();
        if (!timeObj?.available) return;
        if (!timeObj?.appointment_id || !timeObj?.raw_time) return;
        setEditSlotError("");
        setEditSlotModal({
            appointmentId: timeObj.appointment_id,
            rawTime: timeObj.raw_time,
            displayTime: timeObj.time,
            date: slotDate,
        });
        setEditSlotTime(timeObj.raw_time);
    };

    const saveEditSlot = async () => {
        if (!editSlotModal?.appointmentId || !editSlotModal?.rawTime) return;
        setEditSlotLoading(true);
        setEditSlotError("");
        try {
            await api.get("/sanctum/csrf-cookie");
            await api.patch(`/api/hospital/dashboard/appointments/${editSlotModal.appointmentId}/time-slots`, {
                op: "update",
                old_time: editSlotModal.rawTime,
                new_time: editSlotTime,
            });
            setEditSlotModal(null);
            fetchHospitalAppointments();
        } catch (err) {
            setEditSlotError(err.response?.data?.message || "Failed to update time slot");
        } finally {
            setEditSlotLoading(false);
        }
    };

    const openRemoveSlot = (e, slotDate, timeObj) => {
        e.stopPropagation();
        if (!timeObj?.available) return;
        if (!timeObj?.appointment_id || !timeObj?.raw_time) return;
        setRemoveSlotError("");
        setRemoveSlotConfirm({
            appointmentId: timeObj.appointment_id,
            rawTime: timeObj.raw_time,
            displayTime: timeObj.time,
            date: slotDate,
        });
    };

    const confirmRemoveSlot = async () => {
        if (!removeSlotConfirm?.appointmentId || !removeSlotConfirm?.rawTime) return;
        setRemoveSlotLoading(true);
        setRemoveSlotError("");
        try {
            await api.get("/sanctum/csrf-cookie");
            await api.patch(`/api/hospital/dashboard/appointments/${removeSlotConfirm.appointmentId}/time-slots`, {
                op: "remove",
                old_time: removeSlotConfirm.rawTime,
            });
            setRemoveSlotConfirm(null);
            fetchHospitalAppointments();
        } catch (err) {
            setRemoveSlotError(err.response?.data?.message || "Failed to remove time slot");
        } finally {
            setRemoveSlotLoading(false);
        }
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
                api.delete(`/api/hospital/dashboard/appointments/${appointmentId}`)
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
            fetchHospitalAppointments();
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

    // Filter appointments by search term
    const filteredAppointments = currentAppointments.filter(slot => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return slot.date?.toLowerCase().includes(searchLower) ||
               slot.times?.some(time => time.time?.toLowerCase().includes(searchLower));
    });

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

    return (
        <section className="hospital-table-section">
            {/* Hospital Info */}
            {hospitalData && hospitalData.hospital && (
                <div className="control-panel" style={{ marginBottom: '20px' }}>
                    

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
            )}

            {/* Search Bar */}
            <div className="control-panel" style={{ marginBottom: '20px' }}>
                <div className="control-panel-layout">
                    <div className="search-input">
                        <IoSearchSharp />
                        <input 
                            type="search" 
                            placeholder="Search by date or time..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {appointmentError && (
                <div className="control-panel" style={{ marginBottom: '20px', backgroundColor: '#FDE8E8', border: '1px solid #E92C30' }}>
                    <p style={{ color: '#E92C30', margin: 0 }}>{appointmentError}</p>
                </div>
            )}

            {/* Appointments List */}
            {loadingAppointments ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    <SpinnerDotted size={60} thickness={125} speed={100} color="#2349C2" />
                </div>
            ) : filteredAppointments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {filteredAppointments.map((slot) => {
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
                                                        justifyContent: 'space-between',
                                                        gap: '8px',
                                                        fontSize: '14px'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                                        <BsClock />
                                                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{time.time}</span>
                                                        {!time.available && (
                                                            <span style={{ color: '#999', fontSize: '12px' }}>(Booked)</span>
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <button
                                                            type="button"
                                                            title={time.available ? "Edit time" : "Cannot edit booked time"}
                                                            onClick={(e) => openEditSlot(e, slot.date, time)}
                                                            disabled={!time.available}
                                                            style={{
                                                                background: "none",
                                                                border: "none",
                                                                cursor: time.available ? "pointer" : "not-allowed",
                                                                color: time.available ? "#2349C2" : "#bdbdbd",
                                                                padding: 0,
                                                                display: "flex",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <FiEdit />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            title={time.available ? "Remove this time" : "Cannot remove booked time"}
                                                            onClick={(e) => openRemoveSlot(e, slot.date, time)}
                                                            disabled={!time.available}
                                                            style={{
                                                                background: "none",
                                                                border: "none",
                                                                cursor: time.available ? "pointer" : "not-allowed",
                                                                color: time.available ? "#E92C30" : "#bdbdbd",
                                                                padding: 0,
                                                                display: "flex",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <FiTrash2 />
                                                        </button>
                                                    </div>
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
                    <p>No {activeTab} appointments found{searchTerm ? ' matching your search' : ''}</p>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <ConfirmDeleteDialog
                    title="Delete Record"
                    description={`You are going to delete all appointments for ${deleteConfirm.date}. Are you sure?`}
                    details={`This will delete ${deleteConfirm.appointmentIds?.length || 0} appointment record(s).`}
                    confirmText="Yes, Delete"
                    cancelText="No, Keep It"
                    loading={deleteLoading}
                    error={deleteError}
                    onClose={handleDeleteCancel}
                    onConfirm={handleDeleteConfirm}
                />
            )}

            {/* Edit single time slot modal */}
            {editSlotModal && (
                <div className="modal-overlay modal-overlay-delete" onClick={() => !editSlotLoading && setEditSlotModal(null)}>
                    <div className="modal-container modal-modern" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ maxWidth: 520 }}>
                        <div className="modal-modern-header">
                            <div className="modal-modern-title">
                                <h2>Edit Time</h2>
                                <div className="modal-modern-subtitle">
                                    <span className="muted">Date: {editSlotModal.date} • Current: {editSlotModal.displayTime}</span>
                                </div>
                            </div>
                            <button className="modal-icon-btn" onClick={() => !editSlotLoading && setEditSlotModal(null)} aria-label="Close">
                                <IoClose />
                            </button>
                        </div>
                        <div className="modal-modern-body">
                            <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>New Time</label>
                            <input
                                type="time"
                                value={editSlotTime}
                                onChange={(e) => setEditSlotTime(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 10,
                                    outline: "none",
                                }}
                            />
                            {editSlotError ? (
                                <div className="error-message modal-error-container" style={{ marginTop: 12 }}>
                                    {editSlotError}
                                </div>
                            ) : null}
                        </div>
                        <div className="modal-modern-footer" style={{ justifyContent: "space-between" }}>
                            <button className="btn-cancel" onClick={() => !editSlotLoading && setEditSlotModal(null)} disabled={editSlotLoading}>
                                Cancel
                            </button>
                            <button
                                className="submit-btn"
                                style={{ background: "#2349C2" }}
                                onClick={saveEditSlot}
                                disabled={editSlotLoading}
                            >
                                {editSlotLoading ? (
                                    <span style={{ display: "inline-flex", alignItems: "center" }}>
                                        <SpinnerDotted size={18} thickness={120} speed={100} color="#fff" className="spinner-inline" />
                                        Saving...
                                    </span>
                                ) : (
                                    "Save"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Remove single time slot */}
            {removeSlotConfirm && (
                <ConfirmDeleteDialog
                    title="Delete Record"
                    description={`You are going to delete this time slot (${removeSlotConfirm.displayTime}) on ${removeSlotConfirm.date}. Are you sure?`}
                    confirmText="Yes, Delete"
                    cancelText="No, Keep It"
                    loading={removeSlotLoading}
                    error={removeSlotError}
                    onClose={() => !removeSlotLoading && setRemoveSlotConfirm(null)}
                    onConfirm={confirmRemoveSlot}
                />
            )}
        </section>
    );
}
