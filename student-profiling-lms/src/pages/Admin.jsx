import { useMemo, useState } from 'react'
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
  courseID: '',
}

const defaultFaculty = {
  type: 'faculty',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  departmentID: '',
}

export default function Admin() {
  const { token } = useAuth()
  const { departments, courses } = useData()

  const [mode, setMode] = useState('student')
  const [form, setForm] = useState(defaultStudent)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canSubmit = useMemo(() => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password) return false
    if (String(form.password).length < 6) return false
    if (mode === 'student') return !!form.departmentID && !!form.courseID
    return !!form.departmentID
  }, [form, mode])

  const resetForm = (nextMode) => {
    setMode(nextMode)
    setError('')
    setSuccess('')
    if (nextMode === 'faculty') {
      setForm({ ...defaultFaculty, departmentID: departments[0]?.departmentID || '' })
    } else {
      setForm({ ...defaultStudent, departmentID: departments[0]?.departmentID || '', courseID: courses[0]?.courseID || '' })
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

      if (mode === 'student') payload.courseID = Number(form.courseID)

      const endpoint = mode === 'student' ? '/api/admin/students' : '/api/admin/faculty'
      await apiFetch(endpoint, { token, method: 'POST', body: payload })
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

          {mode === 'student' && (
            <>
              <label>Course</label>
              <select value={form.courseID} onChange={(e) => setForm({ ...form, courseID: e.target.value })} required>
                {courses.map(c => <option key={c.courseID} value={c.courseID}>{c.courseCode} - {c.courseName}</option>)}
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

