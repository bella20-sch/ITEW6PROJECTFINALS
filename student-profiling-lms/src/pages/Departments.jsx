import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Building2, Plus, Pencil, Trash2, Search } from 'lucide-react'
import Modal from '../components/Modal'

export default function Departments() {
  const { crud } = useData()
  const [modal, setModal] = useState({ open: false, mode: 'add', item: null })
  const [form, setForm] = useState({ departmentName: '', officeLocation: '', contactNumber: '' })
  const [search, setSearch] = useState('')

  const openAdd = () => {
    setForm({ departmentName: '', officeLocation: '', contactNumber: '' })
    setModal({ open: true, mode: 'add', item: null })
  }
  const openEdit = (d) => {
    setForm({ departmentName: d.departmentName, officeLocation: d.officeLocation, contactNumber: d.contactNumber || '' })
    setModal({ open: true, mode: 'edit', item: d })
  }
  const handleSubmit = (e) => {
    e.preventDefault()
    if (modal.mode === 'add') crud.departments.create(form)
    else crud.departments.update(modal.item.departmentID, form)
    setModal({ open: false })
  }
  const handleDelete = (id) => { if (confirm('Delete this department?')) crud.departments.delete(id) }

  const deps = crud.departments.getAll()
  const query = search.trim().toLowerCase()
  const filtered = query
    ? deps.filter(d => {
        const hay = `${d.departmentName} ${d.officeLocation} ${d.contactNumber || ''}`.toLowerCase()
        return hay.includes(query)
      })
    : deps

  return (
    <div className="page">
      <div className="page-header">
        <h2>Departments</h2>
        <div className="page-header-actions">
          <div className="search-box">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search departments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={18} /> Add Department
          </button>
        </div>
      </div>

      <div className="dept-list">
        {filtered.map(d => (
          <div key={d.departmentID} className="dept-row">
            <div className="dept-icon" aria-hidden="true">
              <Building2 size={20} />
            </div>
            <div className="dept-info">
              <div className="dept-topline">
                <h3 className="dept-name">{d.departmentName}</h3>
              </div>
              <div className="dept-meta">
                <span>{d.officeLocation}</span>
                {d.contactNumber ? (
                  <>
                    <span className="dept-dot" aria-hidden="true">•</span>
                    <span className="muted">{d.contactNumber}</span>
                  </>
                ) : null}
              </div>
            </div>
            <div className="dept-right">
              <div className="dept-actions">
                <button className="btn-icon" onClick={() => openEdit(d)} aria-label={`Edit ${d.departmentName}`}>
                  <Pencil size={16} />
                </button>
                <button className="btn-icon btn-danger" onClick={() => handleDelete(d.departmentID)} aria-label={`Delete ${d.departmentName}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <p>No departments match your search.</p>
        </div>
      )}

      <Modal title={modal.mode === 'add' ? 'Add Department' : 'Edit Department'} open={modal.open} onClose={() => setModal({ open: false })}>
        <form onSubmit={handleSubmit} className="form">
          <label>Department Name</label>
          <input value={form.departmentName} onChange={e => setForm({ ...form, departmentName: e.target.value })} required />
          <label>Office Location</label>
          <input value={form.officeLocation} onChange={e => setForm({ ...form, officeLocation: e.target.value })} required />
          <label>Contact Number</label>
          <input type="text" value={form.contactNumber} onChange={e => setForm({ ...form, contactNumber: e.target.value })} />
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => setModal({ open: false })}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
