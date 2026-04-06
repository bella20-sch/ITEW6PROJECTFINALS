import { useRef, useState, useEffect, useId } from 'react'
import { X } from 'lucide-react'

const EXIT_MS = 220

export default function Modal({ title, open, onClose, children, closeOnOverlayClick = true }) {
  const titleId = useId()
  const mouseDownTarget = useRef(null)
  const exitTimer = useRef(null)
  const [rendered, setRendered] = useState(open)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (open) {
      if (exitTimer.current) {
        clearTimeout(exitTimer.current)
        exitTimer.current = null
      }
      setRendered(true)
      setExiting(false)
      return
    }
    if (rendered) {
      setExiting(true)
      exitTimer.current = setTimeout(() => {
        setRendered(false)
        setExiting(false)
        exitTimer.current = null
      }, EXIT_MS)
    }
    return () => {
      if (exitTimer.current) {
        clearTimeout(exitTimer.current)
        exitTimer.current = null
      }
    }
  }, [open, rendered])

  if (!rendered) return null

  return (
    <div
      className={`modal-overlay${exiting ? ' modal-overlay--exiting' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={e => { mouseDownTarget.current = e.target }}
      onMouseUp={e => {
        if (mouseDownTarget.current === e.currentTarget && e.target === e.currentTarget && closeOnOverlayClick && !exiting) {
          onClose()
        }
        mouseDownTarget.current = null
      }}
    >
      <div
        className={`modal${exiting ? ' modal--exiting' : ''}`}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
