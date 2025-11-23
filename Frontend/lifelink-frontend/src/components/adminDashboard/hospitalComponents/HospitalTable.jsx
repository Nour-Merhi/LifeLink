import { useState, useEffect } from "react"
import { FiEye } from "react-icons/fi";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoSearchSharp } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';

export default function hospitalTable({ hospitals = [], loading = false, error = "" }){
    const [hospitalState, setHospitalState] = useState("all-states"); 
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    const [searchTerm, setSearchTerm] = useState("");

    useEffect(()=>{
        setCurrentPage(1);
    }, [searchTerm, hospitalState])

    // Format date to readable format (YYYY-MM-DD HH:MM)
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        } catch {
            return 'N/A';
        }
    };

 // Get manager name - Laravel returns snake_case for relationships
 const transformedHospitals = Array.isArray(hospitals) ? hospitals.map((hospital) => {
        const manager = hospital.health_center_manager?.user || hospital.healthCenterManager?.user;
        const contactName = manager 
            ? `${manager.first_name || ''} ${manager.middle_name || ''} ${manager.last_name || ''}`.trim()
            : 'N/A';
        
        return {
            id: hospital.code || `HSP-${String(hospital.id).padStart(4, '0')}`,
            name: hospital.name || 'N/A',
            address: hospital.address || 'No address provided',
            status: hospital.status || 'unverified',
            contact_name: contactName,
            phone_nb: hospital.phone_nb || 'N/A',
            email: hospital.email || 'N/A',
            blood_stock: hospital.blood_stock || {}, // If it's an object from backend
            requests: hospital.requests || 0,
            created_at: formatDate(hospital.created_at),
        }
    }) : [];
    

    //Filtering hospital based on search term and status
    const filteredHospitals = transformedHospitals.filter((hospital) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = hospital.name.toLowerCase().includes(searchLower) || 
                             hospital.id.toLowerCase().includes(searchLower); // Search by code too
        const matchesStatus = hospitalState === "all-states" || hospital.status === hospitalState;
        
        return matchesSearch && matchesStatus;
    })

    //Calculate paginiation values
    const totalHospitals = filteredHospitals.length;
    const totalPages = Math.ceil(totalHospitals / itemsPerPage);

    //Calculating which items should show
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentHospitals = filteredHospitals.slice(startIndex, endIndex);

    //Displaying text
    const startDisplay = startIndex + 1;
    const endDisplay = Math.min(endIndex, totalHospitals);

    return(
        <section className="hospital-table-section">
            <div className="control-panel control-panel-layout">
                <div className="search-input">
                    <IoSearchSharp />
                    <input 
                        type="search" 
                        placeholder="Search by hospital name.." 
                        value = {searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filters">
                    <select 
                        value = { hospitalState } 
                        onChange = { (e) => setHospitalState (e.target.value) }
                    >
                        <option value = "all-states" >All states</option>
                        <option value = "verified" >Verified</option>
                        <option value = "unverified" >Unverified</option>
                    </select>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="loader">
                    <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />                
                    <h3>Fetching Hospitals</h3>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#F12C31' }}>
                    <p>Error: {error}</p>
                </div>
            )}

            {/* Table Content */}
            {!loading && !error && (
            <div className="table-design">
                <table className="h1-table">
                    <thead>
                        <tr>
                            <th className="col-select">
                                <input className="ml-3" type="checkbox" aria-label={`select ${hospitalState.name}`}/>
                            </th>
                            <th className="text-left col-hospital">Hospital</th>
                            <th className="col-address">Address</th>
                            <th className="col-status">Status</th>
                            <th className="col-contact">Contact</th>
                            <th className="col-stock">Blood Stock</th>
                            <th className="col-requests">Requests</th>
                            <th className="col-date">Date Added</th>
                            <th className="col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentHospitals.length > 0 ? currentHospitals.map ((h, index) => (
                            <tr key={`${h.id}-${startIndex + index}`}>
                                <td className="col-select">
                                    <input className="ml-3" type="checkbox" aria-label={`select ${hospitalState.name}`}/>
                                </td>
                                <td className="col-hospital">
                                    <div className="cell-title">
                                        <strong title={h.name}>{ h.name }</strong>
                                        <small className="muted">{ h.id }</small>
                                    </div>
                                </td>
                                <td className="col-address">
                                    <div className="cell-sub">
                                        <span title={h.address}>{ h.address }</span>
                                        <div>
                                            <a href="#" className="link">View on Map</a>
                                        </div>
                                    </div>
                                </td>
                                <td className="col-status">
                                    <span className={`badge ${h.status === "verified" ? "badge-success" : "badge-danger"}`}>
                                        { h.status === "verified" ? "Verified" : "Unverified"}
                                    </span>
                                </td>
                                <td className="col-contact">
                                    <div className="contact">
                                        <span>{ h.contact_name }</span>
                                        <small className="muted">{ h.phone_nb }</small>
                                    </div>
                                </td>
                                <td className="col-stock">
                                    {typeof h.blood_stock === 'object' && h.blood_stock !== null ? (
                                        <span className="badge">
                                            A+: {h.blood_stock.A || 0}, B+: {h.blood_stock.B || 0}, O+: {h.blood_stock.O || 0}
                                        </span>
                                    ) : (
                                        <span className="badge">No stock data</span>
                                    )}
                                </td>
                                <td className="col-requests">
                                    <span className="badge request">{ h.requests }</span>
                                </td>
                                <td className="col-date">{ h.created_at }</td>
                                <td className="col-actions">
                                    <div className="row-actions">
                                        <button className="icon-btn text-blue-800"><FiEye /></button>
                                        <button className="icon-btn text-green-600"><FiEdit /></button>
                                        <button className="icon-btn text-red-500"><RiDeleteBin6Line /></button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="10" className="text-center">No hospitals found</td>
                            </tr>
                        )}
                    
                    </tbody>
                </table>
                
                    <div className="pagination">
                        <div className="showing">
                            <small className="muted">Showing {startDisplay} to {endDisplay} of {totalHospitals} hospitals</small>
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
                </div>
            )}
        </section>
    )
}