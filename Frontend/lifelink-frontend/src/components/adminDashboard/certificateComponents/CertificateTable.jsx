import { useState } from "react";
import { IoSearchSharp } from "react-icons/io5";
import { SpinnerDotted } from "spinners-react";
import api from "../../../api/axios";
import { API_BASE_URL } from "../../../config/api";
import ConfirmDeleteDialog from "../../common/ConfirmDeleteDialog";
import CertificateImage from "../../common/CertificateImage";
import "../../../styles/Dashboard.css";

function getCertificateImageSrc(c) {
  const url = c?.image_url ?? null;
  if (url && typeof url === "string" && (url.startsWith("http") || url.startsWith("data:"))) return url;
  if (url && typeof url === "string") {
    const base = (API_BASE_URL || "").replace(/\/$/, "");
    const path = url.startsWith("/") ? url.slice(1) : url;
    return base ? `${base}/${path}` : url;
  }
  if (c?.image_path && API_BASE_URL) {
    const base = API_BASE_URL.replace(/\/$/, "");
    const path = (c.image_path.startsWith("storage/") ? c.image_path : `storage/${c.image_path}`).replace(/^\/+/, "");
    return `${base}/${path}`;
  }
  return null;
}

export default function CertificateTable({
  certificates = [],
  loading = false,
  error = "",
  onCertificatesUpdate,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDeleteClick = (id, donorName) => {
    setDeleteConfirm({ id, donorName });
    setDeleteError("");
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
    setDeleteError("");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm?.id) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await api.get("/sanctum/csrf-cookie");
      await api.delete(`/api/admin/dashboard/certificates/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      onCertificatesUpdate?.();
    } catch (e) {
      setDeleteError(e.response?.data?.message || "Failed to delete certificate");
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const filtered = (certificates || []).filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      !q ||
      (c.donor_name || "").toLowerCase().includes(q) ||
      (c.description_option || "").toLowerCase().includes(q)
    );
  });

  const total = filtered.length;
  const start = (currentPage - 1) * itemsPerPage;
  const pageCertificates = filtered.slice(start, start + itemsPerPage);
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

  return (
    <div className="certificate-table-wrapper">
      <div className="control-panel control-panel-layout">
        <div className="search-input">
          <IoSearchSharp />
          <input
            type="search"
            placeholder="Search by donor or description..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {error ? (
        <div className="error-message" style={{ margin: "1rem 0" }}>
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="loader">
          <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />
          <h3>Loading certificates...</h3>
        </div>
      ) : (
        <div className="table-design">
          <table className="h1-table">
            <thead>
              <tr>
                <th className="text-left col-hospital !pl-3">Donor</th>
                <th className="col-address">Description</th>
                <th className="col-certificate">Certificate</th>
                <th className="col-date">Created</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageCertificates.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                    No certificates found.
                  </td>
                </tr>
              ) : (
                pageCertificates.map((c) => (
                  <tr key={c.id}>
                    <td className="col-hospital">
                      <div className="cell-title pl-3">
                        <strong>{c.donor_name || "—"}</strong>
                      </div>
                    </td>
                    <td className="col-address !text-center">{c.description_option || "—"}</td>
                    <td className="col-certificate">
                      <div className="certificate-image-cell">
                        {c.image_path ? (
                          <CertificateImage
                            certificateId={c.id}
                            imagePath={c.image_path}
                            imageUrl={getCertificateImageSrc(c)}
                            alt={`Certificate for ${c.donor_name}`}
                            className="certificate-thumb"
                            isAdmin={true}
                            onError={(e) => {
                              const cell = e?.target?.parentNode;
                              if (cell) {
                                let placeholder = cell.querySelector(".certificate-no-image");
                                if (!placeholder) {
                                  placeholder = document.createElement("span");
                                  placeholder.className = "certificate-no-image";
                                  placeholder.textContent = "No image";
                                  cell.appendChild(placeholder);
                                }
                                placeholder.style.display = "";
                              }
                            }}
                          />
                        ) : null}
                        {!c.image_path ? (
                          <span className="certificate-no-image">No image</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="col-date">{formatDate(c.created_at)}</td>
                    <td className="col-actions">
                      <button
                        type="button"
                        className="icon-btn text-red-500"
                        title="Delete"
                        onClick={() => handleDeleteClick(c.id, c.donor_name)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && total > 0 && (
        <div className="pagination-controls" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <span style={{ fontSize: "14px", color: "#6b7280" }}>
            Showing {start + 1}–{Math.min(start + itemsPerPage, total)} of {total}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="btn-cancel"
              style={{ padding: "6px 12px" }}
            >
              Previous
            </button>
            <span style={{ fontSize: "14px" }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="submit-btn"
              style={{ padding: "6px 12px", background: "#F12C31" }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <ConfirmDeleteDialog
          title="Delete Certificate"
          description={`Delete certificate for ${deleteConfirm.donorName}?`}
          loading={deleteLoading}
          error={deleteError}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
