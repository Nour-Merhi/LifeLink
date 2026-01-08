import { useState, useEffect } from "react"
import AddPatientCaseForm from "./AddPatientCaseForm"
import ViewPatientCaseModal from "./ViewPatientCaseModal"
import EditPatientCaseModal from "./EditPatientCaseModal"

import { IoSearchSharp } from "react-icons/io5";
import { IoPersonCircle } from "react-icons/io5";
import { FaHospital } from "react-icons/fa";
import { IoCalendarSharp } from "react-icons/io5";
import { GoClockFill } from "react-icons/go";
import { FiEdit3 } from "react-icons/fi";



export default function PatientFunding({ patientCases, onPatientCaseUpdated }){
    const [searchTerm, setSearchTerm] = useState("");
    const [patientState, setPatientState] = useState("all-states");
    const [caseSeverity, setCaseSeverity] = useState("all-severity");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(9);
    const [openModal, setOpenModal] = useState(false)
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedPatientCaseId, setSelectedPatientCaseId] = useState(null);

    const onClose = () => {
        setOpenModal(false)
    }

    useEffect(()=>{
        setCurrentPage(1);
    }, [searchTerm, patientState, caseSeverity])

    //Filtering orders based on search term, status and severity
    const filteredPatientCases = patientCases ? patientCases.filter((patientCase) => {
        const matchesSearch = patientCase.patientName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSeverity = caseSeverity === "all-severity" || patientCase.severity?.toLowerCase() === caseSeverity.toLowerCase();
        const matchesStatus = patientState === "all-states" || patientCase.status?.toLowerCase() === patientState.toLowerCase();

        return matchesSearch && matchesSeverity && matchesStatus;
    }) : [];

    //Calculate paginiation values
    const totalPatientCases = filteredPatientCases.length;
    const totalPages = Math.ceil(totalPatientCases / itemsPerPage);

    //Calculating which items should show
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPatientCase = filteredPatientCases.slice(startIndex, endIndex);

    //Displaying text
    const startDisplay = startIndex + 1;
    const endDisplay = Math.min(endIndex, totalPatientCases);

    return(
        <section className="hospital-table-section">
            <div className="control-panel">
                <div className="control">
                    <div >
                        <h4>Patient Funding</h4>
                        <span className="text-sm text-gray-500">Manage patient funding campaigns and disbursements</span>
                    </div>
                    <div className="add-btn">
                        <button type="button" onClick={() => setOpenModal(true)}>+ Create Patient Case</button>
                    </div>
                </div>

                <div className="control-panel-layout">
                    <div className="control-panel-layout-left">
                        <div className="search-input">
                            <IoSearchSharp />
                            <input 
                                type="search" 
                                placeholder="Search by patient name..." 
                                value = {searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="filter-gap">
                        <div className="filters">
                            <select 
                                value = { caseSeverity } 
                                onChange = { (e) => setCaseSeverity (e.target.value) }
                            >
                                <option value = "all-severity" >All severity</option>
                                <option value = "high" >High</option>
                                <option value = "medium" >Medium</option>
                                <option value = "low" >Low</option>
                            </select>
                        </div>
                        <div className="filters">
                            <select 
                                value = { patientState } 
                                onChange = { (e) => setPatientState (e.target.value) }
                            >
                                <option value = "all-states" >All states</option>
                                <option value = "active" >Active</option>
                                <option value = "done" >Done</option>
                                <option value = "cancelled" >Cancelled</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            {/*Patient card Case*/}
            <div className="cases-grid">
                {currentPatientCase.map((p) => {
                    const fundingPercentage = Math.round((p.currentFunding / p.targetFunding) * 100);

                    return(
                        <div key={p.id} className="patient-case-design">
                            <div className="case-header border-bottom">
                                <div className="case-header-left">
                                    <IoPersonCircle className="case-avatar" />
                                    <div className="case-patient-info">
                                        <h4>{p.patientName}</h4>
                                        <p>{p.condition} • Age {p.age}</p>
                                    </div>
                                </div>
                                <div className="case-badges">
                                    <span className={`badge ${
                                        p.severity === "high" ? "badge-danger" :
                                        p.severity === "medium" ? "badge-pending" :
                                        "badge-success"
                                    }`}>
                                        {p.severity ? p.severity.charAt(0).toUpperCase() + p.severity.slice(1) : 'Low'}
                                    </span>
                                    <span className={`badge ${
                                        p.status === "active" ? "request" :
                                        p.status === "done" ? "badge-success" : 
                                        "badge-danger"
                                    }`}>
                                        {p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : 'Active'}
                                    </span>
                                </div>
                            </div>

                            <div className="case-body">
                                <div className="progress-case">
                                    <div className="funding-info">
                                        <span className="funding-label">Funding progress</span>
                                        <span className="funding-amount">
                                            ${p.currentFunding.toLocaleString()} / ${p.targetFunding.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill" 
                                            style={{ width: `${fundingPercentage}%` }}
                                        ></div>
                                    </div>

                                    <div className="funding-stats">
                                        <span>{p.donorsCount} donors</span>
                                        <span>{fundingPercentage}% funded</span>
                                    </div>
                                </div>
                                <div className="case-description">
                                    <small>
                                        {p.description}
                                    </small>
                                </div>
                            </div>

                            <div className="case-stats">
                                <div>
                                    <FaHospital />
                                    <small>{p.hospital}</small>
                                </div>
                                <div>
                                    <IoCalendarSharp />
                                    <small>{p.daysRemaining} days remaining</small>
                                </div>
                                <div>
                                    <GoClockFill />
                                    <small>Created at {p.created_at} </small>
                                </div>
                            </div>

                            <div className="case-buttons">
                                <button 
                                    className="blue-btn"
                                    onClick={() => {
                                        setSelectedPatientCaseId(p.id);
                                        setViewModalOpen(true);
                                    }}
                                >
                                    View Details
                                </button>
                                <button 
                                    className="filters edit-case-btn"
                                    onClick={() => {
                                        setSelectedPatientCaseId(p.id);
                                        setEditModalOpen(true);
                                    }}
                                >
                                    <FiEdit3 />Edit
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

             {/* Pagination */}
             {totalPatientCases > 0 && (
                <div className="pagination">
                    <div className="showing">
                        <small className="muted">Showing {startDisplay} to {endDisplay} of {totalPatientCases} hospitals</small>
                    </div>
                    <div className="pagination-controls">
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="pagination-btn"
                        >
                            Previous
                        </button>

                        {Array.from({ length: totalPages}, (_, i) => i + 1).map((pageNum) => (
                            <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`pagination-btn ${currentPage === pageNum ? 'active': ''}`}
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
            )}

            {openModal && 
                <AddPatientCaseForm onClose = { onClose } onPatientCaseAdded={onPatientCaseUpdated} />
            }

            {viewModalOpen && (
                <ViewPatientCaseModal 
                    onClose={() => {
                        setViewModalOpen(false);
                        setSelectedPatientCaseId(null);
                    }}
                    patientCaseId={selectedPatientCaseId}
                />
            )}

            {editModalOpen && (
                <EditPatientCaseModal 
                    onClose={() => {
                        setEditModalOpen(false);
                        setSelectedPatientCaseId(null);
                    }}
                    onPatientCaseUpdated={onPatientCaseUpdated}
                    patientCaseId={selectedPatientCaseId}
                />
            )}

        </section>
    );
}