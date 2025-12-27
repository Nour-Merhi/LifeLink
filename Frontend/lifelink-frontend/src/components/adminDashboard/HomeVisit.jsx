import { useState, useEffect } from "react"
import { BiSolidBuildingHouse } from "react-icons/bi";
import axios from 'axios'

import HomeOrderTable from "./homeVisitComponents/HomeOrderTable"
import AddHomeApp from "./homeVisitComponents/AddHomeApp";
import HomeAppTable from "./homeVisitComponents/HomeAppTable";

export default function HomeVisit(){
    const [hospitals, setHospitals] = useState([])
    const [openModal, setOpenModal] = useState(false)
    const [app, setApp] = useState(false)
    const [orders, setOrders] = useState(true)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const onClose = () => {
        setOpenModal(false)
    }

    const [orderData, setOrderData] = useState([]);
    const [appointmentData, setAppointmentData] = useState([]);

    const fetchData = () => {
        setLoading(true);
        setError("");
        
        // Fetch hospitals
        axios.get('http://localhost:8000/api/admin/dashboard/get-hospitals')
            .then((res) => {
                const hospitalsData = res.data.hospitals || res.data || [];
                setHospitals(Array.isArray(hospitalsData) ? hospitalsData : []);
            })
            .catch(err => {
                setError(err.response?.data?.message || err.message || "An error occurred while fetching hospitals")
            });

        // Fetch home visit orders
        axios.get('http://localhost:8000/api/admin/dashboard/home-visit-orders')
            .then((res) => {
                const ordersData = res.data.orders || res.data || [];
                setOrderData(Array.isArray(ordersData) ? ordersData : []);
            })
            .catch(err => {
                console.error('Error fetching home visit orders:', err);
                setError(err.response?.data?.message || err.message || "An error occurred while fetching orders")
            });

        // Fetch home visit appointments
        axios.get('http://localhost:8000/api/admin/dashboard/home-visit-appointments')
            .then((res) => {
                const appointmentsData = res.data.appointments || res.data || [];
                setAppointmentData(Array.isArray(appointmentsData) ? appointmentsData : []);
            })
            .catch(err => {
                console.error('Error fetching home visit appointments:', err);
                setError(err.response?.data?.message || err.message || "An error occurred while fetching appointments")
            })
            .finally(() => setLoading(false))
    };

    useEffect(() => {
        fetchData();
    }, [])

    const totalOrders = orderData.length;
    const totalAppointments = appointmentData.length;

    return(
        <section className="home-visit-section">
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <BiSolidBuildingHouse className="icon-size"/>
                        <h2>Home Visit Management</h2>
                    </div>
                    <p>Manage home visit orders and phlebotomist operations</p>
                </div>
                <div className="mb-2">
                        {orders && 
                            <h3>Total Orders: {totalOrders}</h3>
                        }
                        {app && 
                            <h3>Total Registered Hospitals: {totalAppointments}</h3>
                        }
                </div>
            </div>

            <div className="scroll-btn"> 
                <div className="chose-page">
                    <div className={`sliding-indicator ${orders ? 'slide-left' : 'slide-right'}`}></div>
                    <button 
                        className={orders ? 'active-btn' : 'inactive-btn'}
                        onClick = {()=>{
                            setApp(false)
                            setOrders(true)
                        }}
                    >
                        Home Visit Orders
                    </button>
                    <button 
                        className={app ? 'active-btn' : 'inactive-btn'}
                        onClick = { () => {
                            setOrders(false)
                            setApp(true)
                        }}
                    >
                        Appointments Management
                    </button>
                </div>
                
                {app && 
                    <div className="add-btn">
                        <button type="button" onClick={() => setOpenModal(true)}>+ Add New Home Appointment</button>
                    </div>
                }
            </div>

            {orders &&
                <HomeOrderTable 
                    orders={orderData} 
                    loading={loading} 
                    error={error}
                    onOrdersUpdate={fetchData}
                />
            }
            {app &&
                <HomeAppTable 
                    appointments={appointmentData} 
                    loading={loading} 
                    error={error}
                    onAppointmentsUpdate={fetchData}
                />
            }
            
            {openModal && 
                <AddHomeApp onClose = { onClose } hospitals={ hospitals} onAppointmentAdded={fetchData} />
            }
        </section>
    )
}