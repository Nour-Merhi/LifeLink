import { useState, useEffect } from "react";
import { FiEye, FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoSearchSharp } from "react-icons/io5";


export default function NotificationTable({ notifications }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [notificationType, setNotificationType] = useState("all-types");
    const [notificationState, setNotificationState] = useState("all-states");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    useEffect(() => {
        setCurrentPage(1);
    }, [notificationType, notificationState]);

    // Filtering notifications based on type and status
    const filteredNotifications = notifications ? notifications.filter((notification) => {
        const idString = String(notification.id || '');
        const matchesSearch = idString.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (notification.title && notification.title.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = notificationType === "all-types" || notification.type === notificationType;
        const matchesStatus = notificationState === "all-states" || notification.status === notificationState;

        return matchesSearch && matchesType && matchesStatus;
    }) : [];

    // Calculate pagination values
    const totalNotifications = filteredNotifications.length;
    const totalPages = Math.ceil(totalNotifications / itemsPerPage);

    // Calculating which items should show
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentNotifications = filteredNotifications.slice(startIndex, endIndex);

    // Displaying text
    const startDisplay = startIndex + 1;
    const endDisplay = Math.min(endIndex, totalNotifications);

    return (
        <section className="notification-table-section">
            <div className="control-panel control-panel-layout">
                <div className="control-panel-layout-left">
                    <div className="search-input">
                        <IoSearchSharp />
                        <input 
                            type="search" 
                            placeholder="Search by notification id.." 
                            value = {searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="filter-gap">
                    <div className="filters">
                        <select
                            value={notificationType}
                            onChange={(e) => setNotificationType(e.target.value)}
                        >
                            <option value="all-types">All Types</option>
                            <option value="alert">Alert</option>
                            <option value="reminder">Reminder</option>
                            <option value="announcement">Announcement</option>
                            <option value="campaign">Campaign</option>
                        </select>
                    </div>
                    <div className="filters">
                        <select
                            value={notificationState}
                            onChange={(e) => setNotificationState(e.target.value)}
                        >
                            <option value="all-states">All States</option>
                            <option value="sent">Sent</option>
                            <option value="failed">Failed</option>
                            <option value="pending">Pending</option>
                            <option value="scheduled">Scheduled</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="table-design">
                <table className="h1-table">
                    <thead>
                        <tr>
                            <th className="col-select">
                                <input className="ml-3" type="checkbox" aria-label="select all" />
                            </th>
                            <th className="col-id">Not ID</th>
                            <th className="col-notification">Notification</th>
                            <th className="col-type">Type</th>
                            <th className="col-content">Content</th>
                            <th className="col-recipients">Recipients</th>
                            <th className="col-status">Status</th>
                            <th className="col-performance">Performance</th>
                            <th className="col-date">Sent At</th>
                            <th className="col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentNotifications.map((notification, index) => (
                            <tr key={`${notification.id}-${startIndex + index}`}>
                                <td className="col-select">
                                    <input className="ml-3" type="checkbox" aria-label={`select ${notification.id}`} />
                                </td>
                                <td className="col-id">{notification.id}</td>
                                <td className="col-notification">
                                    <strong>{notification.title}</strong>
                                </td>
                                <td className="col-type">
                                    <span className={`badge ${
                                        notification.type === "alert" ? "badge-danger" :
                                        notification.type === "reminder" ? "badge-pending" :
                                        notification.type === "announcement" ? "request" :
                                        "badge-success"
                                    }`}>
                                        {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                                    </span>
                                </td>
                                <td className="col-content">
                                    <span title={notification.content}>{notification.content}</span>
                                </td>
                                <td className="col-recipients">
                                    <div className="cell-title">
                                        <span>{notification.recipient_group}</span>
                                        <small className="muted">{notification.recipient_count.toLocaleString()} users</small>
                                    </div>
                                </td>
                                <td className="col-status">
                                    <span className={`badge ${
                                        notification.status === "sent" ? "badge-success" :
                                        notification.status === "pending" ? "badge-pending" :
                                        "badge-danger"
                                    }`}>
                                        {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                                    </span>
                                </td>
                                <td className="col-performance">
                                    <div className="cell-title">
                                        <small>Delivered {notification.delivered_rate}</small>
                                        <small>Opened {notification.opened_rate}</small>
                                        <small>Clicked {notification.clicked_rate}</small>
                                    </div>
                                </td>
                                <td className="col-date">
                                    <div className="cell-date">
                                        <span>{notification.sent_date}</span>
                                        <span className="muted">{notification.sent_time}</span>
                                    </div>
                                </td>
                                <td className="col-actions">
                                    <div className="row-actions">
                                        <button className="icon-btn text-blue-800"><FiEye /></button>
                                        <button className="icon-btn text-green-600"><FiEdit /></button>
                                        <button className="icon-btn text-red-500"><RiDeleteBin6Line /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="pagination">
                    <div className="showing">
                        <small className="muted">Showing {startDisplay} to {endDisplay} of {totalNotifications} notifications</small>
                    </div>
                    <div className="pagination-controls">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="pagination-btn"
                        >
                            Previous
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                            <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                            >
                                {pageNum}
                            </button>
                        ))}

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="pagination-btn"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

