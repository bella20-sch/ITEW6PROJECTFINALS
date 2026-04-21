import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { apiFetch } from '../lib/api'
import { useLmsBase, lmsPath } from '../lib/lmsPaths'
import ContentLoadingSkeleton from '../components/ContentLoadingSkeleton'
import DirectoryLoadErrorPanel from '../components/DirectoryLoadErrorPanel'
import { ClipboardList, Sparkles, Send, CheckCircle2 } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'

export default function StudentActivitiesHub() {
  const { token, currentUser } = useAuth()
  const { courses, directoryStatus, reloadDirectory } = useData()
  const base = useLmsBase()
  const [searchParams, setSearchParams] = useSearchParams()
  const [assignments, setAssignments] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [busyId, setBusyId] = useState('')
  const [submissionDraft, setSubmissionDraft] = useState({})
  const [submitConfirmAid, setSubmitConfirmAid] = useState(null)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setMsg('')
    try {
      const [a, act] = await Promise.all([
        apiFetch('/api/me/assignments', { token }),
        apiFetch('/api/me/activities', { token }),
      ])
      setAssignments(Array.isArray(a) ? a : [])
      setActivities(Array.isArray(act) ? act : [])
    } catch {
      setMsg('Could not load activities.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  const enriched = useMemo(() => {
    return assignments.map((x) => {
      const c = courses.find((co) => Number(co.courseID) === Number(x.courseID))
      return {
        ...x,
        key: x.teachingLoadId ?? x.id,
        programCode: c?.courseCode || '—',
        tabLabel: `${x.subjectCode || 'SUB'} · Sec. ${x.section}`,
      }
    })
  }, [assignments, courses])

  const tlParam = searchParams.get('tl')
  const activeTl = tlParam ? Number(tlParam) : enriched[0]?.key

  useEffect(() => {
    if (!enriched.length) return
    const valid = enriched.some((e) => Number(e.key) === Number(tlParam))
    if (!tlParam || !valid) {
      setSearchParams({ tl: String(enriched[0].key) }, { replace: true })
    }
  }, [enriched, tlParam, setSearchParams])

  const forClass = useMemo(() => {
    return activities.filter((a) => Number(a.teachingLoadID) === Number(activeTl))
  }, [activities, activeTl])

  useEffect(() => {
    if (!forClass.length) return
    setSubmissionDraft((prev) => {
      const next = { ...prev }
      forClass.forEach((a) => {
        const id = a.id ?? a.classActivityID
        const c = a.mySubmission?.content
        if (c && next[id] === undefined) next[id] = c
      })
      return next
    })
  }, [forClass])

  if (currentUser?.role !== 'Student') {
    return <Navigate to={lmsPath(base, '/')} replace />
  }

  if (directoryStatus === 'loading' || directoryStatus === 'idle') {
    return <ContentLoadingSkeleton title="Loading…" />
  }
  if (directoryStatus === 'error') {
    return <DirectoryLoadErrorPanel onRetry={reloadDirectory} />
  }

  if (loading) {
    return <ContentLoadingSkeleton title="Loading activities…" />
  }

  const selectClass = (id) => {
    setSearchParams({ tl: String(id) }, { replace: true })
  }

  return (
    <div className="page student-learning-hub">
      <header className="students-hero" aria-labelledby="student-act-hub-title">
        <div className="students-hero-glow" aria-hidden="true" />
        <div className="students-hero-grid" aria-hidden="true" />
        <div className="students-hero-inner">
          <div className="students-hero-copy">
            <div className="students-hero-badge">
              <span className="students-hero-badge-icon">
                <ClipboardList size={18} strokeWidth={2.25} aria-hidden />
              </span>
              <span className="students-hero-badge-text">CCS · All subjects</span>
            </div>
            <h2 id="student-act-hub-title" className="students-hero-title">
              Activities
            </h2>
            <p className="students-hero-sub">
              Pick a class tab, then view and submit activities posted for that subject.
            </p>
            <ul className="students-hero-tags">
              <li>
                <Sparkles size={12} strokeWidth={2} aria-hidden /> {enriched.length}{' '}
                {enriched.length === 1 ? 'class' : 'classes'}
              </li>
              <li>
                <ClipboardList size={12} strokeWidth={2} aria-hidden /> {activities.length} total items
              </li>
            </ul>
          </div>
        </div>
      </header>

      {msg ? (
        <div className="workspace-banner" role="status">
          {msg}
        </div>
      ) : null}

      {!enriched.length ? (
        <p className="muted">No class enrollments yet.</p>
      ) : (
        <>
          <nav className="student-hub-class-tabs faculty-class-tabs workspace-tabs" role="tablist" aria-label="Classes">
            {enriched.map((cl) => (
              <button
                key={cl.key}
                type="button"
                role="tab"
                aria-selected={Number(activeTl) === Number(cl.key)}
                className={`faculty-class-tab ${Number(activeTl) === Number(cl.key) ? 'is-active' : ''}`}
                onClick={() => selectClass(cl.key)}
              >
                <span className="student-hub-tab-main">{cl.subjectTitle || 'Subject'}</span>
                <span className="student-hub-tab-sub muted">{cl.tabLabel}</span>
              </button>
            ))}
          </nav>

          <section className="faculty-class-panel student-hub-panel">
            {!forClass.length ? (
              <p className="muted">No activities posted for this class yet.</p>
            ) : (
              <div className="workspace-activity-stack">
                {forClass.map((a) => {
                  const aid = a.id ?? a.classActivityID
                  return (
                    <article key={aid} className="workspace-activity-card">
                      <header className="workspace-activity-top">
                        <div>
                          <h4>{a.title}</h4>
                          <p className="workspace-activity-classline muted">
                            {a.subjectTitle} ({a.subjectCode}) · {String(a.assessmentKind || 'activity').toUpperCase()} ·{' '}
                            {String(a.gradingPeriod || 'prelim')}
                          </p>
                          {a.description && <p className="workspace-activity-desc">{a.description}</p>}
                          <p className="muted small">
                            Deadline: {a.deadline ? new Date(a.deadline).toLocaleString() : '—'}
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
                            <label>Your work</label>
                            <textarea
                              value={submissionDraft[aid] || ''}
                              onChange={(e) => setSubmissionDraft((p) => ({ ...p, [aid]: e.target.value }))}
                              rows={4}
                              required
                            />
                            <div className="workspace-form-actions">
                              <button
                                type="submit"
                                className="btn btn-primary workspace-form-submit"
                                disabled={busyId === `s-${aid}`}
                              >
                                {busyId === `s-${aid}` ? (
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
        </>
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
          setBusyId(`s-${aid}`)
          setMsg('')
          try {
            await apiFetch(`/api/student/activities/${aid}/submit`, {
              token,
              method: 'POST',
              body: { content: submissionDraft[aid] || '' },
            })
            setMsg('Submitted successfully.')
            await load()
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
