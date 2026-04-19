import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Building2, Plus, Pencil, Trash2, Search } from 'lucide-react'
import Modal from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'
import DirectoryFetchBarrier from '../components/DirectoryFetchBarrier'

export default function Departments() {
  const { crud } = useData()
  const { currentUser } = useAuth()
  const { showToast } = useToast()
  const isAdmin = currentUser?.role === 'Admin'
  const [modal, setModal] = useState({ open: false, mode: 'add', item: null })
  const [form, setForm] = useState({ departmentName: '', officeLocation: '', contactNumber: '' })
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState({ open: false, type: null, item: null })

  const openAdd = () => {
    setForm({ departmentName: '', officeLocation: '', contactNumber: '' })
    setModal({ open: true, mode: 'add', item: null })
  }
  const openEdit = (d) => {
    setForm({ departmentName: d.departmentName, officeLocation: d.officeLocation, contactNumber: d.contactNumber || '' })
    setModal({ open: true, mode: 'edit', item: d })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (modal.mode === 'edit') {
      setModal(m => ({ ...m, open: false }))
      setConfirm({ open: true, type: 'edit', item: modal.item })
      return
    }
    setBusy(true)
    try {
      await crud.departments.create(form)
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
    try {
      await crud.departments.update(confirm.item.departmentID, form)
      setModal({ open: false })
    } catch (err) {
      showToast(err?.message || 'Failed to update.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = (d) => setConfirm({ open: true, type: 'delete', item: d })

  const handleConfirmDelete = async () => {
    const id = confirm.item.departmentID
    setConfirm({ open: false })
    try {
      await crud.departments.delete(id)
    } catch (err) {
      showToast(err?.message || 'Failed to delete.', 'error')
    }
  }

  const deps = crud.departments.getAll()
  const query = search.trim().toLowerCase()
  const filtered = query
    ? deps.filter(d => `${d.departmentName} ${d.officeLocation} ${d.contactNumber || ''}`.toLowerCase().includes(query))
    : deps

  return (
    <DirectoryFetchBarrier>
    <div className="page">
      <div className="page-header">
        <h2>Departments</h2>
        <div className="page-header-actions">
          <div className="search-box">
            <Search size={18} />
            <input type="search" placeholder="Search departments..." value={search}
              onChange={e => setSearch(e.target.value)} className="search-input" />
          </div>
          {isAdmin && <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Add Department</button>}
        </div>
      </div>

      <div className="dept-list">
        {filtered.map(d => (
          <div key={d.departmentID} className="dept-row">
            <div className="dept-icon"><Building2 size={20} /></div>
            <div className="dept-info">
              <div className="dept-topline"><h3 className="dept-name">{d.departmentName}</h3></div>
              <div className="dept-meta">
                <span>{d.officeLocation}</span>
                {d.contactNumber && <><span className="dept-dot">•</span><span className="muted">{d.contactNumber}</span></>}
              </div>
            </div>
            <div className="dept-right">
              {isAdmin && <div className="dept-actions">
                <button className="btn-icon" onClick={() => openEdit(d)}><Pencil size={16} /></button>
                <button className="btn-icon btn-danger" onClick={() => handleDelete(d)}><Trash2 size={16} /></button>
              </div>}
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <div className="empty-state"><p>No departments match your search.</p></div>}

      {isAdmin && (
        <Modal title={modal.mode === 'add' ? 'Add Department' : 'Edit Department'} open={modal.open} onClose={() => setModal({ open: false })}>
          <form onSubmit={handleSubmit} className="form">
            <label>Department Name</label>
            <input value={form.departmentName} onChange={e => setForm({ ...form, departmentName: e.target.value })} required />
            <label>Office Location</label>
            <input value={form.officeLocation} onChange={e => setForm({ ...form, officeLocation: e.target.value })} required />
            <label>Contact Number</label>
            <input value={form.contactNumber} onChange={e => setForm({ ...form, contactNumber: e.target.value })} />
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
        message={`Save changes to "${confirm.item?.departmentName}"?`}
        onConfirm={handleConfirmEdit}
        onCancel={() => { setConfirm({ open: false }); setModal(m => ({ ...m, open: true })) }}
      />
      <ConfirmModal
        open={confirm.open && confirm.type === 'delete'}
        title="Delete Department"
        message={`Are you sure you want to delete "${confirm.item?.departmentName}"? This cannot be undone.`}
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirm({ open: false })}
      />
    </div>
    </DirectoryFetchBarrier>
  )
}
