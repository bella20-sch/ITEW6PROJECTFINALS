import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { apiFetch } from '../lib/api'
import { useLmsBase, lmsPath } from '../lib/lmsPaths'
import ContentLoadingSkeleton from '../components/ContentLoadingSkeleton'
import DirectoryLoadErrorPanel from '../components/DirectoryLoadErrorPanel'
import { FileText, Sparkles, ExternalLink, GraduationCap } from 'lucide-react'
import FilterDropdown from '../components/FilterDropdown'

export default function StudentMaterialsHub() {
  const { token, currentUser } = useAuth()
  const { courses, directoryStatus, reloadDirectory } = useData()
  const base = useLmsBase()
  const [searchParams, setSearchParams] = useSearchParams()
  const [assignments, setAssignments] = useState([])
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setMsg('')
    try {
      const [a, m] = await Promise.all([
        apiFetch('/api/me/assignments', { token }),
        apiFetch('/api/me/materials', { token }),
      ])
      setAssignments(Array.isArray(a) ? a : [])
      setMaterials(Array.isArray(m) ? m : [])
    } catch {
      setMsg('Could not load materials.')
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
    return materials.filter((m) => Number(m.teachingLoadId ?? m.teachingLoadID) === Number(activeTl))
  }, [materials, activeTl])

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
    return <ContentLoadingSkeleton title="Loading materials…" />
  }

  const selectClass = (id) => {
    setSearchParams({ tl: String(id) }, { replace: true })
  }

  return (
    <div className="page student-learning-hub">
      <header className="students-hero" aria-labelledby="student-mat-hub-title">
        <div className="students-hero-glow" aria-hidden="true" />
        <div className="students-hero-grid" aria-hidden="true" />
        <div className="students-hero-inner">
          <div className="students-hero-copy">
            <div className="students-hero-badge">
              <span className="students-hero-badge-icon">
                <FileText size={18} strokeWidth={2.25} aria-hidden />
              </span>
              <span className="students-hero-badge-text">CCS · All subjects</span>
            </div>
            <h2 id="student-mat-hub-title" className="students-hero-title">
              Materials
            </h2>
            <p className="students-hero-sub">Choose a class tab to see readings, notes, and links your instructors posted.</p>
            <ul className="students-hero-tags">
              <li>
                <Sparkles size={12} strokeWidth={2} aria-hidden /> {enriched.length}{' '}
                {enriched.length === 1 ? 'class' : 'classes'}
              </li>
              <li>
                <FileText size={12} strokeWidth={2} aria-hidden /> {materials.length} total items
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

      {msg ? (
        <div className="workspace-banner" role="status">
          {msg}
        </div>
      ) : null}

      {!enriched.length ? (
        <p className="muted">No class enrollments yet.</p>
      ) : (
        <>
          <div className="tabs-mobile-select" aria-label="Classes">
            <FilterDropdown
              ariaLabel="Classes"
              value={String(activeTl)}
              onChange={(v) => selectClass(v)}
              placeholder="Select…"
              options={enriched.map((cl) => ({
                value: String(cl.key),
                label: `${cl.subjectTitle || 'Subject'} · ${cl.tabLabel}`,
              }))}
            />
          </div>
          <nav className="student-hub-class-tabs faculty-class-tabs workspace-tabs tabs-desktop" role="tablist" aria-label="Classes">
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
              <p className="muted">No materials posted for this class yet.</p>
            ) : (
              <ul className="faculty-class-lesson-list">
                {forClass.map((m) => {
                  const posted = m.postedAt ? new Date(m.postedAt).toLocaleString() : null
                  return (
                    <li key={m.sectionMaterialID ?? m.id} className="faculty-class-lesson-card">
                      <div className="lesson-post-head">
                        <div className="lesson-post-title">
                          <FileText size={18} aria-hidden />
                          <h3>{m.title}</h3>
                        </div>
                        <div className="lesson-post-meta muted">
                          {posted ? <span>{posted}</span> : null}
                          {m.facultyName ? <span>{m.facultyName}</span> : null}
                        </div>
                      </div>
                      {m.content ? <p className="faculty-class-lesson-body">{m.content}</p> : null}
                      {m.link ? (
                        <a href={m.link} target="_blank" rel="noreferrer" className="faculty-class-lesson-link">
                          <ExternalLink size={14} aria-hidden />
                          {m.link}
                        </a>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
