import { IoClose } from "react-icons/io5";
import { RiDeleteBin6Line } from "react-icons/ri";
import { SpinnerDotted } from "spinners-react";

export default function ConfirmDeleteDialog({
    title = "Delete",
    description = "Are you sure you want to delete this item? This action cannot be undone.",
    details,
    confirmText = "Yes, Delete",
    cancelText = "No, Keep It",
    loading = false,
    error = "",
    onConfirm,
    onClose,
}) {
    return (
        <div className="modal-overlay modal-overlay-delete" onClick={() => !loading && onClose?.()}>
            <div
                className="modal-container modal-modern"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                style={{ maxWidth: 460 }}
            >
                <div style={{ position: "relative", padding: "18px 20px 0 20px" }}>
                    <button
                        className="modal-icon-btn"
                        onClick={() => !loading && onClose?.()}
                        aria-label="Close"
                        disabled={loading}
                        style={{ position: "absolute", right: 16, top: 16 }}
                    >
                        <IoClose />
                    </button>
                </div>

                <div className="modal-modern-body" style={{ paddingTop: 10, textAlign: "center" }}>
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            margin: "0 auto 14px auto",
                            borderRadius: 9999,
                            background: "rgba(241, 44, 49, 0.10)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#F12C31",
                        }}
                    >
                        <RiDeleteBin6Line size={22} />
                    </div>

                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#111827" }}>{title}</h2>
                    <p style={{ margin: "10px auto 0 auto", maxWidth: 360, color: "#6B6B6B", fontSize: 14 }}>
                        {description}
                    </p>
                    {details ? (
                        <p style={{ marginTop: 10, color: "#111827", fontSize: 13 }}>
                            <strong>{details}</strong>
                        </p>
                    ) : null}

                    {error ? (
                        <div className="error-message modal-error-container" style={{ marginTop: 14, textAlign: "left" }}>
                            {error}
                        </div>
                    ) : null}
                </div>

                <div className="modal-modern-footer" style={{ justifyContent: "center" }}>
                    <button type="button" className="btn-cancel" onClick={() => !loading && onClose?.()} disabled={loading}>
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        className="submit-btn"
                        onClick={() => !loading && onConfirm?.()}
                        disabled={loading}
                        style={{ background: "#F12C31" }}
                    >
                        {loading ? (
                            <span style={{ display: "inline-flex", alignItems: "center" }}>
                                <SpinnerDotted
                                    size={18}
                                    thickness={120}
                                    speed={100}
                                    color="#fff"
                                    className="spinner-inline"
                                />
                                Deleting...
                            </span>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

