import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Code, Award, ChevronDown, Users, Search, GraduationCap, AlertTriangle, Briefcase, Star, Shield, FileBarChart, Sparkles } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import DirectoryFetchBarrier from '../components/DirectoryFetchBarrier'
import { apiFetch } from '../lib/api'

const reportTemplates = [
  {
    id: 'basketball', title: 'Basketball Try-outs Qualified', description: 'Students with Basketball skill',
    icon: Trophy, color: '#f97316',
    filters: { skill: 'Basketball' },
  },
  {
    id: 'programming', title: 'Programming Contest Qualified', description: 'Students with Programming skill',
    icon: Code, color: '#6366f1',
    filters: { skill: 'Programming' },
  },
  {
    id: 'deans-lister', title: "Dean's Lister", description: 'Students with GPA 1.00 – 2.50',
    icon: GraduationCap, color: '#10b981',
    filters: { gpaMin: 1.0, gpaMax: 2.5 },
  },
  {
    id: 'presidents-list', title: "President's List", description: 'Students with GPA 1.00 – 1.25',
    icon: Award, color: '#f59e0b',
    filters: { gpaMin: 1.0, gpaMax: 1.25 },
  },
  {
    id: 'with-activities', title: 'Students with Non-Academic Activities', description: 'Students who joined at least one activity',
    icon: Briefcase, color: '#0ea5e9',
    filters: { hasActivities: true },
  },
  {
    id: 'with-affiliations', title: 'Students with Org Affiliations', description: 'Students who are members of organizations',
    icon: Star, color: '#8b5cf6',
    filters: { hasAffiliations: true },
  },
  {
    id: 'with-violations', title: 'Students with Violations', description: 'Students with at least one recorded violation',
    icon: AlertTriangle, color: '#ef4444',
    filters: { hasViolations: true },
  },
  {
    id: 'no-violations', title: 'Students with Clean Record', description: 'Students with zero violations',
    icon: Shield, color: '#10b981',
    filters: { hasViolations: false },
  },
]

const customQueryTemplate = {
  id: 'custom-query',
  title: 'Custom Query Report',
  description: 'Generated from your selected filters',
  icon: Search,
  color: '#0ea5e9',
}
/** Legacy single-report blob (v1). */
const CUSTOM_REPORT_STORAGE_KEY = 'reports.customQuery.savedReport.v1'
/** Saved custom reports list (v2): array of { id, title, description, filters, students, createdAt }. */
const CUSTOM_REPORTS_LIST_KEY = 'reports.customQuery.savedReports.v2'

