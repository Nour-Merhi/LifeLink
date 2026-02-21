import { useEffect, useMemo, useState } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from "spinners-react";
import api from "../../../api/axios";

const valueOrNA = (v) => {
    if (v === null || v === undefined) return "N/A";
    const s = String(v).trim();
    return s.length ? s : "N/A";
};

const ORGANS = [
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
];

const normalizeOrgans = (arr) => {
    if (!Array.isArray(arr)) return [];
    return Array.from(
        new Set(
            arr
                .filter(Boolean)
                .map((v) => String(v))
                .map((v) => (v === "blood-vesseles" ? "blood-vessels" : v))
        )
    );
};

export default function EditOrganCoordinationModal({ onClose, mode, code, onSaved, scope = "admin" }) {
    const isLiving = mode === "living";
    const title = isLiving ? "Edit Living Donor" : "Edit After-Death Pledge";

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [details, setDetails] = useState(null);
    const [activeTab, setActiveTab] = useState("status");
    const [suggestedSlots, setSuggestedSlots] = useState(["", "", ""]);
    const [apptSaving, setApptSaving] = useState(false);
    const [apptError, setApptError] = useState("");
    const [apptSuccess, setApptSuccess] = useState("");
    const [cancelReason, setCancelReason] = useState("");

    const [hospitals, setHospitals] = useState([]);
    const [loadingHospitals, setLoadingHospitals] = useState(false);

    const endpoint = useMemo(() => {
        if (scope === "hospital") {
            return isLiving
                ? `/api/hospital/dashboard/organ-coordination/living-donors/${code}`
                : `/api/hospital/dashboard/organ-coordination/after-death-pledges/${code}`;
        }
        return isLiving ? `/api/admin/dashboard/living-donors/${code}` : `/api/admin/dashboard/after-death-pledges/${code}`;
    }, [isLiving, code, scope]);

    const updateEndpoint = useMemo(() => {
        if (scope === "hospital") {
            return isLiving
                ? `/api/hospital/dashboard/organ-coordination/living-donors/${code}`
                : `/api/hospital/dashboard/organ-coordination/after-death-pledges/${code}`;
        }
        return isLiving ? `/api/admin/dashboard/living-donors/${code}` : `/api/admin/dashboard/after-death-pledges/${code}`;
    }, [isLiving, code, scope]);

    useEffect(() => {
        let cancelled = false;

        const fetchDetails = async () => {
            if (!code) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError("");
            try {
                const res = await api.get(endpoint);
                const payload = isLiving ? res.data.living_donor : res.data.after_death_pledge;
                if (!cancelled) setDetails(payload || null);
            } catch (e) {
                if (!cancelled) setError(e.response?.data?.message || "Failed to load details");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchDetails();
        return () => {
            cancelled = true;
        };
    }, [endpoint, isLiving, code]);

    const fetchHospitals = async () => {
        setLoadingHospitals(true);
        try {
            const res = await api.get("/api/admin/dashboard/get-hospitals");
            setHospitals(res.data?.hospitals || []);
        } catch (e) {
        } finally {
            setLoadingHospitals(false);
        }
    };

    useEffect(() => {
        if (scope === "admin") fetchHospitals();
    }, [scope]);

    const [form, setForm] = useState({
        // shared
        hospital_selection: "general",
        hospital_id: "",
        // living
        medical_status: "not_started",
        ethics_status: "pending",
        // after-death
        status: "active",
        email: "",
        phone_nb: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        pledged_organs: [],
    });

    useEffect(() => {
        if (!details) return;
        setForm((prev) => ({
            ...prev,
            hospital_selection: details.hospital_selection || "general",
            hospital_id: details.hospital_id || "",
            medical_status: details.medical_status || "not_started",
            ethics_status: details.ethics_status || "pending",
            status: details.status || "active",
            email: details.email || "",
            phone_nb: details.phone_nb || "",
            emergency_contact_name: details.emergency_contact_name || "",
            emergency_contact_phone: details.emergency_contact_phone || "",
            pledged_organs: normalizeOrgans(details.pledged_organs),
        }));

        if (isLiving) {
            const existing = Array.isArray(details.suggested_appointments) ? details.suggested_appointments : [];
            setSuggestedSlots([existing[0] || "", existing[1] || "", existing[2] || ""]);
        }
    }, [details]);

    const onChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (key === "hospital_selection" && value === "general") {
            setForm((prev) => ({ ...prev, hospital_id: "" }));
        }
    };

    const onToggleOrgan = (id, checked) => {
        setForm((prev) => {
            const current = new Set(normalizeOrgans(prev.pledged_organs));

            if (id === "all-organs") {
                if (checked) {
                    ORGANS.forEach((o) => current.add(o.id));
                } else {
                    current.clear();
                }
            } else {
                if (checked) current.add(id);
                else current.delete(id);

                // keep "all-organs" in sync
                const allIndividuals = ORGANS.filter((o) => o.id !== "all-organs").every((o) => current.has(o.id));
                if (allIndividuals) current.add("all-organs");
                else current.delete("all-organs");
            }

            return { ...prev, pledged_organs: Array.from(current) };
        });
    };

    const handleSave = async () => {
        if (!code) return;

        setSaving(true);
        setError("");

        try {
            if (!isLiving) {
                const selectedOrgans = normalizeOrgans(form.pledged_organs);
                if (!selectedOrgans.length) {
                    setError("Please select at least one pledged organ.");
                    setSaving(false);
                    return;
                }
            }

            const payload =
                scope === "hospital"
                    ? isLiving
                        ? {
                              medical_status: form.medical_status,
                              ethics_status: form.ethics_status,
                          }
                        : {
                              status: form.status,
                              email: form.email || null,
                              phone_nb: form.phone_nb || null,
                              emergency_contact_name: form.emergency_contact_name || null,
                              emergency_contact_phone: form.emergency_contact_phone || null,
                              pledged_organs: normalizeOrgans(form.pledged_organs),
                          }
                    : isLiving
                        ? {
                              medical_status: form.medical_status,
                              ethics_status: form.ethics_status,
                              hospital_selection: form.hospital_selection,
                              hospital_id: form.hospital_selection === "specific" ? form.hospital_id : null,
                          }
                        : {
                              status: form.status,
                              email: form.email || null,
                              phone_nb: form.phone_nb || null,
                              emergency_contact_name: form.emergency_contact_name || null,
                              emergency_contact_phone: form.emergency_contact_phone || null,
                              pledged_organs: normalizeOrgans(form.pledged_organs),
                              hospital_selection: form.hospital_selection,
                              hospital_id: form.hospital_selection === "specific" ? form.hospital_id : null,
                          };

            const res = await api.put(updateEndpoint, payload);
            onSaved?.(res.data);
            onClose?.();
        } catch (e) {
            setError(e.response?.data?.message || "Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    const suggestAppointments = async () => {
        if (!isLiving) return;
        setApptSaving(true);
        setApptError("");
        setApptSuccess("");
        try {
            const payload = {
                suggested_appointments: suggestedSlots.filter((x) => String(x || "").trim().length > 0),
            };
            const url =
                scope === "hospital"
                    ? `/api/hospital/dashboard/organ-coordination/living-donors/${code}/appointments/suggestions`
                    : `/api/admin/dashboard/living-donors/${code}/appointments/suggestions`;

            const res = await api.put(url, payload);
            setApptSuccess("Appointment options saved and emailed to donor.");
            setDetails(res.data?.living_donor || res.data?.living_donor || details);
            onSaved?.(res.data);
        } catch (e) {
            setApptError(e.response?.data?.message || "Failed to send appointment options.");
        } finally {
            setApptSaving(false);
        }
    };

    const updateAppointmentStatus = async (newStatus) => {
        if (!isLiving) return;
        setApptSaving(true);
        setApptError("");
        setApptSuccess("");
        try {
            const url =
                scope === "hospital"
                    ? `/api/hospital/dashboard/organ-coordination/living-donors/${code}/appointments/status`
                    : `/api/admin/dashboard/living-donors/${code}/appointments/status`;
            const res = await api.put(url, { appointment_status: newStatus, cancel_reason: cancelReason || null });
            setApptSuccess("Appointment status updated.");
            setDetails(res.data?.living_donor || details);
            onSaved?.(res.data);
        } catch (e) {
            setApptError(e.response?.data?.message || "Failed to update appointment status.");
        } finally {
            setApptSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container modal-modern" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                <div className="modal-modern-header">
                    <div className="modal-modern-title">
                        <h2>{title}</h2>
                        <div className="modal-modern-subtitle">
                            <span>{isLiving ? "LO ID" : "AD ID"}: {valueOrNA(code)}</span>
                            {details?.full_name && <span className="muted">{details.full_name}</span>}
                        </div>
                    </div>
                    <button className="modal-icon-btn" onClick={onClose} aria-label="Close">
                        <IoClose />
                    </button>
                </div>

                <div className="modal-modern-body">
                    {loading ? (
                        <div className="loader" style={{ padding: "28px 0", textAlign: "center" }}>
                            <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />
                            <h3 style={{ marginTop: 10 }}>Loading...</h3>
                        </div>
                    ) : error ? (
                        <div className="error-message modal-error-container">{error}</div>
                    ) : (
                        <>
                            {isLiving && (
                                <div className="donor-detail-tabs" >
                                    <button
                                        type="button"
                                        className={`tab-btn ${activeTab === "status" ? "active" : ""}`}
                                        onClick={() => setActiveTab("status")}
                                    >
                                        Status
                                    </button>

                                    {form.ethics_status === "approved" && (
                                        <button
                                            type="button"
                                            className={`tab-btn ${activeTab === "appointments" ? "active" : ""}`}
                                            onClick={() => setActiveTab("appointments")}
                                        >
                                            Appointments
                                        </button>
                                    )}
                                </div>
                            )}
                            {isLiving ? (
                                <>
                                    {activeTab === "status" && (
                                        <div className="modal-section">
                                            <h3 className="modal-section-title">Workflow Status</h3>
                                            <div className="modal-grid">
                                                <div className="modal-field">
                                                    <span className="label">Medical Status</span>
                                                    <select
                                                        className="value"
                                                        value={form.medical_status}
                                                        onChange={(e) => onChange("medical_status", e.target.value)}
                                                    >
                                                        <option value="not_started">Not Started</option>
                                                        <option value="in_progress">In Progress</option>
                                                        <option value="cleared">Cleared</option>
                                                        <option value="rejected">Rejected</option>
                                                    </select>
                                                </div>
                                                <div className="modal-field">
                                                    <span className="label">Ethics Status</span>
                                                    <select
                                                        className="value"
                                                        value={form.ethics_status}
                                                        onChange={(e) => onChange("ethics_status", e.target.value)}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="approved">Approved</option>
                                                        <option value="rejected">Rejected</option>
                                                        <option value="N/A">N/A</option>
                                                    </select>
                                                </div>
                                            </div>
                                            {form.ethics_status === "approved" && (
                                                <div className="modal-note" style={{ marginTop: 10 }}>
                                                    Approved: go to the <b>Appointments</b> tab to suggest date/time options to the donor.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === "appointments" && (
                                        <div className="modal-section">
                                            <h3 className="modal-section-title">Appointment Scheduling</h3>
                                            <div className="modal-grid">
                                                <div className="modal-field full-width">
                                                    <span className="label">Current appointment status</span>
                                                    <span className="value">{valueOrNA(details?.appointment_status)}</span>
                                                </div>
                                                <div className="modal-field full-width">
                                                    <span className="label">Selected appointment</span>
                                                    <span className="value">
                                                        {details?.selected_appointment_at ? new Date(details.selected_appointment_at).toLocaleString() : "N/A"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="modal-grid" style={{ marginTop: 10 }}>
                                                <div className="modal-field full-width">
                                                    <span className="label">Suggest up to 3 appointment options</span>
                                                    <div className="value" style={{ display: "grid", gap: 10 }}>
                                                        {suggestedSlots.map((v, idx) => (
                                                            <input
                                                                key={idx}
                                                                type="text"
                                                                className="value"
                                                                value={v}
                                                                onChange={(e) => {
                                                                    const next = [...suggestedSlots];
                                                                    next[idx] = e.target.value;
                                                                    setSuggestedSlots(next);
                                                                }}
                                                                placeholder="Example: 2026-01-30T10:00"
                                                            />
                                                        ))}
                                                    </div>
                                                    <div className="modal-note" style={{ marginTop: 8 }}>
                                                        Tip: you can paste ISO datetime strings (e.g. <code>2026-01-30T10:00</code>).
                                                    </div>
                                                </div>
                                            </div>

                                            {apptError && <div className="error-message modal-error-container">{apptError}</div>}
                                            {apptSuccess && <div style={{ color: "#16a34a", marginTop: 10 }}>{apptSuccess}</div>}

                                            <div style={{ display: "flex",gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                                                <button type="button" className="submit-btn" onClick={suggestAppointments} disabled={apptSaving}>
                                                    {apptSaving ? "Sending..." : "Save & Email Options"}
                                                </button>

                                                    {details?.appointment_status !== "in_progress" && (
                                                        <button type="button" className="btn-cancel" onClick={() => updateAppointmentStatus("in_progress")} disabled={apptSaving}>
                                                            Mark In Progress
                                                        </button>
                                                    )}

                                                {details?.appointment_status === "in_progress"  && (
                                                    <button type="button" className="btn-cancel" onClick={() => updateAppointmentStatus("completed")} disabled={apptSaving}>
                                                        Mark Completed
                                                    </button>
                                                )}
                                            </div>

                                            <div style={{ marginTop: 30 }}>
                                                <div style={{ fontWeight: 700, marginBottom: 3 }}>Cancel appointment</div>
                                                <div className="flex flex-col gap-2">
                                                <input
                                                    className="value mb-5"
                                                    type="text"
                                                    value={cancelReason}
                                                    onChange={(e) => setCancelReason(e.target.value)}
                                                    placeholder="Optional reason (shown in email)"
                                                />
                                                <button
                                                    type="button"
                                                    className="btn-cancel"
                                                    onClick={() => updateAppointmentStatus("cancelled")}
                                                    disabled={apptSaving}
                                                >
                                                    Mark Cancelled
                                                </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="modal-section">
                                        <h3 className="modal-section-title">Pledge Status</h3>
                                        <div className="modal-grid">
                                            <div className="modal-field">
                                                <span className="label">Status</span>
                                                <select className="value" value={form.status} onChange={(e) => onChange("status", e.target.value)}>
                                                    <option value="active">Active</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-section">
                                        <h3 className="modal-section-title">Pledged Organs</h3>
                                        <div className="modal-grid">
                                            <div className="modal-field full-width">
                                                <span className="label">Select organs</span>
                                                <div className="value" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                                                    {ORGANS.map((o) => {
                                                        const checked = normalizeOrgans(form.pledged_organs).includes(o.id);
                                                        return (
                                                            <label
                                                                key={o.id}
                                                                style={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: 10,
                                                                    padding: "10px 12px",
                                                                    border: "1px solid rgba(0,0,0,0.08)",
                                                                    borderRadius: 10,
                                                                    background: "#fff",
                                                                    cursor: "pointer",
                                                                }}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={(e) => onToggleOrgan(o.id, e.target.checked)}
                                                                />
                                                                <span style={{ fontWeight: 600 }}>{o.label}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="modal-note" style={{ marginTop: 10 }}>
                                            Tip: selecting “All Organs” will auto-select all organs.
                                        </div>
                                    </div>

                                    <div className="modal-section">
                                        <h3 className="modal-section-title">Contact</h3>
                                        <div className="modal-grid">
                                            <div className="modal-field">
                                                <span className="label">Email</span>
                                                <input
                                                    className="value"
                                                    type="email"
                                                    value={form.email}
                                                    onChange={(e) => onChange("email", e.target.value)}
                                                    placeholder="example@email.com"
                                                />
                                            </div>
                                            <div className="modal-field">
                                                <span className="label">Phone</span>
                                                <input
                                                    className="value"
                                                    type="text"
                                                    value={form.phone_nb}
                                                    onChange={(e) => onChange("phone_nb", e.target.value)}
                                                    placeholder="+961..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-section">
                                        <h3 className="modal-section-title">Emergency Contact</h3>
                                        <div className="modal-grid">
                                            <div className="modal-field">
                                                <span className="label">Name</span>
                                                <input
                                                    className="value"
                                                    type="text"
                                                    value={form.emergency_contact_name}
                                                    onChange={(e) => onChange("emergency_contact_name", e.target.value)}
                                                    placeholder="Full name"
                                                />
                                            </div>
                                            <div className="modal-field">
                                                <span className="label">Phone</span>
                                                <input
                                                    className="value"
                                                    type="text"
                                                    value={form.emergency_contact_phone}
                                                    onChange={(e) => onChange("emergency_contact_phone", e.target.value)}
                                                    placeholder="+961..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {scope === "admin" && (
                                <div className="modal-section">
                                    <h3 className="modal-section-title">Hospital Selection</h3>
                                    <div className="modal-grid">
                                        <div className="modal-field">
                                            <span className="label">Selection</span>
                                            <select
                                                className="value"
                                                value={form.hospital_selection}
                                                onChange={(e) => onChange("hospital_selection", e.target.value)}
                                            >
                                                <option value="general">General</option>
                                                <option value="specific">Specific</option>
                                            </select>
                                        </div>
                                        <div className="modal-field">
                                            <span className="label">Hospital</span>
                                            <select
                                                className="value max-w-[300px]"
                                                value={form.hospital_id}
                                                onChange={(e) => onChange("hospital_id", e.target.value)}
                                                disabled={form.hospital_selection !== "specific" || loadingHospitals}
                                            
                                            >
                                                <option value="">
                                                    {form.hospital_selection !== "specific"
                                                        ? "Not required"
                                                        : loadingHospitals
                                                            ? "Loading hospitals..."
                                                            : "Select hospital"}
                                                </option>
                                                {hospitals.map((h) => (
                                                    <option key={h.id} value={h.id}>
                                                        {h.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="modal-modern-footer">
                    <button type="button" className="btn-cancel" onClick={onClose} disabled={saving}>
                        Cancel
                    </button>
                    <button type="button" className="submit-btn" onClick={handleSave} disabled={saving || loading}>
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

