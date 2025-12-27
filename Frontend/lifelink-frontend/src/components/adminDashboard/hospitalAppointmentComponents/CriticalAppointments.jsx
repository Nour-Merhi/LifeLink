import { FaExclamationTriangle, FaClock, FaHospital, FaTint } from "react-icons/fa";

export default function CriticalAppointments({ appointments = [] }) {
    // Filter urgent/critical appointments (within 24 hours or marked as urgent)
    const getCriticalAppointments = () => {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        return appointments.filter(apt => {
            if (!apt.date) return false;
            
            // Check if marked as urgent or high priority
            const isUrgent = apt.urgency === 'urgent' || apt.priority === 'high' || apt.appointment_type === 'urgent';
            
            // Check if within 24 hours
            const aptDate = new Date(apt.date + 'T00:00:00');
            const isWithin24Hours = aptDate >= now && aptDate <= tomorrow;
            
            // Check if status is pending (not completed or cancelled)
            const isPending = apt.status === 'pending' || apt.status === 'Pending';
            
            return (isUrgent || isWithin24Hours) && isPending;
        }).sort((a, b) => {
            // Sort by date (earliest first)
            const dateA = new Date(a.date + 'T00:00:00');
            const dateB = new Date(b.date + 'T00:00:00');
            return dateA - dateB;
        }).slice(0, 5); // Show only top 5
    };

    const criticalAppointments = getCriticalAppointments();

    const formatDateTime = (date, time) => {
        if (!date) return 'N/A';
        try {
            const dateObj = new Date(date + (time ? `T${time}` : 'T00:00:00'));
            const dateStr = dateObj.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
            const timeStr = time ? dateObj.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            }) : '';
            return timeStr ? `${dateStr} at ${timeStr}` : dateStr;
        } catch {
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
                                    <h4 className="critical-appointment-name">{apt.name || 'Unknown Donor'}</h4>
                                    <small className="muted">Appointment ID: {apt.id}</small>
                                </div>
                            </div>
                            {getUrgencyBadge(apt.urgency, apt.appointment_type)}
                        </div>
                        
                        <div className="critical-appointment-details">
                            <div className="critical-detail-item">
                                <FaHospital className="detail-icon" />
                                <span>{apt.hospital_name || 'N/A'}</span>
                            </div>
                            <div className="critical-detail-item">
                                <FaClock className="detail-icon" />
                                <span>{formatDateTime(apt.date, apt.time)}</span>
                            </div>
                            <div className="critical-detail-item">
                                <FaTint className="detail-icon" />
                                <span>Blood Type: {apt.blood_type || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

