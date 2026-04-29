import { useState, useRef, useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useLmsBase, lmsPath } from '../lib/lmsPaths'
import { UserCircle, Plus, Pencil, Trash2, Search, Building2, Sparkles, Briefcase } from 'lucide-react'
import Modal from '../components/Modal'
import ReqStar from '../components/ReqStar'
import FilterDropdown from '../components/FilterDropdown'
import ConfirmModal from '../components/ConfirmModal'
import FacultyMyProfile from './FacultyMyProfile'
import DirectoryFetchBarrier from '../components/DirectoryFetchBarrier'

export default function Faculty() {
  const { id: routeFacultyId } = useParams()
  const base = useLmsBase()
  const { departments, crud } = useData()
  const { currentUser } = useAuth()
  const { showToast } = useToast()
  const isAdmin = currentUser?.role === 'Admin'
  const isFacultyUser = currentUser?.role === 'Faculty'
  const photoRef = useRef(null)
  const myFacultyId = Number(currentUser?.id)

  const [modal, setModal] = useState({ open: false, mode: 'add', item: null })
  const [statusFilter, setStatusFilter] = useState('')
  const [sortOrder, setSortOrder] = useState('az')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageInput, setPageInput] = useState('1')
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState({ open: false, type: null, item: null })
  const [form, setForm] = useState({
    firstName: '', middleName: '', lastName: '', departmentID: '', position: '', employmentStatus: 'Full-time',
    hireDate: '', email: '', contactNumber: '', officeLocation: '', photo: '',
  })

  const emptyForm = () => ({
    firstName: '', middleName: '', lastName: '', departmentID: departments[0]?.departmentID || 1,
    position: '', employmentStatus: 'Full-time', hireDate: '', email: '',
    contactNumber: '', officeLocation: '', photo: '',
  })

  const openAdd = () => { setForm(emptyForm()); setModal({ open: true, mode: 'add', item: null }) }
  const openEdit = (f) => {
    setForm({
      firstName: f.firstName, middleName: f.middleName || '', lastName: f.lastName,
      departmentID: f.departmentID || departments[0]?.departmentID || 1,
      position: f.position, employmentStatus: f.employmentStatus,
      hireDate: f.hireDate?.slice(0, 10) || '', email: f.email,
      contactNumber: f.contactNumber || '', officeLocation: f.officeLocation || '',
      photo: f.photo || '',
    })
    setModal({ open: true, mode: 'edit', item: f })
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { showToast('Photo must be under 2MB.', 'error'); return }
    const reader = new FileReader()
    reader.onload = (ev) => setForm(prev => ({ ...prev, photo: ev.target.result }))
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (modal.mode === 'edit') {
      setModal(m => ({ ...m, open: false }))
      setConfirm({ open: true, type: 'edit', item: modal.item })
      return
    }
    setBusy(true)
    const payload = { ...form, departmentID: Number(form.departmentID) }
    try {
      await crud.faculty.create(payload)
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
    const payload = { ...form, departmentID: Number(form.departmentID) }
    try {
      await crud.faculty.update(confirm.item.facultyID, payload)
      setModal({ open: false })
    } catch (err) {
      showToast(err?.message || 'Failed to update.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = (f) => setConfirm({ open: true, type: 'delete', item: f })
  const handleConfirmDelete = async () => {
    const id = confirm.item.facultyID
    setConfirm({ open: false })
    try { await crud.faculty.delete(id) }
    catch (err) { showToast(err?.message || 'Failed to delete.', 'error') }
  }

  const faculty = crud.faculty.getAll()
  const statuses = ['Full-time', 'Part-time', 'Contract']

  const fullTimeCount = faculty.filter((f) => f.employmentStatus === 'Full-time').length

  const filtered = faculty
    .filter(f => {
      if (statusFilter && f.employmentStatus !== statusFilter) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const name = `${f.firstName} ${f.middleName || ''} ${f.lastName}`.toLowerCase()
        return name.includes(q) || f.email?.toLowerCase().includes(q) || f.position?.toLowerCase().includes(q)
      }
      return true
    })
    .sort((a, b) => {
      const nameA = `${a.lastName} ${a.firstName}`.toLowerCase()
      const nameB = `${b.lastName} ${b.firstName}`.toLowerCase()
      return sortOrder === 'az' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('')
    setSortOrder('az')
    setPage(1)
  }

  const PAGE_SIZE = 20
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search, sortOrder, statusFilter])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  useEffect(() => {
    setPageInput(String(currentPage))
  }, [currentPage])

  if (isFacultyUser) {
    if (!Number.isFinite(myFacultyId)) {
      return (
        <div className="page">
          <p className="muted">Your account is missing a faculty ID. Please contact MIS.</p>
        </div>
      )
    }
    if (routeFacultyId == null || routeFacultyId === '') {
      return <Navigate to={lmsPath(base, `/faculty/${myFacultyId}`)} replace />
    }
    if (Number(routeFacultyId) !== myFacultyId) {
      return <Navigate to={lmsPath(base, `/faculty/${myFacultyId}`)} replace />
    }
    return <FacultyMyProfile />
  }

  return (
    <DirectoryFetchBarrier>
    <div className="page">
      <header className="faculty-hero" aria-labelledby="faculty-hero-title">
        <div className="faculty-hero-glow" aria-hidden="true" />
        <div className="faculty-hero-grid" aria-hidden="true" />
        <div className="faculty-hero-inner">
          <div className="faculty-hero-copy">
            <div className="faculty-hero-badge">
              <span className="faculty-hero-badge-icon">
                <UserCircle size={18} strokeWidth={2.25} aria-hidden />
              </span>
              <span className="faculty-hero-badge-text">CCS · Faculty directory</span>
            </div>
            <h2 id="faculty-hero-title" className="faculty-hero-title">
              Teaching & staff roster
            </h2>
            <p className="faculty-hero-sub">
              CCS instructors and staff — roles, departments, contacts, and employment status. Admins can add or update records.
            </p>
            <ul className="faculty-hero-tags">
              <li><Sparkles size={12} strokeWidth={2} aria-hidden /> {faculty.length} faculty</li>
              <li><Building2 size={12} strokeWidth={2} aria-hidden /> {departments.length} departments</li>
              <li><Briefcase size={12} strokeWidth={2} aria-hidden /> {fullTimeCount} full-time</li>
            </ul>
          </div>
          <div className="faculty-hero-visual" aria-hidden="true">
            <div className="faculty-hero-orbit">
              <span className="faculty-hero-orbit-ring" />
              <span className="faculty-hero-orbit-dot faculty-hero-orbit-dot--a" />
              <span className="faculty-hero-orbit-dot faculty-hero-orbit-dot--b" />
              <span className="faculty-hero-orbit-center">
                <UserCircle size={28} strokeWidth={1.85} />
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="students-page-header">
        {isAdmin && (
          <div className="students-page-title-row students-page-title-row--faculty-toolbar">
            <button type="button" className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Add Faculty</button>
          </div>
        )}
        <div className="students-search-row">
          <div className="search-box" style={{ flex: 1 }}>
            <Search size={18} />
            <input
              type="search"
              placeholder="Search by name, email, or position..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <div className="students-filter-row">
          <FilterDropdown
            ariaLabel="Filter by employment status"
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Statuses"
            options={[{ value: '', label: 'All Statuses' }, ...statuses.map(s => ({ value: s, label: s }))]}
          />
          <FilterDropdown
            ariaLabel="Sort order"
            value={sortOrder}
            onChange={setSortOrder}
            placeholder="Sort"
            options={[
              { value: 'az', label: 'A → Z (Last Name)' },
              { value: 'za', label: 'Z → A (Last Name)' },
            ]}
          />
          <button type="button" className="btn btn-outline" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
        <div className="students-results-meta" aria-live="polite">
          Showing <strong>{filtered.length}</strong> result{filtered.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="faculty-list" role="region" aria-labelledby="faculty-hero-title">
        {pageRows.map(f => (
          <div key={f.facultyID} className="faculty-row">
            <div className="faculty-icon" style={{ overflow: 'hidden' }}>
              {f.photo
                ? <img src={f.photo} alt={f.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : <UserCircle size={20} />
              }
            </div>
            <div className="faculty-info">
              <div className="faculty-topline">
                <h3 className="faculty-name">{f.lastName}, {f.firstName} {f.middleName || ''}</h3>
              </div>
              <div className="faculty-meta">
                <span>{f.position}</span>
                <span className="faculty-dot">•</span>
                <span className="muted">CCS</span>
                {f.email && <><span className="faculty-dot">•</span><span className="muted">{f.email}</span></>}
              </div>
            </div>
            <div className="faculty-right">
              <span className="faculty-status">{f.employmentStatus}</span>
              {isAdmin && <div className="faculty-actions">
                <button className="btn-icon" onClick={() => openEdit(f)}><Pencil size={16} /></button>
                <button className="btn-icon btn-danger" onClick={() => handleDelete(f)}><Trash2 size={16} /></button>
              </div>}
            </div>
          </div>
        ))}
      </div>
      {!filtered.length && <div className="empty-state"><p>No faculty match your filters.</p></div>}
      {filtered.length > 0 && (
        <div className="students-pagination">
          <button
            type="button"
            className="btn btn-outline"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="students-pagination-meta">
            Page {currentPage} of {totalPages}
          </span>
          <div className="students-pagination-jump">
            <label htmlFor="faculty-page-jump" className="students-pagination-jump-label">
              Go to
            </label>
            <input
              id="faculty-page-jump"
              type="number"
              min={1}
              max={totalPages}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={() => {
                const parsed = Number.parseInt(pageInput, 10)
                const nextPage = Number.isFinite(parsed) ? Math.min(totalPages, Math.max(1, parsed)) : currentPage
                setPage(nextPage)
              }}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                const parsed = Number.parseInt(pageInput, 10)
                const nextPage = Number.isFinite(parsed) ? Math.min(totalPages, Math.max(1, parsed)) : currentPage
                setPage(nextPage)
              }}
              className="students-pagination-input"
              aria-label="Go to faculty page number"
            />
          </div>
          <button
            type="button"
            className="btn btn-outline"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}

      {isAdmin && (
        <Modal
          title={modal.mode === 'add' ? 'Add Faculty' : 'Edit Faculty'}
          open={modal.open}
          onClose={() => setModal({ open: false })}
          modalClassName="modal--faculty"
        >
          <form onSubmit={handleSubmit} className="form faculty-form-layout">

            {/* Photo */}
            <div className="form-section">
              <h4>Photo</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                  background: 'linear-gradient(135deg, #fb923c, #f97316)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid #e5e7eb',
                }}>
                  {form.photo
                    ? <img src={form.photo} alt="Faculty" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ color: 'white', fontWeight: 700, fontSize: '1.25rem' }}>
                        {form.firstName?.[0] || '?'}{form.lastName?.[0] || ''}
                      </span>
                  }
                </div>
                <div>
                  <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                  <button type="button" className="btn btn-outline" onClick={() => photoRef.current?.click()}>
                    {form.photo ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  {form.photo && (
                    <button type="button" className="btn btn-danger" style={{ marginLeft: 8 }}
                      onClick={() => setForm(p => ({ ...p, photo: '' }))}>Remove</button>
                  )}
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 6 }}>JPG, PNG · Max 2MB</p>
                </div>
              </div>
            </div>

            <div>
              <label>First Name <ReqStar /></label>
              <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
            </div>
            <div>
              <label>Middle Name</label>
              <input value={form.middleName} onChange={e => setForm({ ...form, middleName: e.target.value })} />
            </div>
            <div>
              <label>Last Name <ReqStar /></label>
              <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required />
            </div>
            <div className="form-row-2">
              <div>
                <label>Position <ReqStar /></label>
                <input
                  value={form.position}
                  onChange={e => setForm({ ...form, position: e.target.value })}
                  required
                  placeholder="e.g. Professor, Instructor"
                />
              </div>
              <div>
                <label>Employment Status</label>
                <select value={form.employmentStatus} onChange={e => setForm({ ...form, employmentStatus: e.target.value })}>
                  <option>Full-time</option><option>Part-time</option><option>Contract</option>
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div>
                <label>Hire Date</label>
                <input type="date" value={form.hireDate} onChange={e => setForm({ ...form, hireDate: e.target.value })} />
              </div>
              <div>
                <label>Email <ReqStar /></label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>

            <div className="form-row-contact-office">
              <div>
                <label>Contact Number</label>
                <input
                  type="tel"
                  value={form.contactNumber}
                  onChange={e => setForm({ ...form, contactNumber: e.target.value })}
                  placeholder="09XXXXXXXXX"
                  pattern="^(09\d{9}|\+63\d{10})$"
                  title="Enter 11-digit number or +63 format"
                />
              </div>
              <div>
                <label>Office Location</label>
                <input value={form.officeLocation} onChange={e => setForm({ ...form, officeLocation: e.target.value })} placeholder="e.g. Room 201, CCS Building" />
              </div>
            </div>

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
        message={`Save changes to ${confirm.item?.firstName} ${confirm.item?.lastName}?`}
        onConfirm={handleConfirmEdit}
        onCancel={() => { setConfirm({ open: false }); setModal(m => ({ ...m, open: true })) }}
      />
      <ConfirmModal
        open={confirm.open && confirm.type === 'delete'}
        title="Delete Faculty"
        message={`Are you sure you want to delete ${confirm.item?.firstName} ${confirm.item?.lastName}?`}
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirm({ open: false })}
      />
    </div>
    </DirectoryFetchBarrier>
  )
}
