import { useEffect, useMemo, useState } from 'react'
import {
  Shield,
  Users,
  UserCircle,
  KeyRound,
  GraduationCap,
  Building2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'
import { useData } from '../context/DataContext'
import DirectoryFetchBarrier from '../components/DirectoryFetchBarrier'

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
  studentType: 'Regular',
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

const defaultTeachingLoadForm = () => ({
  facultyID: '',
  courseID: '',
  section: '',
  subjectCode: '',
  subjectTitle: '',
})

export default function Admin() {
  const { token } = useAuth()
  const { departments, courses, faculty, students, reloadDirectory } = useData()

  const [mode, setMode] = useState('student')
  const [form, setForm] = useState(defaultStudent)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [tlForm, setTlForm] = useState(defaultTeachingLoadForm)
  const [tlBusy, setTlBusy] = useState(false)
  const [tlError, setTlError] = useState('')
  const [tlSuccess, setTlSuccess] = useState('')

  useEffect(() => {
    if (!departments.length || !courses.length) return

    setForm((prev) => {
      const dept = String(prev.departmentID || departments[0]?.departmentID || '')
      const inDeptCourses = courses.filter((c) => String(c.departmentID) === dept)
      const crs =
        prev.courseID && inDeptCourses.some((c) => String(c.courseID) === String(prev.courseID))
          ? String(prev.courseID)
          : String(inDeptCourses[0]?.courseID || '')

      if (mode === 'faculty') {
        return {
          ...prev,
          type: 'faculty',
          departmentID: dept,
          courseID: crs,
        }
      }
      const pool = faculty.filter((f) => String(f.departmentID) === dept)
      const adv =
        prev.adviserFacultyID && pool.some((f) => String(f.facultyID) === String(prev.adviserFacultyID))
          ? String(prev.adviserFacultyID)
          : String(pool[0]?.facultyID || '')
      return {
        ...prev,
        type: 'student',
        departmentID: dept,
        courseID: crs,
        adviserFacultyID: adv,
        studentType: prev.studentType || 'Regular',
      }
    })
  }, [departments, courses, faculty, mode])

  const deptNum = Number(form.departmentID)
  const coursesInDept = useMemo(
    () => courses.filter((c) => Number(c.departmentID) === deptNum),
    [courses, deptNum],
  )
  const facultyInDept = useMemo(
    () => faculty.filter((f) => Number(f.departmentID) === deptNum),
    [faculty, deptNum],
  )

  useEffect(() => {
    if (!deptNum || !courses.length) return
    setForm((prev) => {
      const pool = courses.filter((c) => Number(c.departmentID) === deptNum)
      if (!pool.length) {
        return String(prev.courseID) === '' ? prev : { ...prev, courseID: '' }
      }
      const cur = Number(prev.courseID)
      if (pool.some((c) => Number(c.courseID) === cur)) return prev
      return { ...prev, courseID: String(pool[0].courseID) }
    })
  }, [deptNum, courses])

  useEffect(() => {
    if (mode !== 'student' || !deptNum) return
    setForm((prev) => {
      const pool = faculty.filter((f) => Number(f.departmentID) === deptNum)
      if (!pool.length) {
        return prev.adviserFacultyID === '' ? prev : { ...prev, adviserFacultyID: '' }
      }
      const cur = Number(prev.adviserFacultyID)
      if (pool.some((f) => f.facultyID === cur)) return prev
      return { ...prev, adviserFacultyID: String(pool[0].facultyID) }
    })
  }, [deptNum, faculty, mode])

  const canSubmit = useMemo(() => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password) return false
    if (String(form.password).length < 6) return false
    if (!deptNum || !coursesInDept.length || !String(form.section || '').trim()) return false
    if (!coursesInDept.some((c) => Number(c.courseID) === Number(form.courseID))) return false
    if (mode === 'faculty') return true
    return facultyInDept.length > 0 && facultyInDept.some((f) => f.facultyID === Number(form.adviserFacultyID))
  }, [form, mode, deptNum, coursesInDept, facultyInDept])

  const stats = useMemo(
    () => [
      { label: 'Students', value: students.length, icon: Users },
      { label: 'Faculty', value: faculty.length, icon: UserCircle },
      { label: 'Programs', value: courses.length, icon: GraduationCap },
    ],
    [students.length, faculty.length, courses.length],
  )

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
        studentType: 'Regular',
      })
    }
  }

  const tlFacultyRow = faculty.find((f) => String(f.facultyID) === String(tlForm.facultyID))
  const tlCoursesPool = tlFacultyRow
    ? courses.filter((c) => Number(c.departmentID) === Number(tlFacultyRow.departmentID))
    : []

  const canSubmitTeachingLoad =
    tlForm.facultyID &&
    tlForm.courseID &&
    tlForm.section.trim() &&
    tlForm.subjectCode.trim() &&
    tlForm.subjectTitle.trim()

  const handleTeachingLoadSubmit = async (e) => {
    e.preventDefault()
    setTlBusy(true)
    setTlError('')
    setTlSuccess('')
    try {
      await apiFetch('/api/admin/teaching-loads', {
        token,
        method: 'POST',
        body: {
          facultyID: Number(tlForm.facultyID),
          courseID: Number(tlForm.courseID),
          section: tlForm.section.trim(),
          subjectCode: tlForm.subjectCode.trim(),
          subjectTitle: tlForm.subjectTitle.trim(),
        },
      })
      setTlSuccess('Class / subject assignment added for that faculty member.')
      setTlForm(defaultTeachingLoadForm())
    } catch (err) {
      setTlError(err?.message || 'Failed to save teaching assignment.')
    } finally {
      setTlBusy(false)
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
      if (mode === 'student') {
        payload.adviserFacultyID = Number(form.adviserFacultyID)
        payload.studentType = form.studentType || 'Regular'
      }

      const endpoint = mode === 'student' ? '/api/admin/students' : '/api/admin/faculty'
      await apiFetch(endpoint, { token, method: 'POST', body: payload })
      await reloadDirectory()
      setSuccess(`${mode === 'student' ? 'Student' : 'Faculty'} account created.`)
      resetForm(mode)
    } catch (err) {
      setError(err?.message || 'Failed to create account.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <DirectoryFetchBarrier>
    <div className="page admin-page admin-page--deck">
      <header className="admin-hero" aria-labelledby="admin-hero-title">
        <div className="admin-hero-glow" aria-hidden="true" />
        <div className="admin-hero-grid" aria-hidden="true" />
        <div className="admin-hero-inner">
          <div className="admin-hero-copy">
            <div className="admin-hero-badge">
              <span className="admin-hero-badge-icon">
                <Shield size={18} strokeWidth={2.25} aria-hidden />
              </span>
              <span className="admin-hero-badge-text">MIS · Access control</span>
            </div>
            <h2 id="admin-hero-title" className="admin-hero-title">
              Account provisioning
            </h2>
            <p className="admin-hero-sub">
              Create login accounts and assign them as student or faculty — aligned with departments, programs, and advising.
            </p>
            <ul className="admin-hero-tags">
              <li><Sparkles size={12} strokeWidth={2} aria-hidden /> Role-based LMS access</li>
              <li><Building2 size={12} strokeWidth={2} aria-hidden /> {departments.length} departments</li>
              <li><Users size={12} strokeWidth={2} aria-hidden /> {students.length} students</li>
            </ul>
          </div>
          <div className="admin-hero-visual" aria-hidden="true">
            <div className="admin-hero-orbit">
              <span className="admin-hero-orbit-ring" />
              <span className="admin-hero-orbit-dot admin-hero-orbit-dot--a" />
              <span className="admin-hero-orbit-dot admin-hero-orbit-dot--b" />
              <span className="admin-hero-orbit-center">
                <Shield size={28} strokeWidth={1.85} />
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="admin-deck">
        <div className="admin-deck-canvas">
          <section className="admin-panel admin-panel--canvas">
            <div className="admin-panel-top">
              <div className="admin-panel-head">
                <h3 className="admin-panel-title">New account</h3>
                <p className="admin-panel-desc">
                  Fields expand to <strong>four columns</strong> on large displays — use your full monitor width.
                </p>
              </div>
              <div className="admin-mode-switch" role="tablist" aria-label="Account type">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'student'}
                  className="admin-mode-btn"
                  onClick={() => resetForm('student')}
                >
                  <Users size={18} strokeWidth={2} aria-hidden />
                  Student
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'faculty'}
                  className="admin-mode-btn"
                  onClick={() => resetForm('faculty')}
                >
                  <UserCircle size={18} strokeWidth={2} aria-hidden />
                  Faculty
                </button>
              </div>
            </div>

            {error && (
              <div className="admin-alert admin-alert--error" role="alert">
                <AlertCircle size={18} aria-hidden />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="admin-alert admin-alert--success" role="status">
                <CheckCircle2 size={18} aria-hidden />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="form admin-form admin-form--deck">
              <section className="admin-form-section" aria-labelledby="admin-section-identity">
                <h4 id="admin-section-identity" className="admin-form-section-title">
                  <Users size={18} aria-hidden />
                  Identity
                </h4>
                <div className="admin-form-grid admin-form-grid--identity">
                  <div className="admin-form-cell">
                    <label htmlFor="admin-first">First name</label>
                    <input id="admin-first" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required autoComplete="off" />
                  </div>
                  <div className="admin-form-cell">
                    <label htmlFor="admin-last">Last name</label>
                    <input id="admin-last" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required autoComplete="off" />
                  </div>
                </div>
              </section>

              <section className="admin-form-section" aria-labelledby="admin-section-access">
                <h4 id="admin-section-access" className="admin-form-section-title">
                  <KeyRound size={18} aria-hidden />
                  Sign-in credentials
                </h4>
                <div className="admin-form-grid admin-form-grid--credentials">
                  <div className="admin-form-cell admin-form-cell--email">
                    <label htmlFor="admin-email">Institutional email</label>
                    <input id="admin-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="off" />
                  </div>
                  <div className="admin-form-cell">
                    <label htmlFor="admin-pass">Temporary password</label>
                    <input id="admin-pass" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} autoComplete="new-password" />
                  </div>
                  <p className="admin-field-hint admin-form-cell admin-form-cell--full">Minimum 6 characters. Share the password outside the LMS through a secure channel.</p>
                </div>
              </section>

              <section className="admin-form-section" aria-labelledby="admin-section-academic">
                <h4 id="admin-section-academic" className="admin-form-section-title">
                  <GraduationCap size={18} aria-hidden />
                  Academic assignment
                </h4>
                <p className="admin-field-hint admin-form-cell admin-form-cell--full" style={{ marginBottom: '0.5rem' }}>
                  Department, course, and section are required. Courses are limited to the selected department; student advisers are limited to faculty in that department.
                </p>
                <div className="admin-form-grid admin-form-grid--academic">
                  <div className="admin-form-cell">
                    <label htmlFor="admin-dept">Department</label>
                    <select id="admin-dept" value={form.departmentID} onChange={(e) => setForm({ ...form, departmentID: e.target.value })} required>
                      {departments.map(d => <option key={d.departmentID} value={d.departmentID}>{d.departmentName}</option>)}
                    </select>
                  </div>
                  <div className="admin-form-cell">
                    <label htmlFor="admin-course">Course (in department)</label>
                    <select
                      id="admin-course"
                      value={form.courseID}
                      onChange={(e) => setForm({ ...form, courseID: e.target.value })}
                      required
                      disabled={!coursesInDept.length}
                    >
                      {coursesInDept.length === 0 ? (
                        <option value="">No courses linked to this department</option>
                      ) : (
                        coursesInDept.map((c) => (
                          <option key={c.courseID} value={c.courseID}>
                            {c.courseCode} — {c.courseName}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="admin-form-cell">
                    <label htmlFor="admin-class-section">Section</label>
                    <input id="admin-class-section" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} placeholder="e.g. 3A · STEM-A" required />
                  </div>
                  {mode === 'student' ? (
                    <>
                      <div className="admin-form-cell">
                        <label htmlFor="admin-adviser">Faculty adviser (same department)</label>
                        <select
                          id="admin-adviser"
                          value={form.adviserFacultyID}
                          onChange={(e) => setForm({ ...form, adviserFacultyID: e.target.value })}
                          required
                          disabled={!facultyInDept.length}
                        >
                          {facultyInDept.length === 0 ? (
                            <option value="">No faculty in this department</option>
                          ) : (
                            facultyInDept.map((f) => (
                              <option key={f.facultyID} value={f.facultyID}>
                                {f.firstName} {f.lastName}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <div className="admin-form-cell">
                        <label htmlFor="admin-student-type">Student type</label>
                        <select id="admin-student-type" value={form.studentType} onChange={(e) => setForm({ ...form, studentType: e.target.value })} required>
                          <option value="Regular">Regular</option>
                          <option value="Irregular">Irregular</option>
                          <option value="Transferee">Transferee</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <div className="admin-form-cell admin-form-cell--filler" aria-hidden="true">
                      <div className="admin-filler">
                        <UserCircle size={28} strokeWidth={1.5} aria-hidden />
                        <span>Faculty accounts skip adviser linkage.</span>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <div className="admin-form-actions form-actions">
                <button type="button" className="btn btn-outline" onClick={() => resetForm(mode)} disabled={busy}>
                  Reset form
                </button>
                <button type="submit" className="btn btn-primary admin-submit-btn" disabled={!canSubmit || busy}>
                  {busy ? 'Creating…' : `Create ${mode === 'student' ? 'student' : 'faculty'} account`}
                </button>
              </div>
            </form>
          </section>

          <section className="admin-panel admin-panel--canvas" aria-labelledby="admin-tl-title">
            <div className="admin-panel-top">
              <div className="admin-panel-head">
                <h3 id="admin-tl-title" className="admin-panel-title">Assign class to faculty</h3>
                <p className="admin-panel-desc">
                  Add a subject line (same program and section as the roster MIS uses). Faculty cannot add these themselves from the workspace.
                </p>
              </div>
            </div>
            {tlError && (
              <div className="admin-alert admin-alert--error" role="alert">
                <AlertCircle size={18} aria-hidden />
                <span>{tlError}</span>
              </div>
            )}
            {tlSuccess && (
              <div className="admin-alert admin-alert--success" role="status">
                <CheckCircle2 size={18} aria-hidden />
                <span>{tlSuccess}</span>
              </div>
            )}
            <form onSubmit={handleTeachingLoadSubmit} className="form admin-form admin-form--deck">
              <section className="admin-form-section" aria-labelledby="admin-tl-fields">
                <h4 id="admin-tl-fields" className="admin-form-section-title">
                  <Layers size={18} aria-hidden />
                  Teaching load
                </h4>
                <div className="admin-form-grid admin-form-grid--academic">
                  <div className="admin-form-cell">
                    <label htmlFor="admin-tl-faculty">Faculty</label>
                    <select
                      id="admin-tl-faculty"
                      value={tlForm.facultyID}
                      onChange={(e) => {
                        const fid = e.target.value
                        const f = faculty.find((x) => String(x.facultyID) === fid)
                        const pool = f
                          ? courses.filter((c) => Number(c.departmentID) === Number(f.departmentID))
                          : []
                        setTlForm({
                          ...defaultTeachingLoadForm(),
                          facultyID: fid,
                          courseID: pool[0] ? String(pool[0].courseID) : '',
                        })
                      }}
                      required
                      disabled={!faculty.length}
                    >
                      <option value="">Select faculty…</option>
                      {faculty.map((f) => (
                        <option key={f.facultyID} value={f.facultyID}>
                          {f.lastName}, {f.firstName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-form-cell">
                    <label htmlFor="admin-tl-course">Program (course)</label>
                    <select
                      id="admin-tl-course"
                      value={tlForm.courseID}
                      onChange={(e) => setTlForm((p) => ({ ...p, courseID: e.target.value }))}
                      required
                      disabled={!tlCoursesPool.length}
                    >
                      {!tlCoursesPool.length ? (
                        <option value="">Select a faculty member first</option>
                      ) : (
                        tlCoursesPool.map((c) => (
                          <option key={c.courseID} value={c.courseID}>
                            {c.courseCode} — {c.courseName}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="admin-form-cell">
                    <label htmlFor="admin-tl-section">Section</label>
                    <input
                      id="admin-tl-section"
                      value={tlForm.section}
                      onChange={(e) => setTlForm((p) => ({ ...p, section: e.target.value }))}
                      placeholder="e.g. 4IT-B"
                      required
                    />
                  </div>
                  <div className="admin-form-cell">
                    <label htmlFor="admin-tl-code">Subject code</label>
                    <input
                      id="admin-tl-code"
                      value={tlForm.subjectCode}
                      onChange={(e) => setTlForm((p) => ({ ...p, subjectCode: e.target.value }))}
                      placeholder="CCS101"
                      required
                    />
                  </div>
                  <div className="admin-form-cell admin-form-cell--full">
                    <label htmlFor="admin-tl-title-field">Subject title</label>
                    <input
                      id="admin-tl-title-field"
                      value={tlForm.subjectTitle}
                      onChange={(e) => setTlForm((p) => ({ ...p, subjectTitle: e.target.value }))}
                      placeholder="Computer Programming 1"
                      required
                    />
                  </div>
                </div>
              </section>
              <div className="admin-form-actions form-actions">
                <button type="submit" className="btn btn-primary" disabled={!canSubmitTeachingLoad || tlBusy}>
                  {tlBusy ? 'Saving…' : 'Add teaching assignment'}
                </button>
              </div>
            </form>
          </section>
        </div>

        <aside className="admin-deck-rail" aria-label="Reference">
          <div className="admin-rail-snapshot" aria-label="Directory snapshot">
            <h3 className="admin-rail-snapshot-title">Live counts</h3>
            <ul className="admin-rail-snapshot-list">
              {stats.map(({ label, value, icon: Icon }) => (
                <li key={label} className="admin-rail-snapshot-row">
                  <span className="admin-rail-snapshot-ico" aria-hidden><Icon size={17} strokeWidth={2} /></span>
                  <span className="admin-rail-snapshot-lbl">{label}</span>
                  <span className="admin-rail-snapshot-num">{value}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="admin-rail-card">
            <h3 className="admin-rail-title"><Layers size={16} aria-hidden /> Flow</h3>
            <ol className="admin-rail-steps">
              <li>Pick <strong>Student</strong> or <strong>Faculty</strong>.</li>
              <li>Fill identity &amp; credentials across the wide grid.</li>
              <li>Assign department, course, section{mode === 'student' ? ', adviser' : ''}.</li>
              <li>Submit — user can sign in immediately.</li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
    </DirectoryFetchBarrier>
  )
}
