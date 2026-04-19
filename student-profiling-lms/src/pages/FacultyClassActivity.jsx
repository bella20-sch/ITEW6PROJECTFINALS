import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'
import { useLmsBase, lmsPath } from '../lib/lmsPaths'
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react'

export default function FacultyClassActivity() {
  const { teachingLoadId, activityId } = useParams()
  const tlId = Number(teachingLoadId)
  const actId = Number(activityId)
  const base = useLmsBase()
  const { token, currentUser } = useAuth()
  const [classroom, setClassroom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    if (!token || !Number.isFinite(tlId)) return
    setLoading(true)
    setMsg('')
    try {
      const c = await apiFetch(`/api/faculty/teaching-loads/${tlId}/classroom`, { token })
      setClassroom(c)
    } catch (e) {
      setMsg(e?.message || 'Could not load this activity.')
      setClassroom(null)
    } finally {
      setLoading(false)
    }
  }, [token, tlId])

  useEffect(() => {
    load()
  }, [load])

  const activity = useMemo(() => {
    const list = classroom?.activities || []
    return list.find((a) => Number(a.classActivityID ?? a.id) === actId) || null
  }, [classroom, actId])

  const tl = classroom?.teachingLoad

  if (currentUser?.role !== 'Faculty') {
    return <Navigate to={lmsPath(base, '/')} replace />
  }

  if (!Number.isFinite(tlId) || !Number.isFinite(actId)) {
    return (
      <div className="page">
        <p className="muted">Invalid link.</p>
        <Link to={lmsPath(base, '/my-classes')}>My classes</Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading…</p>
      </div>
    )
  }

  if (!classroom || !activity) {
    return (
      <div className="page">
        <p>{msg || 'Activity not found or you do not teach this class.'}</p>
        <Link to={lmsPath(base, `/my-classes/${tlId}?tab=activities`)}>Back to class</Link>
      </div>
    )
  }

  return (
    <div className="page faculty-class-activity-page">
      <Link to={lmsPath(base, `/my-classes/${tlId}?tab=activities`)} className="faculty-class-back">
        <ArrowLeft size={18} />
        Back to activities
      </Link>

      <header className="faculty-class-activity-head">
        <p className="faculty-class-activity-meta muted">
          {tl?.courseCode} · Sec. {tl?.section} · {String(activity.assessmentKind || 'activity').toUpperCase()} ·{' '}
          {String(activity.gradingPeriod || 'prelim')}
        </p>
        <h1 className="faculty-class-activity-title">{activity.title}</h1>
        {activity.description ? (
          <p className="faculty-class-activity-desc">{activity.description}</p>
        ) : null}
        <dl className="faculty-class-activity-facts">
          <div>
            <dt>Max score</dt>
            <dd>{activity.maxScore ?? 100}</dd>
          </div>
          {activity.deadline ? (
            <div>
              <dt>Deadline</dt>
              <dd>{activity.deadline}</dd>
            </div>
          ) : null}
        </dl>
      </header>

      <section className="faculty-class-activity-roster-section" aria-labelledby="roster-heading">
        <h2 id="roster-heading" className="faculty-class-panel-title">
          Class submissions
        </h2>
        <p className="muted faculty-class-hint">
          See whether each student has submitted and been graded. Enter scores from{' '}
          <Link to={lmsPath(base, '/workspace')}>Teaching Workspace</Link>.
        </p>
        <div className="faculty-class-activity-table-wrap">
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
              {(activity.rosterStatus || []).map((row) => (
                <tr key={row.studentID}>
                  <td>{row.studentName}</td>
                  <td>
                    {row.submitted ? (
                      <CheckCircle2 className="faculty-class-ico-ok" size={20} aria-label="Submitted" />
                    ) : (
                      <Circle className="faculty-class-ico-no" size={20} aria-label="Not submitted" />
                    )}
                  </td>
                  <td>
                    {row.graded ? (
                      <CheckCircle2 className="faculty-class-ico-ok" size={20} aria-label="Graded" />
                    ) : (
                      <Circle className="faculty-class-ico-no" size={20} aria-label="Not graded" />
                    )}
                  </td>
                  <td>{row.score != null ? row.score : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
