import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Code, Award, ChevronDown, Users, Search, GraduationCap, AlertTriangle, Briefcase, Star, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { apiFetch } from '../lib/api'

const isDeansLister = (gpa) => { const g = Number(gpa); return !isNaN(g) && g >= 1.0 && g <= 2.50 }

const fetchAllProfiles = async (token) => {
  const list = await apiFetch('/api/students', { token })
  return Promise.all((Array.isArray(list) ? list : []).map(s => apiFetch(`/api/students/${s.studentID}`, { token })))
}

const reportTemplates = [
  {
    id: 'basketball', title: 'Basketball Try-outs Qualified', description: 'Students with Basketball skill',
    icon: Trophy, color: '#f97316',
    run: async (token) => Array.isArray(await apiFetch('/api/students?skill=Basketball', { token })) ? await apiFetch('/api/students?skill=Basketball', { token }) : [],
  },
  {
    id: 'programming', title: 'Programming Contest Qualified', description: 'Students with Programming skill',
    icon: Code, color: '#6366f1',
    run: async (token) => { const l = await apiFetch('/api/students?skill=Programming', { token }); return Array.isArray(l) ? l : [] },
  },
  {
    id: 'deans-lister', title: "Dean's Lister", description: 'Students with GPA 1.00 – 2.50',
    icon: GraduationCap, color: '#10b981',
    run: async (token) => (await fetchAllProfiles(token)).filter(p => { const ah = p?.academicHistory; if (!ah?.length) return false; return isDeansLister(ah[ah.length-1]?.gpa) }),
  },
  {
    id: 'presidents-list', title: "President's List", description: 'Students with GPA 1.00 – 1.25',
    icon: Award, color: '#f59e0b',
    run: async (token) => (await fetchAllProfiles(token)).filter(p => { const ah = p?.academicHistory; if (!ah?.length) return false; const g = Number(ah[ah.length-1]?.gpa); return !isNaN(g) && g >= 1.0 && g <= 1.25 }),
  },
  {
    id: 'with-activities', title: 'Students with Non-Academic Activities', description: 'Students who joined at least one activity',
    icon: Briefcase, color: '#0ea5e9',
    run: async (token) => (await fetchAllProfiles(token)).filter(p => (p?.activities || []).length > 0),
  },
  {
    id: 'with-affiliations', title: 'Students with Org Affiliations', description: 'Students who are members of organizations',
    icon: Star, color: '#8b5cf6',
    run: async (token) => (await fetchAllProfiles(token)).filter(p => (p?.affiliations || []).length > 0),
  },
  {
    id: 'with-violations', title: 'Students with Violations', description: 'Students with at least one recorded violation',
    icon: AlertTriangle, color: '#ef4444',
    run: async (token) => (await fetchAllProfiles(token)).filter(p => (p?.violations || []).length > 0),
  },
  {
    id: 'no-violations', title: 'Students with Clean Record', description: 'Students with zero violations',
    icon: Shield, color: '#10b981',
    run: async (token) => (await fetchAllProfiles(token)).filter(p => (p?.violations || []).length === 0),
  },
]

