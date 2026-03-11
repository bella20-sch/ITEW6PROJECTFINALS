import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react'
import Modal from '../components/Modal'

export default function Departments() {
  const { crud } = useData()
  const [modal, setModal] = useState({ open: false, mode: 'add', item: null })
  const [form, setForm] = useState({ departmentName: '', officeLocation: '', contactNumber: '' })

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

  return (
    <div className="page">
      <div className="page-header page-header-row">
        <h2>Departments</h2>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Add Department
        </button>
      </div>

      <div className="card-grid">
        {deps.map(d => (
          <div key={d.departmentID} className="card-item">
            <div className="card-icon"><Building2 size={24} /></div>
            <div className="card-content">
              <h3>{d.departmentName}</h3>
              <p>{d.officeLocation}</p>
              <p className="muted">{d.contactNumber}</p>
            </div>
            <div className="card-actions">
              <button className="btn-icon" onClick={() => openEdit(d)}><Pencil size={16} /></button>
              <button className="btn-icon btn-danger" onClick={() => handleDelete(d.departmentID)}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

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
