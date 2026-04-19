import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'
import { useLmsBase, lmsPath } from '../lib/lmsPaths'
import FacultyStudentGradeCard from '../components/FacultyStudentGradeCard'
import { ArrowLeft, ChevronRight } from 'lucide-react'

export default function FacultyClassStudent() {
  const { teachingLoadId, studentId } = useParams()
  const tlId = Number(teachingLoadId)
  const sid = Number(studentId)
  const base = useLmsBase()
  const { token, currentUser } = useAuth()
  const [classroom, setClassroom] = useState(null)
  const [gradebook, setGradebook] = useState(null)
  const [schoolYear, setSchoolYear] = useState('2025-2026')
  const [semester, setSemester] = useState(1)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState('')

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
      setMsg(e?.message || 'Could not load this student for this class.')
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
  const roster = classroom?.students || []
  const activities = classroom?.activities || []

  const student = useMemo(() => roster.find((s) => Number(s.studentID) === sid) || null, [roster, sid])

  const gradeRow = useMemo(() => {
    const rows = gradebook?.students || []
    return rows.find((r) => Number(r.studentID) === sid) || null
  }, [gradebook, sid])

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

  const studentActivityRows = useMemo(() => {
    return activities.map((a) => {
      const rs = (a.rosterStatus || []).find((r) => Number(r.studentID) === sid)
      return {
        key: a.classActivityID ?? a.id,
        actId: a.classActivityID ?? a.id,
        title: a.title,
        period: a.gradingPeriod || 'prelim',
        kind: a.assessmentKind || 'activity',
        submitted: rs?.submitted ?? false,
        graded: rs?.graded ?? false,
        score: rs?.score ?? null,
        maxScore: a.maxScore ?? 100,
      }
    })
  }, [activities, sid])

  if (currentUser?.role !== 'Faculty') {
    return <Navigate to={lmsPath(base, '/')} replace />
  }

  if (!Number.isFinite(tlId) || !Number.isFinite(sid)) {
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

  if (!classroom || !student) {
    return (
      <div className="page">
        <p>{msg || 'Student is not in this class or you do not teach it.'}</p>
        <Link to={lmsPath(base, `/my-classes/${tlId}?tab=students`)}>Back to class</Link>
      </div>
    )
  }

  const displayName = `${student.lastName}, ${student.firstName}`

  return (
    <div className="page faculty-class-student-page">
      <Link to={lmsPath(base, `/my-classes/${tlId}?tab=students`)} className="faculty-class-back">
        <ArrowLeft size={18} />
        Back to class roster
      </Link>

      <header className="faculty-class-student-head">
        <p className="muted faculty-class-student-kicker">
          {tl?.subjectCode} · {tl?.subjectTitle} · {tl?.courseCode} Sec. {tl?.section}
        </p>
        <h1 className="faculty-class-student-title">{displayName}</h1>
        <p className="faculty-class-student-email muted">{student.email}</p>
      </header>

      {msg ? (
        <div className="workspace-banner" role="status">
          {msg}
        </div>
      ) : null}

      <div className="faculty-class-term-card faculty-class-student-term">
        <div className="faculty-class-term-grid">
          <label className="faculty-field">
            <span className="faculty-field-label">School year</span>
            <input
              className="faculty-field-input"
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
            />
          </label>
          <label className="faculty-field">
            <span className="faculty-field-label">Semester</span>
            <select
              className="faculty-field-input faculty-field-select"
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value))}
            >
              <option value={1}>1st semester</option>
              <option value={2}>2nd semester</option>
            </select>
          </label>
        </div>
      </div>

      <section className="faculty-class-student-section" aria-labelledby="stu-act-heading">
        <h2 id="stu-act-heading" className="faculty-class-panel-title">
          Activities in this class
        </h2>
        <p className="muted faculty-class-hint">
          Your posted work for this subject. Open an item to see the whole class submission list, or use the link to focus only on
          roster status.
        </p>
        {!studentActivityRows.length ? (
          <p className="muted">No activities posted for this class yet.</p>
        ) : (
          <ul className="faculty-class-student-act-list">
            {studentActivityRows.map((r) => (
              <li key={r.key}>
                <div className="faculty-class-student-act-row">
                  <div>
                    <span className="faculty-class-student-act-title">{r.title}</span>
                    <span className="muted small faculty-class-student-act-meta">
                      {String(r.kind).toUpperCase()} · {r.period} · Max {r.maxScore}
                    </span>
                    <div className="faculty-class-student-act-status muted small">
                      {r.submitted ? (r.graded ? `Graded — ${r.score ?? '—'} / ${r.maxScore}` : 'Submitted — awaiting grade') : 'Not submitted'}
                    </div>
                  </div>
                  <Link
                    to={lmsPath(base, `/my-classes/${tlId}/activities/${r.actId}`)}
                    className="btn btn-outline faculty-class-student-act-link"
                  >
                    Class roster <ChevronRight size={16} aria-hidden />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="faculty-class-student-section" aria-labelledby="stu-grade-heading">
        <h2 id="stu-grade-heading" className="faculty-class-panel-title">
          Grades for this class
        </h2>
        <p className="muted faculty-class-hint">
          Same breakdown as the class Grades tab: activities, attendance, quizzes, and exams by period, plus semester average.
        </p>
        {gradeRow ? (
          <FacultyStudentGradeCard row={gradeRow} busy={busy} onSavePeriod={savePeriodGrades} />
        ) : (
          <p className="muted">No grade row yet — use the class Grades tab or save once after entering data.</p>
        )}
      </section>
    </div>
  )
}
