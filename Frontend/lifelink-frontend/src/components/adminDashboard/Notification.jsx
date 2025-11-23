import { useState } from "react";
import { MdNotificationsActive } from "react-icons/md";
import { BsSendCheck } from "react-icons/bs";
import { PiChartLineUpBold } from "react-icons/pi";
import { BsEnvelopePaperHeart } from "react-icons/bs";

import NotificationTable from "./notificationComponents/NotificationTable";
import AddNotificationForm from "./notificationComponents/AddNotificationForm";
import AddTemplateForm from "./notificationComponents/AddTemplateForm";

export default function Notification() {
    const [openModal, setOpenModal] = useState(false);
    const [openTemplates, setOpenTemplates] = useState(false);

    const onClose = () => {
        setOpenModal(false);
    };

    const onCloseTemplates = () => {
        setOpenTemplates(false);
    };

    const metricsData = [
        {
            title: "Total Sent",
            value: "13,847",
            change: "+12% vs last month",
            icon: <BsSendCheck />,
            bgColor: "#EAFFE5",
            iconColor: "#16a34a"
        },
        {
            title: "Delivery Rate",
            value: "98.3%",
            change: "+0.5% improvement",
            icon: <PiChartLineUpBold />,
            bgColor: "#F5E9FF",
            iconColor: "#6132BE"
        },
        {
            title: "Open Rate",
            value: "82.1%",
            change: "+3.2% vs last month",
            icon: <BsEnvelopePaperHeart />,
            bgColor: "#EBEAFF",
            iconColor: "#285BFF"
        }
    ];

    const notifications = [
        {
            id: "N001",
            title: "Critical Blood Shortage Alert",
            content: "O- blood type critically low. Immediate donor mobilization...",
            recipient_group: "All Donors (O-)",
            recipient_count: 1247,
            status: "sent",
            delivered_rate: "98.5%",
            opened_rate: "87.2%",
            clicked_rate: "23.4%",
            sent_date: "2024-01-15",
            sent_time: "14:30",
            type: "alert"
        },
        {
            id: "N002",
            title: "Appointment Reminder",
            content: "Your blood donation appointment is scheduled for",
            recipient_group: "Scheduled Donors",
            recipient_count: 156,
            status: "failed",
            delivered_rate: "97.8%",
            opened_rate: "76.3%",
            clicked_rate: "18.9%",
            sent_date: "2024-01-15",
            sent_time: "14:30",
            type: "reminder"
        },
        {
            id: "N003",
            title: "Critical Blood Shortage Alert",
            content: "O- blood type critically low. Immediate donor mobilization...",
            recipient_group: "All Donors (O-)",
            recipient_count: 1247,
            status: "sent",
            delivered_rate: "98.5%",
            opened_rate: "87.2%",
            clicked_rate: "23.4%",
            sent_date: "2024-01-15",
            sent_time: "14:30",
            type: "announcement"
        },
        {
            id: "N004",
            title: "Appointment Reminder",
            content: "Your blood donation appointment is scheduled for",
            recipient_group: "Scheduled Donors",
            recipient_count: 156,
            status: "failed",
            delivered_rate: "97.8%",
            opened_rate: "76.3%",
            clicked_rate: "18.9%",
            sent_date: "2024-01-15",
            sent_time: "14:30",
            type: "reminder"
        },
        {
            id: "N005",
            title: "Critical Blood Shortage Alert",
            content: "O- blood type critically low. Immediate donor mobilization...",
            recipient_group: "All Donors (O-)",
            recipient_count: 1247,
            status: "sent",
            delivered_rate: "98.5%",
            opened_rate: "87.2%",
            clicked_rate: "23.4%",
            sent_date: "2024-01-15",
            sent_time: "14:30",
            type: "campaign"
        },
        {
            id: "N006",
            title: "Appointment Reminder",
            content: "Your blood donation appointment is scheduled for",
            recipient_group: "Scheduled Donors",
            recipient_count: 156,
            status: "failed",
            delivered_rate: "97.8%",
            opened_rate: "76.3%",
            clicked_rate: "18.9%",
            sent_date: "2024-01-15",
            sent_time: "14:30",
            type: "announcement"
        }
    ];

    return (
        <section className="notification-section">
            {/* Header */}
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <MdNotificationsActive className="icon-size" />
                        <h2>Notification Center</h2>
                    </div>
                    <p>Manage and send notifications to users</p>
                </div>
                <div className="notification-actions">
                    <button className="templates-btn" onClick={() => setOpenTemplates(true)}>Templates</button>
                    <div className="add-btn">
                        <button type="button" onClick={() => setOpenModal(true)}>+ Create Notification</button>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="metrics-grid-3">
                {metricsData.map((metric, index) => (
                    <div key={index} className="metric-card">
                        <div className="metric-content">
                            <div className="metric-info">
                                <p className="metric-title">{metric.title}</p>
                                <h3 className="metric-value">{metric.value}</h3>
                                <span className="metric-change">{metric.change}</span>
                            </div>
                            <div className="metric-icon" style={{ backgroundColor: metric.bgColor, color: metric.iconColor }}>
                                {metric.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <NotificationTable notifications={notifications} />

            {openModal && 
                <AddNotificationForm onClose={onClose} />
            }

            {openTemplates && 
                <AddTemplateForm onClose={onCloseTemplates} />
            }
        </section>
    );
}

