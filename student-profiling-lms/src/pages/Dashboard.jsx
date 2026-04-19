import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, FileBarChart, BookOpen, UserCircle, LayoutDashboard, BarChart3,
  GraduationCap, TrendingUp, UserCheck, UserX, ChevronRight,
  Sparkles, AlertTriangle, Mars, Venus,
} from 'lucide-react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
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

export default function Dashboard() {
  const { students, courses, faculty, profiles } = useData()
  const { currentUser } = useAuth()
  const base = useLmsBase()
  const isFaculty = currentUser?.role === 'Faculty'
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
      .sort((a, b) => new Date(b.violationDate || b.created_at || 0) - new Date(a.violationDate || a.created_at || 0))
      .slice(0, 3)

    return { enrolled, dropped, graduated, male, female, byCourse, byYear, byStatus, recent,
             hasProfiles, topSkills, regular, irregular, transferee, maxType,
             allViolations, pendingViolations, resolvedViolations, recentViolations }
  }, [students, courses, profiles])

  const enrolledPct = students.length > 0 ? Math.round((s.enrolled / students.length) * 100) : 0

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
            to={lmsPath(base, isFaculty ? '/my-classes' : '/courses')}
            className="dash-stat-tile dash-stat-tile--link"
          >
            <span className="dash-stat-tile-icon"><BookOpen size={20} strokeWidth={2} /></span>
            <span className="dash-stat-tile-copy">
              <span className="dash-stat-tile-value">{isFaculty ? '—' : courses.length}</span>
              <span className="dash-stat-tile-label">{isFaculty ? 'My classes' : 'Courses'}</span>
              {isFaculty ? <span className="dash-stat-tile-hint">Sections you teach</span> : null}
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
            {!s.hasProfiles
              ? <p className="muted dash-chart-empty">Load student profiles to see full stats</p>
              : s.topSkills.length > 0
                ? s.topSkills.map(sk => (
                    <MiniBar key={sk.name} label={sk.name} value={sk.count} max={s.topSkills[0].count} color="#8b5cf6" />
                  ))
                : <p className="muted dash-chart-empty">No skills recorded</p>
            }
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
          {s.allViolations.length > 0 && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.allViolations.length} total</span>}
        </div>
        {!s.hasProfiles ? (
          <p className="muted" style={{ padding: '1rem 1.25rem' }}>Load student profiles to see full stats</p>
        ) : s.allViolations.length === 0 ? (
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
        <Link to={lmsPath(base, isFaculty ? '/my-classes' : '/courses')} className="action-card">
          <BookOpen size={28} />
          <h3>{isFaculty ? 'My classes' : 'Courses'}</h3>
          <p>
            {isFaculty
              ? 'Open each section to see students, lessons, activities, and term grades (prelim, midterm, finals).'
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
