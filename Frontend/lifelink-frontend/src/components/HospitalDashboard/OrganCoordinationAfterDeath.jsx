import { useEffect, useMemo, useState } from "react";
import { MdOutlineHealthAndSafety } from "react-icons/md";
import { IoSearchSharp } from "react-icons/io5";
import { FiEye, FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import api from "../../api/axios";
import EditOrganCoordinationModal from "../adminDashboard/organPledgesComponents/EditOrganCoordinationModal";
import ViewOrganCoordinationModal from "../adminDashboard/organPledgesComponents/ViewOrganCoordinationModal";
import ConfirmDeleteDialog from "../common/ConfirmDeleteDialog";

export default function OrganCoordinationAfterDeath() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [pledgedOrganFilter, setPledgedOrganFilter] = useState("");
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
      const res = await api.get("/api/hospital/dashboard/organ-coordination/after-death-pledges");
      setItems(res.data?.after_death_pledges || []);
      setSelectedIds([]);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load after-death pledges");
      setItems([]);
      setSelectedIds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const ORGANS = useMemo(() => ([
    { id: "all-organs", label: "All Organs" },
    { id: "heart", label: "Heart" },
    { id: "corneas", label: "Corneas" },
    { id: "liver", label: "Liver" },
    { id: "skin", label: "Skin" },
    { id: "kidneys", label: "Kidneys" },
    { id: "bones", label: "Bones" },
    { id: "lungs", label: "Lungs" },
    { id: "valves", label: "Valves" },
    { id: "pancrease", label: "Pancreas" },
    { id: "tendons", label: "Tendons" },
    { id: "intestines", label: "Intestines" },
    { id: "blood-vessels", label: "Blood Vessels" },
  ]), []);

  const normalizeOrganId = (v) => {
    const s = String(v || "").trim();
    if (!s) return "";
    return s === "blood-vesseles" ? "blood-vessels" : s;
  };

  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(items.map((p) => String(p.status || "").trim()).filter(Boolean))).sort();
  }, [items]);
  const uniqueGenders = useMemo(() => {
    return Array.from(new Set(items.map((p) => String(p.gender || "").trim()).filter(Boolean))).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    return items.filter((p) => {
      const matchesSearch =
        !s ||
        String(p.id || "").toLowerCase().includes(s) ||
        String(p.full_name || "").toLowerCase().includes(s) ||
        String(p.pledged_organs_string || "").toLowerCase().includes(s) ||
        String(p.status || "").toLowerCase().includes(s);

      const matchesStatus = !statusFilter || String(p.status || "") === statusFilter;
      const matchesGender = !genderFilter || String(p.gender || "") === genderFilter;

      const pledgedArr = Array.isArray(p.pledged_organs) ? p.pledged_organs.map(normalizeOrganId) : [];
      const organNeedle = normalizeOrganId(pledgedOrganFilter);
      const matchesOrgan =
        !organNeedle ||
        pledgedArr.includes(organNeedle) ||
        String(p.pledged_organs_string || "").toLowerCase().includes(organNeedle.toLowerCase());

      return matchesSearch && matchesStatus && matchesGender && matchesOrgan;
    });
  }, [items, searchTerm, statusFilter, genderFilter, pledgedOrganFilter]);

  const filteredIds = useMemo(() => filtered.map((p) => p.id).filter(Boolean), [filtered]);
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
  const hasActiveFilters = Boolean(statusFilter || genderFilter || pledgedOrganFilter);
  const clearFilters = () => {
    setStatusFilter("");
    setGenderFilter("");
    setPledgedOrganFilter("");
  };

  return (
    <section className="organ-coordination-section">
      <div className="dashboard-title">
        <div>
          <div className="icon-title">
            <MdOutlineHealthAndSafety className="icon-size" />
            <h2>Organ Coordination</h2>
          </div>
          <p>After-death pledges (hospital-specific)</p>
        </div>
      </div>

      <div className="control-panel">
        <div className="control-panel-layout">
          <div className="search-input">
            <IoSearchSharp />
            <input
              type="search"
              placeholder="Search by ID, donor name, organs, status..."
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

      <div className="control-panel" style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}>
            <div style={{ minWidth: 170 }}>
              <label style={{ display: "block", marginBottom: 5, fontWeight: 500, fontSize: 14 }}>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, backgroundColor: "#fff" }}
              >
                <option value="">All</option>
                {uniqueStatuses.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
            <div style={{ minWidth: 170 }}>
              <label style={{ display: "block", marginBottom: 5, fontWeight: 500, fontSize: 14 }}>Gender</label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, backgroundColor: "#fff" }}
              >
                <option value="">All</option>
                {uniqueGenders.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div style={{ minWidth: 190 }}>
              <label style={{ display: "block", marginBottom: 5, fontWeight: 500, fontSize: 14 }}>Pledged Organ</label>
              <select
                value={pledgedOrganFilter}
                onChange={(e) => setPledgedOrganFilter(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, backgroundColor: "#fff" }}
              >
                <option value="">All</option>
                {ORGANS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
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
            {statusFilter && <span style={{ marginLeft: 10, padding: "4px 8px", backgroundColor: "#fff", borderRadius: 4 }}>Status: {statusFilter}</span>}
            {genderFilter && <span style={{ marginLeft: 10, padding: "4px 8px", backgroundColor: "#fff", borderRadius: 4 }}>Gender: {genderFilter}</span>}
            {pledgedOrganFilter && <span style={{ marginLeft: 10, padding: "4px 8px", backgroundColor: "#fff", borderRadius: 4 }}>Organ: {pledgedOrganFilter}</span>}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "30px", color: "#6B6B6B" }}>
          Loading after-death pledges...
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
                <th className="col-order-id">AD ID</th>
                <th className="col-donor">Donor</th>
                <th className="col-gender">Gender</th>
                <th className="col-contact">Contact</th>
                <th className="col-availability">ID Photos</th>
                <th className="col-organs">Pledged Organs</th>
                <th className="col-availability">Status</th>
                <th className="col-availability">Created</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="col-select">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => toggleOne(p.id)}
                        aria-label={`Select ${p.id}`}
                      />
                    </td>
                    <td className="col-order-id">
                      <strong>{p.id}</strong>
                    </td>
                    <td className="col-donor">
                      <div className="cell-title">
                        <strong>{p.full_name}</strong>
                        <small className="muted">{p.blood_type || "N/A"} • {p.age ?? "N/A"} yrs</small>
                      </div>
                    </td>
                    <td className="col-gender">
                      <div className="cell-title">
                        <strong>{p.gender || "N/A"}</strong>
                      </div>
                    </td>
                    <td className="col-contact">
                      <div className="cell-title">
                        <strong>{p.email || "N/A"}</strong>
                        <small className="muted">{p.phone_nb || "N/A"}</small>
                      </div>
                    </td>
                    <td className="col-availability">
                      <div  style={{ display: "flex", flexDirection: "column", flexWrap: "wrap", gap: 8 }}>
                        {p.id_photo &&
                          <a className="link id-photo-btn" href={p.id_photo} target="_blank" rel="noreferrer">Personal</a>
                        }
                        {p.father_id_photo &&
                          <a className="link id-photo-btn" href={p.father_id_photo} target="_blank" rel="noreferrer">Father</a>
                        }
                        {p.mother_id_photo &&
                          <a className="link id-photo-btn" href={p.mother_id_photo} target="_blank" rel="noreferrer">Mother</a>
                        }
                      </div>
                    </td>
                    <td className="col-organs">{p.pledged_organs_string || "N/A"}</td>
                    <td className="col-availability">
                      <span className={`badge ${p.status === "active" ? "badge-success" : "badge-danger"}`}>
                        {p.status || "N/A"}
                      </span>
                    </td>
                    <td className="col-availability">{p.created_at || "N/A"}</td>
                    <td className="col-actions">
                      <div className="row-actions">
                        <button className="icon-btn text-blue-800" title="View Details" onClick={() => setViewCode(p.id)}>
                          <FiEye />
                        </button>
                        <button className="icon-btn text-green-600" title="Edit" onClick={() => setEditing(p)}>
                          <FiEdit />
                        </button>
                        <button
                          className="icon-btn text-red-500"
                          title="Delete"
                          onClick={() => {
                            setDeleteError("");
                            setDeleting(p);
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
                  <td colSpan="10" style={{ textAlign: "center", padding: "40px" }}>
                    No after-death pledges found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewCode && (
        <ViewOrganCoordinationModal
          mode="after-death"
          code={viewCode}
          scope="hospital"
          onClose={() => setViewCode(null)}
        />
      )}

      {editing && (
        <EditOrganCoordinationModal
          mode="after-death"
          code={editing.id}
          scope="hospital"
          onClose={() => setEditing(null)}
          onSaved={() => fetchData()}
        />
      )}

      {deleting && (
        <ConfirmDeleteDialog
          title="Delete Record"
          description="You are going to delete this after-death pledge. Are you sure?"
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
              await api.delete(`/api/hospital/dashboard/organ-coordination/after-death-pledges/${deleting.id}`);
              setDeleting(null);
              fetchData();
            } catch (e) {
              setDeleteError(e.response?.data?.message || "Failed to delete pledge");
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
                selectedIds.map((id) => api.delete(`/api/hospital/dashboard/organ-coordination/after-death-pledges/${id}`))
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

