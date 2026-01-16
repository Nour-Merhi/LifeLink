import { useEffect, useMemo, useState } from "react";
import { MdOutlineHealthAndSafety } from "react-icons/md";
import { IoSearchSharp } from "react-icons/io5";
import { FiEye, FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import api from "../../api/axios";
import EditOrganCoordinationModal from "../adminDashboard/organPledgesComponents/EditOrganCoordinationModal";
import ConfirmDeleteModal from "../adminDashboard/organPledgesComponents/ConfirmDeleteModal";
import ViewOrganCoordinationModal from "../adminDashboard/organPledgesComponents/ViewOrganCoordinationModal";

export default function OrganCoordinationLiving() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewCode, setViewCode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/hospital/dashboard/organ-coordination/living-donors");
      setItems(res.data?.living_donors || []);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load living donors");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    if (!s) return items;
    return items.filter((d) => {
      return (
        String(d.id || "").toLowerCase().includes(s) ||
        String(d.full_name || "").toLowerCase().includes(s) ||
        String(d.organ || "").toLowerCase().includes(s) ||
        String(d.medical_status || "").toLowerCase().includes(s) ||
        String(d.ethics_status || "").toLowerCase().includes(s)
      );
    });
  }, [items, searchTerm]);

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
        </div>
      </div>

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
                <th className="col-order-id">LO ID</th>
                <th className="col-donor">Donor</th>
                <th className="col-availability">Organ</th>
                <th className="col-availability">Donation Type</th>
                <th className="col-availability">Medical</th>
                <th className="col-availability">Ethics</th>
                <th className="col-availability">Created</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((d) => (
                  <tr key={d.id}>
                    <td className="col-order-id">
                      <strong>{d.id}</strong>
                    </td>
                    <td className="col-donor">
                      <div className="cell-title">
                        <strong>{d.full_name}</strong>
                        <small className="muted">{d.blood_type} • {d.age ?? "N/A"} yrs</small>
                      </div>
                    </td>
                    <td className="col-availability">{d.organ || "N/A"}</td>
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
                  <td colSpan="8" style={{ textAlign: "center", padding: "40px" }}>
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
        <ConfirmDeleteModal
          title="Delete Living Donor"
          description={`Delete ${deleting.id}? This cannot be undone.`}
          loading={deleteLoading}
          error={deleteError}
          onClose={() => setDeleting(null)}
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
    </section>
  );
}

