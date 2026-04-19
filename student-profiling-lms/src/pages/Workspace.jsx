import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { apiFetch } from '../lib/api'
import { useLmsBase, lmsPath } from '../lib/lmsPaths'
import ContentLoadingSkeleton from '../components/ContentLoadingSkeleton'
import DirectoryLoadErrorPanel from '../components/DirectoryLoadErrorPanel'
import { BookOpen, ClipboardList, GraduationCap, Send, Users, FileText } from 'lucide-react'

export default function Workspace() {
  const { token, currentUser } = useAuth()
  const { courses, directoryStatus, reloadDirectory } = useData()
  const base = useLmsBase()

  const [assignments, setAssignments] = useState([])
  const [activities, setActivities] = useState([])
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [msg, setMsg] = useState('')

  const [actForm, setActForm] = useState({
    teachingLoadId: '',
    title: '',
    description: '',
    deadline: '',
    allow_late: false,
    maxScore: 100,
    gradingPeriod: 'prelim',
    assessmentKind: 'activity',
  })
  const [matForm, setMatForm] = useState({
    teachingLoadId: '',
    title: '',
    content: '',
    link: '',
  })
  const [submissionDraft, setSubmissionDraft] = useState({})
  const [gradeDraft, setGradeDraft] = useState({})

  const isFaculty = currentUser?.role === 'Faculty'
  const isStudent = currentUser?.role === 'Student'

  const courseName = useCallback(
    (courseID) => courses.find((c) => Number(c.courseID) === Number(courseID))?.courseName || 'Program',
    [courses],
  )
  const courseCode = useCallback(
    (courseID) => courses.find((c) => Number(c.courseID) === Number(courseID))?.courseCode || '',
    [courses],
  )

  const mergeRosterWithSubmissions = useCallback(
    (activity) => {
      const tlId = Number(activity.teachingLoadID)
      const load = assignments.find((x) => Number(x.teachingLoadId ?? x.id) === tlId)
      const roster = load?.students || []
      const subs = activity.submissions || []
      const byId = new Map(subs.map((s) => [Number(s.studentID), s]))
      const rows = []
      const seen = new Set()
      roster.forEach((st) => {
        const sid = Number(st.studentID)
        seen.add(sid)
        const existing = byId.get(sid)
        rows.push(
          existing || {
            submissionID: null,
            classActivityID: activity.id,
            studentID: sid,
            studentName: `${st.firstName} ${st.lastName}`.trim(),
            submittedAt: null,
            content: null,
            score: null,
            feedback: '',
            gradedAt: null,
          },
        )
      })
      subs.forEach((s) => {
        const sid = Number(s.studentID)
        if (!seen.has(sid)) {
          seen.add(sid)
          rows.push(s)
        }
      })
      return rows
    },
    [assignments],
  )

  const loadAll = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const [a, m, asg] = await Promise.all([
        apiFetch('/api/me/activities', { token }),
        apiFetch('/api/me/materials', { token }),
        apiFetch('/api/me/assignments', { token }),
      ])
      setActivities(Array.isArray(a) ? a : [])
      setMaterials(Array.isArray(m) ? m : [])
      setAssignments(Array.isArray(asg) ? asg : [])
    } catch {
      setMsg('Could not load workspace.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    if (!assignments.length) return
    const first = String(assignments[0].teachingLoadId ?? assignments[0].id)
    setActForm((p) => (p.teachingLoadId ? p : { ...p, teachingLoadId: first }))
    setMatForm((p) => (p.teachingLoadId ? p : { ...p, teachingLoadId: first }))
  }, [assignments])

  useEffect(() => {
    if (!isStudent) return
    setSubmissionDraft((prev) => {
      const next = { ...prev }
      activities.forEach((a) => {
        const c = a.mySubmission?.content
        if (c && next[a.id] === undefined) next[a.id] = c
      })
      return next
    })
  }, [activities, isStudent])

  const teachingOptions = useMemo(
    () =>
      assignments.map((t) => ({
        value: String(t.teachingLoadId ?? t.id),
        label: t.displayLabel || `${t.subjectTitle} (${t.subjectCode}) · ${courseCode(t.courseID)} · Sec ${t.section}`,
      })),
    [assignments, courseCode],
  )

  if (directoryStatus === 'loading' || directoryStatus === 'idle') {
    return <ContentLoadingSkeleton title="Loading directory data…" />
  }
  if (directoryStatus === 'error') {
    return <DirectoryLoadErrorPanel onRetry={reloadDirectory} />
  }

  if (loading) {
    return <ContentLoadingSkeleton title="Loading workspace…" />
  }

  return (
    <div className="page workspace-page">
      <header className="workspace-hero">
        <div className="workspace-hero-icon" aria-hidden>
          <ClipboardList size={28} strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="workspace-hero-title">{isFaculty ? 'Faculty workspace' : 'Student workspace'}</h2>
          <p className="workspace-hero-sub">
            {isFaculty
              ? 'View your section rosters, post lessons, assign work, and grade submissions for each subject you teach.'
              : 'See materials and activities for your section. Submit assignments and view scores from your instructors.'}
          </p>
        </div>
      </header>

      {msg && (
        <div className="workspace-banner" role="status">
          {msg}
        </div>
      )}

      {/* Teaching loads + rosters (faculty); subject lines (student) */}
      <section className="workspace-section">
        <h3 className="workspace-section-title">
          <GraduationCap size={20} strokeWidth={2} aria-hidden />
          {isFaculty ? 'Your sections & subjects' : 'Your classes this term'}
        </h3>
        {!assignments.length && (
          <p className="muted workspace-empty">
            {isFaculty
              ? 'No teaching assignments yet. Ask MIS to assign your classes (program, section, and subject) in the provisioning console.'
              : 'No class offerings match your program and section yet.'}
          </p>
        )}
        <div className="workspace-load-grid">
          {assignments.map((tl) => (
            <article key={tl.teachingLoadId ?? tl.id} className="workspace-load-card">
              <div className="workspace-load-head">
                <span className="workspace-load-badge">{courseCode(tl.courseID)}</span>
                <span className="workspace-load-section">{tl.section}</span>
              </div>
              <h4 className="workspace-load-subject">
                {tl.subjectTitle}
                <span className="workspace-load-code">{tl.subjectCode}</span>
              </h4>
              <p className="workspace-load-meta">{courseName(tl.courseID)}</p>
              {isFaculty && Array.isArray(tl.students) && (
                <div className="workspace-roster">
                  <div className="workspace-roster-head">
                    <Users size={16} />
                    <span>Students in this section ({tl.students.length})</span>
                  </div>
                  {tl.students.length === 0 ? (
                    <p className="muted workspace-roster-empty">No students match this course and section yet.</p>
                  ) : (
                    <ul className="workspace-roster-list">
                      {tl.students.map((s) => (
                        <li key={s.studentID}>
                          <Link to={lmsPath(base, `/students/${s.studentID}`)} className="workspace-roster-link">
                            {s.lastName}, {s.firstName}
                          </Link>
                          <span className="muted">{s.email}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {isFaculty && (
        <>
          <section className="workspace-section workspace-card-block">
            <h3 className="workspace-section-title">
              <ClipboardList size={20} strokeWidth={2} aria-hidden />
              New activity / assignment
            </h3>
            <form
              className="workspace-form"
              onSubmit={async (e) => {
                e.preventDefault()
                if (!actForm.teachingLoadId) {
                  setMsg('Select a class (subject + section) first.')
                  return
                }
                setBusyId('createActivity')
                setMsg('')
                try {
                  await apiFetch('/api/faculty/activities', {
                    token,
                    method: 'POST',
                    body: {
                      teachingLoadId: Number(actForm.teachingLoadId),
                      title: actForm.title.trim(),
                      description: actForm.description,
                      deadline: actForm.deadline,
                      allow_late: actForm.allow_late,
                      maxScore: Number(actForm.maxScore) || 100,
                      gradingPeriod: actForm.gradingPeriod,
                      assessmentKind: actForm.assessmentKind,
                    },
                  })
                  setMsg('Activity posted for that section.')
                  setActForm({
                    teachingLoadId: teachingOptions[0]?.value || '',
                    title: '',
                    description: '',
                    deadline: '',
                    allow_late: false,
                    maxScore: 100,
                    gradingPeriod: 'prelim',
                    assessmentKind: 'activity',
                  })
                  await loadAll()
                } catch (err) {
                  setMsg(err?.message || 'Failed to create activity.')
                } finally {
                  setBusyId('')
                }
              }}
            >
              <label>
                Class (subject · section)
                <select
                  value={actForm.teachingLoadId}
                  onChange={(e) => setActForm((p) => ({ ...p, teachingLoadId: e.target.value }))}
                  required
                >
                  <option value="">Select…</option>
                  {teachingOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="workspace-form-row">
                <label>
                  Grading period
                  <select
                    value={actForm.gradingPeriod}
                    onChange={(e) => setActForm((p) => ({ ...p, gradingPeriod: e.target.value }))}
                  >
                    <option value="prelim">Prelim</option>
                    <option value="midterm">Midterm</option>
                    <option value="finals">Finals</option>
                  </select>
                </label>
                <label>
                  Kind
                  <select
                    value={actForm.assessmentKind}
                    onChange={(e) => setActForm((p) => ({ ...p, assessmentKind: e.target.value }))}
                  >
                    <option value="activity">Activity (20%)</option>
                    <option value="quiz">Quiz (20%)</option>
                    <option value="exam">Exam (50%)</option>
                  </select>
                </label>
              </div>
              <label>
                Title
                <input
                  value={actForm.title}
                  onChange={(e) => setActForm((p) => ({ ...p, title: e.target.value }))}
                  required
                />
              </label>
              <label>
                Instructions
                <textarea
                  value={actForm.description}
                  onChange={(e) => setActForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
              </label>
              <div className="workspace-form-row">
                <label>
                  Deadline
                  <input
                    type="datetime-local"
                    value={actForm.deadline}
                    onChange={(e) => setActForm((p) => ({ ...p, deadline: e.target.value }))}
                  />
                </label>
                <label>
                  Max score
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={actForm.maxScore}
                    onChange={(e) => setActForm((p) => ({ ...p, maxScore: e.target.value }))}
                  />
                </label>
              </div>
              <label className="workspace-check">
                <input
                  type="checkbox"
                  checked={actForm.allow_late}
                  onChange={(e) => setActForm((p) => ({ ...p, allow_late: e.target.checked }))}
                />
                Allow late submissions
              </label>
              <button type="submit" className="btn btn-primary" disabled={busyId === 'createActivity'}>
                {busyId === 'createActivity' ? 'Publishing…' : 'Publish activity'}
              </button>
            </form>
          </section>

          <section className="workspace-section workspace-card-block">
            <h3 className="workspace-section-title">
              <FileText size={20} strokeWidth={2} aria-hidden />
              Post lesson / module / link
            </h3>
            <form
              className="workspace-form"
              onSubmit={async (e) => {
                e.preventDefault()
                if (!matForm.teachingLoadId) {
                  setMsg('Select a class for this material.')
                  return
                }
                setBusyId('createMaterial')
                setMsg('')
                try {
                  await apiFetch('/api/faculty/materials', {
                    token,
                    method: 'POST',
                    body: {
                      teachingLoadId: Number(matForm.teachingLoadId),
                      title: matForm.title.trim(),
                      content: matForm.content,
                      link: matForm.link.trim(),
                    },
                  })
                  setMsg('Material published.')
                  setMatForm({
                    teachingLoadId: teachingOptions[0]?.value || '',
                    title: '',
                    content: '',
                    link: '',
                  })
                  await loadAll()
                } catch (err) {
                  setMsg(err?.message || 'Failed to post material.')
                } finally {
                  setBusyId('')
                }
              }}
            >
              <label>
                Class
                <select
                  value={matForm.teachingLoadId}
                  onChange={(e) => setMatForm((p) => ({ ...p, teachingLoadId: e.target.value }))}
                  required
                >
                  <option value="">Select…</option>
                  {teachingOptions.map((o) => (
                    <option key={`m-${o.value}`} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Title
                <input
                  value={matForm.title}
                  onChange={(e) => setMatForm((p) => ({ ...p, title: e.target.value }))}
                  required
                />
              </label>
              <label>
                Notes / overview (optional)
                <textarea
                  value={matForm.content}
                  onChange={(e) => setMatForm((p) => ({ ...p, content: e.target.value }))}
                  rows={3}
                  placeholder="Outline, page numbers, or embedded notes"
                />
              </label>
              <label>
                Link (PPT, PDF, LMS, etc.)
                <input
                  value={matForm.link}
                  onChange={(e) => setMatForm((p) => ({ ...p, link: e.target.value }))}
                  placeholder="https://…"
                />
              </label>
              <button type="submit" className="btn btn-primary" disabled={busyId === 'createMaterial'}>
                {busyId === 'createMaterial' ? 'Posting…' : 'Post material'}
              </button>
            </form>
          </section>
        </>
      )}

      <section className="workspace-section">
        <h3 className="workspace-section-title">
          <BookOpen size={20} strokeWidth={2} aria-hidden />
          Materials
        </h3>
        {!materials.length && <p className="muted workspace-empty">No materials posted yet.</p>}
        <div className="workspace-list">
          {materials.map((m) => (
            <article key={m.id} className="workspace-material-card">
              <div className="workspace-material-head">
                <strong>{m.title}</strong>
                <span className="workspace-chip">
                  {m.subjectTitle} · {m.subjectCode} · Sec {m.section}
                </span>
              </div>
              {m.content && <p className="workspace-material-body">{m.content}</p>}
              {m.link && (
                <a href={m.link} target="_blank" rel="noopener noreferrer" className="workspace-link">
                  Open resource
                </a>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="workspace-section">
        <h3 className="workspace-section-title">
          <ClipboardList size={20} strokeWidth={2} aria-hidden />
          Activities & submissions
        </h3>
        {!activities.length && <p className="muted workspace-empty">No class activities yet.</p>}
        <div className="workspace-activity-stack">
          {activities.map((a) => (
            <article key={a.id} className="workspace-activity-card">
              <header className="workspace-activity-top">
                <div>
                  <h4>{a.title}</h4>
                  <p className="workspace-activity-classline muted">
                    {a.subjectTitle} ({a.subjectCode}) · {courseCode(a.courseID)} · Section {a.section}
                  </p>
                  {a.description && <p className="workspace-activity-desc">{a.description}</p>}
                  <p className="muted small">
                    Deadline: {a.deadline ? new Date(a.deadline).toLocaleString() : '—'}{' '}
                    {a.allow_late ? '· Late submissions allowed' : ''}
                    {isFaculty && <> · Max score: {a.maxScore ?? 100}</>}
                  </p>
                </div>
              </header>

              {isStudent && (
                <div className="workspace-student-submit">
                  {a.mySubmission?.gradedAt ? (
                    <div className="workspace-grade-box">
                      <p>
                        <strong>Score:</strong> {a.mySubmission.score} / {a.maxScore ?? 100}
                      </p>
                      {a.mySubmission.feedback && (
                        <p>
                          <strong>Instructor feedback:</strong> {a.mySubmission.feedback}
                        </p>
                      )}
                      <p className="muted small">Submitted {new Date(a.mySubmission.submittedAt).toLocaleString()}</p>
                    </div>
                  ) : (
                    <form
                      className="workspace-form"
                      onSubmit={async (e) => {
                        e.preventDefault()
                        setBusyId(`submit-${a.id}`)
                        setMsg('')
                        try {
                          await apiFetch(`/api/student/activities/${a.id}/submit`, {
                            token,
                            method: 'POST',
                            body: { content: submissionDraft[a.id] || '' },
                          })
                          setMsg('Submission received.')
                          await loadAll()
                        } catch (err) {
                          setMsg(err?.message || 'Submission failed.')
                        } finally {
                          setBusyId('')
                        }
                      }}
                    >
                      <label>Your work (paste text or describe what you attached externally)</label>
                      <textarea
                        value={submissionDraft[a.id] || ''}
                        onChange={(e) =>
                          setSubmissionDraft((prev) => ({ ...prev, [a.id]: e.target.value }))
                        }
                        rows={4}
                        required
                      />
                      <button type="submit" className="btn btn-primary" disabled={busyId === `submit-${a.id}`}>
                        {busyId === `submit-${a.id}` ? (
                          <>
                            <Send size={16} /> Submitting…
                          </>
                        ) : (
                          <>
                            <Send size={16} /> Submit assignment
                          </>
                        )}
                      </button>
                      {a.mySubmission?.submittedAt && !a.mySubmission?.gradedAt && (
                        <p className="muted small">Last submitted {new Date(a.mySubmission.submittedAt).toLocaleString()}</p>
                      )}
                    </form>
                  )}
                </div>
              )}

              {isFaculty && (
                <div className="workspace-submissions">
                  <h5>Submission status (entire section)</h5>
                  {mergeRosterWithSubmissions(a).length === 0 && (
                    <p className="muted">No students are linked to this activity&apos;s section yet.</p>
                  )}
                  <table className="workspace-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Submitted</th>
                        <th>Status</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mergeRosterWithSubmissions(a).map((sub) => {
                        const gkey = `${a.id}-${sub.studentID}`
                        const done = !!sub.gradedAt
                        const rowKey = sub.submissionID ?? `pending-${sub.studentID}`
                        return (
                          <tr key={rowKey}>
                            <td>{sub.studentName}</td>
                            <td>{sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '—'}</td>
                            <td>
                              {done ? (
                                <span className="workspace-pill workspace-pill--done">Graded</span>
                              ) : sub.submittedAt ? (
                                <span className="workspace-pill workspace-pill--pending">Needs grade</span>
                              ) : (
                                <span className="workspace-pill workspace-pill--open">Not submitted</span>
                              )}
                            </td>
                            <td>
                              {sub.submittedAt && !done ? (
                                <form
                                  className="workspace-grade-form"
                                  onSubmit={async (e) => {
                                    e.preventDefault()
                                    setBusyId(`grade-${gkey}`)
                                    setMsg('')
                                    try {
                                      await apiFetch(`/api/faculty/activities/${a.id}/grade`, {
                                        token,
                                        method: 'POST',
                                        body: {
                                          studentID: sub.studentID,
                                          score: gradeDraft[gkey]?.score,
                                          feedback: gradeDraft[gkey]?.feedback || '',
                                        },
                                      })
                                      setMsg('Score saved.')
                                      setGradeDraft((prev) => {
                                        const next = { ...prev }
                                        delete next[gkey]
                                        return next
                                      })
                                      await loadAll()
                                    } catch (err) {
                                      setMsg(err?.message || 'Could not save score.')
                                    } finally {
                                      setBusyId('')
                                    }
                                  }}
                                >
                                  <input
                                    type="number"
                                    min={0}
                                    max={a.maxScore ?? 100}
                                    placeholder={`0–${a.maxScore ?? 100}`}
                                    value={gradeDraft[gkey]?.score ?? ''}
                                    onChange={(e) =>
                                      setGradeDraft((prev) => ({
                                        ...prev,
                                        [gkey]: { ...prev[gkey], score: e.target.value },
                                      }))
                                    }
                                    required
                                  />
                                  <input
                                    type="text"
                                    placeholder="Feedback"
                                    value={gradeDraft[gkey]?.feedback ?? ''}
                                    onChange={(e) =>
                                      setGradeDraft((prev) => ({
                                        ...prev,
                                        [gkey]: { ...prev[gkey], feedback: e.target.value },
                                      }))
                                    }
                                  />
                                  <button type="submit" className="btn btn-outline" disabled={busyId === `grade-${gkey}`}>
                                    Save
                                  </button>
                                </form>
                              ) : done ? (
                                <span>
                                  <strong>{sub.score}</strong> / {a.maxScore ?? 100}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {(a.submissions || [])
                    .filter((sub) => sub.content)
                    .map((sub) => (
                      <details key={`d-${sub.submissionID}`} className="workspace-sub-detail">
                        <summary>
                          Work from {sub.studentName}
                          {sub.gradedAt ? ` — score ${sub.score}` : ''}
                        </summary>
                        <pre className="workspace-sub-pre">{sub.content}</pre>
                      </details>
                    ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
