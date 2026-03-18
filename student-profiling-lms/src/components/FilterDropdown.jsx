import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function FilterDropdown({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  ariaLabel,
}) {
  const id = useId()
  const buttonId = `filter-dd-btn-${id}`
  const listboxId = `filter-dd-list-${id}`
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)

  const selected = useMemo(() => options.find(o => o.value === value) || null, [options, value])

  useEffect(() => {
    if (!open) return
    const onDocDown = (e) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDocDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onDocDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="filter-dd" ref={rootRef}>
      <button
        type="button"
        id={buttonId}
        className="filter-dd-btn"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen(o => !o)}
      >
        <span className={`filter-dd-label ${selected ? '' : 'is-placeholder'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={18} className={`filter-dd-icon ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <div className="filter-dd-popover" role="presentation">
          <div
            id={listboxId}
            role="listbox"
            aria-labelledby={buttonId}
            className="filter-dd-list"
          >
            {options.map((o) => {
              const isSelected = o.value === value
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`filter-dd-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                >
                  {o.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

