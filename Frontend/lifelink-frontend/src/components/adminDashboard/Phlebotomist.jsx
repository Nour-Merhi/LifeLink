import { useState, useEffect } from "react"
import nurse from "../../assets/imgs/nurseBlack.svg";
import { LiaUserNurseSolid } from "react-icons/lia";
import { FiCheckCircle } from "react-icons/fi";
import { PiChartLineUpBold } from "react-icons/pi";

import api from "../../api/axios";
import PhlebotomistTable from "./phlebotomistComponents/PhlebotomistTable";
import AddPhlebotomistForm from "./phlebotomistComponents/AddPhlebotomistForm";

export default function Phlebotomist(){
    const [openModal, setOpenModal] = useState(false)
    const [hospitals, setHospitals] = useState([])
    const [phlebotomists, setPhlebotomists] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [metrics, setMetrics] = useState({
        total_staff: 0,
        active_staff: 0,
        success_rate: 0,
        monthly_change: 0,
        availability_change: 0,
        success_rate_change: 0,
    })

    const fetchHospitals = () => {
        api.get("/api/admin/dashboard/get-hospitals")
        .then(res => {
            setHospitals(res.data.hospitals)
        })
        .catch(err => console.log(err))
    }

    const fetchPhlebotomists = () => {
        setLoading(true)
        setError("")
        api.get("/api/admin/dashboard/get-phlebotomists")
        .then(res => {
            setPhlebotomists(res.data.phlebotomists || [])
            if (res.data.metrics) {
                setMetrics(res.data.metrics)
            }
        })
        .catch(err => {
            console.error('Error fetching phlebotomists:', err)
            setError(err.response?.data?.message || "Failed to load phlebotomists")
        })
        .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchHospitals()
        fetchPhlebotomists()
    }, [])

    const onClose = () => {
        setOpenModal(false)
    }

    const onPhlebotomistAdded = () => {
        fetchPhlebotomists()
        setOpenModal(false)
    }

    // Calculate metrics dynamically
    const metricsData = [
        {
            title: "Total Staff",
            value: metrics.total_staff.toString(),
            change: `${metrics.monthly_change >= 0 ? '+' : ''}${metrics.monthly_change.toFixed(1)}% vs last month`,
            icon: <LiaUserNurseSolid className="text-3xl"/>,
            bgColor: "#EAFFE5",
            iconColor: "#16a34a"
        },
        {
            title: "Active Staff",
            value: metrics.active_staff.toString(),
            change: `${metrics.availability_change >= 0 ? '+' : ''}${metrics.availability_change.toFixed(1)}% availability`,
            icon: <FiCheckCircle />,
            bgColor: "#EBEAFF",
            iconColor: "#285BFF"
        },
        {
            title: "Avg Success Rate",
            value: `${metrics.success_rate.toFixed(1)}%`,
            change: `${metrics.success_rate_change >= 0 ? '+' : ''}${metrics.success_rate_change.toFixed(1)}% vs last month`,
            icon: <PiChartLineUpBold />,
            bgColor: "#F5E9FF",
            iconColor: "#6132BE"
        }
    ]

    return (
        <section className="phlebotomist-section">
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <img src={nurse} alt="nurse" width="23px" height="23px"/>
                        <h2>Phlebotomist Management</h2>
                    </div>
                    <p>Manage certified phlebotomists and their assignments</p>
                </div>
                <div className="add-btn">
                    <button type="button" onClick={() => setOpenModal(true)}>+ Add New Phlebotomist</button>
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
            <PhlebotomistTable 
                phlebotomists={phlebotomists}
                loading={loading}
                error={error}
                onPhlebotomistsUpdate={fetchPhlebotomists}
            />
            
            {openModal && 
                <AddPhlebotomistForm 
                    onClose={onClose} 
                    hospitals={hospitals}
                    onPhlebotomistAdded={onPhlebotomistAdded}
                />
            }
        </section>
    )
}