import { useState, useEffect } from "react";
import { FiEye, FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoSearchSharp } from "react-icons/io5";
import { HiOutlineIdentification } from "react-icons/hi";
import { IoCloseCircle } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';

export default function AfterDeathPledges({ afterDeathPledges = [], metricsData, loading = false, error = "", onRefresh }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all-states");
    const [filterOrgan, setFilterOrgan] = useState("all-organs");
    const [filterGender, setFilterGender] = useState("all-genders");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [viewingPhoto, setViewingPhoto] = useState(null);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterOrgan, filterGender]);

    // Filter after death pledges
    const filteredPledges = afterDeathPledges.filter((pledge) => {
        const matchesSearch = pledge.donor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            pledge.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "all-states" || pledge.status === filterStatus;
        const matchesOrgan = filterOrgan === "all-organs" || 
                           (filterOrgan === "all" ? pledge.pledged_organs === "All Organs" : 
                            pledge.pledged_organs.toLowerCase().includes(filterOrgan.toLowerCase()));
        const matchesGender = filterGender === "all-genders" || pledge.gender.toLowerCase() === filterGender.toLowerCase();
        
        return matchesSearch && matchesStatus && matchesOrgan && matchesGender;
    });

    // Pagination
    const totalPledges = filteredPledges.length;
    const totalPages = Math.ceil(totalPledges / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPledges = filteredPledges.slice(startIndex, endIndex);

    // Displaying text
    const startDisplay = startIndex + 1;
    const endDisplay = Math.min(endIndex, totalPledges);

    // Status badge
    const getStatusBadge = (status) => {
        const statusMap = {
            active: { label: "Active", className: "badge-success" },
            cancelled: { label: "Cancelled", className: "badge-danger" }
        };
        const statusInfo = statusMap[status] || { label: status, className: "badge-inactive" };
        return <span className={`badge ${statusInfo.className}`}>{statusInfo.label}</span>;
    };

    return (
        <section className="hospital-table-section">
            {/* Metrics Cards */}
            <div className="metrics-grid">
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

            {/* Control Panel */}
            <div className="control-panel">
                <div className="control">
                    <div>
                        <h4>After Death Organ Pledges</h4>
                        <span className="text-sm text-gray-500">Manage and track after-death organ donation registry</span>
                    </div>
                </div>

                <div className="control-panel-layout">
                    <div className="control-panel-layout-left">
                        <div className="search-input">
                            <IoSearchSharp />
                            <input
                                type="search"
                                placeholder="Search by donor name or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="filter-gap">
                        <div className="filters">
                            <select value={filterOrgan} onChange={(e) => setFilterOrgan(e.target.value)}>
                                <option value="all-organs">All Organs</option>
                                <option value="all">All Organs Pledged</option>
                                <option value="kidney">Kidney</option>
                                <option value="heart">Heart</option>
                                <option value="liver">Liver</option>
                                <option value="lungs">Lungs</option>
                                <option value="pancreas">Pancreas</option>
                            </select>
                        </div>

                        <div className="filters">
                            <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)}>
                                <option value="all-genders">All Genders</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>

                        <div className="filters">
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                <option value="all-states">All Status</option>
                                <option value="active">Active</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="loader" style={{ padding: "40px", textAlign: "center" }}>
                    <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />                
                    <h3>Loading After-Death Pledges...</h3>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#F12C31' }}>
                    <p>Error: {error}</p>
                    {onRefresh && (
                        <button 
                            onClick={onRefresh}
                            style={{ 
                                marginTop: '10px', 
                                padding: '10px 20px', 
                                backgroundColor: '#f01010ff', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            Retry
                        </button>
                    )}
                </div>
            )}

            {/* Table */}
            {!loading && !error && (
            <div className="table-design">
                <table className="h1-table">
                <thead>
                    <tr>
                        <th className="col-select">
                            <input className="ml-3" type="checkbox" aria-label="select all" />
                        </th>
                        <th className="col-ad-id">AD ID</th>
                        <th className="col-donor-info">Donor</th>
                        <th className="col-gender">Gender</th>
                        <th className="col-pledged-organs">Pledged Organs</th>
                        <th className="col-contact-info">Contact</th>
                        <th className="col-emergency-contact">Emergency Contact</th>
                        <th className="col-id-photo">ID Photos</th>
                        <th className="col-ad-status">Status</th>
                        <th className="col-actions">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {currentPledges.length > 0 ? (
                        currentPledges.map((pledge, index) => (
                            <tr key={`${pledge.id}-${startIndex + index}`}>
                                <td className="col-select">
                                    <input className="ml-3" type="checkbox" aria-label={`select ${pledge.id}`} />
                                </td>

                                {/* AD ID */}
                                <td className="col-ad-id">
                                    <div className="cell-title">
                                        <strong>{pledge.id}</strong>
                                        <small className="muted">{pledge.created_at}</small>
                                    </div>
                                </td>

                                {/* Donor */}
                                <td className="col-donor-info">
                                    <div className="cell-title">
                                        <strong>{pledge.donor_name}</strong>
                                        <small className="muted">{pledge.blood_type} • {pledge.age !== null && pledge.age !== undefined ? `${pledge.age} years` : 'N/A'}</small>
                                    </div>
                                </td>

                                {/* Gender */}
                                <td className="col-gender">
                                    <span>{pledge.gender}</span>
                                </td>

                                {/* Pledged Organs */}
                                <td className="col-pledged-organs">
                                    <span>{pledge.pledged_organs}</span>
                                </td>

                                {/* Contact */}
                                <td className="col-contact-info">
                                    <div className="contact">
                                        <span>{pledge.email}</span>
                                        <small className="muted">{pledge.phone_nb}</small>
                                    </div>
                                </td>

                                {/* Emergency Contact */}
                                <td className="col-emergency-contact">
                                    <div className="contact">
                                        <span>{pledge.emergency_contact_name}</span>
                                        <small className="muted">{pledge.emergency_contact_phone}</small>
                                    </div>
                                </td>

                                {/* ID Photos */}
                                <td className="col-id-photo">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        {pledge.id_photo && (
                                            <button 
                                                className="id-photo-btn"
                                                onClick={() => setViewingPhoto({...pledge, photoType: 'personal'})}
                                                title="View Personal ID Photo"
                                            >
                                                <HiOutlineIdentification />
                                                <span>Personal</span>
                                            </button>
                                        )}
                                        {pledge.father_id_photo && (
                                            <button 
                                                className="id-photo-btn"
                                                onClick={() => setViewingPhoto({...pledge, photoType: 'father'})}
                                                title="View Father ID Photo"
                                            >
                                                <HiOutlineIdentification />
                                                <span>Father</span>
                                            </button>
                                        )}
                                        {pledge.mother_id_photo && (
                                            <button 
                                                className="id-photo-btn"
                                                onClick={() => setViewingPhoto({...pledge, photoType: 'mother'})}
                                                title="View Mother ID Photo"
                                            >
                                                <HiOutlineIdentification />
                                                <span>Mother</span>
                                            </button>
                                        )}
                                        {!pledge.id_photo && !pledge.father_id_photo && !pledge.mother_id_photo && (
                                            <span className="muted" style={{ fontSize: '12px' }}>No ID photos</span>
                                        )}
                                    </div>
                                </td>

                                {/* Status */}
                                <td className="col-ad-status">
                                    {getStatusBadge(pledge.status)}
                                </td>

                                {/* Actions */}
                                <td className="col-actions">
                                    <div className="row-actions">
                                        <button className="icon-btn text-blue-800" title="View Details">
                                            <FiEye />
                                        </button>
                                        <button className="icon-btn text-green-600" title="Edit">
                                            <FiEdit />
                                        </button>
                                        <button className="icon-btn text-red-500" title="Cancel Pledge">
                                            <RiDeleteBin6Line />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="10" style={{ textAlign: "center", padding: "40px" }}>
                                <p>No after-death pledges found</p>
                            </td>
                        </tr>
                    )}
                </tbody>
                </table>

            {/* Pagination */}
            <div className="pagination">
                <div className="showing">
                    <small className="muted">Showing {startDisplay} to {endDisplay} of {totalPledges} pledges</small>
                </div>
                <div className="pagination-controls">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="pagination-btn"
                    >
                        Previous
                    </button>

                    {/* Page Number Buttons */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
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
            </div>
            )}

            {/* ID Photo Modal */}
            {viewingPhoto && (
                <div className="modal" onClick={() => setViewingPhoto(null)}>
                    <div className="modal-container id-photo-modal" onClick={(e) => e.stopPropagation()}>
                        <button 
                            className="modal-close-btn"
                            onClick={() => setViewingPhoto(null)}
                        >
                            <IoCloseCircle />
                        </button>
                        <h3 className="modal-title">
                            {viewingPhoto.photoType === 'father' ? 'Father\'s' : 
                             viewingPhoto.photoType === 'mother' ? 'Mother\'s' : ''} ID Photo - {viewingPhoto.donor_name}
                        </h3>
                        <div className="id-photo-content">
                            <div className="id-photo-info">
                                <p><strong>Donor ID:</strong> {viewingPhoto.id}</p>
                                <p><strong>Name:</strong> {viewingPhoto.donor_name}</p>
                                {viewingPhoto.photoType === 'personal' && (
                                    <>
                                        <p><strong>Age:</strong> {viewingPhoto.age !== null && viewingPhoto.age !== undefined ? `${viewingPhoto.age} years` : 'N/A'}</p>
                                        <p><strong>Blood Type:</strong> {viewingPhoto.blood_type}</p>
                                        <p><strong>Gender:</strong> {viewingPhoto.gender}</p>
                                    </>
                                )}
                                {viewingPhoto.photoType === 'father' && (
                                    <p><strong>Type:</strong> Father's ID</p>
                                )}
                                {viewingPhoto.photoType === 'mother' && (<>
                                    <p><strong>Type:</strong> Mother's ID</p>
                                    <p><strong>Mother's Name:</strong> {viewingPhoto.mother_name}</p>
                                
                                </>
                                )}
                            </div>
                            <div className="id-photo-viewer">
                                <img 
                                    src={
                                        viewingPhoto.photoType === 'father' ? viewingPhoto.father_id_photo :
                                        viewingPhoto.photoType === 'mother' ? viewingPhoto.mother_id_photo :
                                        viewingPhoto.id_photo
                                    }
                                    alt={
                                        viewingPhoto.photoType === 'father' ? `Father's ID Card of ${viewingPhoto.donor_name}` :
                                        viewingPhoto.photoType === 'mother' ? `Mother's ID Card of ${viewingPhoto.donor_name}` :
                                        `ID Card of ${viewingPhoto.donor_name}`
                                    }
                                    onError={(e) => {
                                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"><rect width="400" height="250" fill="%23f5f5f5"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="18">ID Photo Not Available</text></svg>';
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

