import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { BookOpen, Plus, Pencil, Trash2 } from 'lucide-react'
import Modal from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'

export default function Courses() {
  const { departments, crud } = useData()
  const { currentUser } = useAuth()
  const { showToast } = useToast()
  const isAdmin = currentUser?.role === 'Admin'
  const [modal, setModal] = useState({ open: false, mode: 'add', item: null })
  const [form, setForm] = useState({ courseCode: '', courseName: '', totalUnits: '', departmentID: '' })
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState({ open: false, type: null, item: null })

  const openAdd = () => {
    setForm({ courseCode: '', courseName: '', totalUnits: '', departmentID: departments[0]?.departmentID || 1 })
    setModal({ open: true, mode: 'add', item: null })
  }
  const openEdit = (c) => {
    setForm({ courseCode: c.courseCode, courseName: c.courseName, totalUnits: c.totalUnits, departmentID: c.departmentID })
    setModal({ open: true, mode: 'edit', item: c })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (modal.mode === 'edit') {
      setModal(m => ({ ...m, open: false }))
      setConfirm({ open: true, type: 'edit', item: modal.item })
      return
    }
    setBusy(true)
    const payload = { ...form, totalUnits: Number(form.totalUnits), departmentID: Number(form.departmentID) }
    try {
      await crud.courses.create(payload)
      setModal({ open: false })
    } catch (err) {
      showToast(err?.message || 'Failed to save.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleConfirmEdit = async () => {
    setConfirm({ open: false })
    setBusy(true)
    const payload = { ...form, totalUnits: Number(form.totalUnits), departmentID: Number(form.departmentID) }
    try {
      await crud.courses.update(confirm.item.courseID, payload)
      setModal({ open: false })
    } catch (err) {
      showToast(err?.message || 'Failed to update.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = (c) => setConfirm({ open: true, type: 'delete', item: c })

  const handleConfirmDelete = async () => {
    const id = confirm.item.courseID
    setConfirm({ open: false })
    try {
      await crud.courses.delete(id)
    } catch (err) {
      showToast(err?.message || 'Failed to delete.', 'error')
    }
  }

  const courses = crud.courses.getAll()

  return (
    <div className="page">
      <div className="page-header page-header-row">
        <h2>Courses</h2>
        <div className="page-header-actions">
          {isAdmin && <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Add Course</button>}
        </div>
      </div>

      <div className="course-list">
        {courses.map(c => {
          const depName = departments.find(d => d.departmentID === c.departmentID)?.departmentName || '-'
          return (
            <div key={c.courseID} className="course-row">
              <div className="course-icon"><BookOpen size={20} /></div>
              <div className="course-info">
                <div className="course-topline"><h3 className="course-name">{c.courseName}</h3></div>
                <div className="course-meta">
                  <span>{depName}</span><span className="course-dot">•</span><span>{c.totalUnits} units</span>
                </div>
              </div>
              <div className="course-right">
                <span className="course-code">{c.courseCode}</span>
                {isAdmin && <div className="course-actions">
                  <button className="btn-icon" onClick={() => openEdit(c)}><Pencil size={16} /></button>
                  <button className="btn-icon btn-danger" onClick={() => handleDelete(c)}><Trash2 size={16} /></button>
                </div>}
              </div>
            </div>
          )
        })}
      </div>
      {!courses.length && <div className="empty-state"><p>No courses yet.</p></div>}

      {isAdmin && (
        <Modal title={modal.mode === 'add' ? 'Add Course' : 'Edit Course'} open={modal.open} onClose={() => setModal({ open: false })}>
          <form onSubmit={handleSubmit} className="form">
            <label>Course Code</label>
            <input value={form.courseCode} onChange={e => setForm({ ...form, courseCode: e.target.value })} required />
            <label>Course Name</label>
            <input value={form.courseName} onChange={e => setForm({ ...form, courseName: e.target.value })} required />
            <label>Total Units</label>
            <input type="number" value={form.totalUnits} onChange={e => setForm({ ...form, totalUnits: e.target.value })} required />
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={() => setModal({ open: false })} disabled={busy}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmModal
        open={confirm.open && confirm.type === 'edit'}
        title="Confirm Edit"
        message={`Save changes to "${confirm.item?.courseCode}"?`}
        onConfirm={handleConfirmEdit}
        onCancel={() => { setConfirm({ open: false }); setModal(m => ({ ...m, open: true })) }}
      />
      <ConfirmModal
        open={confirm.open && confirm.type === 'delete'}
        title="Delete Course"
        message={`Are you sure you want to delete "${confirm.item?.courseCode} - ${confirm.item?.courseName}"?`}
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirm({ open: false })}
      />
    </div>
  )
}
