import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiUpload, FiArrowLeft } from "react-icons/fi";
import { toPng } from "html-to-image";

import api from "../../../api/axios";
import "../../../styles/Dashboard.css";
import "../../../styles/Certificates.css";
import AnimatedSection from "../../common/AnimatedSection";

const DESCRIPTION_OPTIONS = [
  "Blood Donation",
  "Organ Pledge",
  "Participation",
  "Outstanding Donor",
  "Other",
];

export default function GenerateCertificate() {
  const navigate = useNavigate();
  const [donors, setDonors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [donorId, setDonorId] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const [donorName, setDonorName] = useState("");
  const [descriptionOption, setDescriptionOption] = useState("");
  const [certificateDate, setCertificateDate] = useState(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [donorNamePos, setDonorNamePos] = useState({ x: 50, y: 28 });
  const [descriptionPos, setDescriptionPos] = useState({ x: 50, y: 58 });
  const [datePos, setDatePos] = useState({ x: 50, y: 82 });
  const [hospitalPos, setHospitalPos] = useState({ x: 50, y: 45 });
  const [dragging, setDragging] = useState(null); // 'donor' | 'description' | 'date' | 'hospital' | null
  const previewRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [loadingDonors, setLoadingDonors] = useState(true);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [error, setError] = useState("");

  const certificateRef = useRef(null);

  const downloadCertificate = useCallback(() => {
    if (certificateRef.current == null) return;

    toPng(certificateRef.current, { cacheBust: true })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'certificate.png';
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Error generating PNG:', err);
      });
  }, []);



  useEffect(() => {
    api
      .get("/api/admin/dashboard/get-donors")
      .then((res) => {
        const list = res.data?.donors || [];
        setDonors(Array.isArray(list) ? list : []);
      })
      .catch(() => setDonors([]))
      .finally(() => setLoadingDonors(false));

    api
      .get("/api/admin/dashboard/get-hospitals")
      .then((res) => {
        const hospitalsData = res.data?.hospitals || res.data || [];
        setHospitals(Array.isArray(hospitalsData) ? hospitalsData : []);
      })
      .catch(() => setHospitals([]))
      .finally(() => setLoadingHospitals(false));
  }, []);

  const selectedDonor = donors.find((d) => String(d.id) === String(donorId));
  const displayName = donorName || (selectedDonor ? formatDonorName(selectedDonor) : "");
  const selectedHospital = hospitals.find((h) => String(h.id) === String(hospitalId));
  const displayHospital = selectedHospital ? (`at ${selectedHospital.name ?? selectedHospital.hospital_name ?? `Hospital ${selectedHospital.id}`}`) : "";

  function formatDonorName(d) {
    const u = d.user || {};
    const parts = [u.first_name, u.last_name].filter(Boolean);
    return parts.join(" ").trim() || "Unknown";
  }

  const handleDonorChange = (e) => {
    const id = e.target.value;
    setDonorId(id);
    const d = donors.find((x) => String(x.id) === String(id));
    setDonorName(d ? formatDonorName(d) : "");
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const posFromEvent = useCallback((e) => {
    const el = previewRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x: clamp(x, 0, 100), y: clamp(y, 0, 100) };
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const p = posFromEvent(e);
      if (!p) return;
      if (dragging === "donor") setDonorNamePos(p);
      else if (dragging === "description") setDescriptionPos(p);
      else if (dragging === "date") setDatePos(p);
      else if (dragging === "hospital") setHospitalPos(p);
    };
    const onUp = () => setDragging(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, posFromEvent]);

  function ddMmYyyyToYyyyMmDd(s) {
    if (!s || typeof s !== "string") return null;
    const trimmed = s.trim();
    const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return null;
    const [, dd, mm, yyyy] = match;
    const d = parseInt(dd, 10);
    const m = parseInt(mm, 10);
    const y = parseInt(yyyy, 10);
    if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > 2100) return null;
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!displayName.trim()) {
      setError("Donor name is required.");
      return;
    }
    if (!descriptionOption) {
      setError("Please select a description option.");
      return;
    }
    const apiDate = ddMmYyyyToYyyyMmDd(certificateDate);
    if (certificateDate.trim() && !apiDate) {
      setError("Date must be in dd/mm/yyyy format.");
      return;
    }
    if (!imagePreview) {
      setError("Please add a certificate image.");
      return;
    }
    setLoading(true);
    try {
      await api.get("/sanctum/csrf-cookie");
      
      // Capture the preview with overlays as PNG
      let imageFile = image;
      if (certificateRef.current) {
        try {
          const dataUrl = await toPng(certificateRef.current, { 
            cacheBust: true,
            pixelRatio: 2, // Higher quality
            quality: 1.0
          });
          
          // Convert data URL to Blob
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          
          // Create a File from the Blob with a proper filename
          imageFile = new File([blob], `certificate-${Date.now()}.png`, {
            type: 'image/png',
            lastModified: Date.now()
          });
        } catch (pngError) {
          console.error('Error capturing preview as PNG:', pngError);
          // Fallback to original image if PNG capture fails
          if (!image) {
            setError("Failed to generate certificate preview. Please try again.");
            setLoading(false);
            return;
          }
        }
      }
      
      const fd = new FormData();
      fd.append("donor_name", displayName.trim());
      fd.append("description_option", descriptionOption);
      if (donorId) fd.append("donor_id", donorId);
      if (hospitalId) fd.append("hospital_id", hospitalId);
      if (apiDate) fd.append("certificate_date", apiDate);
      if (imageFile) fd.append("image", imageFile);
      
      await api.post("/api/admin/dashboard/certificates", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate("/admin/certificates");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create certificate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedSection className="financial-section" animation="fade-up">
      <div className="dashboard-title">
        <div>
          <div className="icon-title">
            <FiUpload className="icon-size" />
            <h2>Generate Certificate</h2>
          </div>
          <p>Create a new donor certificate</p>
        </div>
        <div className="add-btn">
          <Link
            to="/admin/certificates"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              background: "#6b7280",
              color: "#fff",
              borderRadius: "8px",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            <FiArrowLeft /> Back to Certificates
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="generate-certificate-form">
        {error ? (
          <div className="error-message" style={{ marginBottom: "1rem" }}>
            {error}
          </div>
        ) : null}

        <div className="form-row generate-certificate-fields">
          <div className="form-group">
            <div>
            <label>Donor Name</label>
            {loadingDonors ? (
              <p className="muted">Loading donors…</p>
            ) : (
              <>
                <select
                  value={donorId}
                  onChange={handleDonorChange}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db" }}
                >
                  <option value="">Select donor</option>
                  {donors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {formatDonorName(d)} {d.code ? `(${d.code})` : ""}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Or type donor name (if not in list)"
                  value={donorId ? "" : donorName}
                  onChange={(e) => {
                    if (!donorId) setDonorName(e.target.value);
                  }}
                  disabled={!!donorId}
                  style={{
                    width: "100%",
                    marginTop: "8px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                  }}
                />
              </>
            )}
            </div>
          </div>

          <div className="form-group">
            <div>
              <label>Description Option</label>
              <select
                value={descriptionOption}
                onChange={(e) => setDescriptionOption(e.target.value)}
                required
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db" }}
              >
                <option value="">Select option</option>
                {DESCRIPTION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <div>
              <label>Hospital</label>
              {loadingHospitals ? (
                <p className="muted">Loading hospitals…</p>
              ) : (
                <select
                  value={hospitalId}
                  onChange={(e) => setHospitalId(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db" }}
                >
                  <option value="">Select hospital (optional)</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name || h.hospital_name || `Hospital ${h.id}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
 
          <div className="form-group">
            <div>
              <label>Date (dd/mm/yyyy)</label>
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                value={certificateDate}
                onChange={(e) => setCertificateDate(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db" }}
              />
            </div>
          </div>
        </div>

        <div className="certificate-preview-container">
          <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "1rem" }}>Certificate preview</h4>
          <p style={{ margin: "0 0 1rem 0", fontSize: "13px", color: "#6b7280" }}>
            {imagePreview ? "Drag the texts (donor, hospital, description, date) to reposition them on the certificate." : "Add a certificate image, then drag donor name, hospital, description, and date to position them."}
          </p>
          <div className="certificate-preview-layout">
            <div className="certificate-preview-left">
              <div className="certificate-preview-box">
                <div ref={(el) => { previewRef.current = el; certificateRef.current = el; }} className={`certificate-preview-inner ${imagePreview ? "has-image" : ""}`}>
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Certificate" className="certificate-preview-img" />
                      <div
                        className={`certificate-overlay certificate-overlay-donor ${dragging === "donor" ? "dragging" : ""}`}
                        style={{ left: `${donorNamePos.x}%`, top: `${donorNamePos.y}%` }}
                        onMouseDown={(e) => { e.preventDefault(); setDragging("donor"); }}
                      >
                        {displayName || "Donor Name"}
                      </div>
                      {displayHospital && (
                        <div
                          className={`certificate-overlay certificate-overlay-hospital ${dragging === "hospital" ? "dragging" : ""}`}
                          style={{ left: `${hospitalPos.x}%`, top: `${hospitalPos.y}%` }}
                          onMouseDown={(e) => { e.preventDefault(); setDragging("hospital"); }}
                        >
                          {displayHospital}
                        </div>
                      )}
                      <div
                        className={`certificate-overlay certificate-overlay-desc ${dragging === "description" ? "dragging" : ""}`}
                        style={{ left: `${descriptionPos.x}%`, top: `${descriptionPos.y}%` }}
                        onMouseDown={(e) => { e.preventDefault(); setDragging("description"); }}
                      >
                        {descriptionOption || "Description Option"}
                      </div>
                      <div
                        className={`certificate-overlay certificate-overlay-date ${dragging === "date" ? "dragging" : ""}`}
                        style={{ left: `${datePos.x}%`, top: `${datePos.y}%` }}
                        onMouseDown={(e) => { e.preventDefault(); setDragging("date"); }}
                      >
                        {certificateDate || "dd/mm/yyyy"}
                      </div>
                    </>
                  ) : (
                    <div className="certificate-preview-placeholder">
                      <p className="certificate-preview-name">{displayName || "Donor Name"}</p>
                      <p className="certificate-preview-desc">{descriptionOption || "Description Option"}</p>
                      <p className="certificate-preview-date">{certificateDate || "dd/mm/yyyy"}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="certificate-controls-right">
              {imagePreview && (
                <div className="certificate-position-inputs">
                  <div className="certificate-position-group">
                    <label>Donor name position</label>
                    <div className="certificate-position-fields">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={Math.round(donorNamePos.x)}
                        onChange={(e) => setDonorNamePos((p) => ({ ...p, x: clamp(Number(e.target.value) || 0, 0, 100) }))}
                        title="Left %"
                      />
                      <span>% left</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={Math.round(donorNamePos.y)}
                        onChange={(e) => setDonorNamePos((p) => ({ ...p, y: clamp(Number(e.target.value) || 0, 0, 100) }))}
                        title="Top %"
                      />
                      <span>% top</span>
                    </div>
                  </div>
                  {displayHospital && (
                    <div className="certificate-position-group">
                      <label>Hospital position</label>
                      <div className="certificate-position-fields">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={Math.round(hospitalPos.x)}
                          onChange={(e) => setHospitalPos((p) => ({ ...p, x: clamp(Number(e.target.value) || 0, 0, 100) }))}
                          title="Left %"
                        />
                        <span>% left</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={Math.round(hospitalPos.y)}
                          onChange={(e) => setHospitalPos((p) => ({ ...p, y: clamp(Number(e.target.value) || 0, 0, 100) }))}
                          title="Top %"
                        />
                        <span>% top</span>
                      </div>
                    </div>
                  )}
                  <div className="certificate-position-group">
                    <label>Description position</label>
                    <div className="certificate-position-fields">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={Math.round(descriptionPos.x)}
                        onChange={(e) => setDescriptionPos((p) => ({ ...p, x: clamp(Number(e.target.value) || 0, 0, 100) }))}
                        title="Left %"
                      />
                      <span>% left</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={Math.round(descriptionPos.y)}
                        onChange={(e) => setDescriptionPos((p) => ({ ...p, y: clamp(Number(e.target.value) || 0, 0, 100) }))}
                        title="Top %"
                      />
                      <span>% top</span>
                    </div>
                  </div>
                  <div className="certificate-position-group">
                    <label>Date position</label>
                    <div className="certificate-position-fields">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={Math.round(datePos.x)}
                        onChange={(e) => setDatePos((p) => ({ ...p, x: clamp(Number(e.target.value) || 0, 0, 100) }))}
                        title="Left %"
                      />
                      <span>% left</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={Math.round(datePos.y)}
                        onChange={(e) => setDatePos((p) => ({ ...p, y: clamp(Number(e.target.value) || 0, 0, 100) }))}
                        title="Top %"
                      />
                      <span>% top</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="certificate-add-image-row">
                <label className="btn-add-certificate-image">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />
                  <FiUpload style={{ marginRight: "6px" }} />
                  Add certificate image
                </label>
                {imagePreview && (
                  <>
                    <button
                      type="button"
                      onClick={downloadCertificate}
                      className="btn-download-preview"
                    >
                      <FiUpload style={{ transform: "rotate(180deg)" }} />
                      Download Preview
                    </button>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="btn-ghost"
                      style={{ marginTop: "8px", width: "100%" }}
                    >
                      Remove image
                    </button>
                  </>
                )}
              </div>

              <div className="certificate-form-actions">
                <button type="submit" className="submit-btn" disabled={loading} >
                  {loading ? "Uploading.." : "Upload Certificate"}
                </button>
                <Link
                  to="/admin/certificates"
                  className="btn-ghost"
                  style={{ padding: "8px 16px", textDecoration: "none", display: "block", textAlign: "center", marginTop: "0.75rem" }}
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </AnimatedSection>
  );
}
