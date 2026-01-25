import ConfirmDeleteDialog from "../../common/ConfirmDeleteDialog";

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
        <ConfirmDeleteDialog
            title={title}
            description={description}
            confirmText={confirmText}
            cancelText={cancelText}
            loading={loading}
            error={error}
            onConfirm={onConfirm}
            onClose={onClose}
        />
    );
}

