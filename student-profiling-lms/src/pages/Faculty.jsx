import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { UserCircle, Plus, Pencil, Trash2 } from 'lucide-react'
import Modal from '../components/Modal'
import FilterDropdown from '../components/FilterDropdown'

export default function Faculty() {
  const { departments, crud } = useData()
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'Admin'
  const [modal, setModal] = useState({ open: false, mode: 'add', item: null })
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [busy, setBusy] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [form, setForm] = useState({
    firstName: '', lastName: '', departmentID: '', position: '', employmentStatus: 'Full-time',
    hireDate: '', email: '', contactNumber: '', officeLocation: '',
  })

  const emptyForm = () => ({
    firstName: '', lastName: '', departmentID: departments[0]?.departmentID || '', position: '', employmentStatus: 'Full-time',
    hireDate: '', email: '', contactNumber: '', officeLocation: '',
  })

  const openAdd = () => { setForm(emptyForm()); setModal({ open: true, mode: 'add', item: null }) }
  const openEdit = (f) => {
    setForm({
      firstName: f.firstName, lastName: f.lastName, departmentID: f.departmentID, position: f.position,
      employmentStatus: f.employmentStatus, hireDate: f.hireDate?.slice(0, 10) || '', email: f.email,
      contactNumber: f.contactNumber || '', officeLocation: f.officeLocation || '',
    })
    setModal({ open: true, mode: 'edit', item: f })
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    const payload = { ...form, departmentID: Number(form.departmentID) }
    try {
      if (modal.mode === 'add') await crud.faculty.create(payload)
      else await crud.faculty.update(modal.item.facultyID, payload)
      setModal({ open: false })
    } finally {
      setBusy(false)
    }
  }
  const handleDelete = async (id) => {
    if (!confirm('Delete this faculty?')) return
    setDeletingId(id)
    try {
      await crud.faculty.delete(id)
    } finally {
      setDeletingId(null)
    }
  }

  const faculty = crud.faculty.getAll()
  const statuses = Array.from(new Set(faculty.map(f => f.employmentStatus).filter(Boolean))).sort((a, b) => a.localeCompare(b))
  const filtered = faculty.filter(f => {
    const matchesDept = !departmentFilter || String(f.departmentID) === departmentFilter
    const matchesStatus = !statusFilter || f.employmentStatus === statusFilter
    return matchesDept && matchesStatus
  })

  return (
    <div className="page">
      <div className="page-header page-header-row">
        <h2>Faculty</h2>
        <div className="page-header-actions">
          <FilterDropdown
            ariaLabel="Filter by department"
            value={departmentFilter}
            onChange={setDepartmentFilter}
            placeholder="All Departments"
            options={[
              { value: '', label: 'All Departments' },
              ...departments.map(d => ({ value: String(d.departmentID), label: d.departmentName })),
            ]}
          />
          <FilterDropdown
            ariaLabel="Filter by employment status"
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Statuses"
            options={[
              { value: '', label: 'All Statuses' },
              ...statuses.map(s => ({ value: s, label: s })),
            ]}
          />
          {isAdmin && <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Add Faculty</button>}
        </div>
      </div>

      <div className="faculty-list">
        {filtered.map(f => {
          const depName = departments.find(d => d.departmentID === f.departmentID)?.departmentName || '-'
          return (
            <div key={f.facultyID} className="faculty-row">
              <div className="faculty-icon" aria-hidden="true">
                <UserCircle size={20} />
              </div>
              <div className="faculty-info">
                <div className="faculty-topline">
                  <h3 className="faculty-name">{f.firstName} {f.lastName}</h3>
                </div>
                <div className="faculty-meta">
                  <span>{f.position}</span>
                  <span className="faculty-dot" aria-hidden="true">•</span>
                  <span className="muted">{depName}</span>
                </div>
              </div>
              <div className="faculty-right">
                <span className="faculty-status">{f.employmentStatus}</span>
                {isAdmin && <div className="faculty-actions">
                  <button className="btn-icon" onClick={() => openEdit(f)} aria-label={`Edit ${f.firstName} ${f.lastName}`}>
                    <Pencil size={16} />
                  </button>
                  <button className="btn-icon btn-danger" onClick={() => handleDelete(f.facultyID)} aria-label={`Delete ${f.firstName} ${f.lastName}`} disabled={deletingId === f.facultyID}>
                    <Trash2 size={16} />
                  </button>
                </div>}
              </div>
            </div>
          )
        })}
      </div>

      {!filtered.length && (
        <div className="empty-state">
          <p>No faculty match your filters.</p>
        </div>
      )}

      {isAdmin && <Modal title={modal.mode === 'add' ? 'Add Faculty' : 'Edit Faculty'} open={modal.open} onClose={() => setModal({ open: false })}>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-row">
            <div><label>First Name</label><input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required /></div>
            <div><label>Last Name</label><input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required /></div>
          </div>
          <label>Department</label>
          <select value={form.departmentID} onChange={e => setForm({ ...form, departmentID: e.target.value })} required>
            {departments.map(d => <option key={d.departmentID} value={d.departmentID}>{d.departmentName}</option>)}
          </select>
          <label>Position</label>
          <input value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} required />
          <label>Employment Status</label>
          <select value={form.employmentStatus} onChange={e => setForm({ ...form, employmentStatus: e.target.value })}>
            <option>Full-time</option><option>Part-time</option><option>Contract</option>
          </select>
          <label>Hire Date</label>
          <input type="date" value={form.hireDate} onChange={e => setForm({ ...form, hireDate: e.target.value })} />
          <label>Email</label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <label>Contact Number</label>
          <input type="number" value={form.contactNumber} onChange={e => setForm({ ...form, contactNumber: e.target.value })} />
          <label>Office Location</label>
          <input value={form.officeLocation} onChange={e => setForm({ ...form, officeLocation: e.target.value })} />
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => setModal({ open: false })} disabled={busy}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </Modal>}
    </div>
  )
}
