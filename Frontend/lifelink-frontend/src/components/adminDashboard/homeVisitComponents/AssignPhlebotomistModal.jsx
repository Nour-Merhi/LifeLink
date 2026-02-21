import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { IoSearchSharp } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import api from "../../../api/axios";

export default function AssignPhlebotomistModal({ onClose, orders = [], onAssignSuccess }) {
    const [phlebotomists, setPhlebotomists] = useState([]);
    const [filteredPhlebotomists, setFilteredPhlebotomists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPhlebotomist, setSelectedPhlebotomist] = useState(null);
    const [error, setError] = useState("");
    const [ratingSort, setRatingSort] = useState("desc"); // desc | asc | off
    const [completedSort, setCompletedSort] = useState("desc"); // desc | asc | off

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

        // Sorting: by rating and/or by completed appointments
        const compareNumber = (a, b, dir) => {
            if (a === b) return 0;
            return dir === "asc" ? (a - b) : (b - a);
        };

        const sorted = [...filtered].sort((a, b) => {
            // Rating sort (avg donor rating)
            if (ratingSort !== "off") {
                const ar = Number(a.avg_rating ?? -1);
                const br = Number(b.avg_rating ?? -1);
                const c = compareNumber(ar, br, ratingSort);
                if (c !== 0) return c;
            }

            // Completed appointments sort
            if (completedSort !== "off") {
                const ac = Number(a.completed_appointments ?? 0);
                const bc = Number(b.completed_appointments ?? 0);
                const c = compareNumber(ac, bc, completedSort);
                if (c !== 0) return c;
            }

            // Fallback: name (A-Z)
            const an = getPhlebotomistName(a).toLowerCase();
            const bn = getPhlebotomistName(b).toLowerCase();
            return an.localeCompare(bn);
        });
        
        // Note: We keep all phlebotomists in the list but disable unavailable ones
        // This way admins can see who is unavailable but cannot select them
        setFilteredPhlebotomists(sorted);
    }, [searchTerm, phlebotomists, orders, ratingSort, completedSort]);

    const fetchPhlebotomists = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await api.get('/api/admin/dashboard/get-phlebotomists');
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
            // Assign phlebotomist to all selected orders (use code for URL; backend accepts code or numeric id)
            const orderCode = (order) => order.code ?? order.id;
            const assignmentPromises = orders.map((order) => {
                const code = orderCode(order);
                return api.post(`/api/admin/dashboard/home-visit-orders/${encodeURIComponent(String(code))}/assign-phlebotomist`, {
                    phlebotomist_id: selectedPhlebotomist.id
                });
            });

            const results = await Promise.allSettled(assignmentPromises);
            const failed = results.filter((r) => r.status === 'rejected');
            const succeeded = results.filter((r) => r.status === 'fulfilled');

            if (failed.length > 0) {
                const messages = failed.map((f) => {
                    const err = f.reason;
                    const data = err?.response?.data;
                    if (data?.errors?.phlebotomist_id?.[0]) return data.errors.phlebotomist_id[0];
                    return data?.message || data?.error || err?.message || 'Request failed';
                });
                const unique = [...new Set(messages)];
                setError(succeeded.length > 0
                    ? `Assigned to ${succeeded.length} order(s). Failed for ${failed.length}: ${unique.join('; ')}`
                    : unique.join('; '));
                if (succeeded.length > 0 && onAssignSuccess) onAssignSuccess();
                return;
            }

            if (onAssignSuccess) onAssignSuccess();
            onClose();
        } catch (err) {
            console.error('Error assigning phlebotomist:', err);
            const data = err?.response?.data;
            const msg = data?.message || data?.error;
            const validationMsg = data?.errors?.phlebotomist_id?.[0];
            setError(validationMsg || msg || 'Failed to assign phlebotomist');
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

    const formatRating = (value) => {
        if (value === null || value === undefined) return null;
        const n = Number(value);
        if (Number.isNaN(n)) return null;
        return n.toFixed(1);
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

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '180px' }}>
                            <label style={{ fontSize: '12px', color: '#666' }}>Sort by rating</label>
                            <select
                                value={ratingSort}
                                onChange={(e) => setRatingSort(e.target.value)}
                                style={{
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    outline: 'none'
                                }}
                            >
                                <option value="desc">Highest → Lowest</option>
                                <option value="asc">Lowest → Highest</option>
                                <option value="off">Off</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '220px' }}>
                            <label style={{ fontSize: '12px', color: '#666' }}>Order by completed appointments</label>
                            <select
                                value={completedSort}
                                onChange={(e) => setCompletedSort(e.target.value)}
                                style={{
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    outline: 'none'
                                }}
                            >
                                <option value="desc">Most → Least</option>
                                <option value="asc">Least → Most</option>
                                <option value="off">Off</option>
                            </select>
                        </div>
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
                                                        <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666', fontWeight: 600 }}>
                                                            {formatRating(phleb.avg_rating) ? (
                                                                <>
                                                                    <span style={{ color: '#f39c12' }}>★</span> {formatRating(phleb.avg_rating)}
                                                                    <span style={{ fontWeight: 500, color: '#888' }}> ({Number(phleb.ratings_count || 0)})</span>
                                                                </>
                                                            ) : (
                                                                <span style={{ fontWeight: 500, color: '#888' }}>No ratings</span>
                                                            )}
                                                        </span>
                                                    </h4>
                                                    <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                                                        License: {phleb.license_number || 'N/A'}
                                                    </p>
                                                    <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                                                        Hospital: {phleb.hospital?.name || 'N/A'}
                                                    </p>
                                                    <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                                                        Completed appointments: {Number(phleb.completed_appointments || 0)}
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

