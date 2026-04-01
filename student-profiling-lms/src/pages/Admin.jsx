import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'
import { useData } from '../context/DataContext'

const defaultStudent = {
  type: 'student',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  departmentID: '',
  adviserFacultyID: '',
  courseID: '',
  section: '',
}

const defaultFaculty = {
  type: 'faculty',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  departmentID: '',
  courseID: '',
  section: '',
}

export default function Admin() {
  const { token } = useAuth()
  const { departments, courses, faculty } = useData()

  const [mode, setMode] = useState('student')
  const [form, setForm] = useState(defaultStudent)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!departments.length || !courses.length) return
    if (mode === 'student' && !faculty.length) return

    setForm((prev) => {
      // Don't clobber user typing; only fill blanks.
      if (mode === 'faculty') {
        return {
          ...prev,
          type: 'faculty',
          departmentID: prev.departmentID || departments[0]?.departmentID || '',
          courseID: prev.courseID || courses[0]?.courseID || '',
        }
      }
      return {
        ...prev,
        type: 'student',
        departmentID: prev.departmentID || departments[0]?.departmentID || '',
        courseID: prev.courseID || courses[0]?.courseID || '',
        adviserFacultyID: prev.adviserFacultyID || faculty[0]?.facultyID || '',
      }
    })
  }, [departments, courses, faculty, mode])

  const canSubmit = useMemo(() => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password) return false
    if (String(form.password).length < 6) return false
    if (mode === 'faculty') return !!form.departmentID && !!form.courseID && !!form.section
    return !!form.departmentID && !!form.courseID && !!form.section && !!form.adviserFacultyID
  }, [form, mode])

  const resetForm = (nextMode) => {
    setMode(nextMode)
    setError('')
    if (nextMode === 'faculty') {
      setForm({
        ...defaultFaculty,
        departmentID: departments[0]?.departmentID || '',
        courseID: courses[0]?.courseID || '',
        section: '',
      })
    } else {
      setForm({
        ...defaultStudent,
        departmentID: departments[0]?.departmentID || '',
        courseID: courses[0]?.courseID || '',
        adviserFacultyID: faculty[0]?.facultyID || '',
        section: '',
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        departmentID: Number(form.departmentID),
      }

      payload.courseID = Number(form.courseID)
      payload.section = form.section.trim()
      if (mode === 'student') payload.adviserFacultyID = Number(form.adviserFacultyID)

      const endpoint = mode === 'student' ? '/api/admin/students' : '/api/admin/faculty'
      const created = await apiFetch(endpoint, { token, method: 'POST', body: payload })
      setSuccess(`${mode === 'student' ? 'Student' : 'Faculty'} account created.`)
      resetForm(mode)
    } catch (err) {
      setError(err?.message || 'Failed to create account.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>MIS/Admin</h2>
        <p className="page-description">Create login accounts and assign them as Student or Faculty.</p>
      </div>

      <div className="card" style={{ maxWidth: 820 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button className={`btn ${mode === 'student' ? 'btn-primary' : 'btn-outline'}`} type="button" onClick={() => resetForm('student')}>
            Create Student
          </button>
          <button className={`btn ${mode === 'faculty' ? 'btn-primary' : 'btn-outline'}`} type="button" onClick={() => resetForm('faculty')}>
            Create Faculty
          </button>
        </div>

        {error && <div className="auth-alert" style={{ marginBottom: 12 }}>{error}</div>}
        {success && <div className="auth-alert" style={{ marginBottom: 12, borderColor: 'rgba(34,197,94,.35)', background: 'rgba(34,197,94,.10)' }}>{success}</div>}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-row">
            <div>
              <label>First Name</label>
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            </div>
            <div>
              <label>Last Name</label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            </div>
          </div>

          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />

          <label>Temporary Password</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />

          <label>Department</label>
          <select value={form.departmentID} onChange={(e) => setForm({ ...form, departmentID: e.target.value })} required>
            {departments.map(d => <option key={d.departmentID} value={d.departmentID}>{d.departmentName}</option>)}
          </select>

          <label>Course</label>
          <select value={form.courseID} onChange={(e) => setForm({ ...form, courseID: e.target.value })} required>
            {courses.map(c => <option key={c.courseID} value={c.courseID}>{c.courseCode} - {c.courseName}</option>)}
          </select>

          <label>Section</label>
          <input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} placeholder="e.g. STEM-A" required />

          {mode === 'student' && (
            <>
              <label>Faculty / Professor</label>
              <select value={form.adviserFacultyID} onChange={(e) => setForm({ ...form, adviserFacultyID: e.target.value })} required>
                {faculty.map(f => <option key={f.facultyID} value={f.facultyID}>{f.firstName} {f.lastName}</option>)}
              </select>
            </>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => resetForm(mode)} disabled={busy}>Reset</button>
            <button type="submit" className="btn btn-primary" disabled={!canSubmit || busy}>
              {busy ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

