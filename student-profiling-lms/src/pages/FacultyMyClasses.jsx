import { useMemo, useState, useEffect, useCallback } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { apiFetch } from '../lib/api'
import { useLmsBase, lmsPath } from '../lib/lmsPaths'
import { GraduationCap, Layers, ChevronRight, BookOpen } from 'lucide-react'
import ContentLoadingSkeleton from '../components/ContentLoadingSkeleton'
import DirectoryLoadErrorPanel from '../components/DirectoryLoadErrorPanel'

const PROGRAM_CODES = ['BSIT', 'BSCS', 'BSIS']

export default function FacultyMyClasses() {
  const { currentUser, token } = useAuth()
  const { courses, directoryStatus, reloadDirectory } = useData()
  const base = useLmsBase()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [programFilter, setProgramFilter] = useState('')

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const data = await apiFetch('/api/me/assignments', { token })
      setAssignments(Array.isArray(data) ? data : [])
    } catch {
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  const enriched = useMemo(() => {
    return assignments.map((a) => {
      const c = courses.find((x) => Number(x.courseID) === Number(a.courseID))
      return {
        ...a,
        programCode: c?.courseCode || '—',
        programName: c?.courseName || '',
        key: a.teachingLoadId ?? a.id,
      }
    })
  }, [assignments, courses])

  const filtered = useMemo(() => {
    if (!programFilter) return enriched
    return enriched.filter((x) => String(x.programCode) === programFilter)
  }, [enriched, programFilter])

  if (currentUser?.role !== 'Faculty') {
    return <Navigate to={lmsPath(base, '/')} replace />
  }

  if (directoryStatus === 'loading' || directoryStatus === 'idle') {
    return <ContentLoadingSkeleton title="Loading directory data…" />
  }
  if (directoryStatus === 'error') {
    return <DirectoryLoadErrorPanel onRetry={reloadDirectory} />
  }

  if (loading) {
    return <ContentLoadingSkeleton title="Loading your classes…" />
  }

  return (
    <div className="page faculty-my-classes">
      <header className="faculty-my-classes-hero">
        <div className="faculty-my-classes-hero-inner">
          <div className="faculty-my-classes-hero-icon" aria-hidden>
            <Layers size={28} strokeWidth={1.75} />
          </div>
          <div>
            <p className="faculty-my-classes-kicker">Teaching</p>
            <h1 className="faculty-my-classes-title">My classes</h1>
            <p className="faculty-my-classes-sub">
              Open a section to view students, posted lessons, activities (and submission status), and term grades. Filter by program
              (BSIT, BSCS, BSIS).
            </p>
          </div>
        </div>
      </header>

      <div className="faculty-my-classes-toolbar">
        <span className="faculty-my-classes-toolbar-label">Program</span>
        <div className="faculty-my-classes-filters" role="group" aria-label="Filter by program">
          <button
            type="button"
            className={`faculty-my-classes-chip ${!programFilter ? 'is-active' : ''}`}
            onClick={() => setProgramFilter('')}
          >
            All
          </button>
          {PROGRAM_CODES.map((code) => (
            <button
              key={code}
              type="button"
              className={`faculty-my-classes-chip ${programFilter === code ? 'is-active' : ''}`}
              onClick={() => setProgramFilter(code)}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {!filtered.length ? (
        <div className="empty-state">
          <p>No classes match this filter. MIS assigns subjects under your teaching loads.</p>
        </div>
      ) : (
        <ul className="faculty-my-classes-list">
          {filtered.map((tl) => (
            <li key={tl.key}>
              <Link to={lmsPath(base, `/my-classes/${tl.key}`)} className="faculty-my-classes-card">
                <div className="faculty-my-classes-card-main">
                  <span className="faculty-my-classes-badge">{tl.programCode}</span>
                  <span className="faculty-my-classes-section-pill">Sec. {tl.section}</span>
                  <h2 className="faculty-my-classes-subject">{tl.subjectTitle}</h2>
                  <p className="faculty-my-classes-meta">
                    <BookOpen size={14} aria-hidden />
                    {tl.subjectCode} · {tl.programName || tl.displayLabel}
                  </p>
                  <p className="faculty-my-classes-roster-hint">
                    <GraduationCap size={14} aria-hidden />
                    {Array.isArray(tl.students) ? `${tl.students.length} students` : 'Roster on file'}
                  </p>
                </div>
                <ChevronRight className="faculty-my-classes-chevron" size={22} aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