function newCustomReportId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `cq-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** Case-insensitive match on name parts + student ID; multi-word queries require every token to appear somewhere in the combined fields. */
function matchesReportStudentSearch(p, query) {
  const raw = query.trim().toLowerCase()
  if (!raw) return true
  const hay = [
    p.firstName,
    p.middleName,
    p.lastName,
    String(p.studentID ?? ''),
  ].filter(Boolean).join(' ').toLowerCase()
  const tokens = raw.split(/\s+/).filter(Boolean)
  return tokens.every((t) => hay.includes(t))
}

function filterStudentsByReportSearch(students, query) {
  if (!Array.isArray(students) || students.length === 0) return []
  return students.filter((p) => matchesReportStudentSearch(p, query))
}

function readSavedReportsFromStorage() {
  if (typeof window === 'undefined') return []
  try {
    const rawV2 = window.localStorage.getItem(CUSTOM_REPORTS_LIST_KEY)
    if (rawV2) {
      const parsed = JSON.parse(rawV2)
      if (Array.isArray(parsed)) {
        return parsed.filter((x) => x && Array.isArray(x.students) && x.id)
      }
    }
    const rawV1 = window.localStorage.getItem(CUSTOM_REPORT_STORAGE_KEY)
    if (rawV1) {
      const parsed = JSON.parse(rawV1)
      if (parsed && Array.isArray(parsed.students)) {
        const migrated = {
          id: newCustomReportId(),
          title: parsed.title || 'Custom Query Report',
          description: parsed.description || 'Generated from your selected query filters',
          filters: Array.isArray(parsed.filters) ? parsed.filters : [],
          students: parsed.students,
          createdAt: parsed.createdAt || new Date().toISOString(),
          sessionOnly: false,
        }
        window.localStorage.setItem(CUSTOM_REPORTS_LIST_KEY, JSON.stringify([migrated]))
        window.localStorage.removeItem(CUSTOM_REPORT_STORAGE_KEY)
        return [migrated]
      }
    }
  } catch {
    /* ignore */
  }
  return []
}

export default function Reports() {
  const { token } = useAuth()
  const { courses, students } = useData()

  const getCourseCode = (courseID) => courses.find(c => c.courseID === courseID)?.courseCode || '—'

  const formatMeta = (p) => {
    const code = getCourseCode(p.courseID)
    return `${p.studentID} · Year ${p.yearLevel} - ${code} ${p.section || ''}`
  }
  const [openId, setOpenId] = useState(null)
  const [results, setResults] = useState({})

  const [customSkill, setCustomSkill] = useState('')
  const [customReportTitle, setCustomReportTitle] = useState('')
  const [customGpa, setCustomGpa] = useState('')
  const [customCourse, setCustomCourse] = useState('')
  const [customYear, setCustomYear] = useState('')
  const [retainInList, setRetainInList] = useState(true)
  /** Multiple saved custom query results (newest first). Loaded synchronously so persistence is not wiped on mount. */
  const [savedCustomReports, setSavedCustomReports] = useState(readSavedReportsFromStorage)
  const [customResult, setCustomResult] = useState(null)
  const [customLoading, setCustomLoading] = useState(false)
  const [customError, setCustomError] = useState('')
  const [skillOptions, setSkillOptions] = useState([])
  const [skillOptionsLoading, setSkillOptionsLoading] = useState(false)
  /** Per-report search terms (keyed by report id). */
  const [reportStudentSearchById, setReportStudentSearchById] = useState({})
  const blockWheelNumberChange = (e) => e.currentTarget.blur()
  const getReportSearch = (id) => reportStudentSearchById[id] || ''
  const setReportSearch = (id, value) => {
    setReportStudentSearchById((prev) => ({ ...prev, [id]: value }))
  }

  const queryStudents = async (filters) => {
    const res = await apiFetch('/api/reports/query-students', {
      token,
      method: 'POST',
      body: filters,
    })
    return Array.isArray(res?.students) ? res.students : []
  }

  const runAllTemplateReports = async () => {
    await Promise.all(reportTemplates.map((template) => runReport(template)))
  }

  const handleCustomQuery = async (e) => {
    e.preventDefault()
    if (!customSkill && !customGpa && !customCourse && !customYear) return
    setCustomLoading(true)
    setCustomError('')
    setCustomResult(null)
    try {
      const filters = {
        ...(customSkill ? { skill: customSkill } : {}),
        ...(customGpa ? { gpaMax: Number(customGpa) } : {}),
        ...(customCourse ? { courseID: Number(customCourse) } : {}),
        ...(customYear ? { yearLevel: Number(customYear) } : {}),
      }
      const summary = [
        customReportTitle ? `Report Title: ${customReportTitle}` : null,
        customSkill ? `Skill: ${customSkill}` : 'Skill: All',
        customGpa ? `Min GPA: ${customGpa}` : 'Min GPA: Any',
        customCourse ? `Course: ${courses.find((c) => Number(c.courseID) === Number(customCourse))?.courseCode || customCourse}` : 'Course: All',
        customYear ? `Year Level: ${customYear}` : 'Year Level: All',
      ].filter(Boolean)
      const filtered = await queryStudents(filters)
      const generatedTitle = customReportTitle.trim() || customQueryTemplate.title
      setCustomResult(filtered)
      const entry = {
        id: newCustomReportId(),
        title: generatedTitle,
        description: 'Generated from your selected query filters',
        filters: summary,
        students: filtered,
        createdAt: new Date().toISOString(),
        sessionOnly: !retainInList,
      }
      setSavedCustomReports((prev) => [entry, ...prev])
      setOpenId(`cq-${entry.id}`)
    } catch (err) {
      setCustomError(err?.message || 'Failed to run query.')
    } finally {
      setCustomLoading(false)
    }
  }

  const runReport = async (template, extraFilters = {}) => {
    const key = template.id
    setResults(prev => ({ ...prev, [key]: { loading: true, error: '', students: [] } }))
    try {
      const students = await queryStudents({ ...(template.filters || {}), ...(extraFilters || {}) })
      setResults(prev => ({ ...prev, [key]: { loading: false, error: '', students } }))
    } catch (err) {
      setResults(prev => ({ ...prev, [key]: { loading: false, error: err?.message || 'Failed.', students: [] } }))
    }
  }

  useEffect(() => {
    if (token) runAllTemplateReports()
  }, [token])

  useEffect(() => {
    if (!token) return
    let alive = true
    setSkillOptionsLoading(true)
    apiFetch('/api/reports/smart-eligibility/options?scope=global', { token })
      .then((data) => {
        if (!alive) return
        const tags = Array.isArray(data?.skillTags) ? data.skillTags : []
        setSkillOptions(tags)
      })
      .catch(() => {
        if (!alive) return
        setSkillOptions([])
      })
      .finally(() => {
        if (alive) setSkillOptionsLoading(false)
      })
    return () => {
      alive = false
    }
  }, [token])

  useEffect(() => {
    try {
      if (!retainInList) return
      window.localStorage.setItem(CUSTOM_REPORTS_LIST_KEY, JSON.stringify(savedCustomReports))
    } catch {
      /* quota */
    }
  }, [savedCustomReports, retainInList])

  useEffect(() => {
    if (!retainInList) return
    setSavedCustomReports((prev) => {
      if (!prev.some((r) => r.sessionOnly)) return prev
      return prev.map((r) => ({ ...r, sessionOnly: false }))
    })
  }, [retainInList])

  useEffect(() => {
    if (!openId?.startsWith('cq-')) return
    const rid = openId.slice(3)
    if (!savedCustomReports.some((r) => String(r.id) === rid)) setOpenId(null)
  }, [savedCustomReports, openId])

  const toggle = (templateOrId) => {
    const id = typeof templateOrId === 'string' ? templateOrId : templateOrId.id
    setOpenId(prev => prev === id ? null : id)
  }

  const deleteCustomReport = (reportId) => {
    setSavedCustomReports((prev) => prev.filter((r) => r.id !== reportId))
    if (openId === `cq-${reportId}`) setOpenId(null)
  }

  const exportCustomReportPdf = (reportPayload) => {
    const report = reportPayload
    if (!report || !Array.isArray(report.students)) return
    const doc = new jsPDF({ orientation: 'landscape' })
    const now = new Date().toLocaleString()
    const title = report.title || customQueryTemplate.title
    const filters = Array.isArray(report.filters) && report.filters.length > 0 ? report.filters : []

    const orangeAccent = [234, 88, 12]
    const orangeAccentSoft = [251, 146, 60]
    const orangeRowTint = [255, 251, 245]
    const border = [253, 230, 208]
    const textPrimary = [41, 37, 36]
    const textMuted = [113, 113, 122]

    const textStartX = 14

    doc.setFontSize(15)
    doc.setTextColor(...textPrimary)
    const titleLines = doc.splitTextToSize(title, 297 - textStartX - 14)
    doc.text(titleLines, textStartX, 13)
    doc.setFontSize(8.5)
    doc.setTextColor(...textMuted)
    doc.text(`Generated: ${now}`, textStartX, 13 + titleLines.length * 5 + 2)

    doc.setDrawColor(...orangeAccentSoft)
    doc.setLineWidth(0.35)
    const ruleY = Math.max(21, 13 + titleLines.length * 5 + 6)
    doc.line(textStartX, ruleY, 283, ruleY)

    const compactFilterSummary = (filters.length ? filters : ['No explicit filters'])
      .map((line) => line.replace(/^Report Title:\s*/i, '').trim())
      .join('  |  ')
    const filterMaxW = 297 - textStartX - 14
    const wrappedFilterLines = doc.splitTextToSize(`Filters: ${compactFilterSummary}`, filterMaxW)
    doc.setFontSize(8.5)
    doc.setTextColor(...orangeAccentSoft)
    doc.text(wrappedFilterLines, textStartX, ruleY + 5)

    const filterBlockH = 5 + (wrappedFilterLines.length - 1) * 4
    const tableStartY = ruleY + filterBlockH + 2

    autoTable(doc, {
      startY: tableStartY,
      head: [['Student', 'Student ID', 'Course / Year / Section', 'Latest GPA', 'Standing']],
      body: report.students.map((p) => [
        `${p.lastName || ''}, ${p.firstName || ''} ${p.middleName || ''}`.trim(),
        String(p.studentID || ''),
        `${getCourseCode(p.courseID)} · Year ${p.yearLevel || '—'} · ${p.section || '—'}`,
        p.latestGpa ?? '—',
        p.latestAcademicStanding || '—',
      ]),
      theme: 'striped',
      headStyles: { fillColor: orangeAccent, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: orangeRowTint },
      bodyStyles: { textColor: textPrimary, fontSize: 8.5 },
      margin: { left: 14, right: 14 },
      styles: { cellPadding: 2.7, lineColor: border, lineWidth: 0.12 },
    })

    doc.save(`${title.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '').toLowerCase() || 'custom-query-report'}.pdf`)
  }

  return (
    <DirectoryFetchBarrier>
    <div className="page">
      <header className="reports-hero" aria-labelledby="reports-hero-title">
        <div className="reports-hero-glow" aria-hidden="true" />
        <div className="reports-hero-grid" aria-hidden="true" />
        <div className="reports-hero-inner">
          <div className="reports-hero-copy">
            <div className="reports-hero-badge">
              <span className="reports-hero-badge-icon">
                <FileBarChart size={18} strokeWidth={2.25} aria-hidden />
              </span>
              <span className="reports-hero-badge-text">CCS · Analytics</span>
            </div>
            <h2 id="reports-hero-title" className="reports-hero-title">
              Reports & queries
            </h2>
            <p className="reports-hero-sub">
              Preset reports and a custom query builder across the student directory — skills, honors, activities, affiliations, and conduct. Results link to full profiles.
            </p>
            <ul className="reports-hero-tags">
              <li><Sparkles size={12} strokeWidth={2} aria-hidden /> {reportTemplates.length} report types</li>
              <li><Users size={12} strokeWidth={2} aria-hidden /> {students.length} students</li>
              <li><Search size={12} strokeWidth={2} aria-hidden /> Custom filters</li>
            </ul>
          </div>
          <div className="reports-hero-visual" aria-hidden="true">
            <div className="reports-hero-orbit">
              <span className="reports-hero-orbit-ring" />
              <span className="reports-hero-orbit-dot reports-hero-orbit-dot--a" />
              <span className="reports-hero-orbit-dot reports-hero-orbit-dot--b" />
              <span className="reports-hero-orbit-center">
                <FileBarChart size={28} strokeWidth={1.85} />
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Custom Query */}
      <div className="report-card report-card--custom-query open">
        <div className="report-card-header report-card-header--static">
          <div className="report-icon">
            <Search size={22} strokeWidth={2} />
          </div>
          <div className="report-info">
            <h3>Custom Query</h3>
            <p>Filter students by skill, GPA, course, or year level. GPA follows the school's better-grade rule.</p>
          </div>
        </div>
        <div className="report-results">
          <form onSubmit={handleCustomQuery}>
            <div className="reports-query-grid">
              <div>
                <label className="reports-query-label">Skill</label>
                <select
                  className="reports-query-input"
                  value={customSkill}
                  onChange={e => setCustomSkill(e.target.value)}
                >
                  <option value="">
                    {skillOptionsLoading ? 'Loading skills...' : 'All Skills'}
                  </option>
                  {skillOptions.map((skill) => (
                    <option key={skill} value={skill}>{skill}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="reports-query-label">Report Title</label>
                <input
                  type="text"
                  className="reports-query-input"
                  placeholder="e.g. Sports Qualifiers"
                  value={customReportTitle}
                  onChange={e => setCustomReportTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="reports-query-label">Min GPA</label>
                <input
                  type="number"
                  className="reports-query-input"
                  step="0.01"
                  min="1"
                  max="5"
                  placeholder="e.g. 2.00"
                  value={customGpa}
                  onWheel={blockWheelNumberChange}
                  onChange={e => setCustomGpa(e.target.value)}
                />
              </div>
              <div>
                <label className="reports-query-label">Course</label>
                <select
                  className="reports-query-input"
                  value={customCourse}
                  onChange={e => setCustomCourse(e.target.value)}
                >
                  <option value="">All Courses</option>
                  {courses.map(c => (
                    <option key={c.courseID} value={c.courseID}>
                      {c.courseCode} - {c.courseName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="reports-query-label">Year Level</label>
                <select
                  className="reports-query-input"
                  value={customYear}
                  onChange={e => setCustomYear(e.target.value)}
                >
                  <option value="">All Years</option>
                  {[1,2,3,4,5,6].map(y => <option key={y} value={y}>{y}{['st','nd','rd','th','th','th'][y-1]} Year</option>)}
                </select>
              </div>
            </div>
            <div className="reports-query-actions">
              <button type="submit" className="btn btn-primary" disabled={customLoading}>
                {customLoading ? 'Searching…' : <><Search size={15} /> Run Query</>}
              </button>
              {(customResult !== null || (!retainInList && savedCustomReports.some((r) => r.sessionOnly))) && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setCustomResult(null)
                    setCustomSkill('')
                    setCustomReportTitle('')
                    setCustomGpa('')
                    setCustomCourse('')
                    setCustomYear('')
                    if (!retainInList) {
                      setSavedCustomReports((prev) => prev.filter((r) => !r.sessionOnly))
                    }
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            <label className="eligibility-check" style={{ marginTop: '0.65rem' }}>
              <input
                type="checkbox"
                checked={retainInList}
                onChange={(e) => setRetainInList(e.target.checked)}
              />
              <span>Remember saved reports after refresh (this browser)</span>
            </label>
          </form>

          {customError && <p style={{ color: '#dc2626', marginTop: '0.75rem', fontSize: '0.9rem' }}>{customError}</p>}

          {customResult !== null && (
            <div style={{ marginTop: '1rem' }}>
              <div className="report-results-header">
                {customResult.length} student{customResult.length !== 1 ? 's' : ''} found
              </div>
              <p className="muted" style={{ padding: '0.35rem 0 0.1rem' }}>
                Result details are shown in the predefined report sections below.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="reports-grid">
        {savedCustomReports.map((rep) => {
          const templateId = `cq-${rep.id}`
          const searchQuery = getReportSearch(templateId)
          const r = {
            loading: false,
            error: '',
            students: rep.students,
            title: rep.title,
            description: rep.description,
            filters: rep.filters,
          }
          const count = r.students?.length ?? 0
          const filteredCustom = filterStudentsByReportSearch(r.students || [], searchQuery)
          const filteredCustomCount = filteredCustom.length
          const isOpen = openId === templateId
          const Icon = Search
          const effectiveTemplate = {
            ...customQueryTemplate,
            title: rep.title,
            description: rep.description,
          }

          return (
            <div key={rep.id} className={`report-card ${isOpen ? 'open' : ''}`}>
              <div className="report-card-header report-card-header--toolbar">
                <div
                  className="report-card-header-main"
                  onClick={() => toggle(templateId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggle(templateId)
                    }
                  }}
                >
                  <div className="report-icon" style={{ background: `${effectiveTemplate.color}18`, color: effectiveTemplate.color }}>
                    <Icon size={22} />
                  </div>
                  <div className="report-info">
                    <h3>{effectiveTemplate.title}</h3>
                    <p>{effectiveTemplate.description}</p>
                    {!r.loading && (
                      <span className="report-count"><Users size={13} /> {count} student{count !== 1 ? 's' : ''} qualified</span>
                    )}
                  </div>
                </div>
                <div className="report-card-toolbar report-card-toolbar--saved">
                  <input
                    type="search"
                    className="reports-query-input report-card-search-input"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setReportSearch(templateId, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                  <div className="report-card-toolbar-actions">
                    <div className="report-card-print-delete">
                      <button
                        type="button"
                        className="btn btn-outline report-card-action-btn"
                        onClick={() => exportCustomReportPdf(rep)}
                        aria-label="Export report as PDF"
                      >
                        Print
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline report-card-action-btn"
                        onClick={() => deleteCustomReport(rep.id)}
                        aria-label="Delete saved report"
                      >
                        Delete
                      </button>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline report-card-action-btn report-card-action-btn--icon"
                      onClick={() => toggle(templateId)}
                      aria-label="Toggle report"
                    >
                      <ChevronDown size={15} className={`report-chevron ${isOpen ? 'rotated' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {isOpen && (
                <div className="report-results report-results--scroll-safe">
                  <div className="report-results-header">
                    Qualified Students
                    {searchQuery.trim() ? (
                      <span className="muted" style={{ fontWeight: 400 }}>
                        {' '}· {filteredCustomCount} of {count}
                      </span>
                    ) : null}
                  </div>
                  <div className="report-results-list">
                    {!r.loading && count === 0 && (
                      <p className="muted" style={{ padding: '0.5rem 0' }}>No students qualify.</p>
                    )}
                    {!r.loading && count > 0 && filteredCustomCount === 0 && searchQuery.trim() && (
                      <p className="muted" style={{ padding: '0.5rem 0' }}>
                        No students match "{searchQuery.trim()}".
                      </p>
                    )}
                    {filteredCustom.map((p) => (
                      <Link key={`${rep.id}-${p.studentID}`} to={`/students/${p.studentID}`} className="report-result-item">
                        <span className="report-result-name">{p.lastName}, {p.firstName} {p.middleName || ''}</span>
                        <span className="report-result-meta">{formatMeta(p)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {reportTemplates.map((template) => {
          const effectiveTemplate = template
          const searchQuery = getReportSearch(template.id)
          const r = results[template.id]
          const count = r?.students?.length ?? 0
          const filteredPreset = filterStudentsByReportSearch(r?.students || [], searchQuery)
          const filteredPresetCount = filteredPreset.length
          const isOpen = openId === template.id
          const Icon = effectiveTemplate.icon

          return (
            <div key={template.id} className={`report-card ${isOpen ? 'open' : ''}`}>
              <div className="report-card-header report-card-header--toolbar">
                <div
                  className="report-card-header-main"
                  onClick={() => toggle(template)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggle(template)
                    }
                  }}
                  aria-expanded={isOpen}
                  aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${effectiveTemplate.title}`}
                >
                  <div className="report-icon" style={{ background: `${effectiveTemplate.color}18`, color: effectiveTemplate.color }}>
                    <Icon size={22} />
                  </div>
                  <div className="report-info">
                    <h3>{effectiveTemplate.title}</h3>
                    <p>{effectiveTemplate.description}</p>
                    {r && !r.loading && (
                      <span className="report-count"><Users size={13} /> {count} student{count !== 1 ? 's' : ''} qualified</span>
                    )}
                  </div>
                </div>
                <div className="report-card-toolbar report-card-toolbar--preset">
                  <input
                    type="search"
                    className="reports-query-input report-card-search-input"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setReportSearch(template.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                  <button
                    type="button"
                    className="btn btn-outline report-card-action-btn report-card-action-btn--icon"
                    onClick={() => toggle(template)}
                    aria-label="Toggle report list"
                  >
                    <ChevronDown size={15} className={`report-chevron ${isOpen ? 'rotated' : ''}`} />
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="report-results report-results--scroll-safe">
                  <div className="report-results-header">
                    Qualified Students
                    {searchQuery.trim() && !r?.loading && !r?.error && count > 0 ? (
                      <span className="muted" style={{ fontWeight: 400 }}>
                        {' '}· {filteredPresetCount} of {count}
                      </span>
                    ) : null}
                  </div>
                  <div className="report-results-list">
                    {r?.loading && <p className="muted" style={{ padding: '0.5rem 0' }}>Running query…</p>}
                    {r?.error && <p style={{ color: '#dc2626', padding: '0.5rem 0', fontSize: '0.9rem' }}>{r.error}</p>}
                    {!r?.loading && !r?.error && count === 0 && (
                      <p className="muted" style={{ padding: '0.5rem 0' }}>No students qualify.</p>
                    )}
                    {!r?.loading && !r?.error && count > 0 && filteredPresetCount === 0 && searchQuery.trim() && (
                      <p className="muted" style={{ padding: '0.5rem 0' }}>
                        No students match "{searchQuery.trim()}".
                      </p>
                    )}
                    {filteredPreset.map((p) => (
                      <Link key={p.studentID} to={`/students/${p.studentID}`} className="report-result-item">
                        <span className="report-result-name">{p.lastName}, {p.firstName} {p.middleName || ''}</span>
                        <span className="report-result-meta">{formatMeta(p)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
    </DirectoryFetchBarrier>
  )
}
