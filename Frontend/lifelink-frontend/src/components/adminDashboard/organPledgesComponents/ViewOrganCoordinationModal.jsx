import { useEffect, useMemo, useState } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from "spinners-react";
import api from "../../../api/axios";

const valueOrNA = (v) => {
    if (v === null || v === undefined) return "N/A";
    const s = String(v).trim();
    return s.length ? s : "N/A";
};

const titleCase = (v) => {
    const s = String(v || "").replace(/_/g, " ").trim();
    if (!s) return "N/A";
    return s.charAt(0).toUpperCase() + s.slice(1);
};

const yesNo = (v) => {
    if (v === true) return "Yes";
    if (v === false) return "No";
    return "N/A";
};

const formatOrgansFromArray = (organs) => {
    if (!Array.isArray(organs) || organs.length === 0) return "N/A";
    if (organs.includes("all-organs")) return "All Organs";
    const map = {
        heart: "Heart",
        corneas: "Corneas",
        liver: "Liver",
        skin: "Skin",
        kidneys: "Kidneys",
        bones: "Bones",
        lungs: "Lungs",
        valves: "Valves",
        pancrease: "Pancreas",
        tendons: "Tendons",
        intestines: "Intestines",
        "blood-vesseles": "Blood Vessels",
        "blood-vessels": "Blood Vessels",
    };
    return organs.map((o) => map[o] || titleCase(o)).join(", ");
};

const humanDonationType = (t) => {
    const s = String(t || "").toLowerCase();
    if (s === "directed") return "Directed Donation";
    if (s === "non-directed") return "Non-Directed Donation";
    return valueOrNA(t);
};

