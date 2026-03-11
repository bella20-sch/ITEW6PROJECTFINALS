import { useState } from 'react'
import { useData } from '../context/DataContext'
import { UserCircle, Plus, Pencil, Trash2 } from 'lucide-react'
import Modal from '../components/Modal'

export default function Faculty() {
  const { departments, crud } = useData()
  const [modal, setModal] = useState({ open: false, mode: 'add', item: null })
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
  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form, departmentID: Number(form.departmentID) }
    if (modal.mode === 'add') crud.faculty.create(payload)
    else crud.faculty.update(modal.item.facultyID, payload)
    setModal({ open: false })
  }
  const handleDelete = (id) => { if (confirm('Delete this faculty?')) crud.faculty.delete(id) }

  const faculty = crud.faculty.getAll()

  return (
    <div className="page">
      <div className="page-header page-header-row">
        <h2>Faculty</h2>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Add Faculty</button>
      </div>

      <div className="card-grid">
        {faculty.map(f => (
          <div key={f.facultyID} className="card-item">
            <div className="card-icon"><UserCircle size={24} /></div>
            <div className="card-content">
              <h3>{f.firstName} {f.lastName}</h3>
              <p>{f.position} • {f.employmentStatus}</p>
              <p className="muted">{departments.find(d => d.departmentID === f.departmentID)?.departmentName}</p>
            </div>
            <div className="card-actions">
              <button className="btn-icon" onClick={() => openEdit(f)}><Pencil size={16} /></button>
              <button className="btn-icon btn-danger" onClick={() => handleDelete(f.facultyID)}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      <Modal title={modal.mode === 'add' ? 'Add Faculty' : 'Edit Faculty'} open={modal.open} onClose={() => setModal({ open: false })}>
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
            <button type="button" className="btn btn-outline" onClick={() => setModal({ open: false })}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
