import { useState, useEffect } from "react"
import { FiEye } from "react-icons/fi";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoSearchSharp, IoClose } from "react-icons/io5";
import { BsCalendar3 } from "react-icons/bs";
import { BsListUl } from "react-icons/bs";
import { FiUserPlus } from "react-icons/fi";
import { FaTint, FaClock, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { SpinnerDotted } from 'spinners-react';
import api from "../../../api/axios";
import CalendarView from "./CalendarView";
import AssignPhlebotomistModal from "./AssignPhlebotomistModal";
import ViewHomeOrderModal from "./ViewHomeOrderModal";
import EditHomeOrderModal from "./EditHomeOrderModal";

export default function HomeOrderTable({ orders = [], loading = false, error = "", onOrdersUpdate }){
    const [visitState, setVisitState] = useState(""); 
    const [bloodType, setBloodType] = useState("");
    const [hospital, setHospital] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [viewMode, setViewMode] = useState("table"); 
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedOrders, setSelectedOrders] = useState([]); // Array of selected order IDs
    const [selectAll, setSelectAll] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null); // For assign phlebotomist modal
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [selectedOrderCode, setSelectedOrderCode] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");

    // Get unique hospitals from orders
    const uniqueHospitals = Array.from(new Set(orders.map(order => order.hospital_name).filter(Boolean))).sort();

    useEffect(()=>{
        setCurrentPage(1);
    }, [searchTerm, visitState, bloodType, hospital])

    // Normalize status for filtering (backend uses 'canceled', frontend expects 'cancelled')
    const normalizeStatus = (status) => {
        if (status === 'canceled') return 'cancelled';
        return status;
    };

    const normalizeDateStr = (value) => {
        if (!value || value === 'N/A') return null;
        if (typeof value === 'string') {
            // Already YYYY-MM-DD?
            const m = value.match(/^(\d{4}-\d{2}-\d{2})/);
            if (m) return m[1];
        }
        try {
            const d = new Date(value);
            if (Number.isNaN(d.getTime())) return null;
            return d.toISOString().split('T')[0];
        } catch {
            return null;
        }
    };

    // Handle clear filters
    const handleClearFilters = () => {
        setVisitState("");
        setBloodType("");
        setHospital("");
    };

    //Filtering orders based on search term, status, blood type, and hospital (with normalized status)
    const filteredOrders = orders.filter((order) => {
        const normalizedStatus = normalizeStatus(order.status || 'pending');
        const matchesSearch = order.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        const matchPhlebotomist = order.phlebotomist?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        const matchesStatus = !visitState || normalizedStatus === visitState;
        const matchesBlood = !bloodType || order.blood_type === bloodType;
        const matchesHospital = !hospital || order.hospital_name === hospital;

        return (matchesSearch || matchPhlebotomist) && matchesStatus && matchesBlood && matchesHospital;
    });

    // Metrics (same design system as other admin pages)
    const todayStr = new Date().toISOString().split('T')[0];
    const metrics = {
        totalToday: filteredOrders.filter(o => normalizeDateStr(o.date) === todayStr).length,
        pending: filteredOrders.filter(o => normalizeStatus(o.status || 'pending') === 'pending').length,
        completed: filteredOrders.filter(o => normalizeStatus(o.status || 'pending') === 'completed').length,
        cancelled: filteredOrders.filter(o => normalizeStatus(o.status || 'pending') === 'cancelled').length,
    };

    const metricsData = [
        {
            title: "Today's Visits",
            value: metrics.totalToday.toString(),
            change: "Scheduled for today",
            icon: <FaTint className="text-3xl" />,
            bgColor: "#EBEAFF",
            iconColor: "#285BFF",
        },
        {
            title: "Pending Orders",
            value: metrics.pending.toString(),
            change: "Awaiting completion",
            icon: <FaClock className="text-3xl" />,
            bgColor: "#FFF7D6",
            iconColor: "#B45309",
        },
        {
            title: "Completed Visits",
            value: metrics.completed.toString(),
            change: "Finished visits",
            icon: <FaCheckCircle className="text-3xl" />,
            bgColor: "#EAFFE5",
            iconColor: "#16a34a",
        },
        {
            title: "Cancelled",
            value: metrics.cancelled.toString(),
            change: "Cancelled/canceled",
            icon: <FaTimesCircle className="text-3xl" />,
            bgColor: "#FFE5E5",
            iconColor: "#F12C31",
        },
    ];

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
            {/* Metrics Grid (same design as other admin pages) */}
            <div className="metrics-grid-4">
                {metricsData.map((metric, index) => (
                    <div key={index} className="metric-card">
                        <div className="metric-content">
                            <div className="metric-info">
                                <p className="metric-title">{metric.title}</p>
                                <h3 className="metric-value">{metric.value}</h3>
                                <span className="metric-change">{metric.change}</span>
                            </div>
                            <div
                                className="metric-icon"
                                style={{ backgroundColor: metric.bgColor, color: metric.iconColor }}
                            >
                                {metric.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="control-panel">
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
                </div>
                {/* Filters Section */}
                <div className="mt-5">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end' }}>
                        {/* Hospital Filter */}
                        <div style={{ flex: '1', minWidth: '200px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                                Hospital
                            </label>
                            <select
                                value={hospital}
                                onChange={(e) => setHospital(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    backgroundColor: '#fff'
                                }}
                            >
                                <option value="">All Hospitals</option>
                                {uniqueHospitals.map(hosp => (
                                    <option key={hosp} value={hosp}>{hosp}</option>
                                ))}
                            </select>
                        </div>

                        {/* Blood Type Filter */}
                        <div style={{ flex: '1', minWidth: '200px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                                Blood Type
                            </label>
                            <select
                                value={bloodType}
                                onChange={(e) => setBloodType(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    backgroundColor: '#fff'
                                }}
                            >
                                <option value="">All Blood Types</option>
                                <option value="AB+">AB+</option>
                                <option value="A+">A+</option>
                                <option value="B+">B+</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                                <option value="B-">B-</option>
                                <option value="A-">A-</option>
                                <option value="AB-">AB-</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div style={{ flex: '1', minWidth: '200px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                                Status
                            </label>
                            <select 
                                value={visitState}
                                onChange={(e) => setVisitState(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    backgroundColor: '#fff'
                                }}
                            >
                                <option value="">All Statuses</option>
                                <option value="completed">Completed</option>
                                <option value="pending">Pending</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        {/* Clear Filters Button */}
                        <div>
                            <button
                                onClick={handleClearFilters}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#6B6B6B',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#5a5a5a'}
                                onMouseOut={(e) => e.target.style.backgroundColor = '#6B6B6B'}
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    {(visitState || bloodType || hospital) && (
                        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '6px', fontSize: '13px' }}>
                            <strong>Active Filters:</strong>
                            {hospital && <span style={{ marginLeft: '10px', padding: '4px 8px', backgroundColor: '#fff', borderRadius: '4px' }}>Hospital: {hospital}</span>}
                            {bloodType && <span style={{ marginLeft: '10px', padding: '4px 8px', backgroundColor: '#fff', borderRadius: '4px' }}>Blood Type: {bloodType}</span>}
                            {visitState && <span style={{ marginLeft: '10px', padding: '4px 8px', backgroundColor: '#fff', borderRadius: '4px' }}>Status: {visitState}</span>}
                        </div>
                    )}
                </div>
            </div>


            {/* Assign Phlebotomist Button - appears when orders are selected */}
            {selectedOrders.length > 0 && (
                <div style={{ marginBottom: '20px', padding: '0 20px' }}>
                    <button
                        className="assign-phlebotomist-btn"
                        onClick={() => setAssignModalOpen(true)}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#3257CD',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        Assign Phlebotomist ({selectedOrders.length})
                    </button>
                </div>
            )}

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
                                            onClick={() => {
                                                setSelectedOrderCode(o.id);
                                                setViewModalOpen(true);
                                            }}
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
                                            onClick={() => {
                                                setSelectedOrderCode(o.id);
                                                setEditModalOpen(true);
                                            }}
                                        >
                                            <FiEdit />
                                        </button>
                                        <button 
                                            className="icon-btn text-red-500" 
                                            title="Delete"
                                            onClick={() => {
                                                setDeleteConfirm({
                                                    orderCode: o.id,
                                                    donorName: o.name,
                                                    hospitalName: o.hospital_name,
                                                    date: o.date
                                                });
                                                setDeleteError("");
                                            }}
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
                        setSelectedOrder(null);
                    }}
                    orders={selectedOrder ? [selectedOrder] : getSelectedOrdersData()}
                    onAssignSuccess={() => {
                        setSelectedOrders([]);
                        setSelectAll(false);
                        setSelectedOrder(null);
                        if (onOrdersUpdate) {
                            onOrdersUpdate();
                        }
                    }}
                />
            )}

            {viewModalOpen && selectedOrderCode && (
                <ViewHomeOrderModal
                    onClose={() => {
                        setViewModalOpen(false);
                        setSelectedOrderCode(null);
                    }}
                    orderCode={selectedOrderCode}
                />
            )}

            {editModalOpen && selectedOrderCode && (
                <EditHomeOrderModal
                    onClose={() => {
                        setEditModalOpen(false);
                        setSelectedOrderCode(null);
                    }}
                    onOrderUpdated={() => {
                        if (onOrdersUpdate) {
                            onOrdersUpdate();
                        }
                    }}
                    orderCode={selectedOrderCode}
                />
            )}

            {deleteConfirm && (
                <div className="modal-overlay modal-overlay-delete">
                    <div className="modal-container modal-container-delete">
                        <div className="modal-title">
                            <h2>Confirm Deletion</h2>
                            <button onClick={() => {
                                setDeleteConfirm(null);
                                setDeleteError("");
                            }} disabled={deleteLoading}>
                                <IoClose />
                            </button>
                        </div>
                        <div className="modal-form">
                            <p>Are you sure you want to delete the order for <strong>{deleteConfirm.donorName}</strong> at <strong>{deleteConfirm.hospitalName}</strong> on <strong>{deleteConfirm.date}</strong>?</p>
                            <p className="modal-text-secondary">This action cannot be undone.</p>
                            {deleteError && (
                                <div className="error-message modal-error-container">
                                    {deleteError}
                                </div>
                            )}
                            <div className="form-actions form-actions-modal">
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setDeleteConfirm(null);
                                        setDeleteError("");
                                    }}
                                    disabled={deleteLoading}
                                    className="btn-cancel"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    onClick={async () => {
                                        setDeleteLoading(true);
                                        setDeleteError("");
                                        try {
                                            await api.get("/sanctum/csrf-cookie");
                                            await api.delete(
                                                `/api/admin/dashboard/home-visit-orders/${deleteConfirm.orderCode}`
                                            );
                                            setDeleteConfirm(null);
                                            if (onOrdersUpdate) {
                                                onOrdersUpdate();
                                            }
                                        } catch (error) {
                                            console.error('Error deleting home order:', error);
                                            setDeleteError(error.response?.data?.message || error.message || "Failed to delete order");
                                        } finally {
                                            setDeleteLoading(false);
                                        }
                                    }}
                                    disabled={deleteLoading}
                                    className="submit-btn btn-delete-submit"
                                >
                                    {deleteLoading ? (
                                        <>
                                            <SpinnerDotted size={20} thickness={100} speed={100} color="#fff" className="spinner-inline" />
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}