import { useMemo, useState, useEffect, useCallback } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { apiFetch } from '../lib/api'
import { useLmsBase, lmsPath } from '../lib/lmsPaths'
import { GraduationCap, Layers, ChevronRight, BookOpen, Sparkles } from 'lucide-react'
import ContentLoadingSkeleton from '../components/ContentLoadingSkeleton'
import DirectoryLoadErrorPanel from '../components/DirectoryLoadErrorPanel'

export default function StudentClassesList() {
  const { currentUser, token } = useAuth()
  const { courses, directoryStatus, reloadDirectory } = useData()
  const base = useLmsBase()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

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

  const heroStats = useMemo(() => {
    return { classCount: enriched.length }
  }, [enriched])

  if (currentUser?.role !== 'Student') {
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
      <header className="students-hero" aria-labelledby="student-classes-hero-title">
        <div className="students-hero-glow" aria-hidden="true" />
        <div className="students-hero-grid" aria-hidden="true" />
        <div className="students-hero-inner">
          <div className="students-hero-copy">
            <div className="students-hero-badge">
              <span className="students-hero-badge-icon">
                <Layers size={18} strokeWidth={2.25} aria-hidden />
              </span>
              <span className="students-hero-badge-text">CCS · This semester</span>
            </div>
            <h2 id="student-classes-hero-title" className="students-hero-title">
              Classes
            </h2>
            <p className="students-hero-sub">
              These are the subjects you are enrolled in for this term. Open one for activities, grades, and lessons.
            </p>
            <ul className="students-hero-tags">
              <li>
                <Sparkles size={12} strokeWidth={2} aria-hidden /> {heroStats.classCount}{' '}
                {heroStats.classCount === 1 ? 'class' : 'classes'}
              </li>
            </ul>
          </div>
          <div className="students-hero-visual" aria-hidden="true">
            <div className="students-hero-orbit">
              <span className="students-hero-orbit-ring" />
              <span className="students-hero-orbit-dot students-hero-orbit-dot--a" />
              <span className="students-hero-orbit-dot students-hero-orbit-dot--b" />
              <span className="students-hero-orbit-center">
                <GraduationCap size={28} strokeWidth={1.85} />
              </span>
            </div>
          </div>
        </div>
      </header>

      {!enriched.length ? (
        <div className="empty-state">
          <p>No classes are linked to your enrollment yet.</p>
        </div>
      ) : (
        <ul className="faculty-my-classes-list">
          {enriched.map((tl) => (
            <li key={tl.key}>
              <Link to={lmsPath(base, `/classes/${tl.key}`)} className="faculty-my-classes-card">
                <div className="faculty-my-classes-card-main">
                  <span className="faculty-my-classes-badge">{tl.programCode}</span>
                  <span className="faculty-my-classes-section-pill">Sec. {tl.section}</span>
                  <h2 className="faculty-my-classes-subject">{tl.subjectTitle}</h2>
                  <p className="faculty-my-classes-meta">
                    <BookOpen size={14} aria-hidden />
                    {tl.subjectCode} · {tl.programName || tl.displayLabel}
                  </p>
                  <p className="faculty-my-classes-roster-hint muted">Activities · Grades · Lessons</p>
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
