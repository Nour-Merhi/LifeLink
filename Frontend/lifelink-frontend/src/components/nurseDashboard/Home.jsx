import { useState } from "react";
import { FaHome } from "react-icons/fa";
import { FaCalendar } from "react-icons/fa";
import { FaTint } from "react-icons/fa";
import { FaHospital } from "react-icons/fa";
import { IoMdArrowForward } from "react-icons/io";
import { FiEdit2 } from "react-icons/fi";
import nurseMetricIcon from "../../assets/imgs/nurseMetricIcon.svg";
import "../../styles/Dashboard.css";

export default function Home(){
    const [searchTerm, setSearchTerm] = useState("");
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [bloodType, setBloodType] = useState("all-blood");

    const metricsData = [
        {
            title: "Upcoming Home Visits",
            value: "8",
            change: "Next: Today 2:00 PM",
            icon: <img src={nurseMetricIcon} alt="nurse metric icon" />,
        },
        {
            title: "Completed Donations",
            value: "142",
            change: "This month 28",
        },
        {
            title: "Pending Requests",
            value: "4",
            change: "2 urgent",
        },
        {
            title: "Hospital Assigned",
            value: "St. Mary's",
            change: "View details",
        }
    ];

    // Sample data
    const appointments = [
        { id: 1, donor: "ali mohamad abed rida (+961 1234567)", address: "Gorgina, Al harire, f 6", status: "Completed", bloodType: "O+", date: "Jan 25, 2025 10:00 AM" },
        { id: 2, donor: "Mariam Morsel", address: "Al harire, raid street, floor 7", status: "Canceled", bloodType: "B+", date: "Jul 23, 2025 12:30 PM" },
        { id: 3, donor: "ali mohamad abed rida (+961 1234567)", address: "Gorgina, Al harire, f 6", status: "Completed", bloodType: "O+", date: "Jan 25, 2025 10:00 AM" },
        { id: 4, donor: "Mariam Morsel", address: "Al harire, raid street, floor 7", status: "Canceled", bloodType: "B+", date: "Jul 23, 2025 12:30 PM" },
        { id: 5, donor: "ali mohamad abed rida (+961 1234567)", address: "Gorgina, Al harire, f 6", status: "Completed", bloodType: "O+", date: "Jan 25, 2025 10:00 AM" },
        { id: 6, donor: "Mariam Morsel", address: "Al harire, raid street, floor 7", status: "Canceled", bloodType: "B+", date: "Jul 23, 2025 12:30 PM" },
        { id: 7, donor: "ali mohamad abed rida (+961 1234567)", address: "Gorgina, Al harire, f 6", status: "Completed", bloodType: "O+", date: "Jan 25, 2025 10:00 AM" },
        { id: 8, donor: "Mariam Morsel", address: "Al harire, raid street, floor 7", status: "Canceled", bloodType: "B+", date: "Jul 23, 2025 12:30 PM" },
    ];

    const getStatusClass = (status) => {
        if (!status) return "";
        const statusLower = status.toLowerCase();
        if (statusLower === "completed") return "status-completed";
        if (statusLower === "canceled") return "status-canceled";
        return "";
    };

    return (
        <>
        <div className="nurse-section">
            {/* Summary Cards */}
            <div className="metrics-grid">
                {metricsData.map((metric, index) => (
                    <div key={index} className={`metric-card ${index === 0 ? "linear-light-blue" : ""}`}>
                        <div className="metric-content">
                            <div className="metric-info">
                                <p className="metric-title">{metric.title}</p>
                                <h3 className="metric-value">{metric.value}</h3>
                                {index === 3 ? (
                                    <button style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "5px", background: "none", border: "none", color: "#2196F3", cursor: "pointer", fontSize: "12px", fontWeight: "500", padding: 0 }}>
                                        {metric.change} <IoMdArrowForward />
                                    </button>
                                ) : (
                                    <span className="metric-change">{metric.change}</span>
                                )}
                            </div>
                            <div className="metric-icon" style={{ backgroundColor: metric.bgColor, color: metric.iconColor }}>
                                {metric.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Home Donation Appointments */}
            <div className="donor-section">

                <div className="control-panel">
                    <div className="dashboard-title">
                        <div className="icon-title">
                            <FaHome style={{ fontSize: "24px", color: "#252E32" }} />
                            <h2 className="control-panel-title">Home Donation Appointments</h2>
                        </div>
                    </div>
                    <div className="control-panel-layout">
                        <div className="control-panel-layout-left">
                            <div className="search-input">
                                <input
                                    type="text"
                                    placeholder="Search by name"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="filters">
                            <select
                                value = { bloodType } 
                                onChange = { (e) => setBloodType (e.target.value) }
                            >
                                <option value = "all-blood" >All blood types</option>
                                <option value = "AB+" >AB+</option>
                                <option value = "A+" >A+</option>
                                <option value = "B+" >B+</option>
                                <option value = "O+" >O+</option>
                                <option value = "O-" >O-</option>
                                <option value = "B-" >B-</option>
                                <option value = "A-" >A-</option>
                                <option value = "AB-" >AB-</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="donor-container table-design">
                    <table className="h1-table">
                        <thead>
                            <tr>
                                <th className="col-checkbox"></th>
                                <th className="col-donor text-left">Donor</th>
                                <th className="col-address text-left">Address</th>
                                <th className="col-status">Status</th>
                                <th className="col-blood-type">Blood Type</th>
                                <th className="col-date">Date</th>
                                <th className="col-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.map((appointment) => (
                                <tr key={appointment.id}>
                                    <td className="col-checkbox">
                                        <input type="checkbox" />
                                    </td>
                                    <td className="col-donor">{appointment.donor}</td>
                                    <td className="col-address">{appointment.address}</td>
                                    <td className="col-status">
                                        <span className={`status-badge ${getStatusClass(appointment.status)}`}>
                                            {appointment.status || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="col-blood-type">{appointment.bloodType}</td>
                                    <td className="col-date">{appointment.date}</td>
                                    <td className="col-actions">
                                        <button className="icon-btn edit-btn">
                                            <FiEdit2 />
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        </>
    )
}
