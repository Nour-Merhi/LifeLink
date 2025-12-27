import { FaCheck, FaTimes, FaClock } from "react-icons/fa";
import { FiEdit, FiEye } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";

export default function ActivityLog({ activities = [] }) {
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        try {
            const date = new Date(timestamp);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return timestamp;
        }
    };

    const getActivityIcon = (action) => {
        const actionLower = action?.toLowerCase() || '';
        if (actionLower.includes('approve')) return <FaCheck className="activity-icon approve" />;
        if (actionLower.includes('reject')) return <FaTimes className="activity-icon reject" />;
        if (actionLower.includes('edit') || actionLower.includes('update')) return <FiEdit className="activity-icon edit" />;
        if (actionLower.includes('delete')) return <RiDeleteBin6Line className="activity-icon delete" />;
        if (actionLower.includes('view')) return <FiEye className="activity-icon view" />;
        return <FaClock className="activity-icon default" />;
    };

    const getActivityBadge = (action) => {
        const actionLower = action?.toLowerCase() || '';
        let className = 'badge-pending';
        if (actionLower.includes('approve')) className = 'badge-success';
        else if (actionLower.includes('reject') || actionLower.includes('delete')) className = 'badge-danger';
        else if (actionLower.includes('edit') || actionLower.includes('update')) className = 'badge-pending';
        
        return (
            <span className={`badge ${className}`}>
                {action}
            </span>
        );
    };

    // Default activities if none provided (for placeholder data)
    const defaultActivities = activities.length > 0 ? activities : [
        {
            id: 1,
            action: 'Approved Donation Request',
            admin: 'Admin User',
            target: 'Hospital Appointment #HAPPT-001',
            timestamp: new Date().toISOString(),
            details: 'Approved blood donation request from City Hospital'
        },
        {
            id: 2,
            action: 'Updated Status',
            admin: 'Admin User',
            target: 'Hospital Appointment #HAPPT-002',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            details: 'Changed status from Pending to Approved'
        },
        {
            id: 3,
            action: 'Rejected Request',
            admin: 'Admin User',
            target: 'Hospital Appointment #HAPPT-003',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            details: 'Rejected donation request - Invalid donor information'
        }
    ];

    return (
        <div className="control-panel">
            <h3 className="control-panel-title">Activity / Audit Log</h3>
            <div className="activity-log-list">
                {defaultActivities.length > 0 ? (
                    defaultActivities.slice(0, 20).map((activity, index) => (
                        <div key={activity.id || index} className="activity-item">
                            <div className="activity-icon-container">
                                {getActivityIcon(activity.action)}
                            </div>
                            <div className="activity-content">
                                <div className="activity-header">
                                    <div className="activity-main">
                                        <span className="activity-action">{activity.action}</span>
                                        <span className="activity-target">{activity.target}</span>
                                    </div>
                                    <div className="activity-meta">
                                        {getActivityBadge(activity.action)}
                                        <small className="muted">{formatTimestamp(activity.timestamp)}</small>
                                    </div>
                                </div>
                                <div className="activity-details">
                                    <span className="activity-admin">By: {activity.admin || 'System'}</span>
                                    {activity.details && (
                                        <span className="activity-description">• {activity.details}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-activities">
                        <p>No recent activities</p>
                        <small className="muted">Activity log will appear here</small>
                    </div>
                )}
            </div>
        </div>
    );
}