export default function ViewOrganCoordinationModal({ onClose, data, mode, code: codeProp, scope = "admin" }) {
    const isLiving = mode === "living";
    const headerTitle = isLiving ? "Living Organ Donation" : "After-Death Organ Pledge";
    const idLabel = isLiving ? "LO ID" : "AD ID";

    const code = useMemo(() => codeProp || data?.id, [codeProp, data?.id]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [details, setDetails] = useState(data || null);

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
                const url =
                    scope === "hospital"
                        ? isLiving
                            ? `/api/hospital/dashboard/organ-coordination/living-donors/${code}`
                            : `/api/hospital/dashboard/organ-coordination/after-death-pledges/${code}`
                        : isLiving
                            ? `/api/admin/dashboard/living-donors/${code}`
                            : `/api/admin/dashboard/after-death-pledges/${code}`;

                const res = await api.get(url);
                const payload = isLiving ? res.data.living_donor : res.data.after_death_pledge;
                if (!cancelled) {
                    setDetails(payload || null);
                }
            } catch (e) {
                if (!cancelled) {
                    setError(e.response?.data?.message || "Failed to fetch details");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchDetails();
        return () => {
            cancelled = true;
        };
    }, [code, isLiving, scope]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className={`modal-container modal-modern ${isLiving ? "" : "modal-modern-wide"}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="modal-modern-header">
                    <div className="modal-modern-title">
                        <h2>{headerTitle}</h2>
                        <div className="modal-modern-subtitle">
                            <span>
                                {idLabel}: {valueOrNA(code)}
                            </span>
                            {details?.created_at && <span className="muted">{valueOrNA(details.created_at)}</span>}
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
                            <h3 style={{ marginTop: 10 }}>Loading details...</h3>
                        </div>
                    ) : error ? (
                        <div className="error-message modal-error-container">{error}</div>
                    ) : !details ? (
                        <div className="error-message modal-error-container">No details available</div>
                    ) : (
                        <>
                            {/* Photos */}
                            {(details.id_picture || details.id_photo || details.father_id_photo || details.mother_id_photo) && (
                                <div className="modal-section">
                                    <h3 className="modal-section-title">ID Photos</h3>
                                    <div className="view-organ-id-photos">
                                        {details.id_picture && (
                                            <div className="view-organ-id-photo-item">
                                                <span className="view-organ-id-photo-label">Personal ID</span>
                                                <button
                                                    type="button"
                                                    className="view-organ-id-photo-preview"
                                                    onClick={() => window.open(details.id_picture, "_blank", "noopener,noreferrer")}
                                                    title="Open in new tab"
                                                >
                                                    <img src={details.id_picture} alt="Personal ID" />
                                                </button>
                                            </div>
                                        )}
                                        {details.id_photo && (
                                            <div className="view-organ-id-photo-item">
                                                <span className="view-organ-id-photo-label">Personal ID</span>
                                                <button
                                                    type="button"
                                                    className="view-organ-id-photo-preview"
                                                    onClick={() => window.open(details.id_photo, "_blank", "noopener,noreferrer")}
                                                    title="Open in new tab"
                                                >
                                                    <img src={details.id_photo} alt="Personal ID" />
                                                </button>
                                            </div>
                                        )}
                                        {details.father_id_photo && (
                                            <div className="view-organ-id-photo-item">
                                                <span className="view-organ-id-photo-label">Father ID</span>
                                                <button
                                                    type="button"
                                                    className="view-organ-id-photo-preview"
                                                    onClick={() => window.open(details.father_id_photo, "_blank", "noopener,noreferrer")}
                                                    title="Open in new tab"
                                                >
                                                    <img src={details.father_id_photo} alt="Father ID" />
                                                </button>
                                            </div>
                                        )}
                                        {details.mother_id_photo && (
                                            <div className="view-organ-id-photo-item">
                                                <span className="view-organ-id-photo-label">Mother ID</span>
                                                <button
                                                    type="button"
                                                    className="view-organ-id-photo-preview"
                                                    onClick={() => window.open(details.mother_id_photo, "_blank", "noopener,noreferrer")}
                                                    title="Open in new tab"
                                                >
                                                    <img src={details.mother_id_photo} alt="Mother ID" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="modal-section">
                                <h3 className="modal-section-title">General Information</h3>
                                <div className="modal-grid">
                                    <div className="modal-field">
                                        <span className="label">Full Name</span>
                                        <span className="value">{valueOrNA(details.full_name || details.donor_name)}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Blood Type</span>
                                        <span className="value">{valueOrNA(details.blood_type)}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Date of Birth</span>
                                        <span className="value">{valueOrNA(details.date_of_birth)}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Age</span>
                                        <span className="value">{details.age !== null && details.age !== undefined ? `${details.age} years` : "N/A"}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Gender</span>
                                        <span className="value">{titleCase(details.gender)}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Address</span>
                                        <span className="value">{valueOrNA(details.address)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-section">
                                <h3 className="modal-section-title">Contact</h3>
                                <div className="modal-grid">
                                    <div className="modal-field">
                                        <span className="label">Email</span>
                                        <span className="value">{valueOrNA(details.email)}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="label">Phone</span>
                                        <span className="value">{valueOrNA(details.phone_nb)}</span>
                                    </div>
                                </div>
                            </div>

                            {isLiving ? (
                                <>
                                    <div className="modal-section">
                                        <h3 className="modal-section-title">Health Information</h3>
                                        <div className="modal-grid">
                                            <div className="modal-field">
                                                <span className="label">Medical Conditions</span>
                                                <span className="value">
                                                    {Array.isArray(details.medical_conditions) && details.medical_conditions.length
                                                        ? details.medical_conditions.map(titleCase).join(", ")
                                                        : "None"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-section">
                                        <h3 className="modal-section-title">Donation Details</h3>
                                        <div className="modal-grid">
                                            <div className="modal-field">
                                                <span className="label">Organ</span>
                                                <span className="value">{valueOrNA(details.organ)}</span>
                                            </div>
                                            <div className="modal-field">
                                                <span className="label">Donation Type</span>
                                                <span className="value">{humanDonationType(details.donation_type)}</span>
                                            </div>
                                            <div className="modal-field">
                                                <span className="label">Medical Status</span>
                                                <span className="value">{titleCase(details.medical_status)}</span>
                                            </div>
                                            <div className="modal-field">
                                                <span className="label">Ethics Status</span>
                                                <span className="value">{titleCase(details.ethics_status)}</span>
                                            </div>
                                            <div className="modal-field">
                                                <span className="label">Consent Confirmed</span>
                                                <span className="value">{yesNo(details.agree_interest)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {String(details.donation_type || "").toLowerCase() === "directed" && (
                                        <div className="modal-section">
                                            <h3 className="modal-section-title">Recipient Information (Directed Donation)</h3>
                                            <div className="modal-grid">
                                                <div className="modal-field">
                                                    <span className="label">Full Name</span>
                                                    <span className="value">{valueOrNA(details.recipient_full_name)}</span>
                                                </div>
                                                <div className="modal-field">
                                                    <span className="label">Age</span>
                                                    <span className="value">{details.recipient_age ? `${details.recipient_age} years` : "N/A"}</span>
                                                </div>
                                                <div className="modal-field">
                                                    <span className="label">Contact Type</span>
                                                    <span className="value">{titleCase(details.recipient_contact_type)}</span>
                                                </div>
                                                <div className="modal-field">
                                                    <span className="label">Contact</span>
                                                    <span className="value">{valueOrNA(details.recipient_contact)}</span>
                                                </div>
                                                <div className="modal-field">
                                                    <span className="label">Blood Type</span>
                                                    <span className="value">{valueOrNA(details.recipient_blood_type)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="modal-section">
                                        <h3 className="modal-section-title">Hospital Selection</h3>
                                        <div className="modal-grid">
                                            <div className="modal-field">
                                                <span className="label">Selection</span>
                                                <span className="value">{titleCase(details.hospital_selection)}</span>
                                            </div>
                                            <div className="modal-field">
                                                <span className="label">Hospital</span>
                                                <span className="value">{valueOrNA(details.hospital_name)}</span>
                                            </div>
                                            <div className="modal-field">
                                                <span className="label">Manager</span>
                                                <span className="value">{valueOrNA(details.manager_name)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="modal-section">
                                        <h3 className="modal-section-title">Emergency Contact</h3>
                                        <div className="modal-grid">
                                            <div className="modal-field">
                                                <span className="label">Name</span>
                                                <span className="value">{valueOrNA(details.emergency_contact_name)}</span>
                                            </div>
                                            <div className="modal-field">
                                                <span className="label">Phone</span>
                                                <span className="value">{valueOrNA(details.emergency_contact_phone)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-section">
                                        <h3 className="modal-section-title">Personal Information (Step 2)</h3>
                                        <div className="modal-grid">
                                            <div className="modal-field">
                                                <span className="label">Marital Status</span>
                                                <span className="value">{titleCase(details.marital_status)}</span>
                                            </div>
                                            <div className="modal-field">
                                                <span className="label">Education Level</span>
                                                <span className="value">{valueOrNA(details.education_level)}</span>
                                            </div>
                                            <div className="modal-field">
                                                <span className="label">Professional Status</span>
                                                <span className="value">{titleCase(details.professional_status)}</span>
                                            </div>
                                            <div className="modal-field">
                                                <span className="label">Work Type</span>
                                                <span className="value">{valueOrNA(details.work_type)}</span>
                                            </div>
                                            <div className="modal-field">
                                                <span className="label">Mother Name</span>
                                                <span className="value">{valueOrNA(details.mother_name)}</span>
                                            </div>
                                            <div className="modal-field">
                                                <span className="label">Spouse Name</span>
                                                <span className="value">{valueOrNA(details.spouse_name)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-section">
                                        <h3 className="modal-section-title">Pledge Details</h3>
                                        <div className="modal-grid">
                                            <div className="modal-field">
                                                <span className="label">Pledged Organs</span>
                                                <span className="value">
                                                    {valueOrNA(details.pledged_organs_string) !== "N/A"
                                                        ? valueOrNA(details.pledged_organs_string)
                                                        : formatOrgansFromArray(details.pledged_organs)}
                                                </span>
                                            </div>
                                            <div className="modal-field">
                                                <span className="label">Hospital Selection</span>
                                                <span className="value">{titleCase(details.hospital_selection)}</span>
                                            </div>
                                            <div className="modal-field">
                                                <span className="label">Hospital</span>
                                                <span className="value">{valueOrNA(details.hospital_name)}</span>
                                            </div>
                                            <div className="modal-field">
                                                <span className="label">Status</span>
                                                <span className="value">{titleCase(details.status)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>

                <div className="modal-modern-footer">
                    <button type="button" className="btn-cancel" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

