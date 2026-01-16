import { useEffect, useMemo, useState } from "react";
import { MdOutlineHealthAndSafety } from "react-icons/md";
import { IoSearchSharp } from "react-icons/io5";
import { FiEye, FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import api from "../../api/axios";
import EditOrganCoordinationModal from "../adminDashboard/organPledgesComponents/EditOrganCoordinationModal";
import ConfirmDeleteModal from "../adminDashboard/organPledgesComponents/ConfirmDeleteModal";
import ViewOrganCoordinationModal from "../adminDashboard/organPledgesComponents/ViewOrganCoordinationModal";

export default function OrganCoordinationAfterDeath() {
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
      const res = await api.get("/api/hospital/dashboard/organ-coordination/after-death-pledges");
      setItems(res.data?.after_death_pledges || []);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load after-death pledges");
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
    return items.filter((p) => {
      return (
        String(p.id || "").toLowerCase().includes(s) ||
        String(p.full_name || "").toLowerCase().includes(s) ||
        String(p.pledged_organs_string || "").toLowerCase().includes(s) ||
        String(p.status || "").toLowerCase().includes(s)
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
        </div>
      </div>

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
                <th className="col-order-id">AD ID</th>
                <th className="col-donor">Donor</th>
                <th className="col-availability">ID Photos</th>
                <th className="col-availability">Pledged Organs</th>
                <th className="col-availability">Status</th>
                <th className="col-availability">Created</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="col-order-id">
                      <strong>{p.id}</strong>
                    </td>
                    <td className="col-donor">
                      <div className="cell-title">
                        <strong>{p.full_name}</strong>
                        <small className="muted">{p.blood_type || "N/A"} • {p.age ?? "N/A"} yrs</small>
                      </div>
                    </td>
                    <td className="col-availability">
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {p.id_photo ? (
                          <a className="link" href={p.id_photo} target="_blank" rel="noreferrer">Personal</a>
                        ) : (
                          <span className="muted">Personal: N/A</span>
                        )}
                        {p.father_id_photo ? (
                          <a className="link" href={p.father_id_photo} target="_blank" rel="noreferrer">Father</a>
                        ) : (
                          <span className="muted">Father: N/A</span>
                        )}
                        {p.mother_id_photo ? (
                          <a className="link" href={p.mother_id_photo} target="_blank" rel="noreferrer">Mother</a>
                        ) : (
                          <span className="muted">Mother: N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="col-availability">{p.pledged_organs_string || "N/A"}</td>
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
                  <td colSpan="7" style={{ textAlign: "center", padding: "40px" }}>
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
        <ConfirmDeleteModal
          title="Delete After-Death Pledge"
          description={`Delete ${deleting.id}? This cannot be undone.`}
          loading={deleteLoading}
          error={deleteError}
          onClose={() => setDeleting(null)}
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
    </section>
  );
}

