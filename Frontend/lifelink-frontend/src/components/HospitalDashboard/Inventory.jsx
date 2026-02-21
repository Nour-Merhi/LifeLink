import { useState, useEffect, useMemo } from "react";
import { PiHeartbeatFill } from "react-icons/pi";
import { FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import { IoSearchSharp, IoClose } from "react-icons/io5";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

export default function Inventory() {
    const { user } = useAuth();
    const [inventory, setInventory] = useState([]); // [{ blood_type, registered_donors, available_stock, threshold, shortage_status, nearest_expiry_date, expiry_status, expiry_days_left }]
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedBloodTypes, setExpandedBloodTypes] = useState(() => new Set());
    const [usageUpdating, setUsageUpdating] = useState({}); // key: `${type}-${id}` -> bool

    // Edit stock modal state
    const [editStockOpen, setEditStockOpen] = useState(false);
    const [editStockLoading, setEditStockLoading] = useState(false);
    const [editStockError, setEditStockError] = useState("");
    const [editStockRows, setEditStockRows] = useState([]); // [{ blood_type, quantity, expiry_date }]

    useEffect(() => {
        const hospitalId = user?.health_center_manager?.hospital_id ?? user?.healthCenterManager?.hospital_id ?? user?.hospital_id;
        if (user && hospitalId) {
            fetchInventory(hospitalId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchInventory = (hospitalId) => {
        setLoading(true);
        setError("");
        api.get(`/api/hospital/dashboard/inventory/${hospitalId}`)
            .then((res) => {
                if (res.data?.success) {
                    setInventory(res.data.inventory || []);
                } else {
                    setInventory([]);
                    setError(res.data?.message || "Failed to load inventory");
                }
            })
            .catch((err) => {
                setInventory([]);
                setError(err.response?.data?.message || "Failed to load inventory");
            })
            .finally(() => setLoading(false));
    };

    const getShortageStateColor = (state) => {
        if (state === 'critical') return '#E92C30';
        if (state === 'low stock') return '#F5CF26';
        return '#16a34a';
    };
    const getShortageStateBg = (state) => {
        if (state === 'critical') return '#FDE8E8';
        if (state === 'low stock') return '#fcf7d6';
        return '#e8f9ef';
    };

    const getExpiryStyle = (expiryStatus) => {
        if (expiryStatus === 'expired') {
            return { bg: '#FDE8E8', color: '#E92C30' };
        }
        if (expiryStatus === 'warning') {
            return { bg: '#fcf7d6', color: '#F5CF26' };
        }
        return { bg: '#e8f9ef', color: '#16a34a' };
    };

    const normalizedInventory = useMemo(() => {
        const rows = Array.isArray(inventory) ? inventory : [];
        return rows.map((r, idx) => ({
            id: idx + 1,
            bloodType: r.blood_type,
            registered_donors: Number(r.registered_donors ?? 0),
            requests_total: Number(r.requests_total ?? 0),
            available_stock: Number(r.available_stock ?? 0),
            threshold: Number(r.threshold ?? 0),
            shortage_status: String(r.shortage_status || 'critical'),
            nearest_expiry_date: r.nearest_expiry_date || null,
            expiry_status: String(r.expiry_status || 'none'),
            expiry_days_left: r.expiry_days_left ?? null,
            usage_used_units: Number(r?.usage?.used_units ?? 0),
            usage_unused_units: Number(r?.usage?.unused_units ?? 0),
            usage_expired_unused_units: Number(r?.usage?.expired_unused_units ?? 0),
            completed_donations: Array.isArray(r.completed_donations) ? r.completed_donations : [],
        }));
    }, [inventory]);

    const hospitalId = user?.health_center_manager?.hospital_id ?? user?.healthCenterManager?.hospital_id ?? user?.hospital_id;

    const openEditStock = () => {
        setEditStockError("");
        const bloodTypes = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
        const map = new Map(normalizedInventory.map((r) => [r.bloodType, r]));
        setEditStockRows(
            bloodTypes.map((bt) => {
                const row = map.get(bt);
                return {
                    blood_type: bt,
                    quantity: row ? Number(row.available_stock ?? 0) : 0,
                    expiry_date: row?.nearest_expiry_date || "",
                };
            })
        );
        setEditStockOpen(true);
    };

    const updateEditRow = (blood_type, patch) => {
        setEditStockRows((prev) =>
            prev.map((r) => (r.blood_type === blood_type ? { ...r, ...patch } : r))
        );
    };

    const saveEditStock = async () => {
        if (!hospitalId) return;
        setEditStockLoading(true);
        setEditStockError("");
        try {
            await api.get("/sanctum/csrf-cookie");
            await api.put(`/api/hospital/dashboard/inventory/${hospitalId}`, {
                inventory: editStockRows.map((r) => ({
                    blood_type: r.blood_type,
                    quantity: Number(r.quantity || 0),
                    expiry_date: r.expiry_date ? r.expiry_date : null,
                })),
            });
            setEditStockOpen(false);
            fetchInventory(hospitalId);
        } catch (err) {
            setEditStockError(err.response?.data?.message || "Failed to update inventory");
        } finally {
            setEditStockLoading(false);
        }
    };

    const filteredRows = normalizedInventory.filter((item) => {
        const searchLower = searchTerm.toLowerCase();
        return searchTerm === "" || String(item.bloodType || "").toLowerCase().includes(searchLower);
    });

    const totalRegisteredDonors = normalizedInventory.reduce((sum, item) => sum + (item.registered_donors || 0), 0);
    const totalRequests = normalizedInventory.reduce((sum, item) => sum + (item.requests_total || 0), 0);
    const totalStockUnits = normalizedInventory.reduce((sum, item) => sum + (item.available_stock || 0), 0);
    const totalUsedUnits = normalizedInventory.reduce((sum, item) => sum + (item.usage_used_units || 0), 0);
    const totalUnusedUnits = normalizedInventory.reduce((sum, item) => sum + (item.usage_unused_units || 0), 0);
    const criticalCount = normalizedInventory.filter(item => item.shortage_status === 'critical').length;
    const lowStockCount = normalizedInventory.filter(item => item.shortage_status === 'low stock').length;

    const metricsData = [
        {
            title: "Available Stock",
            value: totalStockUnits.toString(),
            change: "Units available",
            icon: <PiHeartbeatFill />,
            bgColor: "#EAFFE5",
            iconColor: "#16a34a"
        },
        {
            title: "Blood Donation Requests",
            value: totalRequests.toString(),
            change: `Used: ${totalUsedUnits} • Unused: ${totalUnusedUnits}`,
            icon: <FiCheckCircle />,
            bgColor: "#EBEAFF",
            iconColor: "#285BFF"
        },
        {
            title: "Critical Shortages",
            value: criticalCount.toString(),
            change: "Below threshold",
            icon: <FiAlertTriangle />,
            bgColor: "#FFE5E5",
            iconColor: "#F12C31"
        }
    ];

    return (
        <section className="inventory-section">
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <PiHeartbeatFill className="icon-size" />
                        <h2>Blood Bank Inventory</h2>
                    </div>
                    <p>Monitor blood inventory levels, expiration dates, and manage incoming donations</p>
                </div>
            </div>

            {/* Metrics */}
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

            {/* Search Bar */}
            <div className="control-panel">
                <div className="control-panel-layout">
                    <div className="search-input">
                        <IoSearchSharp />
                        <input 
                            type="search" 
                            placeholder="Search by blood type.." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                        <button
                            type="button"
                            className="btn-save"
                            onClick={openEditStock}
                            style={{
                                background: "linear-gradient(to right, #96AFFF, #2349C2)",
                                color: "white",
                                border: "none",
                                padding: "10px 14px",
                                borderRadius: 8,
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: 14,
                                whiteSpace: "nowrap",
                            }}
                        >
                            Edit Stock
                        </button>
                    </div>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="table-design p-5">
                <table className="h1-table">
                    <thead>
                        <tr>
                            <th className="col-order-id">Blood Type</th>
                            <th className="col-amount">Threshold</th>
                            <th className="col-amount">Completed Donations</th>
                            <th className="col-amount">Usage</th>
                            <th className="col-amount">Available Stock</th>
                            <th className="col-date">Nearest Expiry</th>
                            <th className="col-availability">Status</th>
                            <th className="col-actions">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRows.length > 0 ? (
                            filteredRows.flatMap((item) => {
                                const state = item.shortage_status;
                                const stateColor = getShortageStateColor(state);
                                const stateBg = getShortageStateBg(state);
                                const expiry = item.nearest_expiry_date;
                                const expiryStatus = item.expiry_status;
                                const expiryStyle = getExpiryStyle(expiryStatus);
                                const expanded = expandedBloodTypes.has(item.bloodType);

                                const mainRow = (
                                    <tr key={`${item.id}-main`} className={state === 'critical' ? 'urgent-row' : ''}>
                                        <td className="col-order-id">
                                            <strong style={{ fontSize: '16px', color: stateColor }}>{item.bloodType}</strong>
                                        </td>
                                        <td className="col-amount">
                                            <strong>{item.threshold}</strong>
                                        </td>
                                        <td className="col-amount">
                                            <span className="amount-value">{item.requests_total}</span>
                                        </td>
                                        <td className="col-amount">
                                            <span className="amount-value" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                                                <span style={{ color: "#16a34a", fontWeight: 800 }}>{item.usage_used_units}</span>
                                                <span className="muted">/</span>
                                                <span style={{ color: "#6B6B6B", fontWeight: 800 }}>{item.usage_unused_units}</span>
                                            </span>
                                            <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                                                used / unused
                                            </div>
                                        </td>
                                        <td className="col-amount">
                                            <span className="amount-value">{item.available_stock}</span>
                                        </td>
                                        <td className="col-date">
                                            {expiry ? (
                                                <div className="cell-date" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                    <span>{expiry}</span>
                                                    {expiryStatus !== 'ok' && expiryStatus !== 'none' ? (
                                                        <span
                                                            style={{
                                                                display: "inline-block",
                                                                width: "fit-content",
                                                                padding: "4px 8px",
                                                                borderRadius: 999,
                                                                backgroundColor: expiryStyle.bg,
                                                                color: expiryStyle.color,
                                                                fontWeight: 700,
                                                                fontSize: 11,
                                                            }}
                                                        >
                                                            {expiryStatus === 'expired'
                                                                ? 'Expired'
                                                                : `Expiring soon${item.expiry_days_left !== null ? ` (${item.expiry_days_left}d)` : ''}`}
                                                        </span>
                                                    ) : (
                                                        <small className="muted">
                                                            {item.expiry_days_left !== null ? `${item.expiry_days_left} days` : 'OK'}
                                                        </small>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="muted">N/A</span>
                                            )}
                                        </td>
                                        <td className="col-availability">
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    padding: '6px 10px',
                                                    borderRadius: '999px',
                                                    backgroundColor: stateBg,
                                                    color: stateColor,
                                                    fontWeight: 600,
                                                    fontSize: '12px',
                                                    textTransform: 'capitalize'
                                                }}
                                            >
                                                {state}
                                            </span>
                                        </td>
                                        <td className="col-actions">
                                            <button
                                                type="button"
                                                className="btn-cancel"
                                                style={{
                                                    padding: "8px 10px",
                                                    borderRadius: 10,
                                                    border: "1px solid #e5e7eb",
                                                    background: expanded ? "#f3f4f6" : "#fff",
                                                    cursor: "pointer",
                                                    fontWeight: 700,
                                                    fontSize: 12,
                                                }}
                                                onClick={() => {
                                                    setExpandedBloodTypes((prev) => {
                                                        const next = new Set(prev);
                                                        if (next.has(item.bloodType)) next.delete(item.bloodType);
                                                        else next.add(item.bloodType);
                                                        return next;
                                                    });
                                                }}
                                            >
                                                {expanded ? "Hide" : "Show"}
                                            </button>
                                        </td>
                                    </tr>
                                );

                                const detailsRow = expanded ? (
                                    <tr key={`${item.id}-details`}>
                                        <td colSpan="8" style={{ padding: 0 }}>
                                            <div style={{ padding: 14, background: "#fafafa", borderTop: "1px solid #eef0f3" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                                    <div>
                                                        <strong>Completed donations</strong>{" "}
                                                        <span className="muted" style={{ fontSize: 12 }}>
                                                            (latest {item.completed_donations.length})
                                                        </span>
                                                    </div>
                                                    <div className="muted" style={{ fontSize: 12 }}>
                                                        Toggle usage state per completed booking
                                                    </div>
                                                </div>

                                                {item.completed_donations.length === 0 ? (
                                                    <div className="muted" style={{ padding: 10 }}>No completed donations for this blood type yet.</div>
                                                ) : (
                                                    <div className="table-design" style={{ padding: 0, boxShadow: "none", border: "1px solid #eef0f3" }}>
                                                        <table className="h1-table" style={{ margin: 0 }}>
                                                            <thead>
                                                                <tr>
                                                                    <th className="col-donor">Donor</th>
                                                                    <th className="col-blood">Blood</th>
                                                                    <th className="col-date">Completed At</th>
                                                                    <th className="col-date">Expires At</th>
                                                                    <th className="col-date">Time</th>
                                                                    <th className="col-amount">Units</th>
                                                                    <th className="col-availability">Usage</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {item.completed_donations.map((d) => {
                                                                    const key = `${d.booking_type}-${d.booking_id}`;
                                                                    const isUpdating = Boolean(usageUpdating[key]);
                                                                    const isUsed = String(d.usage_status || "unused") === "used";
                                                                    const completedAt = d.completed_at ? new Date(d.completed_at).toLocaleString() : "N/A";
                                                                    const expiresAt = d.expires_at || null;
                                                                    const expiryStatus = String(d.expiry_status || "none"); // ok|warning|expired|none
                                                                    const expiryStyle = getExpiryStyle(expiryStatus);
                                                                    const isExpired = expiryStatus === "expired";
                                                                    return (
                                                                        <tr key={key}>
                                                                            <td className="col-donor">
                                                                                <div style={{ display: "flex", flexDirection: "column" }}>
                                                                                    <strong>{d.donor_name || "Unknown"}</strong>
                                                                                    <small className="muted">{d.booking_code ? `Booking: ${d.booking_code}` : null}</small>
                                                                                </div>
                                                                            </td>
                                                                            <td className="col-blood">
                                                                                <strong style={{ color: "#F12C31" }}>{d.blood_type || item.bloodType}</strong>
                                                                            </td>
                                                                            <td className="col-date">
                                                                                {completedAt}
                                                                            </td>
                                                                            <td className="col-date">
                                                                                {expiresAt ? (
                                                                                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                                                        <span>{expiresAt}</span>
                                                                                        <span
                                                                                            style={{
                                                                                                display: "inline-block",
                                                                                                width: "fit-content",
                                                                                                padding: "4px 8px",
                                                                                                borderRadius: 999,
                                                                                                backgroundColor: expiryStyle.bg,
                                                                                                color: expiryStyle.color,
                                                                                                fontWeight: 800,
                                                                                                fontSize: 11,
                                                                                            }}
                                                                                        >
                                                                                            {expiryStatus === "ok"
                                                                                                ? "Fresh"
                                                                                                : expiryStatus === "warning"
                                                                                                ? "Expiring Soon"
                                                                                                : expiryStatus === "expired"
                                                                                                ? "Expired"
                                                                                                : "N/A"}
                                                                                            {d.expiry_days_left !== null && d.expiry_days_left !== undefined && expiryStatus !== "expired"
                                                                                                ? ` (${d.expiry_days_left}d)`
                                                                                                : ""}
                                                                                        </span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <span className="muted">N/A</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="col-date">
                                                                                {d.appointment_time || "N/A"}
                                                                            </td>
                                                                            <td className="col-amount">
                                                                                <strong>{Number(d.units_collected ?? 1)}</strong>
                                                                            </td>
                                                                            <td className="col-availability">
                                                                                <button
                                                                                    type="button"
                                                                                    disabled={isUpdating || (isExpired && !isUsed)}
                                                                                    className="btn-cancel"
                                                                                    onClick={async () => {
                                                                                        try {
                                                                                            setUsageUpdating((prev) => ({ ...prev, [key]: true }));
                                                                                            await api.get("/sanctum/csrf-cookie");
                                                                                            await api.put(
                                                                                                `/api/hospital/dashboard/inventory/bookings/${d.booking_type}/${d.booking_id}/usage`,
                                                                                                { usage_status: isUsed ? "unused" : "used" }
                                                                                            );
                                                                                            // Refresh inventory
                                                                                            if (hospitalId) fetchInventory(hospitalId);
                                                                                        } catch (e) {
                                                                                            console.error("Failed to update usage:", e);
                                                                                        } finally {
                                                                                            setUsageUpdating((prev) => ({ ...prev, [key]: false }));
                                                                                        }
                                                                                    }}
                                                                                    style={{
                                                                                        padding: "6px 10px",
                                                                                        borderRadius: 999,
                                                                                        border: "1px solid #e5e7eb",
                                                                                        background: isUsed ? "#EAFFE5" : "#fff",
                                                                                        color: isUsed ? "#16a34a" : "#6B6B6B",
                                                                                        fontWeight: 800,
                                                                                        cursor: isUpdating ? "not-allowed" : "pointer",
                                                                                    }}
                                                                                >
                                                                                    {isUpdating
                                                                                        ? "Saving..."
                                                                                        : isExpired && !isUsed
                                                                                        ? "Expired"
                                                                                        : (isUsed ? "Used" : "Unused")}
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : null;

                                return detailsRow ? [mainRow, detailsRow] : [mainRow];
                            })
                        ) : (
                            <tr>
                                <td colSpan="8" style={{ textAlign: "center", padding: "40px" }}>
                                    {searchTerm ? "No inventory found matching your search" : "No inventory data available"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Stock Modal */}
            {editStockOpen && (
                <div className="modal-overlay modal-overlay-delete" onClick={() => !editStockLoading && setEditStockOpen(false)}>
                    <div className="modal-container modal-modern" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ maxWidth: 760 }}>
                        <div className="modal-modern-header">
                            <div className="modal-modern-title">
                                <h2>Edit Available Blood Stock</h2>
                                <div className="modal-modern-subtitle">
                                    <span className="muted">Update quantity and (optional) nearest expiry date for each blood type.</span>
                                </div>
                            </div>
                            <button className="modal-icon-btn" onClick={() => !editStockLoading && setEditStockOpen(false)} aria-label="Close">
                                <IoClose />
                            </button>
                        </div>
                        <div className="modal-modern-body">
                            <div className="table-design" style={{ boxShadow: "none", border: "1px solid #eef0f3" }}>
                                <table className="h1-table">
                                    <thead>
                                        <tr>
                                            <th className="col-order-id">Blood Type</th>
                                            <th className="col-amount">Available Stock</th>
                                            <th className="col-date">Nearest Expiry</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {editStockRows.map((r) => (
                                            <tr key={r.blood_type}>
                                                <td className="col-order-id">
                                                    <strong>{r.blood_type}</strong>
                                                </td>
                                                <td className="col-amount">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={r.quantity}
                                                        onChange={(e) => updateEditRow(r.blood_type, { quantity: e.target.value })}
                                                        style={{
                                                            width: 140,
                                                            padding: "8px 10px",
                                                            border: "1px solid #e5e7eb",
                                                            borderRadius: 10,
                                                            outline: "none",
                                                        }}
                                                    />
                                                </td>
                                                <td className="col-date">
                                                    <input
                                                        type="date"
                                                        value={r.expiry_date || ""}
                                                        onChange={(e) => updateEditRow(r.blood_type, { expiry_date: e.target.value })}
                                                        style={{
                                                            width: 170,
                                                            padding: "8px 10px",
                                                            border: "1px solid #e5e7eb",
                                                            borderRadius: 10,
                                                            outline: "none",
                                                        }}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {editStockError ? (
                                <div className="error-message modal-error-container" style={{ marginTop: 12 }}>
                                    {editStockError}
                                </div>
                            ) : null}
                        </div>
                        <div className="modal-modern-footer" style={{ justifyContent: "flex-end" }}>
                            <button className="btn-cancel" onClick={() => !editStockLoading && setEditStockOpen(false)} disabled={editStockLoading}>
                                Cancel
                            </button>
                            <button
                                className="submit-btn"
                                onClick={saveEditStock}
                                disabled={editStockLoading}
                                style={{ background: "linear-gradient(to right, #96AFFF, #2349C2)" }}
                            >
                                {editStockLoading ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

