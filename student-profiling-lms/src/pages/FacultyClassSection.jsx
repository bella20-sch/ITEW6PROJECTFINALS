import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'
import { useLmsBase, lmsPath } from '../lib/lmsPaths'
import {
  ArrowLeft,
  Users,
  FileText,
  ClipboardList,
  BarChart3,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'

const ALLOWED_TABS = new Set(['students', 'lessons', 'activities', 'grades'])

const KIND_OPTIONS = [
  { value: 'activity', label: 'Activity (20%)' },
  { value: 'quiz', label: 'Quiz (20%)' },
  { value: 'exam', label: 'Exam (50%)' },
]

const PERIOD_OPTIONS = [
  { value: 'prelim', label: 'Prelim' },
  { value: 'midterm', label: 'Midterm' },
  { value: 'finals', label: 'Finals' },
]

export default function FacultyClassSection() {
  const { teachingLoadId } = useParams()
  const tlId = Number(teachingLoadId)
  const base = useLmsBase()
  const [searchParams, setSearchParams] = useSearchParams()
  const { token, currentUser } = useAuth()
  const [tab, setTab] = useState('students')
  const [classroom, setClassroom] = useState(null)
  const [gradebook, setGradebook] = useState(null)
  const [schoolYear, setSchoolYear] = useState('2025-2026')
  const [semester, setSemester] = useState(1)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState('') // posting activity only

  const [newAct, setNewAct] = useState({
    title: '',
    description: '',
    deadline: '',
    maxScore: 100,
    gradingPeriod: 'prelim',
    assessmentKind: 'activity',
  })

  const loadAll = useCallback(async () => {
    if (!token || !Number.isFinite(tlId)) return
    setLoading(true)
    setMsg('')
    try {
      const [c, g] = await Promise.all([
        apiFetch(`/api/faculty/teaching-loads/${tlId}/classroom`, { token }),
        apiFetch(
          `/api/faculty/teaching-loads/${tlId}/gradebook?schoolYear=${encodeURIComponent(schoolYear)}&semester=${semester}`,
          { token },
        ),
      ])
      setClassroom(c)
      setGradebook(g)
    } catch (e) {
      setMsg(e?.message || 'Could not load this class.')
      setClassroom(null)
      setGradebook(null)
    } finally {
      setLoading(false)
    }
  }, [token, tlId, schoolYear, semester])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t && ALLOWED_TABS.has(t)) setTab(t)
  }, [searchParams])

  const selectTab = (id) => {
    setTab(id)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', id)
        return next
      },
      { replace: true },
    )
  }

  const tl = classroom?.teachingLoad

  const postActivity = async (e) => {
    e.preventDefault()
    if (!newAct.title.trim()) return
    setBusy('newAct')
    setMsg('')
    try {
      await apiFetch('/api/faculty/activities', {
        token,
        method: 'POST',
        body: {
          teachingLoadId: tlId,
          title: newAct.title.trim(),
          description: newAct.description,
          deadline: newAct.deadline,
          maxScore: Number(newAct.maxScore) || 100,
          gradingPeriod: newAct.gradingPeriod,
          assessmentKind: newAct.assessmentKind,
        },
      })
      setNewAct({
        title: '',
        description: '',
        deadline: '',
        maxScore: 100,
        gradingPeriod: 'prelim',
        assessmentKind: 'activity',
      })
      setMsg('Activity posted.')
      await loadAll()
    } catch (err) {
      setMsg(err?.message || 'Could not post activity.')
    } finally {
      setBusy('')
    }
  }

  const roster = classroom?.students || []
  const activities = classroom?.activities || []
  const materials = classroom?.materials || []

  /** Same roster order as Students tab; gradebook is already scoped to this teaching load’s course + section on the server. */
  const gradeRowsOrdered = useMemo(() => {
    const byId = new Map((gradebook?.students || []).map((r) => [Number(r.studentID), r]))
    return roster.map((s) => byId.get(Number(s.studentID))).filter(Boolean)
  }, [roster, gradebook])

  const fmtPeriod = (v) => (v != null && !Number.isNaN(Number(v)) ? Number(v).toFixed(2) : '—')

  if (currentUser?.role !== 'Faculty') {
    return <Navigate to={lmsPath(base, '/')} replace />
  }

  if (!Number.isFinite(tlId)) {
    return (
      <div className="page">
        <p className="muted">Invalid class.</p>
        <Link to={lmsPath(base, '/my-classes')}>Back to My classes</Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading class…</p>
      </div>
    )
  }

  if (!classroom || !tl) {
    return (
      <div className="page">
        <p>{msg || 'Class not found or you do not teach it.'}</p>
        <Link to={lmsPath(base, '/my-classes')}>Back to My classes</Link>
      </div>
    )
  }

  return (
    <div className="page faculty-class-section">
      <div className="faculty-class-section-head">
        <Link to={lmsPath(base, '/my-classes')} className="faculty-class-back">
          <ArrowLeft size={18} />
          My classes
        </Link>
        <div className="faculty-class-section-title-block">
          <span className="faculty-my-classes-badge">{tl.courseCode}</span>
          <span className="faculty-my-classes-section-pill">Sec. {tl.section}</span>
          <h1 className="faculty-class-section-title">{tl.subjectTitle}</h1>
          <p className="faculty-class-section-sub">
            {tl.subjectCode} · {tl.courseName}
          </p>
        </div>
      </div>

      <div className="faculty-class-term-card">
        <div className="faculty-class-term-grid">
          <label className="faculty-field">
            <span className="faculty-field-label">School year</span>
            <input
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              className="faculty-field-input"
              placeholder="e.g. 2025-2026"
            />
          </label>
          <label className="faculty-field">
            <span className="faculty-field-label">Semester</span>
            <select
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value))}
              className="faculty-field-input faculty-field-select"
            >
              <option value={1}>1st semester</option>
              <option value={2}>2nd semester</option>
            </select>
          </label>
          <div className="faculty-class-term-note-block">
            <span className="faculty-field-label">How grading works</span>
            <p className="faculty-class-term-note muted">
              Semester grade is the average of prelim, midterm, and finals period scores. Year level is updated on each student
              profile; repeat this flow every semester until they advance.
            </p>
          </div>
        </div>
      </div>

      {msg ? (
        <div className="workspace-banner" role="status">
          {msg}
        </div>
      ) : null}

      <div className="faculty-class-tabs" role="tablist" aria-label="Class views">
        {[
          { id: 'students', label: 'Students', Icon: Users },
          { id: 'lessons', label: 'Lessons', Icon: FileText },
          { id: 'activities', label: 'Activities', Icon: ClipboardList },
          { id: 'grades', label: 'Grades', Icon: BarChart3 },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`faculty-class-tab ${tab === id ? 'is-active' : ''}`}
            onClick={() => selectTab(id)}
          >
            <Icon size={18} aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {tab === 'students' && (
        <section className="faculty-class-panel" aria-labelledby="tab-students">
          <h2 id="tab-students" className="sr-only">
            Students
          </h2>
          {!roster.length ? (
            <p className="muted">No students match this program section yet.</p>
          ) : (
            <ul className="faculty-class-student-list">
              {roster.map((s) => (
                <li key={s.studentID}>
                  <Link to={lmsPath(base, `/my-classes/${tlId}/students/${s.studentID}`)} className="faculty-class-student-link">
                    <span className="faculty-class-student-name">
                      {s.lastName}, {s.firstName}
                    </span>
                    <span className="muted">{s.email}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'lessons' && (
        <section className="faculty-class-panel" aria-labelledby="tab-lessons">
          <h2 id="tab-lessons" className="sr-only">
            Lessons
          </h2>
          {!materials.length ? (
            <p className="muted">No lessons posted yet. Use Teaching Workspace to add materials, or post from there for this subject.</p>
          ) : (
            <ul className="faculty-class-lesson-list">
              {materials.map((m) => (
                <li key={m.sectionMaterialID ?? m.id} className="faculty-class-lesson-card">
                  <h3>{m.title}</h3>
                  {m.content ? <p className="faculty-class-lesson-body">{m.content}</p> : null}
                  {m.link ? (
                    <a href={m.link} target="_blank" rel="noreferrer" className="faculty-class-lesson-link">
                      <ExternalLink size={14} aria-hidden />
                      {m.link}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'activities' && (
        <section className="faculty-class-panel" aria-labelledby="tab-activities">
          <h2 id="tab-activities" className="faculty-class-panel-title">
            Post an activity, quiz, or exam
          </h2>
          <p className="muted faculty-class-hint">
            Set the <strong>grading period</strong> (prelim / midterm / finals) so scores roll into the correct column. Kind{' '}
            <strong>Activity</strong> counts toward the 20% activity bucket; <strong>Quiz</strong> and <strong>Exam</strong> toward their
            buckets when graded (otherwise use manual inputs on the Grades tab).
          </p>
          <div className="faculty-class-form-shell">
            <form className="faculty-class-form" onSubmit={postActivity}>
              <div className="faculty-class-form-grid">
                <label className="faculty-field faculty-field--span-8">
                  <span className="faculty-field-label">Title</span>
                  <input
                    className="faculty-field-input"
                    value={newAct.title}
                    onChange={(e) => setNewAct((p) => ({ ...p, title: e.target.value }))}
                    required
                    placeholder="e.g. Midterm practical"
                  />
                </label>
                <label className="faculty-field faculty-field--span-4">
                  <span className="faculty-field-label">Max score</span>
                  <input
                    className="faculty-field-input"
                    type="number"
                    min={1}
                    value={newAct.maxScore}
                    onChange={(e) => setNewAct((p) => ({ ...p, maxScore: e.target.value }))}
                  />
                </label>
                <label className="faculty-field faculty-field--span-4">
                  <span className="faculty-field-label">Grading period</span>
                  <select
                    className="faculty-field-input faculty-field-select"
                    value={newAct.gradingPeriod}
                    onChange={(e) => setNewAct((p) => ({ ...p, gradingPeriod: e.target.value }))}
                  >
                    {PERIOD_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="faculty-field faculty-field--span-4">
                  <span className="faculty-field-label">Kind</span>
                  <select
                    className="faculty-field-input faculty-field-select"
                    value={newAct.assessmentKind}
                    onChange={(e) => setNewAct((p) => ({ ...p, assessmentKind: e.target.value }))}
                  >
                    {KIND_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="faculty-field faculty-field--span-12">
                  <span className="faculty-field-label">Instructions</span>
                  <textarea
                    className="faculty-field-textarea"
                    rows={4}
                    value={newAct.description}
                    onChange={(e) => setNewAct((p) => ({ ...p, description: e.target.value }))}
                    placeholder="What should students submit or prepare?"
                  />
                </label>
                <label className="faculty-field faculty-field--span-6">
                  <span className="faculty-field-label">Deadline (optional)</span>
                  <input
                    className="faculty-field-input"
                    type="datetime-local"
                    value={newAct.deadline}
                    onChange={(e) => setNewAct((p) => ({ ...p, deadline: e.target.value }))}
                  />
                </label>
              </div>
              <div className="faculty-class-form-footer">
                <button type="submit" className="btn btn-primary faculty-class-form-submit" disabled={busy === 'newAct'}>
                  {busy === 'newAct' ? 'Posting…' : 'Post to class'}
                </button>
              </div>
            </form>
          </div>

          <h3 className="faculty-class-subtitle">Posted items</h3>
          <p className="muted small faculty-class-hint">
            Open an item to see every student&rsquo;s submitted / not submitted status and scores. Grade submissions from{' '}
            <Link to={lmsPath(base, '/workspace')}>Teaching Workspace</Link>.
          </p>
          {!activities.length ? (
            <p className="muted">No activities yet.</p>
          ) : (
            <div className="faculty-class-act-list">
              {activities.map((a) => (
                <Link
                  key={a.classActivityID ?? a.id}
                  to={lmsPath(base, `/my-classes/${tlId}/activities/${a.classActivityID ?? a.id}`)}
                  className="faculty-class-act-card faculty-class-act-card-link"
                >
                  <div className="faculty-class-act-head">
                    <div>
                      <h4>{a.title}</h4>
                      <p className="muted small">
                        {String(a.assessmentKind || 'activity').toUpperCase()} · {String(a.gradingPeriod || 'prelim')} · Max{' '}
                        {a.maxScore}
                      </p>
                    </div>
                    <span className="faculty-class-act-open">
                      Roster <ChevronRight size={18} aria-hidden />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'grades' && gradebook && (
        <section className="faculty-class-panel" aria-labelledby="tab-grades">
          <h2 id="tab-grades" className="faculty-class-panel-title">
            Grades — this class only
          </h2>
          <p className="muted faculty-class-hint">
            Totals below are for <strong>{tl.subjectCode}</strong> · Sec. {tl.section} only (same roster as the Students tab). Period scores use
            20% activities + 10% attendance + 20% quizzes + 50% exams. To enter or change grades, open each student from the{' '}
            <button type="button" className="faculty-class-inline-link" onClick={() => selectTab('students')}>
              Students
            </button>{' '}
            tab (or use the <strong>Edit grades</strong> link in each row).
          </p>
          {!gradeRowsOrdered.length ? (
            <p className="muted">No students enrolled in this section yet.</p>
          ) : (
            <div className="faculty-class-grades-summary-wrap">
              <table className="faculty-class-roster-table faculty-class-grades-summary-table">
                <thead>
                  <tr>
                    <th scope="col">Student</th>
                    <th scope="col">Prelim</th>
                    <th scope="col">Midterm</th>
                    <th scope="col">Finals</th>
                    <th scope="col">Semester avg</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {gradeRowsOrdered.map((row) => (
                    <tr key={row.studentID}>
                      <td>{row.studentName}</td>
                      <td>{fmtPeriod(row.periods?.prelim?.periodTotal)}</td>
                      <td>{fmtPeriod(row.periods?.midterm?.periodTotal)}</td>
                      <td>{fmtPeriod(row.periods?.finals?.periodTotal)}</td>
                      <td>{fmtPeriod(row.semesterAverage)}</td>
                      <td>
                        <Link
                          to={lmsPath(base, `/my-classes/${tlId}/students/${row.studentID}?tab=grades`)}
                          className="btn btn-outline btn-sm faculty-class-grades-edit-link"
                        >
                          Edit grades
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
