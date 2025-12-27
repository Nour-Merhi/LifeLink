import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom";
import { FiEye } from "react-icons/fi";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoSearchSharp, IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import axios from 'axios';
import EditDonorForm from "./EditDonorForm";

export default function DonorTable({ donors = [], loading = false, error = "", onDonorsUpdate }){
    const navigate = useNavigate();
    const [donorState, setDonorState] = useState("all-states"); 
    const [bloodType, setBloodType] = useState("all-blood");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [editModal, setEditModal] = useState(null); // { donorCode, donorData }
    const [deleteConfirm, setDeleteConfirm] = useState(null); // { donorCode, donorName }
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");

    useEffect(()=>{
        setCurrentPage(1);
    }, [searchTerm, donorState, bloodType])

    // Blood type mapping (ID to string)
    const bloodTypeMap = {
        1: 'A+', 2: 'A-', 3: 'B+', 4: 'B-',
        5: 'AB+', 6: 'AB-', 7: 'O+', 8: 'O-'
    };

    // Transform backend data to match table format
    const transformedDonors = Array.isArray(donors) ? donors.map((donor) => {
        // Calculate age from date of birth
        const calculateAge = (dob) => {
            if (!dob) return 'N/A';
            const birthDate = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        };

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

        // Process medical conditions JSON
        const medicalConditions = donor.medical_conditions || {};
        const medicalConditionsList = Object.entries(medicalConditions)
            .filter(([key, value]) => value === true)
            .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1));

        return {
            id: donor.code || `D${String(donor.id).padStart(4, '0')}`, // Use database code, fallback to formatted ID
            name: `${donor.user?.first_name || ''} ${donor.user?.middle_name || ''} ${donor.user?.last_name || ''}`.trim(),
            age: calculateAge(donor.date_of_birth),
            blood_type: bloodTypeMap[donor.blood_type_id] || 'Unknown',
            address: donor.address || 'No address provided',
            last_donation: donor.last_donation || 'Never',
            status: donor.status || 'active', // Default to active if not set
            total_donations: donor.total_donations || 0,
            phone_nb: donor.user?.phone_nb || 'N/A',
            email: donor.user?.email || 'N/A',
            created_at: formatDate(donor.created_at),
            gender: donor.gender || 'N/A',
            medical_conditions: medicalConditionsList,
            medical_conditions_raw: medicalConditions,
            // Store original donor data for edit functionality
            _originalDonor: donor
        };
    }): [];

    //Filtering donor based on search term, status and blood type
    const filteredDonors = transformedDonors.filter((donor) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = donor.name.toLowerCase().includes(searchLower) || 
                             donor.id.toLowerCase().includes(searchLower); // Search by code too
        const matchesStatus = donorState === "all-states" || donor.status === donorState;
        const matchesBlood = bloodType === "all-blood" || donor.blood_type === bloodType;

        return matchesSearch && matchesStatus && matchesBlood;
    })

    //Calculate paginiation values
    const totalDonors = filteredDonors.length;
    const totalPages = Math.ceil(totalDonors / itemsPerPage);

    //Calculating which items should show
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentDonor = filteredDonors.slice(startIndex, endIndex);

    //Displaying text
    const startDisplay = startIndex + 1;
    const endDisplay = Math.min(endIndex, totalDonors);

    // Handle edit click
    const handleEditClick = (donor) => {
        // Find the original donor data from the donors array
        const originalDonor = donors.find(d => {
            const code = d.code || `D${String(d.id).padStart(4, '0')}`;
            return code === donor.id;
        });
        
        if (originalDonor) {
            setEditModal({
                donorCode: donor.id,
                donorData: originalDonor
            });
        } else {
            console.error('Donor not found in original data');
            alert('Error: Could not load donor data. Please refresh the page and try again.');
        }
    };

    // Handle delete click
    const handleDeleteClick = (donor) => {
        setDeleteConfirm({
            donorCode: donor.id,
            donorName: donor.name
        });
        setDeleteError("");
    };

    // Handle delete confirmation
    const handleDeleteConfirm = async () => {
        if (!deleteConfirm) return;

        setDeleteLoading(true);
        setDeleteError("");

        try {
            await axios.delete(
                `http://localhost:8000/api/admin/dashboard/donors/${deleteConfirm.donorCode}`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );

            setDeleteConfirm(null);
            if (onDonorsUpdate) {
                onDonorsUpdate();
            }
        } catch (error) {
            console.error('Error deleting donor:', error);
            setDeleteError(error.response?.data?.message || error.message || "Failed to delete donor");
        } finally {
            setDeleteLoading(false);
        }
    };

    // Handle delete cancel
    const handleDeleteCancel = () => {
        setDeleteConfirm(null);
        setDeleteError("");
    };

    // Handle edit modal close
    const handleEditClose = () => {
        setEditModal(null);
    };

    // Handle donor updated
    const handleDonorUpdated = () => {
        setEditModal(null);
        if (onDonorsUpdate) {
            onDonorsUpdate();
        }
    };

    return(
        <section className="hospital-table-section">
            <div className="control-panel control-panel-layout">
                <div className="search-input">
                    <IoSearchSharp />
                    <input 
                        type="search" 
                        placeholder="Search by donor name.." 
                        value = {searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
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
                            value = { donorState } 
                            onChange = { (e) => setDonorState (e.target.value) }
                        >
                            <option value = "all-states" >All states</option>
                            <option value = "active" >Active</option>
                            <option value = "inactive" >Inactive</option>
                            <option value = "blocked" >Blocked</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="loader">
                    <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />                
                    <h3>Fetching Donors...</h3>
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
                                <input className="ml-3" type="checkbox" aria-label="select all"/>
                            </th>
                            <th className="text-left col-donor">Donor</th>
                            <th className="col-blood">Blood Type</th>
                            <th className="col-address">Address</th>
                            <th className="col-last-donation">Last Donation</th>
                            <th className="col-status">Status</th>
                            <th className="col-total">Total Donations</th>
                            <th className="col-phone">Phone Number</th>
                            <th className="col-contact">Email</th>
                            <th className="col-date">Date Added</th>
                            <th className="col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentDonor.length > 0 ? currentDonor.map ((d, index) => (
                            <tr key={`${d.id}-${startIndex + index}`}>
                                <td className="col-select">
                                    <input className="ml-3" type="checkbox" aria-label={`select ${donorState.name}`}/>
                                </td>
                                <td className="col-donor">
                                    <div className="cell-title">
                                        <strong title={d.name}>{ d.name }</strong>
                                        <small className="muted">{ d.id }</small>
                                    </div>
                                </td>
                                <td className="col-blood">
                                    <span className="badge">{d.blood_type}</span>
                                </td>
                                <td className="col-address">
                                    <div className="cell-sub">
                                        <span title={d.address}>{ d.address }</span>
                                        <div>
                                            <a href="#" className="link">View on Map</a>
                                        </div>
                                    </div>
                                </td>
                                <td className="col-last-donation">
                                    <span>{d.last_donation}</span>
                                </td>
                                <td className="col-status">
                                    <span className={`badge ${
                                        d.status === "active" ? "badge-success" : 
                                        d.status === "inactive" ? "badge-pending" : 
                                        "badge-danger"
                                    }`}>
                                        {d.status === "active" ? "Active" : 
                                         d.status === "inactive" ? "Inactive" : 
                                         "Blocked"}
                                    </span>
                                </td>
                                <td className="col-total">
                                    <span>{d.total_donations}</span>
                                </td>
                                <td className="col-phone">
                                    <span>+961 {d.phone_nb}</span>
                                </td>
                                <td className="col-contact">
                                    <span>{d.email}</span>
                                </td>
                                <td className="col-date">{ d.created_at }</td>
                                <td className="col-actions">
                                    <div className="row-actions">
                                        <button 
                                            className="icon-btn text-blue-800"
                                            onClick={() => navigate(`/admin/donors/${d.id}`)}
                                            title="View Details"
                                        >
                                            <FiEye />
                                        </button>
                                        <button 
                                            className="icon-btn text-green-600"
                                            onClick={() => handleEditClick(d)}
                                            title="Edit Donor"
                                        >
                                            <FiEdit />
                                        </button>
                                        <button 
                                            className="icon-btn text-red-500"
                                            onClick={() => handleDeleteClick(d)}
                                            title="Delete Donor"
                                        >
                                            <RiDeleteBin6Line />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="10" style={{ textAlign: 'center', padding: '40px' }}>
                                    <p>No donors found</p>
                                </td>
                            </tr>
                        )}

                    </tbody>
                </table>
                
                <div className="pagination">
                    <div className="showing">
                        <small className="muted">Showing {startDisplay} to {endDisplay} of {totalDonors} donors</small>
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

            {/* Edit Donor Modal */}
            {editModal && (
                <EditDonorForm
                    onClose={handleEditClose}
                    onDonorUpdated={handleDonorUpdated}
                    donorCode={editModal.donorCode}
                    donorData={editModal.donorData}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="modal-overlay modal-overlay-delete">
                    <div className="modal-container modal-container-delete">
                        <div className="modal-title">
                            <h2>Delete Donor</h2>
                            <button onClick={handleDeleteCancel} disabled={deleteLoading}>
                                <IoClose />
                            </button>
                        </div>
                        <div className="modal-form">
                            <p>Are you sure you want to delete <strong>{deleteConfirm.donorName}</strong>?</p>
                            <p className="modal-text-secondary">
                                This action cannot be undone. If the donor has active appointments, deletion will be prevented.
                            </p>
                            
                            {deleteError && (
                                <div className="error-message modal-error-container">
                                    {deleteError}
                                </div>
                            )}

                            <div className="form-actions form-actions-modal">
                                <button 
                                    type="button" 
                                    onClick={handleDeleteCancel}
                                    disabled={deleteLoading}
                                    className="btn-cancel"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleDeleteConfirm}
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