import Modal from './Modal'

export default function ConfirmModal({ open, title, message, onConfirm, onCancel, danger = false }) {
  if (!open) return null
  return (
    <Modal title={title || 'Confirm'} open={open} onClose={onCancel}>
      <p style={{ marginBottom: '1.5rem', color: '#374151' }}>{message}</p>
      <div className="form-actions">
        <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
          {danger ? 'Delete' : 'Confirm'}
        </button>
      </div>
    </Modal>
  )
}
