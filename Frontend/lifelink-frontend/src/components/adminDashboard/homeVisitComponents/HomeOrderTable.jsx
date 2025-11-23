import { useState, useEffect } from "react"
import { FiEye } from "react-icons/fi";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoSearchSharp } from "react-icons/io5";
import { BsCalendar3 } from "react-icons/bs";
import { BsListUl } from "react-icons/bs";
import { FiUserPlus } from "react-icons/fi";
import { SpinnerDotted } from 'spinners-react';
import CalendarView from "./CalendarView";
import AssignPhlebotomistModal from "./AssignPhlebotomistModal";

export default function HomeOrderTable({ orders = [], loading = false, error = "", onOrdersUpdate }){
    const [visitState, setVisitState] = useState("all-states"); 
    const [bloodType, setBloodType] = useState("all-blood");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [viewMode, setViewMode] = useState("table"); 
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedOrders, setSelectedOrders] = useState([]); // Array of selected order IDs
    const [selectAll, setSelectAll] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");

    useEffect(()=>{
        setCurrentPage(1);
    }, [searchTerm, visitState, bloodType])


    // Normalize status for filtering (backend uses 'canceled', frontend expects 'cancelled')
    const normalizeStatus = (status) => {
        if (status === 'canceled') return 'cancelled';
        return status;
    };

    //Filtering orders based on search term, status and blood type (with normalized status)
    const filteredOrders = orders.filter((order) => {
        const normalizedStatus = normalizeStatus(order.status || 'pending');
        const matchesSearch = order.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        const matchPhlebotomist = order.phlebotomist?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        const matchesStatus = visitState === "all-states" || normalizedStatus === visitState;
        const matchesBlood = bloodType === "all-blood" || order.blood_type === bloodType;

        return (matchesSearch || matchPhlebotomist) && matchesStatus && matchesBlood;
    });

    // Handle individual checkbox change
    const handleCheckboxChange = (orderId, isChecked) => {
        if (isChecked) {
            setSelectedOrders([...selectedOrders, orderId]);
        } else {
            setSelectedOrders(selectedOrders.filter(id => id !== orderId));
            setSelectAll(false);
        }
    };

    // Handle select all checkbox
    const handleSelectAll = (isChecked) => {
        if (isChecked) {
            const allOrderIds = currentOrder.map(o => o.id);
            setSelectedOrders(allOrderIds);
            setSelectAll(true);
        } else {
            setSelectedOrders([]);
            setSelectAll(false);
        }
    };

    // Get selected orders data
    const getSelectedOrdersData = () => {
        return filteredOrders.filter(o => selectedOrders.includes(o.id));
    };

    //Calculate paginiation values
    const totalOrders = filteredOrders.length;
    const totalPages = Math.ceil(totalOrders / itemsPerPage);

    //Calculating which items should show
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentOrder = filteredOrders.slice(startIndex, endIndex);

    //Displaying text
    const startDisplay = startIndex + 1;
    const endDisplay = Math.min(endIndex, totalOrders);

    if (loading) {
        return (
            <div className="loader">
                <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />                
                <h3>Loading Home Visit Orders...</h3>
            </div>
        );
    }

    if (error && !loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: '#F12C31' }}>
                <p>Error: {error}</p>
            </div>
        );
    }

    return(
        <section className="hospital-table-section">
            <div className="control-panel">
                <h3 className="control-panel-title">Home Donations Orders</h3>
                <div className="control-panel-layout">
                    <div className="control-panel-layout-left">
                        <div className="search-input">
                            <IoSearchSharp />
                            <input 
                                type="search" 
                                placeholder="Search by donor or nurse name..." 
                                value = {searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="view-toggle">
                            <button 
                                className={viewMode === "table" ? "active-view" : ""}
                                onClick={() => setViewMode("table")}
                                title="Table View"
                            >
                                <BsListUl />
                            </button>
                            <button 
                                className={viewMode === "calendar" ? "active-view" : ""}
                                onClick={() => setViewMode("calendar")}
                                title="Calendar View"
                            >
                                <BsCalendar3 />
                            </button>
                        </div>
                    </div>

                    <div className="filter-gap">
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
                        <div className="filters">
                            <select 
                                value = { visitState } 
                                onChange = { (e) => setVisitState (e.target.value) }
                            >
                                <option value = "all-states" >All states</option>
                                <option value = "completed" >Completed</option>
                                <option value = "pending" >Pending</option>
                                <option value = "cancelled" >Cancelled</option>
                            </select>
                        </div>
                        {/* Assign Phlebotomist Button - appears when orders are selected */}
                        {selectedOrders.length > 0 ? (
                            <div className="assign-phlebotomist-btn">
                                <button
                                    className="assign-phlebotomist-btn"
                                    onClick={() => setAssignModalOpen(true)}
                                >
                                    Assign Phlebotomist ({selectedOrders.length})
                                </button>
                            </div>
                        ) : <div className="filters">
                                <small>Select order/s to assign phlebotomist</small>
                            </div>
                        }
                    </div>
                </div>
            </div>

            {viewMode === "calendar" && (
                <CalendarView orders={orders} filteredOrders={filteredOrders} />
            )}

            {viewMode === "table" && <div className="table-design">
                <table className="h1-table">
                    <thead>
                        <tr>
                            <th className="col-select">
                                <input 
                                    className="ml-3" 
                                    type="checkbox" 
                                    checked={selectAll && currentOrder.length > 0 && selectedOrders.length === currentOrder.length}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                    aria-label="select all orders"
                                />
                            </th>
                            <th className="col-order-id">Order ID</th>
                            <th className="text-left col-donor">Donor</th>
                            <th className="col-hospital">Hospital</th>
                            <th className="col-contact">Contact</th>
                            <th className="col-physical">Age & Weight</th>
                            <th className="col-address">Address</th>
                            <th className="col-status">Status</th>
                            <th className="col-phlebotomist">Phlebotomist</th>
                            <th className="col-date-time">Date & Time</th>
                            <th className="col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                            {currentOrder.length > 0 ? currentOrder.map ((o, index) => {
                                const isSelected = selectedOrders.includes(o.id);
                                return (
                                <tr key={`${o.id}-${startIndex + index}`}>
                                <td className="col-select">
                                    <input 
                                        className="ml-3" 
                                        type="checkbox" 
                                        checked={isSelected}
                                        onChange={(e) => handleCheckboxChange(o.id, e.target.checked)}
                                        aria-label={`select order ${o.id}`}
                                    />
                                </td>
                                <td className="col-order-id">
                                    <div className="cell-title">
                                        <strong title={o.id}>{ o.id }</strong>
                                        <small className="muted">{ o.created_at }</small>
                                    </div>
                                </td>
                                <td className="col-donor">
                                    <div className="cell-title">
                                        <strong title={o.name}>{ o.name }</strong>
                                        <small className="muted">Blood Type: { o.blood_type }</small>
                                    </div>
                                </td>

                                <td className="col-hospital">
                                    <div className="cell-title">
                                        <strong title={o.hospital_name}>{ o.hospital_name || 'N/A' }</strong>
                                    </div>
                                </td>

                                <td className="col-contact">
                                    <div className="cell-title">
                                        <span>{ o.email }</span>
                                        <small className="muted">{ o.phone }</small>
                                    </div>
                                </td>

                                <td className="col-physical">
                                    <div className="cell-title">
                                        <span>{ o.age } years</span>
                                        <small className="muted">{ o.weight } kg</small>
                                    </div>
                                </td>
                                
                                <td className="col-address">
                                    <div className="cell-sub">
                                        <span title={o.address}>{ o.address }</span>
                                        <div>
                                            <a href="#" className="link">View on Map</a>
                                        </div>
                                    </div>
                                </td>

                                <td className="col-status">
                                    <span className={`badge ${
                                        o.status === "completed" ? "badge-success" : 
                                        (o.status === "pending" || o.status === "Pending") ? "badge-pending" : 
                                        "badge-danger"
                                    }`}>
                                        { o.status === "canceled" ? "Cancelled" : (o.status?.charAt(0).toUpperCase() + o.status?.slice(1)) || "Pending" }
                                    </span>
                                </td>
                                <td className="col-phlebotomist">
                                    <span>{o.phlebotomist}</span>
                                </td>
                                
                                <td className="col-date">
                                    <div className="cell-date">
                                        <span>{ o.date }</span>
                                        <span>{ o.time }</span>
                                    </div>
                                </td>    
                                    
                                <td className="col-actions">
                                    <div className="row-actions">
                                        <button 
                                            className="icon-btn text-blue-800" 
                                            title="View Details"
                                        >
                                            <FiEye />
                                        </button>
                                        <button 
                                            className="icon-btn text-purple-600" 
                                            title="Assign Phlebotomist"
                                            onClick={() => {
                                                setSelectedOrder(o);
                                                setAssignModalOpen(true);
                                            }}
                                        >
                                            <FiUserPlus />
                                        </button>
                                        <button 
                                            className="icon-btn text-green-600" 
                                            title="Edit"
                                        >
                                            <FiEdit />
                                        </button>
                                        <button 
                                            className="icon-btn text-red-500" 
                                            title="Delete"
                                        >
                                            <RiDeleteBin6Line />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            );
                            }) : (
                            <tr>
                                <td colSpan="11" style={{ textAlign: 'center', padding: '40px' }}>
                                    <p>No orders found</p>
                                </td>
                            </tr>
                        )}

                    </tbody>
                </table>
                
                <div className="pagination">
                    <div className="showing">
                        <small className="muted">Showing {startDisplay} to {endDisplay} of {totalOrders} orders</small>
                    </div>
                    <div className="pagination-controls">
                        <button 
                            onClick = {()=> setCurrentPage(prev => Math.max(1, prev -1))}
                            disabled = {currentPage === 1}
                            className="pagination-btn"
                        >
                            Previous
                        </button>

                        {/*page Number Buttons*/}
                        {Array.from({ length: totalPages}, (_, i) => i + 1).map((pageNum) =>(
                            <button
                                key = {pageNum}
                                onClick = {() => setCurrentPage(pageNum)}
                                className={`pagination-btn ${currentPage === pageNum ? 'active': ''}`}
                            >
                                {pageNum}
                            </button>
                        ))}
                        
                        <button 
                            onClick = {() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled = {currentPage === totalPages}
                            className="pagination-btn"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>}


            {assignModalOpen && (
                <AssignPhlebotomistModal
                    onClose={() => {
                        setAssignModalOpen(false);
                    }}
                    orders={getSelectedOrdersData()}
                    onAssignSuccess={() => {
                        setSelectedOrders([]);
                        setSelectAll(false);
                        if (onOrdersUpdate) {
                            onOrdersUpdate();
                        }
                    }}
                />
            )}
        </section>
    )
}