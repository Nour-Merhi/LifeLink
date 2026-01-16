import { FaExclamationTriangle, FaClock, FaHospital, FaTint } from "react-icons/fa";

export default function CriticalAppointments({ appointments = [] }) {
    // Appointments are already filtered by backend (urgent appointments only)
    // Just sort and limit to top 10 for display
    const criticalAppointments = appointments
        .sort((a, b) => {
            // Sort by due_date first, then appointment_date
            const dateA = a.due_date || a.appointment_date;
            const dateB = b.due_date || b.appointment_date;
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return new Date(dateA) - new Date(dateB);
        })
        .slice(0, 10); // Show top 10

    const formatDateTime = (date, time) => {
        if (!date) return 'N/A';
        try {
            // Handle different date formats - extract just the date part
            let dateStr = date;
            if (typeof date === 'string') {
                dateStr = date.split('T')[0].split(' ')[0]; // Get YYYY-MM-DD part
            }
            
            // Format the date
            const [year, month, day] = dateStr.split('-');
            const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            const formattedDate = dateObj.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
            
            // Format the time if provided
            if (time) {
                let formattedTime = time;
                // Handle time format (could be "HH:MM" or "HH:MM:SS" or "HH:MM AM/PM")
                if (!time.includes('AM') && !time.includes('PM')) {
                    // Convert 24-hour to 12-hour format
                    const timeParts = time.split(':');
                    const hours = parseInt(timeParts[0]);
                    const minutes = timeParts[1] || '00';
                    const hour12 = hours % 12 || 12;
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    formattedTime = `${hour12}:${minutes} ${ampm}`;
                }
                return `${formattedDate} at ${formattedTime}`;
            }
            
            return formattedDate;
        } catch (e) {
            return `${date} ${time || ''}`.trim();
        }
    };

    const getUrgencyBadge = (urgency, appointmentType) => {
        const isUrgent = urgency === 'urgent' || appointmentType === 'urgent';
        return (
            <span className={`badge ${isUrgent ? 'badge-danger' : 'badge-orange'}`}>
                {isUrgent ? 'Urgent' : 'High Priority'}
            </span>
        );
    };

    if (criticalAppointments.length === 0) {
        return (
            <div className="control-panel">
                <div className="display-row-center">
                    <FaExclamationTriangle className="icon-size" style={{ marginRight: '8px', color: '#f59e0b' }} />
                    <h3>
                        Upcoming Critical Appointments
                    </h3>
                </div>
                <div className="no-critical">
                    <p>No critical appointments at this time</p>
                    <small className="muted">All appointments are well scheduled</small>
                </div>
            </div>
        );
    }

    return (
        <div className="control-panel critical-appointments-panel">
            <h3 className="control-panel-title">
                <FaExclamationTriangle className="icon-size" style={{ marginRight: '8px', color: '#f59e0b' }} />
                Upcoming Critical Appointments ({criticalAppointments.length})
            </h3>
            <div className="critical-appointments-list">
                {criticalAppointments.map((apt, index) => (
                    <div key={apt.id || index} className="critical-appointment-item">
                        <div className="critical-appointment-header">
                            <div className="critical-appointment-info">
                                <FaHospital className="critical-icon" />
                                <div>
                                    <h4 className="critical-appointment-name">{apt.donor?.name || 'Unknown Donor'}</h4>
                                    <small className="muted">Code: {apt.code || apt.id}</small>
                                </div>
                            </div>
                            {getUrgencyBadge(null, 'urgent')}
                        </div>
                        
                        <div className="critical-appointment-details">
                            <div className="critical-detail-item">
                                <FaHospital className="detail-icon" />
                                <span>{apt.hospital?.name || apt.hospital_name || 'N/A'}</span>
                            </div>
                            <div className="critical-detail-item">
                                <FaClock className="detail-icon" />
                                <span>
                                    {apt.due_date && apt.due_time 
                                        ? formatDateTime(apt.due_date, apt.due_time) 
                                        : formatDateTime(apt.appointment_date, apt.appointment_time)}
                                    {apt.due_date && (
                                        <span className="muted" style={{marginLeft: '8px'}}>
                                            (Due)
                                        </span>
                                    )}
                                </span>
                            </div>
                            <div className="critical-detail-item">
                                <FaTint className="detail-icon" />
                                <span>Blood Type: {apt.blood_type || apt.donor?.blood_type || 'N/A'}</span>
                            </div>
                            {apt.type === 'home' && apt.address && (
                                <div className="critical-detail-item" style={{marginTop: '4px'}}>
                                    <small className="muted">📍 {apt.address}</small>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