export default function Reports() {
  const { token } = useAuth()
  const { courses } = useData()

  const getCourseCode = (courseID) => courses.find(c => c.courseID === courseID)?.courseCode || '—'

  const formatMeta = (p) => {
    const code = getCourseCode(p.courseID)
    return `${p.studentID} · Year ${p.yearLevel} - ${code} ${p.section || ''}`
  }
  const [openId, setOpenId] = useState(null)
  const [results, setResults] = useState({})

  const [customSkill, setCustomSkill] = useState('')
  const [customActivity, setCustomActivity] = useState('')
  const [customGpa, setCustomGpa] = useState('')
  const [customCourse, setCustomCourse] = useState('')
  const [customYear, setCustomYear] = useState('')
  const [customResult, setCustomResult] = useState(null)
  const [customLoading, setCustomLoading] = useState(false)
  const [customError, setCustomError] = useState('')

  const handleCustomQuery = async (e) => {
    e.preventDefault()
    if (!customSkill && !customGpa && !customCourse && !customYear && !customActivity) return
    setCustomLoading(true)
    setCustomError('')
    setCustomResult(null)
    try {
      const qs = new URLSearchParams()
      if (customSkill) qs.append('skill', customSkill)
      if (customCourse) qs.append('courseID', customCourse)

      const list = await apiFetch(`/api/students?${qs.toString()}`, { token })
      let filtered = Array.isArray(list) ? list : []

      if (customYear) filtered = filtered.filter(s => String(s.yearLevel) === customYear)

      // For GPA or activity filters, fetch full profiles
      if (customGpa || customActivity) {
        const profiles = await Promise.all(filtered.map(s => apiFetch(`/api/students/${s.studentID}`, { token })))
        filtered = profiles.filter(p => {
          if (customGpa) {
            const ah = p?.academicHistory
            if (!ah?.length) return false
            const g = Number(ah[ah.length - 1]?.gpa)
            if (isNaN(g) || g > parseFloat(customGpa)) return false
          }
          if (customActivity) {
            const acts = p?.activities || []
            const q = customActivity.toLowerCase()
            if (!acts.some(a => (a.activityName || '').toLowerCase().includes(q) || (a.activityType || '').toLowerCase().includes(q))) return false
          }
          return true
        })
      }

      setCustomResult(filtered)
    } catch (err) {
      setCustomError(err?.message || 'Failed to run query.')
    } finally {
      setCustomLoading(false)
    }
  }

  const runReport = async (template) => {
    const key = template.id
    setResults(prev => ({ ...prev, [key]: { loading: true, error: '', students: [] } }))
    try {
      const students = await template.run(token)
      setResults(prev => ({ ...prev, [key]: { loading: false, error: '', students } }))
    } catch (err) {
      setResults(prev => ({ ...prev, [key]: { loading: false, error: err?.message || 'Failed.', students: [] } }))
    }
  }

  useEffect(() => {
    if (token) reportTemplates.forEach(t => runReport(t))
  }, [token])

  const toggle = (template) => {
    setOpenId(prev => prev === template.id ? null : template.id)
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Reports & Queries</h2>
      </div>

      {/* Custom Query */}
      <div className="report-card open" style={{ marginBottom: '1.5rem' }}>
        <div className="report-card-header" style={{ cursor: 'default' }}>
          <div className="report-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>
            <Search size={22} />
          </div>
          <div className="report-info">
            <h3>Custom Query</h3>
            <p>Filter students by skill, GPA, course, or year level</p>
          </div>
        </div>
        <div className="report-results">
          <form onSubmit={handleCustomQuery}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: 4, color: '#4b5563' }}>Skill</label>
                <input type="text" placeholder="e.g. Basketball, Python" value={customSkill}
                  onChange={e => setCustomSkill(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: 4, color: '#4b5563' }}>Activity</label>
                <input type="text" placeholder="e.g. Debate, Sports Tournament" value={customActivity}
                  onChange={e => setCustomActivity(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: 4, color: '#4b5563' }}>Max GPA (PH scale, e.g. 1.75)</label>
                <input type="number" step="0.01" min="1" max="5" placeholder="e.g. 1.75" value={customGpa}
                  onChange={e => setCustomGpa(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: 4, color: '#4b5563' }}>Year Level</label>
                <select value={customYear} onChange={e => setCustomYear(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem' }}>
                  <option value="">All Years</option>
                  {[1,2,3,4,5,6].map(y => <option key={y} value={y}>{y}{['st','nd','rd','th','th','th'][y-1]} Year</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button type="submit" className="btn btn-primary" disabled={customLoading}>
                {customLoading ? 'Searching…' : <><Search size={15} /> Run Query</>}
              </button>
              {customResult !== null && (
                <button type="button" className="btn btn-outline" onClick={() => { setCustomResult(null); setCustomSkill(''); setCustomActivity(''); setCustomGpa(''); setCustomCourse(''); setCustomYear('') }}>
                  Clear
                </button>
              )}
            </div>
          </form>

          {customError && <p style={{ color: '#dc2626', marginTop: '0.75rem', fontSize: '0.9rem' }}>{customError}</p>}

          {customResult !== null && (
            <div style={{ marginTop: '1rem' }}>
              <div className="report-results-header">{customResult.length} student{customResult.length !== 1 ? 's' : ''} found</div>
              <div className="report-results-list">
                {customResult.length === 0
                  ? <p className="muted" style={{ padding: '0.5rem 0' }}>No students match these criteria.</p>
                  : customResult.map(p => (
                    <Link key={p.studentID} to={`/students/${p.studentID}`} className="report-result-item">
                      <span className="report-result-name">{p.lastName}, {p.firstName} {p.middleName || ''}</span>
                      <span className="report-result-meta">{formatMeta(p)}</span>
                    </Link>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Predefined reports */}
      <div className="reports-grid">
        {reportTemplates.map(template => {
          const r = results[template.id]
          const count = r?.students?.length ?? 0
          const isOpen = openId === template.id
          const Icon = template.icon

          return (
            <div key={template.id} className={`report-card ${isOpen ? 'open' : ''}`}>
              <button className="report-card-header" onClick={() => toggle(template)}>
                <div className="report-icon" style={{ background: `${template.color}18`, color: template.color }}>
                  <Icon size={22} />
                </div>
                <div className="report-info">
                  <h3>{template.title}</h3>
                  <p>{template.description}</p>
                  {r && !r.loading && (
                    <span className="report-count"><Users size={13} /> {count} student{count !== 1 ? 's' : ''} qualified</span>
                  )}
                </div>
                <ChevronDown size={20} className={`report-chevron ${isOpen ? 'rotated' : ''}`} />
              </button>

              {isOpen && (
                <div className="report-results">
                  <div className="report-results-header">Qualified Students</div>
                  <div className="report-results-list">
                    {r?.loading && <p className="muted" style={{ padding: '0.5rem 0' }}>Running query…</p>}
                    {r?.error && <p style={{ color: '#dc2626', padding: '0.5rem 0', fontSize: '0.9rem' }}>{r.error}</p>}
                    {!r?.loading && !r?.error && count === 0 && (
                      <p className="muted" style={{ padding: '0.5rem 0' }}>No students qualify.</p>
                    )}
                    {(r?.students || []).map(p => (
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
  )
}
