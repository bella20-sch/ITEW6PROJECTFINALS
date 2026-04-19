import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'
import { useLmsBase, lmsPath } from '../lib/lmsPaths'
import {
  ArrowLeft,
  Users,
  FileText,
  ClipboardList,
  BarChart3,
  CheckCircle2,
  Circle,
  ExternalLink,
} from 'lucide-react'

const PERIODS = [
  { id: 'prelim', label: 'Prelim' },
  { id: 'midterm', label: 'Midterm' },
  { id: 'finals', label: 'Finals' },
]

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
  const { token, currentUser } = useAuth()
  const [tab, setTab] = useState('students')
  const [classroom, setClassroom] = useState(null)
  const [gradebook, setGradebook] = useState(null)
  const [schoolYear, setSchoolYear] = useState('2025-2026')
  const [semester, setSemester] = useState(1)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState('')

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

  const tl = classroom?.teachingLoad

  const savePeriodGrades = async (studentID, period, payload) => {
    setBusy(`${studentID}-${period}`)
    setMsg('')
    try {
      await apiFetch(`/api/faculty/teaching-loads/${tlId}/gradebook`, {
        token,
        method: 'PUT',
        body: {
          studentID,
          schoolYear,
          semester,
          period,
          attendancePct: Number(payload.attendancePct),
          quizPct: Number(payload.quizPct),
          examPct: Number(payload.examPct),
        },
      })
      setMsg('Grades saved.')
      await loadAll()
    } catch (e) {
      setMsg(e?.message || 'Save failed.')
    } finally {
      setBusy('')
    }
  }

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

  const gradeRows = useMemo(() => gradebook?.students || [], [gradebook])

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
            onClick={() => setTab(id)}
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
                  <Link to={lmsPath(base, `/students/${s.studentID}`)} className="faculty-class-student-link">
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

          <h3 className="faculty-class-subtitle">Posted items & submission status</h3>
          {!activities.length ? (
            <p className="muted">No activities yet.</p>
          ) : (
            <div className="faculty-class-act-list">
              {activities.map((a) => (
                <article key={a.classActivityID ?? a.id} className="faculty-class-act-card">
                  <header className="faculty-class-act-head">
                    <div>
                      <h4>{a.title}</h4>
                      <p className="muted small">
                        {String(a.assessmentKind || 'activity').toUpperCase()} · {String(a.gradingPeriod || 'prelim')} · Max {a.maxScore}
                      </p>
                    </div>
                  </header>
                  <table className="faculty-class-roster-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Submitted</th>
                        <th>Graded</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(a.rosterStatus || []).map((row) => (
                        <tr key={row.studentID}>
                          <td>{row.studentName}</td>
                          <td>
                            {row.submitted ? (
                              <CheckCircle2 className="faculty-class-ico-ok" size={18} aria-label="Yes" />
                            ) : (
                              <Circle className="faculty-class-ico-no" size={18} aria-label="No" />
                            )}
                          </td>
                          <td>
                            {row.graded ? (
                              <CheckCircle2 className="faculty-class-ico-ok" size={18} aria-label="Yes" />
                            ) : (
                              <Circle className="faculty-class-ico-no" size={18} aria-label="No" />
                            )}
                          </td>
                          <td>{row.score != null ? row.score : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="muted small">
                    Grade submissions from <Link to={lmsPath(base, '/workspace')}>Teaching Workspace</Link>.
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'grades' && gradebook && (
        <section className="faculty-class-panel" aria-labelledby="tab-grades">
          <h2 id="tab-grades" className="faculty-class-panel-title">
            Grades
          </h2>
          <p className="muted faculty-class-hint">
            Each period = <strong>20%</strong> activities (from graded activity-type posts) + <strong>10%</strong> attendance +{' '}
            <strong>20%</strong> quizzes + <strong>50%</strong> exams (0–100 each). Posted quizzes/exams that are graded replace manual
            quiz/exam for that period. Semester average = average of prelim, midterm, and finals totals.
          </p>
          <div className="faculty-grade-cards">
            {gradeRows.map((row) => (
              <StudentGradeCard
                key={row.studentID}
                row={row}
                busy={busy}
                onSavePeriod={savePeriodGrades}
                schoolYear={schoolYear}
                semester={semester}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function StudentGradeCard({ row, busy, onSavePeriod }) {
  const [draft, setDraft] = useState(() => buildDraft(row))

  useEffect(() => {
    setDraft(buildDraft(row))
  }, [row])

  return (
    <div className="faculty-grade-card">
      <div className="faculty-grade-card-head">
        <h3 className="faculty-grade-card-name">{row.studentName}</h3>
        <div className="faculty-grade-avg-pill" aria-label="Semester average">
          <span className="faculty-grade-avg-pill-label">Semester avg</span>
          <span className="faculty-grade-avg-pill-value">{row.semesterAverage != null ? row.semesterAverage : '—'}</span>
        </div>
      </div>

      <div className="faculty-grade-matrix-scroll">
        <table className="faculty-grade-matrix">
          <thead>
            <tr>
              <th scope="col" className="faculty-grade-matrix-corner">
                Component
              </th>
              {PERIODS.map(({ id, label }) => (
                <th key={id} scope="col" className="faculty-grade-matrix-period">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Activities (20%)</th>
              {PERIODS.map(({ id }) => {
                const p = row.periods[id] || {}
                return (
                  <td key={id}>
                    <span className="faculty-grade-cell-read">{p.activityPct != null ? `${p.activityPct}%` : '—'}</span>
                  </td>
                )
              })}
            </tr>
            <tr>
              <th scope="row">Attendance (10%)</th>
              {PERIODS.map(({ id }) => {
                const d = draft[id] || { attendancePct: 0, quizPct: 0, examPct: 0 }
                return (
                  <td key={id}>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="faculty-grade-field"
                      value={d.attendancePct}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          [id]: { ...prev[id], attendancePct: e.target.value },
                        }))
                      }
                    />
                  </td>
                )
              })}
            </tr>
            <tr>
              <th scope="row">
                Quiz (20%)
                <span className="faculty-grade-row-hint">Posted quizzes override manual</span>
              </th>
              {PERIODS.map(({ id }) => {
                const p = row.periods[id] || {}
                const d = draft[id] || { attendancePct: 0, quizPct: 0, examPct: 0 }
                return (
                  <td key={id}>
                    {p.quizFromPostedActivities ? (
                      <span className="faculty-grade-cell-read">{p.quizPct ?? '—'}%</span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="faculty-grade-field"
                        value={d.quizPct}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            [id]: { ...prev[id], quizPct: e.target.value },
                          }))
                        }
                      />
                    )}
                  </td>
                )
              })}
            </tr>
            <tr>
              <th scope="row">
                Exam (50%)
                <span className="faculty-grade-row-hint">Posted exams override manual</span>
              </th>
              {PERIODS.map(({ id }) => {
                const p = row.periods[id] || {}
                const d = draft[id] || { attendancePct: 0, quizPct: 0, examPct: 0 }
                return (
                  <td key={id}>
                    {p.examFromPostedActivities ? (
                      <span className="faculty-grade-cell-read">{p.examPct ?? '—'}%</span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="faculty-grade-field"
                        value={d.examPct}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            [id]: { ...prev[id], examPct: e.target.value },
                          }))
                        }
                      />
                    )}
                  </td>
                )
              })}
            </tr>
            <tr className="faculty-grade-matrix-totals">
              <th scope="row">Period total</th>
              {PERIODS.map(({ id }) => {
                const p = row.periods[id] || {}
                return (
                  <td key={id}>
                    <span className="faculty-grade-total">{p.periodTotal != null ? p.periodTotal : '—'}</span>
                  </td>
                )
              })}
            </tr>
            <tr className="faculty-grade-matrix-actions">
              <th scope="row">Save changes</th>
              {PERIODS.map(({ id, label }) => {
                const d = draft[id] || { attendancePct: 0, quizPct: 0, examPct: 0 }
                const saving = busy === `${row.studentID}-${id}`
                return (
                  <td key={id}>
                    <button
                      type="button"
                      className="btn btn-outline faculty-grade-save-btn"
                      disabled={saving}
                      onClick={() =>
                        onSavePeriod(row.studentID, id, {
                          attendancePct: d.attendancePct,
                          quizPct: d.quizPct,
                          examPct: d.examPct,
                        })
                      }
                    >
                      {saving ? 'Saving…' : `Save ${label}`}
                    </button>
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function buildDraft(row) {
  const out = {}
  PERIODS.forEach(({ id }) => {
    const p = row.periods[id] || {}
    out[id] = {
      attendancePct: p.attendancePct ?? 0,
      quizPct: p.quizFromPostedActivities ? (p.quizPct ?? 0) : (p.quizManualPct ?? 0),
      examPct: p.examFromPostedActivities ? (p.examPct ?? 0) : (p.examManualPct ?? 0),
    }
  })
  return out
}
