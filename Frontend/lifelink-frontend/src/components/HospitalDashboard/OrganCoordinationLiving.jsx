import { useEffect, useMemo, useState } from "react";
import { MdOutlineHealthAndSafety } from "react-icons/md";
import { IoSearchSharp } from "react-icons/io5";
import { FiEye, FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import api from "../../api/axios";
import EditOrganCoordinationModal from "../adminDashboard/organPledgesComponents/EditOrganCoordinationModal";
import ViewOrganCoordinationModal from "../adminDashboard/organPledgesComponents/ViewOrganCoordinationModal";
import ConfirmDeleteDialog from "../common/ConfirmDeleteDialog";

export default function OrganCoordinationLiving() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  // Filters
  const [organFilter, setOrganFilter] = useState("");
  const [donationTypeFilter, setDonationTypeFilter] = useState("");
  const [medicalStatusFilter, setMedicalStatusFilter] = useState("");
  const [ethicsStatusFilter, setEthicsStatusFilter] = useState("");
  const [viewCode, setViewCode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/hospital/dashboard/organ-coordination/living-donors");
      setItems(res.data?.living_donors || []);
      setSelectedIds([]);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load living donors");
      setItems([]);
      setSelectedIds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const uniqueOrgans = useMemo(() => {
    return Array.from(new Set(items.map((d) => String(d.organ || "").trim()).filter(Boolean))).sort();
  }, [items]);
  const uniqueDonationTypes = useMemo(() => {
    return Array.from(new Set(items.map((d) => String(d.donation_type || "").trim()).filter(Boolean))).sort();
  }, [items]);
  const uniqueMedicalStatuses = useMemo(() => {
    return Array.from(new Set(items.map((d) => String(d.medical_status || "").trim()).filter(Boolean))).sort();
  }, [items]);
  const uniqueEthicsStatuses = useMemo(() => {
    return Array.from(new Set(items.map((d) => String(d.ethics_status || "").trim()).filter(Boolean))).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    return items.filter((d) => {
      const matchesSearch =
        !s ||
        String(d.id || "").toLowerCase().includes(s) ||
        String(d.full_name || "").toLowerCase().includes(s) ||
        String(d.organ || "").toLowerCase().includes(s) ||
        String(d.medical_status || "").toLowerCase().includes(s) ||
        String(d.ethics_status || "").toLowerCase().includes(s);

      const matchesOrgan = !organFilter || String(d.organ || "") === organFilter;
      const matchesDonationType = !donationTypeFilter || String(d.donation_type || "") === donationTypeFilter;
      const matchesMedical = !medicalStatusFilter || String(d.medical_status || "") === medicalStatusFilter;
      const matchesEthics = !ethicsStatusFilter || String(d.ethics_status || "") === ethicsStatusFilter;

      return matchesSearch && matchesOrgan && matchesDonationType && matchesMedical && matchesEthics;
    });
  }, [items, searchTerm, organFilter, donationTypeFilter, medicalStatusFilter, ethicsStatusFilter]);

  const filteredIds = useMemo(() => filtered.map((d) => d.id).filter(Boolean), [filtered]);
  const isAllSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));

  const toggleOne = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const selectedCount = selectedIds.length;
  const hasActiveFilters = Boolean(organFilter || donationTypeFilter || medicalStatusFilter || ethicsStatusFilter);
  const clearFilters = () => {
    setOrganFilter("");
    setDonationTypeFilter("");
    setMedicalStatusFilter("");
    setEthicsStatusFilter("");
  };

  return (
    <section className="organ-coordination-section">
      <div className="dashboard-title">
        <div>
          <div className="icon-title">
            <MdOutlineHealthAndSafety className="icon-size" />
            <h2>Organ Coordination</h2>
          </div>
          <p>Living donors (hospital-specific)</p>
        </div>
      </div>

      <div className="control-panel">
        <div className="control-panel-layout">
          <div className="search-input">
            <IoSearchSharp />
            <input
              type="search"
              placeholder="Search by ID, donor name, organ, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {selectedCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span className="muted" style={{ fontWeight: 600 }}>
                Selected: {selectedCount}
              </span>
              <button
                type="button"
                style={{
                    background: "transparent",
                    color: "#767676",
                    border: "1px solid #D9D9D9",
                    padding: "8px 16px",
                    borderRadius: "5px",
                    cursor: bulkDeleteLoading ? "not-allowed" : "pointer",
                    fontSize: "14px"
                }}
                onClick={() => setSelectedIds([])}
                disabled={bulkDeleteLoading}
              >
                Clear 
              </button>
              <button
                type="button"
                className="btn-save"
                style={{
                    background: "linear-gradient(to right, #FF585D, #CA2529)",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "5px",
                    cursor: bulkDeleteLoading ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    opacity: bulkDeleteLoading ? 0.6 : 1
                }}
                onClick={() => {
                  setBulkDeleteError("");
                  setBulkDeleteOpen(true);
                }}
                disabled={bulkDeleteLoading}
              >
                Delete Selected
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="control-panel" style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}>
            <div style={{ minWidth: 170 }}>
              <label style={{ display: "block", marginBottom: 5, fontWeight: 500, fontSize: 14 }}>Organ</label>
              <select
                value={organFilter}
                onChange={(e) => setOrganFilter(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, backgroundColor: "#fff" }}
              >
                <option value="">All</option>
                {uniqueOrgans.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div style={{ minWidth: 190 }}>
              <label style={{ display: "block", marginBottom: 5, fontWeight: 500, fontSize: 14 }}>Donation Type</label>
              <select
                value={donationTypeFilter}
                onChange={(e) => setDonationTypeFilter(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, backgroundColor: "#fff" }}
              >
                <option value="">All</option>
                {uniqueDonationTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div style={{ minWidth: 170 }}>
              <label style={{ display: "block", marginBottom: 5, fontWeight: 500, fontSize: 14 }}>Medical</label>
              <select
                value={medicalStatusFilter}
                onChange={(e) => setMedicalStatusFilter(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, backgroundColor: "#fff" }}
              >
                <option value="">All</option>
                {uniqueMedicalStatuses.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div style={{ minWidth: 160 }}>
              <label style={{ display: "block", marginBottom: 5, fontWeight: 500, fontSize: 14 }}>Ethics</label>
              <select
                value={ethicsStatusFilter}
                onChange={(e) => setEthicsStatusFilter(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, backgroundColor: "#fff" }}
              >
                <option value="">All</option>
                {uniqueEthicsStatuses.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </div>
            <div>
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                style={{
                  padding: "8px 16px",
                  backgroundColor: hasActiveFilters ? "#6B6B6B" : "#BDBDBD",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: hasActiveFilters ? "pointer" : "not-allowed",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>

      {hasActiveFilters && (
        <div className="control-panel" style={{ marginTop: 12, padding: 14 }}>
          <div style={{ fontSize: 13 }}>
            <strong>Active Filters:</strong>
            {organFilter && <span style={{ marginLeft: 10, padding: "4px 8px", backgroundColor: "#fff", borderRadius: 4 }}>Organ: {organFilter}</span>}
            {donationTypeFilter && <span style={{ marginLeft: 10, padding: "4px 8px", backgroundColor: "#fff", borderRadius: 4 }}>Type: {donationTypeFilter}</span>}
            {medicalStatusFilter && <span style={{ marginLeft: 10, padding: "4px 8px", backgroundColor: "#fff", borderRadius: 4 }}>Medical: {medicalStatusFilter}</span>}
            {ethicsStatusFilter && <span style={{ marginLeft: 10, padding: "4px 8px", backgroundColor: "#fff", borderRadius: 4 }}>Ethics: {ethicsStatusFilter}</span>}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "30px", color: "#6B6B6B" }}>
          Loading living donors...
        </div>
      )}

      {error && !loading && (
        <div style={{ textAlign: "center", padding: "30px", color: "#F12C31" }}>{error}</div>
      )}

      {!loading && !error && (
        <div className="table-design">
          <table className="h1-table">
            <thead>
              <tr>
                <th className="col-select">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="col-order-id">LO ID</th>
                <th className="col-donor">Donor</th>
                <th className="col-contact">Contact</th>
                <th className="col-organs">Organ</th>
                <th className="col-availability">Donation Type</th>
                <th className="col-availability">Medical State</th>
                <th className="col-availability">Ethics</th>
                <th className="col-availability">Appointment</th>
                <th className="col-availability">Chosen Slot</th>
                <th className="col-availability">Created</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((d) => (
                  <tr key={d.id}>
                    <td className="col-select">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(d.id)}
                        onChange={() => toggleOne(d.id)}
                        aria-label={`Select ${d.id}`}
                      />
                    </td>
                    <td className="col-order-id">
                      <strong>{d.id}</strong>
                    </td>
                    <td className="col-donor">
                      <div className="cell-title">
                        <strong>{d.full_name}</strong>
                        <small className="muted">{d.blood_type} • {d.age ?? "N/A"} yrs</small>
                      </div>
                    </td>
                    <td className="col-contact">
                    <div className="cell-title">
                        <strong>{d.email || "N/A"}</strong>
                        <small className="muted">{d.phone_nb || "N/A"}</small>
                      </div>

                    </td>
                    <td className="col-organs">{d.organ || "N/A"}</td>
                    <td className="col-availability">{d.donation_type || "N/A"}</td>
                    <td className="col-availability">
                      <span className={`badge ${d.medical_status === "cleared" ? "badge-success" : d.medical_status === "rejected" ? "badge-danger" : "badge-pending"}`}>
                        {d.medical_status || "N/A"}
                      </span>
                    </td>
                    <td className="col-availability">
                      <span className={`badge ${d.ethics_status === "approved" ? "badge-success" : d.ethics_status === "rejected" ? "badge-danger" : "badge-pending"}`}>
                        {d.ethics_status || "N/A"}
                      </span>
                    </td>
                    <td className="col-availability">
                      <span className={`badge ${d.appointment_status === "completed" ? "badge-success" : d.appointment_status === "cancelled" ? "badge-danger" : "badge-pending"}`}>
                        {d.appointment_status || "N/A"}
                      </span>
                    </td>
                    <td className="col-availability">
                      <span className="muted">
                        {d.selected_appointment_at ? new Date(d.selected_appointment_at).toLocaleString() : "—"}
                      </span>
                    </td>
                    <td className="col-availability">{d.created_at || "N/A"}</td>
                    <td className="col-actions">
                      <div className="row-actions">
                        <button className="icon-btn text-blue-800" title="View Details" onClick={() => setViewCode(d.id)}>
                          <FiEye />
                        </button>
                        <button className="icon-btn text-green-600" title="Edit" onClick={() => setEditing(d)}>
                          <FiEdit />
                        </button>
                        <button
                          className="icon-btn text-red-500"
                          title="Delete"
                          onClick={() => {
                            setDeleteError("");
                            setDeleting(d);
                          }}
                        >
                          <RiDeleteBin6Line />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "40px" }}>
                    No living donors found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewCode && (
        <ViewOrganCoordinationModal
          mode="living"
          code={viewCode}
          scope="hospital"
          onClose={() => setViewCode(null)}
        />
      )}

      {editing && (
        <EditOrganCoordinationModal
          mode="living"
          code={editing.id}
          scope="hospital"
          onClose={() => setEditing(null)}
          onSaved={() => fetchData()}
        />
      )}

      {deleting && (
        <ConfirmDeleteDialog
          title="Delete Record"
          description="You are going to delete this living donor record. Are you sure?"
          details={`Record ID: ${deleting.id}`}
          confirmText="Yes, Delete"
          cancelText="No, Keep It"
          loading={deleteLoading}
          error={deleteError}
          onClose={() => !deleteLoading && setDeleting(null)}
          onConfirm={async () => {
            setDeleteLoading(true);
            setDeleteError("");
            try {
              await api.delete(`/api/hospital/dashboard/organ-coordination/living-donors/${deleting.id}`);
              setDeleting(null);
              fetchData();
            } catch (e) {
              setDeleteError(e.response?.data?.message || "Failed to delete living donor");
            } finally {
              setDeleteLoading(false);
            }
          }}
        />
      )}

      {bulkDeleteOpen && (
        <ConfirmDeleteDialog
          title="Delete Record"
          description={`You are going to delete ${selectedCount} selected record(s). Are you sure?`}
          confirmText="Yes, Delete"
          cancelText="No, Keep It"
          loading={bulkDeleteLoading}
          error={bulkDeleteError}
          onClose={() => !bulkDeleteLoading && setBulkDeleteOpen(false)}
          onConfirm={async () => {
            if (selectedIds.length === 0) {
              setBulkDeleteOpen(false);
              return;
            }
            setBulkDeleteLoading(true);
            setBulkDeleteError("");
            try {
              const results = await Promise.allSettled(
                selectedIds.map((id) => api.delete(`/api/hospital/dashboard/organ-coordination/living-donors/${id}`))
              );
              const failed = results.filter((r) => r.status === "rejected");
              if (failed.length) {
                setBulkDeleteError(`Failed to delete ${failed.length} record(s).`);
              } else {
                setBulkDeleteOpen(false);
                setSelectedIds([]);
                fetchData();
              }
            } catch (e) {
              setBulkDeleteError(e.response?.data?.message || "Failed to delete selected records");
            } finally {
              setBulkDeleteLoading(false);
            }
          }}
        />
      )}
    </section>
  );
}

