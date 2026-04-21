import Modal from './Modal'

export default function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  danger = false,
  confirmLabel,
}) {
  const primaryLabel = danger ? 'Delete' : confirmLabel || 'Confirm'
  return (
    <Modal title={title || 'Confirm'} open={open} onClose={onCancel}>
      <p className="confirm-modal-message">{message}</p>
      <div className="form-actions">
        <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
          {primaryLabel}
        </button>
      </div>
    </Modal>
  )
}
