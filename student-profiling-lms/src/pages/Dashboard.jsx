import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, FileBarChart, BookOpen, UserCircle,
  GraduationCap, TrendingUp, UserCheck, UserX, ChevronRight,
  Sparkles, AlertTriangle,
} from 'lucide-react'
import { useData } from '../context/DataContext'

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

export default function Dashboard() {
  const { students, courses, faculty, profiles } = useData()

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

    // Profile-derived stats
    const profileList = Object.values(profiles)
    const hasProfiles = profileList.length > 0

    // Top skills
    const skillCounts = {}
    profileList.forEach(p => {
      (p.skills || []).forEach(sk => {
        const name = sk.skillName || sk.name || 'Unknown'
        skillCounts[name] = (skillCounts[name] || 0) + 1
      })
    })
    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    // Student type breakdown
    const regular    = students.filter(x => x.studentType === 'Regular').length
    const irregular  = students.filter(x => x.studentType === 'Irregular').length
    const transferee = students.filter(x => x.studentType === 'Transferee').length
    const maxType    = Math.max(regular, irregular, transferee, 1)

    // Violations
    const allViolations = []
    profileList.forEach(p => {
      (p.violations || []).forEach(v => {
        allViolations.push({ ...v, studentID: p.studentID, studentName: `${p.lastName}, ${p.firstName}` })
      })
    })
    const pendingViolations  = allViolations.filter(v => v.status === 'Pending').length
    const resolvedViolations = allViolations.filter(v => v.status === 'Resolved').length
    const recentViolations   = [...allViolations]
      .sort((a, b) => new Date(b.violationDate || b.dateReported || b.created_at || 0) - new Date(a.violationDate || a.dateReported || a.created_at || 0))
      .slice(0, 3)

    return { enrolled, dropped, graduated, male, female, byCourse, byYear, byStatus, recent,
             hasProfiles, topSkills, regular, irregular, transferee, maxType,
             allViolations, pendingViolations, resolvedViolations, recentViolations }
  }, [students, courses, profiles])

  return (
    <div className="dashboard">
      <section className="dashboard-hero">
        <h2 className="dashboard-hero-title">College of Computer Studies</h2>
        <p className="dashboard-hero-subtitle">
          Student Profiling System — Pamantasan ng Cabuyao · BSIT · BSCS · BSIS
        </p>
      </section>

      {/* Stat cards */}
      <section className="dashboard-stats">
        <Link to="/students" className="stat-card stat-card-accent stat-card-link">
          <div className="stat-icon"><Users size={22} /></div>
          <div className="stat-content">
            <span className="stat-value">{students.length}</span>
            <span className="stat-label">Total Students</span>
            <span className="stat-card-sub">{s.enrolled} enrolled</span>
          </div>
        </Link>
        <Link to="/courses" className="stat-card stat-card-teal stat-card-link">
          <div className="stat-icon"><BookOpen size={22} /></div>
          <div className="stat-content">
            <span className="stat-value">{courses.length}</span>
            <span className="stat-label">Courses</span>
          </div>
        </Link>
        <Link to="/faculty" className="stat-card stat-card-blue stat-card-link">
          <div className="stat-icon"><UserCircle size={22} /></div>
          <div className="stat-content">
            <span className="stat-value">{faculty.length}</span>
            <span className="stat-label">Faculty</span>
          </div>
        </Link>
        <div className="stat-card stat-card-green">
          <div className="stat-icon"><UserCheck size={22} /></div>
          <div className="stat-content">
            <span className="stat-value">{s.enrolled}</span>
            <span className="stat-label">Enrolled</span>
            <span className="stat-card-sub">
              {students.length > 0 ? Math.round(s.enrolled / students.length * 100) : 0}% of total
            </span>
          </div>
        </div>
        <div className="stat-card stat-card-accent">
          <div className="stat-icon"><UserX size={22} /></div>
          <div className="stat-content">
            <span className="stat-value">{s.dropped}</span>
            <span className="stat-label">Dropped</span>
          </div>
        </div>
        <div className="stat-card stat-card-teal">
          <div className="stat-icon"><GraduationCap size={22} /></div>
          <div className="stat-content">
            <span className="stat-value">{s.graduated}</span>
            <span className="stat-label">Graduated</span>
          </div>
        </div>
      </section>

      {/* Widgets row */}
      <div className="dash-widgets">
        <div className="dash-widget">
          <h3><BookOpen size={15} /> Students by Course</h3>
          {s.byCourse.map(c => (
            <MiniBar key={c.code} label={c.code} value={c.count} max={students.length} color="#fb923c" />
          ))}
          {s.byCourse.every(c => c.count === 0) && <p className="muted">No data</p>}
        </div>

        <div className="dash-widget">
          <h3><TrendingUp size={15} /> Students by Year Level</h3>
          {s.byYear.length > 0
            ? s.byYear.map(y => <MiniBar key={y.label} label={y.label} value={y.count} max={students.length} color="#6366f1" />)
            : <p className="muted">No data</p>
          }
        </div>

        <div className="dash-widget">
          <h3><UserCheck size={15} /> Enrollment Status</h3>
          {s.byStatus.length > 0
            ? s.byStatus.map(x => <MiniBar key={x.label} label={x.label} value={x.count} max={students.length} color={x.color} />)
            : <p className="muted">No data</p>
          }
          {students.length > 0 && (
            <div className="dash-gender-row">
              <span>♂ Male: <strong>{s.male}</strong></span>
              <span>♀ Female: <strong>{s.female}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Skills + Student Type row */}
      <div className="dash-widgets" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="dash-widget">
          <h3><Sparkles size={15} /> Top Skills</h3>
          {s.topSkills.length > 0
            ? s.topSkills.map(sk => (
                <MiniBar key={sk.name} label={sk.name} value={sk.count} max={s.topSkills[0].count} color="#8b5cf6" />
              ))
            : <p className="muted">No skills recorded</p>
          }
        </div>

        <div className="dash-widget">
          <h3><Users size={15} /> Student Type Breakdown</h3>
          <MiniBar label="Regular"    value={s.regular}    max={s.maxType} color="#10b981" />
          <MiniBar label="Irregular"  value={s.irregular}  max={s.maxType} color="#f59e0b" />
          <MiniBar label="Transferee" value={s.transferee} max={s.maxType} color="#3b82f6" />
        </div>
      </div>

      {/* Violations summary */}
      <div className="dash-recent">
        <div className="dash-recent-header">
          <AlertTriangle size={16} />
          <h3>Violations Summary</h3>
          {s.allViolations.length > 0 && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.allViolations.length} total</span>}
        </div>
        {s.allViolations.length === 0 ? (
          <p className="muted" style={{ padding: '1rem 1.25rem' }}>No violations recorded</p>
        ) : (
          <>
            <div style={{ padding: '0.75rem 1.25rem', display: 'flex', gap: '2rem' }}>
              <MiniBar label="Pending"  value={s.pendingViolations}  max={Math.max(s.pendingViolations, s.resolvedViolations, 1)} color="#ef4444" />
              <MiniBar label="Resolved" value={s.resolvedViolations} max={Math.max(s.pendingViolations, s.resolvedViolations, 1)} color="#10b981" />
            </div>
            {s.recentViolations.map((v, i) => {
              const severity = v.severity || v.severityLevel || 'Minor'
              const severityStyle =
                severity === 'Critical' ? { background: '#fce7f3', color: '#be185d' } :
                severity === 'Major'    ? { background: '#fee2e2', color: '#dc2626' } :
                                          { background: '#fef3c7', color: '#d97706' }
              const dateStr = v.violationDate || v.dateReported
                ? new Date(v.violationDate || v.dateReported).toLocaleDateString()
                : v.created_at
                  ? new Date(v.created_at).toLocaleDateString()
                  : '—'
              return (
                <Link key={v.violationID ?? i} to={`/students/${v.studentID}`} className="dash-recent-row">
                  <div className="dash-recent-info">
                    <div className="dash-recent-name">{v.studentName}</div>
                    <div className="dash-recent-meta">{v.violationType || v.type || 'Violation'} · {dateStr}</div>
                  </div>
                  <span style={{ ...severityStyle, fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 999, flexShrink: 0 }}>
                    {severity}
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
          <Users size={16} />
          <h3>Recently Added Students</h3>
          <Link to="/students">View all</Link>
        </div>
        {s.recent.length > 0 ? s.recent.map(st => {
          const course = courses.find(c => c.courseID === st.courseID)
          return (
            <Link key={st.studentID} to={`/students/${st.studentID}`} className="dash-recent-row">
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
        <Link to="/students" className="action-card">
          <Users size={28} />
          <h3>Students</h3>
          <p>View and manage all student profiles with full academic, medical, and personal records.</p>
        </Link>
        <Link to="/reports" className="action-card">
          <FileBarChart size={28} />
          <h3>Reports & Queries</h3>
          <p>Run queries — basketball tryouts, programming contest, honor roll, and custom filters.</p>
        </Link>
        <Link to="/courses" className="action-card">
          <BookOpen size={28} />
          <h3>Courses</h3>
          <p>Manage BSIT, BSCS, BSIS and other CCS programs.</p>
        </Link>
        <Link to="/faculty" className="action-card">
          <UserCircle size={28} />
          <h3>Faculty</h3>
          <p>Manage CCS faculty members, positions, and contact information.</p>
        </Link>
      </section>
    </div>
  )
}
