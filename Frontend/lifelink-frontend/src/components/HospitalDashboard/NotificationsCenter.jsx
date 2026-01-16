import { useState, useEffect } from "react";
import { MdNotificationsActive } from "react-icons/md";
import axios from "axios";
import NotificationTable from "../../components/adminDashboard/notificationComponents/NotificationTable";
import CreateNotificationForm from "../../components/adminDashboard/notificationComponents/CreateNotificationForm";

export default function NotificationsCenter() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [openModal, setOpenModal] = useState(false);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = () => {
        setLoading(true);
        // In production: axios.get("/api/hospital/notifications")
        axios.get("http://localhost:8000/api/admin/dashboard/get-notifications")
            .then(res => {
                setNotifications(res.data.notifications || []);
            })
            .catch(err => {
                setError(err.response?.data?.message || "An error occurred");
            })
            .finally(() => setLoading(false));
    };

    return (
        <section className="notification-section">
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <MdNotificationsActive className="icon-size" />
                        <h2>Notifications Center</h2>
                    </div>
                    <p>Manage and send notifications to donors, phlebotomists, and staff</p>
                </div>
                <div className="add-btn">
                    <button type="button" onClick={() => setOpenModal(true)}>+ Create Notification</button>
                </div>
            </div>

            <NotificationTable 
                notifications={notifications}
                loading={loading}
                error={error}
            />

            {openModal && (
                <CreateNotificationForm
                    onClose={() => setOpenModal(false)}
                    onNotificationCreated={fetchNotifications}
                />
            )}
        </section>
    );
}

