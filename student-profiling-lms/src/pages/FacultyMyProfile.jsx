import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  UserCircle,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  Calendar,
  GraduationCap,
  Shield,
  KeyRound,
  Info,
  Users,
  IdCard,
} from 'lucide-react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useLmsBase, lmsPath } from '../lib/lmsPaths'
import { apiFetch } from '../lib/api'
import ContentLoadingSkeleton from '../components/ContentLoadingSkeleton'
import DirectoryLoadErrorPanel from '../components/DirectoryLoadErrorPanel'

function formatDate(iso) {
  if (!iso) return '—'
  const d = String(iso).slice(0, 10)
  if (!d || d.length < 10) return iso
  const [y, m, day] = d.split('-')
  return `${m}/${day}/${y}`
}

export default function FacultyMyProfile() {
  const { courses, departments, crud, directoryStatus, reloadDirectory } = useData()
  const { token } = useAuth()
  const base = useLmsBase()
  const me = crud.faculty.getAll()[0] || null
  const [assignments, setAssignments] = useState([])
  const [assignmentsLoading, setAssignmentsLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setAssignmentsLoading(false)
      return
    }
    let cancelled = false
    setAssignmentsLoading(true)
    apiFetch('/api/me/assignments', { token })
      .then((d) => {
        if (!cancelled) setAssignments(Array.isArray(d) ? d : [])
      })
      .catch(() => {
        if (!cancelled) setAssignments([])
      })
      .finally(() => {
        if (!cancelled) setAssignmentsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const dept = useMemo(
    () => departments.find((d) => Number(d.departmentID) === Number(me?.departmentID)),
    [departments, me?.departmentID],
  )
  const primaryCourse = useMemo(
    () => courses.find((c) => Number(c.courseID) === Number(me?.courseID)),
    [courses, me?.courseID],
  )

  if (directoryStatus === 'loading' || directoryStatus === 'idle') {
    return <ContentLoadingSkeleton title="Loading directory data…" />
  }
  if (directoryStatus === 'error') {
    return <DirectoryLoadErrorPanel onRetry={reloadDirectory} />
  }

  if (!me) {
    return (
      <div className="page faculty-my-profile">
        <p className="muted">Loading your profile…</p>
      </div>
    )
  }

  const fullName = [me.firstName, me.middleName, me.lastName].filter(Boolean).join(' ').trim()
  const displayNameFormal = [me.lastName, [me.firstName, me.middleName].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  const hasPrimarySection =
    me.courseID != null && String(me.section || '').trim() !== ''

  const aboutText = [
    `${fullName} is on record as ${me.position || 'faculty'} in the ${dept?.departmentName || 'College of Computer Studies'}.`,
    me.employmentStatus ? `Employment type: ${me.employmentStatus}.` : null,
    hasPrimarySection
      ? `Primary program assignment: ${primaryCourse?.courseCode || 'Program'} · Section ${me.section}.`
      : 'No primary program/section is set on your directory record yet — MIS can link this for advising and roster matching.',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="page faculty-my-profile">
      <div className="profile-toolbar">
        <Link to={lmsPath(base, '/')} className="back-link">
          <ArrowLeft size={18} strokeWidth={2} aria-hidden />
          Back to dashboard
        </Link>
      </div>
      <section className="faculty-my-profile-hero" aria-labelledby="faculty-my-profile-title">
        <div className="faculty-my-profile-hero-inner">
          <div className="faculty-my-profile-avatar-wrap">
            {me.photo ? (
              <img src={me.photo} alt="" className="faculty-my-profile-avatar" />
            ) : (
              <div className="faculty-my-profile-avatar faculty-my-profile-avatar--placeholder" aria-hidden>
                <UserCircle size={56} strokeWidth={1.5} />
              </div>
            )}
          </div>
          <div className="faculty-my-profile-hero-copy">
            <p className="faculty-my-profile-kicker">CCS · Faculty directory</p>
            <h1 id="faculty-my-profile-title" className="faculty-my-profile-title">
              {displayNameFormal}
            </h1>
            <p className="faculty-my-profile-role">{me.position || '—'}</p>
            <ul className="faculty-my-profile-chips">
              <li>{dept?.departmentName || 'Department —'}</li>
              <li>{me.employmentStatus || '—'}</li>
              <li>Hired {formatDate(me.hireDate)}</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="faculty-my-profile-grid">
        <section className="faculty-my-profile-card" aria-labelledby="faculty-about-heading">
          <h2 id="faculty-about-heading" className="faculty-my-profile-card-title">
            <Info size={20} strokeWidth={2} aria-hidden />
            About you
          </h2>
          <p className="faculty-my-profile-prose">{aboutText}</p>
          <dl className="faculty-my-profile-dl">
            <div>
              <dt><IdCard size={16} aria-hidden /> Full name</dt>
              <dd>{fullName}</dd>
            </div>
            <div>
              <dt><Briefcase size={16} aria-hidden /> Position</dt>
              <dd>{me.position || '—'}</dd>
            </div>
            <div>
              <dt><Building2 size={16} aria-hidden /> Department</dt>
              <dd>{dept?.departmentName || '—'}</dd>
            </div>
            <div>
              <dt><Calendar size={16} aria-hidden /> Hire date</dt>
              <dd>{formatDate(me.hireDate)}</dd>
            </div>
          </dl>
        </section>

        <section className="faculty-my-profile-card" aria-labelledby="faculty-contact-heading">
          <h2 id="faculty-contact-heading" className="faculty-my-profile-card-title">
            <Mail size={20} strokeWidth={2} aria-hidden />
            Contact & office
          </h2>
          <dl className="faculty-my-profile-dl">
            <div>
              <dt><Mail size={16} aria-hidden /> Institutional email</dt>
              <dd>{me.email || '—'}</dd>
            </div>
            <div>
              <dt><Phone size={16} aria-hidden /> Contact number</dt>
              <dd>{me.contactNumber?.trim() ? me.contactNumber : '—'}</dd>
            </div>
            <div>
              <dt><MapPin size={16} aria-hidden /> Office</dt>
              <dd>{me.officeLocation?.trim() ? me.officeLocation : '—'}</dd>
            </div>
          </dl>
        </section>

        <section className="faculty-my-profile-card faculty-my-profile-card--wide" aria-labelledby="faculty-sections-heading">
          <h2 id="faculty-sections-heading" className="faculty-my-profile-card-title">
            <GraduationCap size={20} strokeWidth={2} aria-hidden />
            Sections & classes you handle
          </h2>
          <p className="faculty-my-profile-muted">
            Program and section assignments are maintained by MIS. Listed below are your directory-linked section (if any) and every
            subject line assigned to you for this term.
          </p>

          {hasPrimarySection ? (
            <div className="faculty-my-profile-highlight">
              <span className="faculty-my-profile-highlight-label">Primary directory section</span>
              <p className="faculty-my-profile-highlight-body">
                <strong>{primaryCourse?.courseCode || `Program #${me.courseID}`}</strong>
                {primaryCourse?.courseName ? ` — ${primaryCourse.courseName}` : null} · Section{' '}
                <strong>{me.section}</strong>
              </p>
              <p className="faculty-my-profile-muted small">
                This pairing is used for advising and matching students to your managed sections when no separate subject line exists.
              </p>
            </div>
          ) : (
            <p className="faculty-my-profile-muted">No primary program/section on file.</p>
          )}

          <h3 className="faculty-my-profile-subheading">
            <Users size={18} strokeWidth={2} aria-hidden />
            Assigned subjects (teaching loads)
          </h3>
          {assignmentsLoading ? (
            <p className="muted">Loading assignments…</p>
          ) : assignments.length === 0 ? (
            <p className="faculty-my-profile-muted">
              No subject lines are assigned yet. Ask MIS to add teaching loads under <strong>Account provisioning</strong> →{' '}
              <strong>Assign class to faculty</strong>.
            </p>
          ) : (
            <ul className="faculty-my-profile-loads">
              {assignments.map((tl) => {
                const cid = Number(tl.courseID)
                const c = courses.find((x) => Number(x.courseID) === cid)
                return (
                  <li key={tl.teachingLoadId ?? tl.id} className="faculty-my-profile-load">
                    <div className="faculty-my-profile-load-top">
                      <span className="faculty-my-profile-load-code">{tl.subjectCode || '—'}</span>
                      <span className="faculty-my-profile-load-section">Sec. {tl.section || '—'}</span>
                    </div>
                    <div className="faculty-my-profile-load-title">{tl.subjectTitle || 'Subject'}</div>
                    <div className="faculty-my-profile-load-meta">
                      {c?.courseCode || '—'} · {c?.courseName || 'Program'}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="faculty-my-profile-card faculty-my-profile-card--wide" aria-labelledby="faculty-account-heading">
          <h2 id="faculty-account-heading" className="faculty-my-profile-card-title">
            <Shield size={20} strokeWidth={2} aria-hidden />
            Sign-in & credentials
          </h2>
          <p className="faculty-my-profile-muted">
            Use your institutional credentials to access this LMS. For security, your password is never shown on this screen.
          </p>
          <dl className="faculty-my-profile-dl">
            <div>
              <dt><Mail size={16} aria-hidden /> Login email (username)</dt>
              <dd>
                <code className="faculty-my-profile-code">{me.email || '—'}</code>
              </dd>
            </div>
            <div>
              <dt><KeyRound size={16} aria-hidden /> Password</dt>
              <dd>
                <span className="faculty-my-profile-mask">••••••••••••</span>
                <span className="faculty-my-profile-muted small"> Not displayed</span>
              </dd>
            </div>
          </dl>
          <div className="faculty-my-profile-callout" role="note">
            <strong>Need changes?</strong> To reset your password, update your login email, or correct your official name and employment
            details, submit a request to <strong>MIS / the system administrator</strong>. They can also adjust your program, section, and
            assigned subjects.
          </div>
        </section>
      </div>
    </div>
  )
}
