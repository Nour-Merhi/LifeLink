import { IoClose } from "react-icons/io5";

export default function ConfirmDeleteModal({
    title = "Delete",
    description = "Are you sure you want to delete this item? This action cannot be undone.",
    confirmText = "Delete",
    cancelText = "Cancel",
    loading = false,
    error = "",
    onConfirm,
    onClose,
}) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container modal-modern" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                <div className="modal-modern-header">
                    <div className="modal-modern-title">
                        <h2>{title}</h2>
                        <div className="modal-modern-subtitle">
                            <span className="muted">{description}</span>
                        </div>
                    </div>
                    <button className="modal-icon-btn" onClick={onClose} aria-label="Close">
                        <IoClose />
                    </button>
                </div>

                <div className="modal-modern-body">
                    {error ? (
                        <div className="error-message modal-error-container">{error}</div>
                    ) : (
                        <div className="modal-note">{description}</div>
                    )}
                </div>

                <div className="modal-modern-footer" style={{ justifyContent: "space-between" }}>
                    <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        className="btn-save"
                        onClick={onConfirm}
                        disabled={loading}
                        style={{ background: "#F12C31" }}
                    >
                        {loading ? "Deleting..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

