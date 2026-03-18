import { useState } from 'react'
import { useData } from '../context/DataContext'
import { BookOpen, Plus, Pencil, Trash2 } from 'lucide-react'
import Modal from '../components/Modal'
import FilterDropdown from '../components/FilterDropdown'

export default function Courses() {
  const { departments, crud } = useData()
  const [modal, setModal] = useState({ open: false, mode: 'add', item: null })
  const [form, setForm] = useState({ courseCode: '', courseName: '', totalUnits: '', departmentID: '' })
  const [departmentFilter, setDepartmentFilter] = useState('')

  const openAdd = () => {
    setForm({ courseCode: '', courseName: '', totalUnits: '', departmentID: departments[0]?.departmentID || '' })
    setModal({ open: true, mode: 'add', item: null })
  }
  const openEdit = (c) => {
    setForm({ courseCode: c.courseCode, courseName: c.courseName, totalUnits: c.totalUnits, departmentID: c.departmentID })
    setModal({ open: true, mode: 'edit', item: c })
  }
  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form, totalUnits: Number(form.totalUnits), departmentID: Number(form.departmentID) }
    if (modal.mode === 'add') crud.courses.create(payload)
    else crud.courses.update(modal.item.courseID, payload)
    setModal({ open: false })
  }
  const handleDelete = (id) => { if (confirm('Delete this course?')) crud.courses.delete(id) }

  const courses = crud.courses.getAll()
  const filtered = departmentFilter ? courses.filter(c => String(c.departmentID) === departmentFilter) : courses

  return (
    <div className="page">
      <div className="page-header page-header-row">
        <h2>Courses</h2>
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
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={18} /> Add Course
          </button>
        </div>
      </div>

      <div className="course-list">
        {filtered.map(c => {
          const depName = departments.find(d => d.departmentID === c.departmentID)?.departmentName || '-'
          return (
            <div key={c.courseID} className="course-row">
              <div className="course-icon" aria-hidden="true">
                <BookOpen size={20} />
              </div>
              <div className="course-info">
                <div className="course-topline">
                  <h3 className="course-name">{c.courseName}</h3>
                </div>
                <div className="course-meta">
                  <span>{depName}</span>
                  <span className="course-dot" aria-hidden="true">•</span>
                  <span>{c.totalUnits} units</span>
                </div>
              </div>
              <div className="course-right">
                <span className="course-code">{c.courseCode}</span>
                <div className="course-actions">
                  <button className="btn-icon" onClick={() => openEdit(c)} aria-label={`Edit ${c.courseCode}`}>
                    <Pencil size={16} />
                  </button>
                  <button className="btn-icon btn-danger" onClick={() => handleDelete(c.courseID)} aria-label={`Delete ${c.courseCode}`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {!filtered.length && (
        <div className="empty-state">
          <p>No courses match your filter.</p>
        </div>
      )}

      <Modal title={modal.mode === 'add' ? 'Add Course' : 'Edit Course'} open={modal.open} onClose={() => setModal({ open: false })}>
        <form onSubmit={handleSubmit} className="form">
          <label>Course Code</label>
          <input value={form.courseCode} onChange={e => setForm({ ...form, courseCode: e.target.value })} required />
          <label>Course Name</label>
          <input value={form.courseName} onChange={e => setForm({ ...form, courseName: e.target.value })} required />
          <label>Total Units</label>
          <input type="number" value={form.totalUnits} onChange={e => setForm({ ...form, totalUnits: e.target.value })} required />
          <label>Department</label>
          <select value={form.departmentID} onChange={e => setForm({ ...form, departmentID: e.target.value })} required>
            {departments.map(d => <option key={d.departmentID} value={d.departmentID}>{d.departmentName}</option>)}
          </select>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => setModal({ open: false })}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
