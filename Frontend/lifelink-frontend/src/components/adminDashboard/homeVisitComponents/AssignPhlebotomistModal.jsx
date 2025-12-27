import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { IoSearchSharp } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import axios from "axios";

export default function AssignPhlebotomistModal({ onClose, orders = [], onAssignSuccess }) {
    const [phlebotomists, setPhlebotomists] = useState([]);
    const [filteredPhlebotomists, setFilteredPhlebotomists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPhlebotomist, setSelectedPhlebotomist] = useState(null);
    const [error, setError] = useState("");

    // Extract hospital IDs from orders
    const getOrderHospitalIds = () => {
        if (!orders || orders.length === 0) return [];
        // Extract unique hospital IDs from orders
        const hospitalIds = orders
            .map(order => order.hospital_id)
            .filter(id => id !== null && id !== undefined);
        return [...new Set(hospitalIds)]; // Remove duplicates
    };

    // Fetch phlebotomists on mount
    useEffect(() => {
        fetchPhlebotomists();
    }, []);

    // Filter phlebotomists based on hospital and search
    useEffect(() => {
        let filtered = phlebotomists;
        const orderHospitalIds = getOrderHospitalIds();
        
        // Filter by hospital ID (only show phlebotomists from the same hospital as the orders)
        if (orderHospitalIds.length > 0) {
            filtered = filtered.filter((phleb) => {
                const phlebHospitalId = phleb.hospital_id || phleb.hospital?.id;
                return orderHospitalIds.includes(phlebHospitalId);
            });
        }
        
        // Apply search filter if search term exists
        if (searchTerm.trim() !== "") {
            filtered = filtered.filter((phleb) => {
                const fullName = `${phleb.user?.first_name || ''} ${phleb.user?.middle_name || ''} ${phleb.user?.last_name || ''}`.trim();
                const license = phleb.license_number || '';
                const hospital = phleb.hospital?.name || '';
                
                return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       license.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       hospital.toLowerCase().includes(searchTerm.toLowerCase());
            });
        }
        
        // Note: We keep all phlebotomists in the list but disable unavailable ones
        // This way admins can see who is unavailable but cannot select them
        setFilteredPhlebotomists(filtered);
    }, [searchTerm, phlebotomists, orders]);

    const fetchPhlebotomists = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await axios.get('http://localhost:8000/api/admin/dashboard/get-phlebotomists');
            const phlebotomistsData = response.data.phlebotomists || [];
            setPhlebotomists(phlebotomistsData);
            setFilteredPhlebotomists(phlebotomistsData);
        } catch (err) {
            console.error('Error fetching phlebotomists:', err);
            setError(err.response?.data?.message || 'Failed to load phlebotomists');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        // Validate phlebotomist selection - check if id exists
        if (!selectedPhlebotomist || !selectedPhlebotomist.id) {
            setError("Please select a phlebotomist");
            return;
        }

        // Validate that selected phlebotomist is not unavailable
        if (selectedPhlebotomist.availability === 'unavailable') {
            setError("Cannot assign an unavailable phlebotomist. Please select an available or on-duty phlebotomist.");
            return;
        }

        // Validate orders
        if (!orders || !Array.isArray(orders) || orders.length === 0) {
            setError("No orders selected");
            return;
        }

        // Clear any previous errors before proceeding
        setError("");
        setAssigning(true);

        try {
            // Assign phlebotomist to all selected orders
            const assignmentPromises = orders.map(async (order) => {
                const orderCode = order.id || order.code;
                return axios.post(`http://localhost:8000/api/admin/dashboard/home-visit-orders/${encodeURIComponent(orderCode)}/assign-phlebotomist`, {
                    phlebotomist_id: selectedPhlebotomist.id
                });
            });

            await Promise.all(assignmentPromises);

            // Success - notify parent to refetch orders
            if (onAssignSuccess) {
                onAssignSuccess();
            }
            onClose();
        } catch (err) {
            console.error('Error assigning phlebotomist:', err);
            setError(err.response?.data?.message || err.response?.data?.error || 'Failed to assign phlebotomist');
        } finally {
            setAssigning(false);
        }
    };

    const getPhlebotomistName = (phleb) => {
        if (!phleb.user) return 'Unknown';
        const nameParts = [
            phleb.user.first_name,
            phleb.user.middle_name,
            phleb.user.last_name
        ].filter(Boolean);
        return nameParts.join(' ') || 'Unknown';
    };

    const getAvailabilityBadge = (availability) => {
        const badges = {
            'available': 'badge-success',
            'onDuty': 'badge-success',
            'unavailable': 'badge-danger'
        };
        return badges[availability] || 'badge-pending';
    };

    return (
        <div className="modal" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-title">
                    <h3>Assign Phlebotomist to {orders.length} Order{orders.length > 1 ? 's' : ''}</h3>
                    <button className="close-btn" onClick={onClose}>
                        <IoClose />
                    </button>
                </div>

                <div className="modal-form">
                    {orders && orders.length > 0 && (
                        <div className="order-info" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                            <h4>Selected Orders:</h4>
                            <div style={{ maxHeight: '120px', overflowY: 'auto', marginTop: '10px' }}>
                                {orders.map((order, idx) => (
                                    <div key={order.id || idx} style={{ marginBottom: '8px', fontSize: '14px' }}>
                                        <strong>{order.name}</strong> - {order.id} : {order.date} at {order.time}
                                        {order.hospital_name && (
                                            <span style={{ color: '#666', marginLeft: '8px' }}>
                                                (Hospital: {order.hospital_name})
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {getOrderHospitalIds().length > 0 && (
                                <div style={{ marginTop: '10px', fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
                                    Only phlebotomists from the selected hospital(s) are shown
                                </div>
                            )}
                        </div>
                    )}

                    <div className="search-input" style={{ marginBottom: '20px' }}>
                        <IoSearchSharp />
                        <input
                            type="search"
                            placeholder="Search by name, license, or hospital..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="error-message" style={{ color: '#F12C31', marginBottom: '15px', padding: '10px', backgroundColor: '#fee', borderRadius: '5px' }}>
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="loader" style={{ textAlign: 'center', padding: '40px' }}>
                            <SpinnerDotted size={50} thickness={125} speed={100} color="#f01010ff" />
                            <p>Loading phlebotomists...</p>
                        </div>
                    ) : (
                        <div className="phlebotomist-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {filteredPhlebotomists.length > 0 ? (
                                filteredPhlebotomists.map((phleb) => {
                                    // Check if phlebotomist is available (not unavailable)
                                    const isAvailable = phleb.availability && phleb.availability !== 'unavailable';
                                    const isDisabled = !isAvailable;
                                    
                                    return (
                                        <div
                                            key={phleb.id}
                                            className={`phlebotomist-item ${selectedPhlebotomist?.id === phleb.id ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                // Block selection if unavailable
                                                if (isDisabled) {
                                                    setError("This phlebotomist is unavailable and cannot be assigned");
                                                    return;
                                                }
                                                // Use a callback to ensure state is set properly
                                                setSelectedPhlebotomist(phleb);
                                                setError(""); // Clear error when phlebotomist is selected
                                            }}
                                            style={{
                                                padding: '15px',
                                                marginBottom: '10px',
                                                border: selectedPhlebotomist?.id === phleb.id ? '2px solid #f01010' : '1px solid #ddd',
                                                borderRadius: '8px',
                                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                backgroundColor: isDisabled ? '#f5f5f5' : (selectedPhlebotomist?.id === phleb.id ? '#fff5f5' : '#fff'),
                                                opacity: isDisabled ? 0.6 : 1,
                                                transition: 'all 0.2s ease',
                                                position: 'relative'
                                            }}
                                        >
                                            {isDisabled && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '10px',
                                                    right: '10px',
                                                    fontSize: '12px',
                                                    color: '#999',
                                                    fontStyle: 'italic'
                                                }}>
                                                    Unavailable
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <h4 style={{ margin: '0 0 5px 0', color: isDisabled ? '#999' : '#000' }}>
                                                        {getPhlebotomistName(phleb)}
                                                    </h4>
                                                    <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                                                        License: {phleb.license_number || 'N/A'}
                                                    </p>
                                                    <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                                                        Hospital: {phleb.hospital?.name || 'N/A'}
                                                    </p>
                                                    {phleb.user?.phone_nb && (
                                                        <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                                                            Phone: {phleb.user.phone_nb}
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className={`badge ${getAvailabilityBadge(phleb.availability)}`}>
                                                        {phleb.availability || 'available'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                    <p>No phlebotomists found</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-footer form-submit-btn">
                    <button
                        type="button"
                        className="btn-cancel"
                        onClick={onClose}
                        disabled={assigning}
                        style={{ marginRight: '10px' }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="submit-btn"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAssign();
                        }}
                        disabled={!selectedPhlebotomist || assigning || !orders || orders.length === 0}
                    >
                        {assigning ? (
                            <>
                                <SpinnerDotted size={20} thickness={100} speed={100} color="#fff" style={{ marginRight: '8px' }} />
                                Assigning...
                            </>
                        ) : (
                            'Assign Phlebotomist'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

