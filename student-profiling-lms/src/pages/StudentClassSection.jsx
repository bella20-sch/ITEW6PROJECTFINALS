import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { apiFetch } from '../lib/api'
import { fetchStudentClassroomFallback, isNotFoundError } from '../lib/studentClassroomFallback'
import { useLmsBase, lmsPath } from '../lib/lmsPaths'
import FilterDropdown from '../components/FilterDropdown'
import {
  ArrowLeft,
  FileText,
  ClipboardList,
  BarChart3,
  ExternalLink,
  Send,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'

const ALLOWED_TABS = new Set(['activities', 'grades', 'period-totals', 'lessons'])

export default function StudentClassSection() {
  const { teachingLoadId } = useParams()
  const tlId = Number(teachingLoadId)
  const base = useLmsBase()
  const [searchParams, setSearchParams] = useSearchParams()
  const { token, currentUser } = useAuth()
  const { courses } = useData()
  const [tab, setTab] = useState('activities')
  const [classroom, setClassroom] = useState(null)
  const [gradebook, setGradebook] = useState(null)
  const [schoolYear, setSchoolYear] = useState('2025-2026')
  const [semester, setSemester] = useState(1)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [busyId, setBusyId] = useState('')
  const [submissionDraft, setSubmissionDraft] = useState({})
  const [submitConfirmAid, setSubmitConfirmAid] = useState(null)

  const loadAll = useCallback(async () => {
    if (!token || !Number.isFinite(tlId)) return
    setLoading(true)
    setMsg('')
    try {
      let c
      try {
        c = await apiFetch(`/api/student/teaching-loads/${tlId}/classroom`, { token })
      } catch (e) {
        if (isNotFoundError(e)) {
          c = await fetchStudentClassroomFallback(token, tlId, courses)
        } else {
          throw e
        }
      }

      let g = null
      try {
        g = await apiFetch(
          `/api/student/teaching-loads/${tlId}/gradebook?schoolYear=${encodeURIComponent(schoolYear)}&semester=${semester}`,
          { token },
        )
      } catch (e) {
        if (!isNotFoundError(e)) {
          setMsg(e?.message || 'Could not load grades.')
        }
      }

      setClassroom(c)
      setGradebook(g)
    } catch (e) {
      const raw = e?.message || 'Could not load this class.'
      const short = String(raw).includes('<!DOCTYPE') ? 'Could not load this class. Is the API server running?' : raw
      setMsg(short)
      setClassroom(null)
      setGradebook(null)
    } finally {
      setLoading(false)
    }
  }, [token, tlId, schoolYear, semester, courses])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t === 'materials' || t === 'lessons') {
      setTab('lessons')
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('tab', 'lessons')
          return next
        },
        { replace: true },
      )
      return
    }
    if (t === 'students') {
      setTab('activities')
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('tab', 'activities')
          return next
        },
        { replace: true },
      )
      return
    }
    if (t && ALLOWED_TABS.has(t)) setTab(t)
  }, [searchParams, setSearchParams])

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
  const materials = classroom?.materials || []
  const activities = classroom?.activities || []

  useEffect(() => {
    if (!activities.length) return
    setSubmissionDraft((prev) => {
      const next = { ...prev }
      activities.forEach((a) => {
        const id = a.id ?? a.classActivityID
        const c = a.mySubmission?.content
        if (c && next[id] === undefined) next[id] = c
      })
      return next
    })
  }, [activities])

  /** Gradebook API may omit or return [] for assessmentItems; mirror Activities tab from classroom.activities. */
  const displayAssessmentItems = useMemo(() => {
    const fromApi = gradebook?.assessmentItems
    if (Array.isArray(fromApi) && fromApi.length > 0) return fromApi
    return activities.map((a) => {
      const max = Number(a.maxScore) > 0 ? Number(a.maxScore) : 100
      const sub = a.mySubmission
      let status = 'no_submission'
      let score = null
      let percent = null
      if (sub) {
        if (sub.score != null && sub.gradedAt != null) {
          score = Number(sub.score)
          percent = Math.round((score / max) * 10000) / 100
          status = 'graded'
        } else if (sub.submittedAt) {
          status = 'pending'
        }
      }
      return {
        classActivityID: a.classActivityID ?? a.id,
        title: a.title || 'Untitled',
        assessmentKind: a.assessmentKind || 'activity',
        gradingPeriod: a.gradingPeriod || 'prelim',
        maxScore: max,
        score,
        percent,
        status,
        submittedAt: sub?.submittedAt || null,
        gradedAt: sub?.gradedAt || null,
      }
    })
  }, [gradebook?.assessmentItems, activities])

  const fmtPeriod = (v) => (v != null && !Number.isNaN(Number(v)) ? Number(v).toFixed(2) : '—')

  if (currentUser?.role !== 'Student') {
    return <Navigate to={lmsPath(base, '/')} replace />
  }

  if (!Number.isFinite(tlId)) {
    return (
      <div className="page">
        <p className="muted">Invalid class.</p>
        <Link to={lmsPath(base, '/classes')}>Back to Classes</Link>
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
        <p>{msg || 'Class not found or you are not enrolled.'}</p>
        <Link to={lmsPath(base, '/classes')}>Back to Classes</Link>
      </div>
    )
  }

  const myRow = gradebook?.student

  const kindLabel = (k) =>
    ({ activity: 'Activity', quiz: 'Quiz', exam: 'Exam' }[String(k || '').toLowerCase()] || String(k || '—'))
  const periodLabel = (p) =>
    ({ prelim: 'Prelim', midterm: 'Midterm', finals: 'Finals' }[String(p || '').toLowerCase()] || String(p || '—'))

  return (
    <div className="page faculty-class-section">
      <div className="faculty-class-section-head">
        <Link to={lmsPath(base, '/classes')} className="faculty-class-back">
          <ArrowLeft size={18} />
          Classes
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

      {msg ? (
        <div className="workspace-banner" role="status">
          {msg}
        </div>
      ) : null}

      <div className="tabs-mobile-select" aria-label="Class views">
        <FilterDropdown
          ariaLabel="Class views"
          value={tab}
          onChange={selectTab}
          placeholder="Select…"
          options={[
            { value: 'activities', label: 'Activities' },
            { value: 'grades', label: 'Grades' },
            { value: 'period-totals', label: 'Period totals' },
            { value: 'lessons', label: 'Lessons' },
          ]}
        />
      </div>
      <nav className="faculty-class-tabs workspace-tabs tabs-desktop" role="tablist" aria-label="Class views">
        {[
          { id: 'activities', label: 'Activities', Icon: ClipboardList },
          { id: 'grades', label: 'Grades', Icon: BarChart3 },
          { id: 'period-totals', label: 'Period totals', Icon: TrendingUp },
          { id: 'lessons', label: 'Lessons', Icon: FileText },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`faculty-class-tab ${tab === id ? 'is-active' : ''}`}
            onClick={() => selectTab(id)}
          >
            <Icon size={18} strokeWidth={2} aria-hidden />
            {label}
          </button>
        ))}
      </nav>

      {tab === 'activities' && (
        <section className="faculty-class-panel" aria-labelledby="tab-act">
          <h2 id="tab-act" className="faculty-class-panel-title">
            Posted activities
          </h2>
          <p className="muted faculty-class-hint">Submit on time; scores appear here and on the Grades tab when graded.</p>
          {!activities.length ? (
            <p className="muted">No activities posted yet.</p>
          ) : (
            <div className="workspace-activity-stack">
              {activities.map((a) => {
                const aid = a.id ?? a.classActivityID
                return (
                  <article key={aid} className="workspace-activity-card">
                    <header className="workspace-activity-top">
                      <div>
                        <h4>{a.title}</h4>
                        <p className="workspace-activity-classline muted">
                          {String(a.assessmentKind || 'activity').toUpperCase()} · {String(a.gradingPeriod || 'prelim')} · Max{' '}
                          {a.maxScore ?? 100}
                        </p>
                        {a.description && <p className="workspace-activity-desc">{a.description}</p>}
                        <p className="muted small">
                          Deadline: {a.deadline ? new Date(a.deadline).toLocaleString() : '—'}{' '}
                          {a.allow_late ? '· Late submissions allowed' : ''}
                        </p>
                      </div>
                    </header>
                    <div className="workspace-student-submit">
                      {a.mySubmission?.gradedAt ? (
                        <div className="workspace-grade-box">
                          <p>
                            <strong>Score:</strong> {a.mySubmission.score} / {a.maxScore ?? 100}
                          </p>
                          {a.mySubmission.feedback && (
                            <p>
                              <strong>Feedback:</strong> {a.mySubmission.feedback}
                            </p>
                          )}
                          <p className="muted small">Submitted {new Date(a.mySubmission.submittedAt).toLocaleString()}</p>
                        </div>
                      ) : a.mySubmission?.submittedAt ? (
                        <div className="workspace-submission-success">
                          <p className="workspace-submission-success-badge">
                            <CheckCircle2 size={18} aria-hidden />
                            Submitted successfully
                          </p>
                          {a.mySubmission.content ? (
                            <div className="workspace-submission-success-body">{a.mySubmission.content}</div>
                          ) : null}
                          <p className="muted small">
                            Awaiting grade · Submitted {new Date(a.mySubmission.submittedAt).toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <form
                          className="workspace-form"
                          onSubmit={(e) => {
                            e.preventDefault()
                            setSubmitConfirmAid(aid)
                          }}
                        >
                          <label htmlFor={`student-activity-work-${aid}`}>Your work</label>
                          <textarea
                            id={`student-activity-work-${aid}`}
                            value={submissionDraft[aid] || ''}
                            onChange={(e) => setSubmissionDraft((prev) => ({ ...prev, [aid]: e.target.value }))}
                            rows={4}
                            required
                          />
                          <div className="workspace-form-actions">
                            <button
                              type="submit"
                              className="btn btn-primary workspace-form-submit"
                              disabled={busyId === `submit-${aid}`}
                            >
                              {busyId === `submit-${aid}` ? (
                                <>
                                  <Send size={16} aria-hidden /> Submitting…
                                </>
                              ) : (
                                <>
                                  <Send size={16} aria-hidden /> Submit
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}

      {tab === 'grades' && (
        <section className="faculty-class-panel" aria-label="Your grades by posted activity">
          {!gradebook && activities.length > 0 ? (
            <p className="muted workspace-banner" role="status">
              Period summary could not be loaded from the server; your posted activities and scores below still match this
              class.
            </p>
          ) : null}

          {!gradebook && !activities.length ? (
            <p className="muted">
              Grade summary could not be loaded. Restart the API server after updating, or try again later.
            </p>
          ) : null}

          {gradebook || activities.length ? (
            <>
              <h2 className="faculty-class-panel-title">Posted activities</h2>
              {!displayAssessmentItems.length ? (
                <p className="muted">No activities posted yet.</p>
              ) : (
                <table className="faculty-class-roster-table student-grade-two-col-table">
                  <thead>
                    <tr>
                      <th scope="col">Posted activity</th>
                      <th scope="col" className="student-grade-two-col-th-grade">
                        Your grade
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayAssessmentItems.map((row) => {
                      const max = row.maxScore != null ? Number(row.maxScore) : 100
                      const meta = `${kindLabel(row.assessmentKind)} · ${periodLabel(row.gradingPeriod)} · Max ${max}`
                      let gradeCell = null
                      if (row.status === 'graded' && row.score != null) {
                        gradeCell = (
                          <span className="student-grade-two-col-score">
                            {Number(row.score).toFixed(0)}
                            <span className="student-grade-two-col-outof muted"> / {max}</span>
                          </span>
                        )
                      } else if (row.status === 'pending') {
                        gradeCell = <span className="muted">Pending</span>
                      } else {
                        gradeCell = <span className="muted">—</span>
                      }
                      return (
                        <tr key={row.classActivityID}>
                          <td>
                            <span className="student-grade-two-col-name">{row.title}</span>
                            <span className="student-grade-two-col-meta muted">{meta}</span>
                          </td>
                          <td className="student-grade-two-col-grade-cell">{gradeCell}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </>
          ) : null}
        </section>
      )}

      {tab === 'period-totals' && (
        <section className="faculty-class-panel" aria-labelledby="tab-period-totals">
          <h2 id="tab-period-totals" className="faculty-class-panel-title">
            Period totals
          </h2>
          <p className="muted faculty-class-hint">
            Overall period grades combine activities, attendance, quizzes, and exams using your instructor&rsquo;s weights.
          </p>

          {!gradebook ? (
            <p className="muted workspace-banner" role="status">
              Period summary could not be loaded. Restart the API server after updating, or try again later.
            </p>
          ) : null}

          {gradebook && myRow ? (
            <div className="faculty-class-grades-summary-wrap">
              <table className="faculty-class-roster-table faculty-class-grades-summary-table student-class-grades-summary-table">
                <thead>
                  <tr>
                    <th scope="col" className="student-class-grades-summary-corner" aria-hidden="true" />
                    <th scope="col">Prelim</th>
                    <th scope="col">Midterm</th>
                    <th scope="col">Finals</th>
                    <th scope="col">Semester avg</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Grades</th>
                    <td>{fmtPeriod(myRow.periods?.prelim?.periodTotal)}</td>
                    <td>{fmtPeriod(myRow.periods?.midterm?.periodTotal)}</td>
                    <td>{fmtPeriod(myRow.periods?.finals?.periodTotal)}</td>
                    <td>
                      <strong>{fmtPeriod(myRow.semesterAverage)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : null}

          {gradebook && !myRow ? (
            <p className="muted">Period totals for this term are not available yet.</p>
          ) : null}
        </section>
      )}

      {tab === 'lessons' && (
        <section className="faculty-class-panel" aria-labelledby="tab-lessons">
          <h2 id="tab-lessons" className="sr-only">
            Lessons
          </h2>
          {!materials.length ? (
            <p className="muted">No lessons posted yet.</p>
          ) : (
            <ul className="faculty-class-lesson-list">
              {materials.map((m) => {
                const posted = m.postedAt ? new Date(m.postedAt).toLocaleString() : null
                return (
                  <li key={m.sectionMaterialID ?? m.id} className="faculty-class-lesson-card">
                    <div className="lesson-post-head">
                      <div className="lesson-post-title">
                        <FileText size={18} aria-hidden />
                        <h3>{m.title}</h3>
                      </div>
                      <div className="lesson-post-meta muted">
                        {posted ? <span>{posted}</span> : null}
                        {m.facultyName ? <span>{m.facultyName}</span> : null}
                      </div>
                    </div>
                    {m.content ? <p className="faculty-class-lesson-body">{m.content}</p> : null}
                    {m.link ? (
                      <a href={m.link} target="_blank" rel="noreferrer" className="faculty-class-lesson-link">
                        <ExternalLink size={14} aria-hidden />
                        {m.link}
                      </a>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      <ConfirmModal
        open={submitConfirmAid !== null}
        title="Submit activity?"
        message="You can only submit once. After you submit, you cannot change your work. Continue?"
        confirmLabel="Submit"
        onCancel={() => setSubmitConfirmAid(null)}
        onConfirm={async () => {
          const aid = submitConfirmAid
          setSubmitConfirmAid(null)
          if (aid == null) return
          setBusyId(`submit-${aid}`)
          setMsg('')
          try {
            await apiFetch(`/api/student/activities/${aid}/submit`, {
              token,
              method: 'POST',
              body: { content: submissionDraft[aid] || '' },
            })
            setMsg('Submitted successfully.')
            await loadAll()
          } catch (err) {
            setMsg(err?.message || 'Submission failed.')
          } finally {
            setBusyId('')
          }
        }}
      />
    </div>
  )
}
