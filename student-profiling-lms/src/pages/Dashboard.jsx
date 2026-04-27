import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, FileBarChart, BookOpen, UserCircle, LayoutDashboard, BarChart3,
  GraduationCap, TrendingUp, UserCheck, UserX, ChevronRight,
  Sparkles, AlertTriangle, Mars, Venus,
} from 'lucide-react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'
import DirectoryFetchBarrier from '../components/DirectoryFetchBarrier'
import { useLmsBase, lmsPath } from '../lib/lmsPaths'

function MiniBar({ label, value, max, color = '#fb923c' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="dash-mini-bar">
      <div className="dash-mini-bar-label">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="dash-mini-bar-track">
        <div className="dash-mini-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function isPastDeadline(value) {
  if (!value) return false
  const t = new Date(value).getTime()
  return Number.isFinite(t) && t < Date.now()
}

const FAILING_PERCENT_THRESHOLD = 60

export default function Dashboard() {
  const { students, courses, faculty, profiles } = useData()
  const { currentUser, token } = useAuth()
  const base = useLmsBase()
  const [insights, setInsights] = useState(null)
  const [insightsStatus, setInsightsStatus] = useState('idle')
  const [roleScope, setRoleScope] = useState({
    status: 'idle',
    assignments: [],
    activities: [],
  })

  useEffect(() => {
    if (!token || currentUser?.role === 'Student') {
      setInsights(null)
      setInsightsStatus('idle')
      return
    }
    let cancelled = false
    setInsightsStatus('loading')
    ;(async () => {
      try {
        const data = await apiFetch('/api/meta/dashboard-insights', { token })
        if (!cancelled) {
          setInsights(data)
          setInsightsStatus('ready')
        }
      } catch {
        if (!cancelled) {
          setInsights(null)
          setInsightsStatus('error')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, currentUser?.role])
  useEffect(() => {
    if (!token || (currentUser?.role !== 'Faculty' && currentUser?.role !== 'Student')) {
      setRoleScope({ status: 'idle', assignments: [], activities: [] })
      return
    }
    let cancelled = false
    setRoleScope((p) => ({ ...p, status: 'loading' }))
    ;(async () => {
      try {
        const [assignments, activities] = await Promise.all([
          apiFetch('/api/me/assignments', { token }),
          apiFetch('/api/me/activities', { token }),
        ])
        if (!cancelled) {
          setRoleScope({
            status: 'ready',
            assignments: Array.isArray(assignments) ? assignments : [],
            activities: Array.isArray(activities) ? activities : [],
          })
        }
      } catch {
        if (!cancelled) setRoleScope({ status: 'error', assignments: [], activities: [] })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, currentUser?.role])
  const isFaculty = currentUser?.role === 'Faculty'
  const isStudent = currentUser?.role === 'Student'
  const isAdmin = currentUser?.role === 'Admin'
  const myFacultyId = currentUser?.id
  const facultyHubPath =
    isFaculty && myFacultyId != null && myFacultyId !== ''
      ? lmsPath(base, `/faculty/${myFacultyId}`)
      : lmsPath(base, '/faculty')

  const s = useMemo(() => {
    const enrolled  = students.filter(x => x.enrollmentStatus === 'Enrolled').length
    const dropped   = students.filter(x => x.enrollmentStatus === 'Dropped').length
    const graduated = students.filter(x => x.enrollmentStatus === 'Graduated').length
    const male      = students.filter(x => x.gender === 'Male').length
    const female    = students.filter(x => x.gender === 'Female').length

    const byCourse = courses.map(c => ({
      code: c.courseCode,
      count: students.filter(x => x.courseID === c.courseID).length,
    }))

    const byYear = [1,2,3,4,5,6]
      .map(y => ({ label: `Year ${y}`, count: students.filter(x => x.yearLevel === y).length }))
      .filter(y => y.count > 0)

    const byStatus = [
      { label: 'Enrolled',  count: enrolled,  color: '#10b981' },
      { label: 'Dropped',   count: dropped,   color: '#ef4444' },
      { label: 'Graduated', count: graduated, color: '#3b82f6' },
    ].filter(x => x.count > 0)

    const recent = [...students].sort((a, b) => b.studentID - a.studentID).slice(0, 5)

    // Profile-derived stats (fallback when dashboard insights are not loaded — e.g. opened student pages)
    const profileList = Object.values(profiles)

    // Top skills + violations: prefer server aggregates (MIS / faculty); else cached profiles from opened students
    let topSkills = []
    let allViolations = []
    let pendingViolations = 0
    let resolvedViolations = 0
    let recentViolations = []
    let totalViolations = 0

    if (insights) {
      topSkills = insights.topSkills || []
      pendingViolations = insights.pendingViolations ?? 0
      resolvedViolations = insights.resolvedViolations ?? 0
      recentViolations = insights.recentViolations || []
      totalViolations = insights.totalViolations ?? 0
    } else {
      const skillCounts = {}
      profileList.forEach(p => {
        (p.skills || []).forEach(sk => {
          const name = sk.skillName || sk.name || 'Unknown'
          skillCounts[name] = (skillCounts[name] || 0) + 1
        })
      })
      topSkills = Object.entries(skillCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }))

      profileList.forEach(p => {
        (p.violations || []).forEach(v => {
          allViolations.push({ ...v, studentID: p.studentID, studentName: `${p.lastName}, ${p.firstName}` })
        })
      })
      pendingViolations = allViolations.filter(v => v.status === 'Pending').length
      resolvedViolations = allViolations.filter(v => v.status === 'Resolved').length
      recentViolations = [...allViolations]
        .sort((a, b) => new Date(b.violationDate || b.created_at || 0) - new Date(a.violationDate || a.created_at || 0))
        .slice(0, 3)
      totalViolations = allViolations.length
    }

    // Student type breakdown
    const regular    = students.filter(x => x.studentType === 'Regular').length
    const irregular  = students.filter(x => x.studentType === 'Irregular').length
    const transferee = students.filter(x => x.studentType === 'Transferee').length
    const maxType    = Math.max(regular, irregular, transferee, 1)

    return { enrolled, dropped, graduated, male, female, byCourse, byYear, byStatus, recent,
             topSkills, regular, irregular, transferee, maxType,
             pendingViolations, resolvedViolations, recentViolations, totalViolations }
  }, [students, courses, profiles, insights])

  const enrolledPct = students.length > 0 ? Math.round((s.enrolled / students.length) * 100) : 0

  const studentSummary = useMemo(() => {
    const assignments = roleScope.assignments || []
    const activities = roleScope.activities || []
    const graded = activities.filter((a) => a?.mySubmission?.gradedAt)
    const awaiting = activities.filter((a) => a?.mySubmission?.submittedAt && !a?.mySubmission?.gradedAt)
    const pending = activities.filter((a) => !a?.mySubmission?.submittedAt)
    const overdue = pending.filter((a) => isPastDeadline(a?.deadline))
    const avgPct = graded.length
      ? Math.round(
        (graded.reduce((sum, a) => {
          const max = Number(a?.maxScore) > 0 ? Number(a.maxScore) : 100
          const score = Number(a?.mySubmission?.score)
          if (!Number.isFinite(score) || max <= 0) return sum
          return sum + (score / max) * 100
        }, 0) / graded.length) * 100,
      ) / 100
      : null
    return { assignments, activities, graded, awaiting, pending, overdue, avgPct }
  }, [roleScope.assignments, roleScope.activities])

  const facultySummary = useMemo(() => {
    const assignments = roleScope.assignments || []
    const activities = roleScope.activities || []
    const studentsByLoad = new Map()
    const studentNameById = new Map()
    assignments.forEach((a) => {
      const loadId = Number(a.teachingLoadId ?? a.teachingLoadID ?? a.id)
      const list = Array.isArray(a.students) ? a.students : []
      studentsByLoad.set(loadId, list)
      list.forEach((st) => {
        const sid = Number(st.studentID)
        if (!studentNameById.has(sid)) {
          studentNameById.set(sid, `${st.lastName || ''}, ${st.firstName || ''}`.replace(/^,\s*/, '').trim())
        }
      })
    })

    let gradedCount = 0
    let awaitingCount = 0
    let overdueMissingCount = 0
    const failingCounts = new Map()
    const overdueRows = []

    activities.forEach((a) => {
      const submissions = Array.isArray(a.submissions) ? a.submissions : []
      const max = Number(a.maxScore) > 0 ? Number(a.maxScore) : 100
      const submittedIds = new Set()
      submissions.forEach((sub) => {
        const sid = Number(sub.studentID)
        if (sub?.submittedAt) submittedIds.add(sid)
        if (sub?.submittedAt && !sub?.gradedAt) awaitingCount += 1
        if (sub?.gradedAt) {
          gradedCount += 1
          const pct = max > 0 ? (Number(sub.score) / max) * 100 : null
          if (pct != null && Number.isFinite(pct) && pct < FAILING_PERCENT_THRESHOLD) {
            failingCounts.set(sid, (failingCounts.get(sid) || 0) + 1)
          }
        }
      })

      if (isPastDeadline(a?.deadline)) {
        const loadId = Number(a.teachingLoadID ?? a.teachingLoadId)
        const roster = studentsByLoad.get(loadId) || []
        const missing = roster.filter((st) => !submittedIds.has(Number(st.studentID)))
        if (missing.length > 0) {
          overdueMissingCount += missing.length
          overdueRows.push({
            activityID: a.classActivityID ?? a.id,
            title: a.title || 'Untitled activity',
            deadline: a.deadline,
            missingCount: missing.length,
          })
        }
      }
    })

    const failingStudents = [...failingCounts.entries()]
      .map(([studentID, failCount]) => ({
        studentID,
        failCount,
        name: studentNameById.get(studentID) || `Student #${studentID}`,
      }))
      .sort((a, b) => b.failCount - a.failCount)

    return {
      assignments,
      activities,
      studentsHandled: studentNameById.size,
      gradedCount,
      awaitingCount,
      overdueMissingCount,
      failingStudents,
      overdueRows: overdueRows.sort((a, b) => new Date(a.deadline) - new Date(b.deadline)),
    }
  }, [roleScope.assignments, roleScope.activities])

  if (isStudent) {
    const me = students[0] || null
    return (
      <DirectoryFetchBarrier>
        <div className="dashboard">
          <header className="dashboard-masthead" aria-labelledby="student-dashboard-masthead-title">
            <div className="dashboard-masthead-glow" aria-hidden="true" />
            <div className="dashboard-masthead-grid" aria-hidden="true" />
            <div className="dashboard-masthead-top">
              <div className="dashboard-masthead-copy">
                <div className="dashboard-masthead-badge">
                  <span className="dashboard-masthead-badge-icon"><LayoutDashboard size={18} strokeWidth={2.25} aria-hidden /></span>
                  <span className="dashboard-masthead-badge-text">Student · Personal overview</span>
                </div>
                <h2 id="student-dashboard-masthead-title" className="dashboard-masthead-title">My dashboard</h2>
                <p className="dashboard-masthead-sub">
                  Your classes, submissions, and grades only.
                  {me ? ` (${me.lastName}, ${me.firstName})` : ''}
                </p>
                <ul className="dashboard-masthead-tags">
                  <li><Sparkles size={12} strokeWidth={2} aria-hidden /> {studentSummary.assignments.length} class{studentSummary.assignments.length === 1 ? '' : 'es'}</li>
                  <li><BookOpen size={12} strokeWidth={2} aria-hidden /> {studentSummary.activities.length} tracked activities</li>
                  <li><GraduationCap size={12} strokeWidth={2} aria-hidden /> {studentSummary.graded.length} graded</li>
                </ul>
              </div>
              <div className="dashboard-masthead-visual" aria-hidden="true">
                <div className="dashboard-masthead-orbit">
                  <span className="dashboard-masthead-orbit-ring" />
                  <span className="dashboard-masthead-orbit-dot dashboard-masthead-orbit-dot--a" />
                  <span className="dashboard-masthead-orbit-dot dashboard-masthead-orbit-dot--b" />
                  <span className="dashboard-masthead-orbit-dot dashboard-masthead-orbit-dot--c" />
                  <span className="dashboard-masthead-orbit-center">
                    <GraduationCap size={26} strokeWidth={1.85} />
                  </span>
                </div>
              </div>
            </div>
            <div className="dashboard-masthead-stats">
              <Link to={lmsPath(base, '/classes')} className="dash-stat-tile dash-stat-tile--link">
                <span className="dash-stat-tile-icon"><BookOpen size={20} strokeWidth={2} /></span>
                <span className="dash-stat-tile-copy">
                  <span className="dash-stat-tile-value">{studentSummary.assignments.length}</span>
                  <span className="dash-stat-tile-label">My classes</span>
                </span>
              </Link>
              <Link to={lmsPath(base, '/activities')} className="dash-stat-tile dash-stat-tile--link">
                <span className="dash-stat-tile-icon"><Users size={20} strokeWidth={2} /></span>
                <span className="dash-stat-tile-copy">
                  <span className="dash-stat-tile-value">{studentSummary.pending.length}</span>
                  <span className="dash-stat-tile-label">Pending activities</span>
                </span>
              </Link>
              <div className="dash-stat-tile">
                <span className="dash-stat-tile-icon"><AlertTriangle size={20} strokeWidth={2} /></span>
                <span className="dash-stat-tile-copy">
                  <span className="dash-stat-tile-value">{studentSummary.overdue.length}</span>
                  <span className="dash-stat-tile-label">Overdue</span>
                </span>
              </div>
              <div className="dash-stat-tile">
                <span className="dash-stat-tile-icon"><GraduationCap size={20} strokeWidth={2} /></span>
                <span className="dash-stat-tile-copy">
                  <span className="dash-stat-tile-value">{studentSummary.avgPct != null ? `${studentSummary.avgPct}%` : '—'}</span>
                  <span className="dash-stat-tile-label">Average (graded)</span>
                </span>
              </div>
            </div>
          </header>

          <div className="dash-widgets dash-widgets--two">
            <div className="dash-recent">
              <div className="dash-recent-header">
                <AlertTriangle size={16} strokeWidth={2} />
                <h3>Overdue activities</h3>
              </div>
              {roleScope.status === 'loading' ? <p className="muted" style={{ padding: '1rem 1.25rem' }}>Loading…</p> : null}
              {roleScope.status === 'error' ? <p className="muted" style={{ padding: '1rem 1.25rem' }}>Could not load your activity summary.</p> : null}
              {roleScope.status !== 'loading' && roleScope.status !== 'error' && (
                studentSummary.overdue.length > 0 ? studentSummary.overdue.slice(0, 6).map((a) => (
                  <Link key={a.id ?? a.classActivityID} to={lmsPath(base, '/activities')} className="dash-recent-row">
                    <div className="dash-recent-info">
                      <div className="dash-recent-name">{a.title || 'Untitled activity'}</div>
                      <div className="dash-recent-meta">Deadline: {a.deadline ? new Date(a.deadline).toLocaleString() : '—'}</div>
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                  </Link>
                )) : <p className="muted" style={{ padding: '1rem 1.25rem' }}>No overdue activities.</p>
              )}
            </div>

            <div className="dash-recent">
              <div className="dash-recent-header">
                <TrendingUp size={16} strokeWidth={2} />
                <h3>Recently graded</h3>
              </div>
              {studentSummary.graded.length > 0 ? studentSummary.graded.slice(0, 6).map((a) => {
                const max = Number(a.maxScore) > 0 ? Number(a.maxScore) : 100
                const score = Number(a?.mySubmission?.score)
                const pct = Number.isFinite(score) ? Math.round((score / max) * 10000) / 100 : null
                return (
                  <Link key={a.id ?? a.classActivityID} to={lmsPath(base, '/activities')} className="dash-recent-row">
                    <div className="dash-recent-info">
                      <div className="dash-recent-name">{a.title || 'Untitled activity'}</div>
                      <div className="dash-recent-meta">
                        Score: {Number.isFinite(score) ? score : '—'} / {max}
                        {pct != null ? ` (${pct}%)` : ''}
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                  </Link>
                )
              }) : <p className="muted" style={{ padding: '1rem 1.25rem' }}>No graded activities yet.</p>}
            </div>
          </div>
        </div>
      </DirectoryFetchBarrier>
    )
  }

  if (isFaculty) {
    return (
      <DirectoryFetchBarrier>
        <div className="dashboard">
          <header className="dashboard-masthead" aria-labelledby="faculty-dashboard-masthead-title">
            <div className="dashboard-masthead-glow" aria-hidden="true" />
            <div className="dashboard-masthead-grid" aria-hidden="true" />
            <div className="dashboard-masthead-top">
              <div className="dashboard-masthead-copy">
                <div className="dashboard-masthead-badge">
                  <span className="dashboard-masthead-badge-icon"><LayoutDashboard size={18} strokeWidth={2.25} aria-hidden /></span>
                  <span className="dashboard-masthead-badge-text">Faculty · Teaching overview</span>
                </div>
                <h2 id="faculty-dashboard-masthead-title" className="dashboard-masthead-title">My teaching dashboard</h2>
                <p className="dashboard-masthead-sub">
                  Track the classes, sections, and students assigned to you, then quickly spot submissions that still need grading or learners who may need intervention.
                </p>
                <ul className="dashboard-masthead-tags">
                  <li><Sparkles size={12} strokeWidth={2} aria-hidden /> {facultySummary.assignments.length} class{facultySummary.assignments.length === 1 ? '' : 'es'}</li>
                  <li><Users size={12} strokeWidth={2} aria-hidden /> {facultySummary.studentsHandled} students handled</li>
                  <li><BookOpen size={12} strokeWidth={2} aria-hidden /> {facultySummary.activities.length} activities tracked</li>
                </ul>
              </div>
              <div className="dashboard-masthead-visual" aria-hidden="true">
                <div className="dashboard-masthead-orbit">
                  <span className="dashboard-masthead-orbit-ring" />
                  <span className="dashboard-masthead-orbit-dot dashboard-masthead-orbit-dot--a" />
                  <span className="dashboard-masthead-orbit-dot dashboard-masthead-orbit-dot--b" />
                  <span className="dashboard-masthead-orbit-dot dashboard-masthead-orbit-dot--c" />
                  <span className="dashboard-masthead-orbit-center">
                    <GraduationCap size={26} strokeWidth={1.85} />
                  </span>
                </div>
              </div>
            </div>
            <div className="dashboard-masthead-stats">
              <Link to={lmsPath(base, '/my-classes')} className="dash-stat-tile dash-stat-tile--link">
                <span className="dash-stat-tile-icon"><BookOpen size={20} strokeWidth={2} /></span>
                <span className="dash-stat-tile-copy">
                  <span className="dash-stat-tile-value">{facultySummary.assignments.length}</span>
                  <span className="dash-stat-tile-label">My classes</span>
                  <span className="dash-stat-tile-hint">Sections currently assigned</span>
                </span>
              </Link>
              <Link to={lmsPath(base, '/students')} className="dash-stat-tile dash-stat-tile--link">
                <span className="dash-stat-tile-icon"><Users size={20} strokeWidth={2} /></span>
                <span className="dash-stat-tile-copy">
                  <span className="dash-stat-tile-value">{facultySummary.studentsHandled}</span>
                  <span className="dash-stat-tile-label">Students handled</span>
                  <span className="dash-stat-tile-hint">Unique learners in your loads</span>
                </span>
              </Link>
              <div className="dash-stat-tile">
                <span className="dash-stat-tile-icon"><AlertTriangle size={20} strokeWidth={2} /></span>
                <span className="dash-stat-tile-copy">
                  <span className="dash-stat-tile-value">{facultySummary.awaitingCount}</span>
                  <span className="dash-stat-tile-label">Awaiting grading</span>
                  <span className="dash-stat-tile-hint">Submitted but not graded yet</span>
                </span>
              </div>
              <div className="dash-stat-tile">
                <span className="dash-stat-tile-icon"><UserX size={20} strokeWidth={2} /></span>
                <span className="dash-stat-tile-copy">
                  <span className="dash-stat-tile-value">{facultySummary.failingStudents.length}</span>
                  <span className="dash-stat-tile-label">Students below {FAILING_PERCENT_THRESHOLD}%</span>
                  <span className="dash-stat-tile-hint">Needs attention or follow-up</span>
                </span>
              </div>
            </div>
          </header>

          <div className="dash-widgets dash-widgets--two">
            <div className="dash-recent">
              <div className="dash-recent-header">
                <UserX size={16} strokeWidth={2} />
                <h3>At-risk students (failing grades)</h3>
              </div>
              {roleScope.status === 'loading' ? <p className="muted" style={{ padding: '1rem 1.25rem' }}>Loading…</p> : null}
              {roleScope.status === 'error' ? <p className="muted" style={{ padding: '1rem 1.25rem' }}>Could not load your class analytics.</p> : null}
              {roleScope.status !== 'loading' && roleScope.status !== 'error' && (
                facultySummary.failingStudents.length > 0 ? facultySummary.failingStudents.slice(0, 8).map((r) => (
                  <Link key={r.studentID} to={lmsPath(base, `/students/${r.studentID}`)} className="dash-recent-row">
                    <div className="dash-recent-info">
                      <div className="dash-recent-name">{r.name}</div>
                      <div className="dash-recent-meta">{r.failCount} failing graded item(s)</div>
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                  </Link>
                )) : <p className="muted" style={{ padding: '1rem 1.25rem' }}>No failing graded records found.</p>
              )}
            </div>

            <div className="dash-recent">
              <div className="dash-recent-header">
                <AlertTriangle size={16} strokeWidth={2} />
                <h3>Past-deadline, not submitted</h3>
              </div>
              {roleScope.status !== 'loading' && roleScope.status !== 'error' && facultySummary.overdueRows.length > 0 && (
                <div style={{ padding: '0.75rem 1.25rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  Total missing submissions: <strong>{facultySummary.overdueMissingCount}</strong>
                </div>
              )}
              {roleScope.status !== 'loading' && roleScope.status !== 'error' && (
                facultySummary.overdueRows.length > 0 ? facultySummary.overdueRows.slice(0, 8).map((row) => (
                  <Link key={row.activityID} to={lmsPath(base, '/my-classes')} className="dash-recent-row">
                    <div className="dash-recent-info">
                      <div className="dash-recent-name">{row.title}</div>
                      <div className="dash-recent-meta">
                        {row.missingCount} not submitted · Deadline {row.deadline ? new Date(row.deadline).toLocaleString() : '—'}
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                  </Link>
                )) : <p className="muted" style={{ padding: '1rem 1.25rem' }}>No overdue missing submissions.</p>
              )}
            </div>
          </div>
        </div>
      </DirectoryFetchBarrier>
    )
  }

  if (!isAdmin) return null

  return (
    <DirectoryFetchBarrier>
    <div className="dashboard">
      <header className="dashboard-masthead" aria-labelledby="dashboard-masthead-title">
        <div className="dashboard-masthead-glow" aria-hidden="true" />
        <div className="dashboard-masthead-grid" aria-hidden="true" />
        <div className="dashboard-masthead-top">
          <div className="dashboard-masthead-copy">
            <div className="dashboard-masthead-badge">
              <span className="dashboard-masthead-badge-icon">
                <LayoutDashboard size={18} strokeWidth={2.25} aria-hidden />
              </span>
              <span className="dashboard-masthead-badge-text">CCS · Overview & analytics</span>
            </div>
            <h2 id="dashboard-masthead-title" className="dashboard-masthead-title">
              College dashboard
            </h2>
            <p className="dashboard-masthead-sub">
              Live snapshot of enrollment, programs, and faculty — Pamantasan ng Cabuyao student profiling (
              <span className="dashboard-masthead-programs">BSIT · BSCS · BSIS</span>).
            </p>
            <ul className="dashboard-masthead-tags">
              <li><Sparkles size={12} strokeWidth={2} aria-hidden /> {students.length} students</li>
              <li><BookOpen size={12} strokeWidth={2} aria-hidden /> {courses.length} programs</li>
              <li><UserCircle size={12} strokeWidth={2} aria-hidden /> {faculty.length} faculty</li>
            </ul>
          </div>
          <div className="dashboard-masthead-visual" aria-hidden="true">
            <div className="dashboard-masthead-orbit">
              <span className="dashboard-masthead-orbit-ring" />
              <span className="dashboard-masthead-orbit-dot dashboard-masthead-orbit-dot--a" />
              <span className="dashboard-masthead-orbit-dot dashboard-masthead-orbit-dot--b" />
              <span className="dashboard-masthead-orbit-dot dashboard-masthead-orbit-dot--c" />
              <span className="dashboard-masthead-orbit-center">
                <BarChart3 size={26} strokeWidth={1.85} />
              </span>
            </div>
          </div>
        </div>

        <div className="dashboard-masthead-stats">
          <Link to={lmsPath(base, '/students')} className="dash-stat-tile dash-stat-tile--link">
            <span className="dash-stat-tile-icon"><Users size={20} strokeWidth={2} /></span>
            <span className="dash-stat-tile-copy">
              <span className="dash-stat-tile-value">{students.length}</span>
              <span className="dash-stat-tile-label">Total students</span>
              <span className="dash-stat-tile-hint">{s.enrolled} enrolled</span>
            </span>
          </Link>
          <Link
            to={lmsPath(base, isFaculty ? '/my-classes' : isStudent ? '/classes' : '/courses')}
            className="dash-stat-tile dash-stat-tile--link"
          >
            <span className="dash-stat-tile-icon"><BookOpen size={20} strokeWidth={2} /></span>
            <span className="dash-stat-tile-copy">
              <span className="dash-stat-tile-value">{isFaculty || isStudent ? '—' : courses.length}</span>
              <span className="dash-stat-tile-label">{isFaculty ? 'My classes' : isStudent ? 'Classes' : 'Courses'}</span>
              {isFaculty ? <span className="dash-stat-tile-hint">Sections you teach</span> : null}
              {isStudent ? <span className="dash-stat-tile-hint">This semester</span> : null}
            </span>
          </Link>
          <Link to={facultyHubPath} className="dash-stat-tile dash-stat-tile--link">
            <span className="dash-stat-tile-icon"><UserCircle size={20} strokeWidth={2} /></span>
            <span className="dash-stat-tile-copy">
              <span className="dash-stat-tile-value">{isFaculty ? 1 : faculty.length}</span>
              <span className="dash-stat-tile-label">{isFaculty ? 'My profile' : 'Faculty'}</span>
            </span>
          </Link>
          <div className="dash-stat-tile">
            <span className="dash-stat-tile-icon"><UserCheck size={20} strokeWidth={2} /></span>
            <span className="dash-stat-tile-copy">
              <span className="dash-stat-tile-value">{s.enrolled}</span>
              <span className="dash-stat-tile-label">Enrolled</span>
              <span className="dash-stat-tile-hint">{enrolledPct}% of total</span>
            </span>
          </div>
          <div className="dash-stat-tile">
            <span className="dash-stat-tile-icon"><UserX size={20} strokeWidth={2} /></span>
            <span className="dash-stat-tile-copy">
              <span className="dash-stat-tile-value">{s.dropped}</span>
              <span className="dash-stat-tile-label">Dropped</span>
            </span>
          </div>
          <div className="dash-stat-tile">
            <span className="dash-stat-tile-icon"><GraduationCap size={20} strokeWidth={2} /></span>
            <span className="dash-stat-tile-copy">
              <span className="dash-stat-tile-value">{s.graduated}</span>
              <span className="dash-stat-tile-label">Graduated</span>
            </span>
          </div>
        </div>
      </header>

      {/* Widgets row */}
      <div className="dash-widgets">
        <div className="dash-recent">
          <div className="dash-recent-header">
            <BookOpen size={16} strokeWidth={2} />
            <h3>Students by Course</h3>
          </div>
          <div className="dash-chart-body">
            {s.byCourse.map(c => (
              <MiniBar key={c.code} label={c.code} value={c.count} max={students.length} color="#fb923c" />
            ))}
            {s.byCourse.every(c => c.count === 0) && <p className="muted dash-chart-empty">No data</p>}
          </div>
        </div>

        <div className="dash-recent">
          <div className="dash-recent-header">
            <TrendingUp size={16} strokeWidth={2} />
            <h3>Students by Year Level</h3>
          </div>
          <div className="dash-chart-body">
            {s.byYear.length > 0
              ? s.byYear.map(y => <MiniBar key={y.label} label={y.label} value={y.count} max={students.length} color="#6366f1" />)
              : <p className="muted dash-chart-empty">No data</p>
            }
          </div>
        </div>

        <div className="dash-recent">
          <div className="dash-recent-header">
            <UserCheck size={16} strokeWidth={2} />
            <h3>Enrollment Status</h3>
          </div>
          <div className="dash-chart-body">
            {s.byStatus.length > 0
              ? s.byStatus.map(x => <MiniBar key={x.label} label={x.label} value={x.count} max={students.length} color={x.color} />)
              : <p className="muted dash-chart-empty">No data</p>
            }
            {students.length > 0 && (
              <div className="dash-gender-row dash-gender-row--sectioned">
                <span className="dash-gender-stat dash-gender-stat--male">
                  <span className="dash-gender-icon-wrap" aria-hidden>
                    <Mars size={20} strokeWidth={2.25} />
                  </span>
                  <span className="dash-gender-label">Male <strong>{s.male}</strong></span>
                </span>
                <span className="dash-gender-stat dash-gender-stat--female">
                  <span className="dash-gender-icon-wrap" aria-hidden>
                    <Venus size={20} strokeWidth={2.25} />
                  </span>
                  <span className="dash-gender-label">Female <strong>{s.female}</strong></span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skills + Student Type row */}
      <div className="dash-widgets dash-widgets--two">
        <div className="dash-recent">
          <div className="dash-recent-header">
            <Sparkles size={16} strokeWidth={2} />
            <h3>Top Skills</h3>
          </div>
          <div className="dash-chart-body">
            {insightsStatus === 'loading' && currentUser?.role !== 'Student' ? (
              <p className="muted dash-chart-empty">Loading…</p>
            ) : insightsStatus === 'error' && currentUser?.role !== 'Student' ? (
              <p className="muted dash-chart-empty">Could not load skills.</p>
            ) : s.topSkills.length > 0 ? (
              s.topSkills.map(sk => (
                <MiniBar
                  key={sk.name}
                  label={sk.name}
                  value={sk.count}
                  max={s.topSkills[0]?.count || 1}
                  color="#8b5cf6"
                />
              ))
            ) : (
              <p className="muted dash-chart-empty">No skills recorded</p>
            )}
          </div>
        </div>

        <div className="dash-recent">
          <div className="dash-recent-header">
            <Users size={16} strokeWidth={2} />
            <h3>Student Type Breakdown</h3>
          </div>
          <div className="dash-chart-body">
            <MiniBar label="Regular" value={s.regular} max={s.maxType} color="#10b981" />
            <MiniBar label="Irregular" value={s.irregular} max={s.maxType} color="#f59e0b" />
            <MiniBar label="Transferee" value={s.transferee} max={s.maxType} color="#3b82f6" />
          </div>
        </div>
      </div>

      {/* Violations summary */}
      <div className="dash-recent">
        <div className="dash-recent-header">
          <AlertTriangle size={16} strokeWidth={2} />
          <h3>Violations Summary</h3>
          {s.totalViolations > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {s.totalViolations} total
            </span>
          )}
        </div>
        {insightsStatus === 'loading' && currentUser?.role !== 'Student' ? (
          <p className="muted" style={{ padding: '1rem 1.25rem' }}>Loading…</p>
        ) : insightsStatus === 'error' && currentUser?.role !== 'Student' ? (
          <p className="muted" style={{ padding: '1rem 1.25rem' }}>Could not load violations.</p>
        ) : s.totalViolations === 0 ? (
          <p className="muted" style={{ padding: '1rem 1.25rem' }}>No violations recorded</p>
        ) : (
          <>
            <div style={{ padding: '0.75rem 1.25rem', display: 'flex', gap: '2rem' }}>
              <MiniBar label="Pending"  value={s.pendingViolations}  max={Math.max(s.pendingViolations, s.resolvedViolations, 1)} color="#ef4444" />
              <MiniBar label="Resolved" value={s.resolvedViolations} max={Math.max(s.pendingViolations, s.resolvedViolations, 1)} color="#10b981" />
            </div>
            {s.recentViolations.map((v, i) => {
              const severityStyle =
                v.severity === 'Critical' ? { background: '#fce7f3', color: '#be185d' } :
                v.severity === 'Major'    ? { background: '#fee2e2', color: '#dc2626' } :
                                            { background: '#fef3c7', color: '#d97706' }
              const dateStr = v.violationDate
                ? new Date(v.violationDate).toLocaleDateString()
                : v.created_at
                  ? new Date(v.created_at).toLocaleDateString()
                  : '—'
              return (
                <Link key={v.violationID ?? i} to={lmsPath(base, `/students/${v.studentID}`)} className="dash-recent-row">
                  <div className="dash-recent-info">
                    <div className="dash-recent-name">{v.studentName}</div>
                    <div className="dash-recent-meta">{v.violationType || v.type || 'Violation'} · {dateStr}</div>
                  </div>
                  <span style={{ ...severityStyle, fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 999, flexShrink: 0 }}>
                    {v.severity || 'Minor'}
                  </span>
                </Link>
              )
            })}
          </>
        )}
      </div>

      {/* Recent students */}
      <div className="dash-recent">
        <div className="dash-recent-header">
          <Users size={16} strokeWidth={2} />
          <h3>Recently Added Students</h3>
          <Link to={lmsPath(base, '/students')}>View all</Link>
        </div>
        {s.recent.length > 0 ? s.recent.map(st => {
          const course = courses.find(c => c.courseID === st.courseID)
          return (
            <Link key={st.studentID} to={lmsPath(base, `/students/${st.studentID}`)} className="dash-recent-row">
              <div className="student-avatar" style={{ width: 36, height: 36, fontSize: '0.8rem', flexShrink: 0 }}>
                {st.photo
                  ? <img src={st.photo} alt={st.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : <>{st.firstName[0]}{st.lastName[0]}</>
                }
              </div>
              <div className="dash-recent-info">
                <div className="dash-recent-name">{st.lastName}, {st.firstName}</div>
                <div className="dash-recent-meta">{course?.courseCode || '—'} · Year {st.yearLevel} · {st.enrollmentStatus}</div>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            </Link>
          )
        }) : <p className="muted" style={{ padding: '1rem 1.25rem' }}>No students yet.</p>}
      </div>

      {/* Quick actions */}
      <section className="dashboard-actions">
        <Link to={lmsPath(base, '/students')} className="action-card">
          <Users size={28} />
          <h3>Students</h3>
          <p>View and manage all student profiles with full academic, medical, and personal records.</p>
        </Link>
        <Link to={lmsPath(base, '/reports')} className="action-card">
          <FileBarChart size={28} />
          <h3>Reports & Queries</h3>
          <p>Run queries — basketball tryouts, programming contest, honor roll, and custom filters.</p>
        </Link>
        <Link to={lmsPath(base, isFaculty ? '/my-classes' : isStudent ? '/classes' : '/courses')} className="action-card">
          <BookOpen size={28} />
          <h3>{isFaculty ? 'My classes' : isStudent ? 'Classes' : 'Courses'}</h3>
          <p>
            {isFaculty
              ? 'Open each section to see students, lessons, activities, and term grades (prelim, midterm, finals).'
              : isStudent
                ? 'See your subjects for the semester: activities, grades, and lessons.'
                : 'Manage BSIT, BSCS, BSIS and other CCS programs.'}
          </p>
        </Link>
        <Link to={facultyHubPath} className="action-card">
          <UserCircle size={28} />
          <h3>{isFaculty ? 'My profile' : 'Faculty'}</h3>
          <p>
            {isFaculty
              ? 'Open your faculty directory record. Academic assignments are updated by MIS.'
              : 'Manage CCS faculty members, positions, and contact information.'}
          </p>
        </Link>
      </section>
    </div>
    </DirectoryFetchBarrier>
  )
}
