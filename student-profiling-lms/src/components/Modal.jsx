import { useRef } from 'react'
import { X } from 'lucide-react'

export default function Modal({ title, open, onClose, children, closeOnOverlayClick = true }) {
  const mouseDownTarget = useRef(null)

  if (!open) return null
  return (
    <div
      className="modal-overlay"
      onMouseDown={e => { mouseDownTarget.current = e.target }}
      onMouseUp={e => {
        if (mouseDownTarget.current === e.currentTarget && e.target === e.currentTarget && closeOnOverlayClick) {
          onClose()
        }
        mouseDownTarget.current = null
      }}
    >
      <div className="modal" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
