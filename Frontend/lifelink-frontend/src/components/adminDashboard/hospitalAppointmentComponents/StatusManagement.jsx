import { useState } from "react";
import { FiEdit } from "react-icons/fi";

export default function StatusManagement({ appointment, onStatusUpdate }) {
    const [selectedStatus, setSelectedStatus] = useState(appointment?.status || 'pending');
    const [isEditing, setIsEditing] = useState(false);

    const statusOptions = [
        { value: 'pending', label: 'Pending', className: 'badge-pending' },
        { value: 'approved', label: 'Approved', className: 'badge-success' },
        { value: 'completed', label: 'Completed', className: 'badge-success' },
        { value: 'cancelled', label: 'Cancelled', className: 'badge-danger' }
    ];

    const handleStatusChange = (newStatus) => {
        setSelectedStatus(newStatus);
        if (onStatusUpdate && appointment) {
            onStatusUpdate(appointment.id, newStatus);
        }
        setIsEditing(false);
    };

    const getCurrentStatusBadge = () => {
        const status = statusOptions.find(s => s.value === selectedStatus) || statusOptions[0];
        return (
            <span className={`badge ${status.className}`}>
                {status.label}
            </span>
        );
    };

    if (!appointment) {
        return null;
    }

    return (
        <div className="status-management">
            <div className="status-management-header">
                <h4>Status Management</h4>
                {!isEditing && (
                    <button 
                        className="icon-btn" 
                        onClick={() => setIsEditing(true)}
                        title="Edit Status"
                    >
                        <FiEdit />
                    </button>
                )}
            </div>
            
            {isEditing ? (
                <div className="status-edit-mode">
                    <div className="status-options">
                        {statusOptions.map((status) => (
                            <button
                                key={status.value}
                                className={`status-option-btn ${selectedStatus === status.value ? 'active' : ''}`}
                                onClick={() => handleStatusChange(status.value)}
                            >
                                <span className={`badge ${status.className}`}>
                                    {status.label}
                                </span>
                            </button>
                        ))}
                    </div>
                    <div className="status-edit-actions">
                        <button 
                            className="btn-cancel"
                            onClick={() => {
                                setSelectedStatus(appointment?.status || 'pending');
                                setIsEditing(false);
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="status-display">
                    <div className="current-status">
                        {getCurrentStatusBadge()}
                        <small className="muted">Last updated: {appointment.updated_at || 'N/A'}</small>
                    </div>
                </div>
            )}
        </div>
    );
}

