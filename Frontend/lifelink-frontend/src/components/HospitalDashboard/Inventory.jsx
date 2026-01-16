import { useState, useEffect } from "react";
import { PiHeartbeatFill } from "react-icons/pi";
import { FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import { IoSearchSharp } from "react-icons/io5";
import axios from "axios";

export default function Inventory() {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = () => {
        setLoading(true);
        // In production: axios.get("/api/hospital/inventory")
        setTimeout(() => {
            const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
            setInventory(bloodTypes.map((type, index) => ({
                id: index + 1,
                bloodType: type,
                units: Math.floor(Math.random() * 50) + 10,
                reserved: Math.floor(Math.random() * 10),
                threshold: 15,
                expiration: new Date(Date.now() + (Math.random() * 30 + 7) * 24 * 60 * 60 * 1000).toISOString(),
                status: Math.random() > 0.7 ? 'critical' : 'normal'
            })));
            setLoading(false);
        }, 500);
    };

    const handleMarkTested = (bloodType) => {
        // In production: axios.post(`/api/hospital/inventory/${bloodType}/tested`)
        console.log("Mark as tested:", bloodType);
    };

    const handleMarkAccepted = (bloodType) => {
        // In production: axios.post(`/api/hospital/inventory/${bloodType}/accepted`)
        console.log("Mark as accepted:", bloodType);
    };

    const handleMarkQuarantined = (bloodType) => {
        // In production: axios.post(`/api/hospital/inventory/${bloodType}/quarantined`)
        console.log("Mark as quarantined:", bloodType);
    };

    const getStatusBadge = (item) => {
        const available = item.units - item.reserved;
        if (available < item.threshold) {
            return <span className="badge badge-danger">Critical</span>;
        }
        return <span className="badge badge-success">Normal</span>;
    };

    const totalUnits = inventory.reduce((sum, item) => sum + item.units, 0);
    const totalReserved = inventory.reduce((sum, item) => sum + item.reserved, 0);
    const criticalCount = inventory.filter(item => (item.units - item.reserved) < item.threshold).length;

    const metricsData = [
        {
            title: "Total Units",
            value: totalUnits.toString(),
            change: "All blood types",
            icon: <PiHeartbeatFill />,
            bgColor: "#EAFFE5",
            iconColor: "#16a34a"
        },
        {
            title: "Reserved Units",
            value: totalReserved.toString(),
            change: "Currently reserved",
            icon: <FiCheckCircle />,
            bgColor: "#EBEAFF",
            iconColor: "#285BFF"
        },
        {
            title: "Critical Shortages",
            value: criticalCount.toString(),
            change: "Below threshold",
            icon: <FiAlertTriangle />,
            bgColor: "#FFE5E5",
            iconColor: "#F12C31"
        }
    ];

    return (
        <section className="inventory-section">
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <PiHeartbeatFill className="icon-size" />
                        <h2>Blood Bank Inventory</h2>
                    </div>
                    <p>Monitor blood inventory levels, expiration dates, and manage incoming donations</p>
                </div>
            </div>

            {/* Metrics */}
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

            {/* Search Bar */}
            <div className="control-panel">
                <div className="control-panel-layout">
                    <div className="search-input">
                        <IoSearchSharp />
                        <input 
                            type="search" 
                            placeholder="Search by blood type.." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="table-design">
                <table className="h1-table">
                    <thead>
                        <tr>
                            <th className="col-order-id">Blood Type</th>
                            <th className="col-amount">Total Units</th>
                            <th className="col-amount">Reserved</th>
                            <th className="col-amount">Available</th>
                            <th className="col-amount">Threshold</th>
                            <th className="col-date">Expiration</th>
                            <th className="col-availability">Status</th>
                            <th className="col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.filter(item => {
                            const searchLower = searchTerm.toLowerCase();
                            return searchTerm === "" || item.bloodType.toLowerCase().includes(searchLower);
                        }).length > 0 ? (
                            inventory.filter(item => {
                                const searchLower = searchTerm.toLowerCase();
                                return searchTerm === "" || item.bloodType.toLowerCase().includes(searchLower);
                            }).map((item) => {
                                const available = item.units - item.reserved;
                                return (
                                    <tr key={item.id} className={available < item.threshold ? 'urgent-row' : ''}>
                                        <td className="col-order-id">
                                            <strong style={{ fontSize: '16px', color: '#F12C31' }}>{item.bloodType}</strong>
                                        </td>
                                        <td className="col-amount">
                                            <span className="amount-value">{item.units}</span>
                                        </td>
                                        <td className="col-amount">{item.reserved}</td>
                                        <td className="col-amount">
                                            <strong>{available}</strong>
                                        </td>
                                        <td className="col-amount">{item.threshold}</td>
                                        <td className="col-date">
                                            <div className="cell-date">
                                                <span>{new Date(item.expiration).toLocaleDateString()}</span>
                                                <small className="muted">
                                                    {Math.ceil((new Date(item.expiration) - new Date()) / (1000 * 60 * 60 * 24))} days
                                                </small>
                                            </div>
                                        </td>
                                        <td className="col-availability">
                                            {getStatusBadge(item)}
                                        </td>
                                        <td className="col-actions">
                                            <div className="row-actions">
                                                <button 
                                                    className="icon-btn text-green-600"
                                                    onClick={() => handleMarkTested(item.bloodType)}
                                                    title="Mark as Tested"
                                                >
                                                    Tested
                                                </button>
                                                <button 
                                                    className="icon-btn text-blue-600"
                                                    onClick={() => handleMarkAccepted(item.bloodType)}
                                                    title="Mark as Accepted"
                                                >
                                                    Accept
                                                </button>
                                                <button 
                                                    className="icon-btn text-orange-600"
                                                    onClick={() => handleMarkQuarantined(item.bloodType)}
                                                    title="Quarantine"
                                                >
                                                    Quarantine
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="8" style={{ textAlign: "center", padding: "40px" }}>
                                    {searchTerm ? "No inventory found matching your search" : "No inventory data available"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

