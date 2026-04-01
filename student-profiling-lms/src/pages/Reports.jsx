import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Code, FlaskConical, Award, ChevronDown, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'

const iconMap = { basketball: Trophy, code: Code, flask: FlaskConical, award: Award }

const reportTemplates = [
  {
    id: 'basketball',
    title: 'Basketball Try-outs Qualified',
    description: 'Students with basketball skill',
    params: { skill: 'Basketball' },
    icon: 'basketball',
  },
  {
    id: 'programming',
    title: 'Programming Contest Qualified',
    description: 'Students with Programming skills',
    params: { skillCategory: 'Programming' },
    icon: 'code',
  },
  {
    id: 'honor-roll',
    title: 'Honor Roll (GPA 3.5+)',
    description: 'Students with latest GPA ≥ 3.5',
    params: { },
    icon: 'award',
  },
  {
    id: 'dean-lister',
    title: "Dean's Lister",
    description: "Students with academic standing Dean's Lister",
    params: { },
    icon: 'award',
  },
]

export default function Reports() {
  const { token } = useAuth()
  const [selected, setSelected] = useState(null)
  const [results, setResults] = useState({})

  const fetchReport = async (template) => {
    const key = template.id
    setResults(prev => ({ ...prev, [key]: { loading: true, error: '', students: [] } }))

    try {
      const qs = new URLSearchParams(template.params || {}).toString()
      const list = await apiFetch(`/api/students${qs ? `?${qs}` : ''}`, { token })

      // For honor-roll / dean-lister, compute client-side by fetching profiles for the current list.
      if (template.id === 'honor-roll' || template.id === 'dean-lister') {
        const profiles = await Promise.all(
          (Array.isArray(list) ? list : []).map(s => apiFetch(`/api/students/${s.studentID}`, { token }))
        )
        const filtered = profiles.filter(p => {
          if (template.id === 'honor-roll') {
            const ah = p?.academicHistory
            if (!ah?.length) return false
            const latest = ah[ah.length - 1]
            return Number(latest?.gpa) >= 3.5
          }
          const ah = p?.academicHistory
          if (!ah?.length) return false
          return ah.some(a => String(a.academicStanding || '').toLowerCase().includes('dean'))
        })
        setResults(prev => ({ ...prev, [key]: { loading: false, error: '', students: filtered } }))
        return
      }

      setResults(prev => ({ ...prev, [key]: { loading: false, error: '', students: Array.isArray(list) ? list : [] } }))
    } catch (e) {
      setResults(prev => ({ ...prev, [key]: { loading: false, error: e?.message || 'Failed to run report.', students: [] } }))
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Reports & Queries</h2>
        <p className="page-description">Run pre-defined queries. Results update with your data.</p>
      </div>

      <div className="reports-grid">
        {reportTemplates.map(template => {
          const r = results[template.id]
          const count = r?.students?.length ?? 0
          const Icon = iconMap[template.icon] || Award
          const isOpen = selected === template.id

          return (
            <div key={template.id} className={`report-card ${isOpen ? 'open' : ''}`}>
              <button
                className="report-card-header"
                onClick={() => {
                  const next = isOpen ? null : template.id
                  setSelected(next)
                  if (next) fetchReport(template)
                }}
              >
                <div className="report-icon"><Icon size={24} /></div>
                <div className="report-info">
                  <h3>{template.title}</h3>
                  <p>{template.description}</p>
                  <span className="report-count"><Users size={14} /> {count} student{count !== 1 ? 's' : ''} qualified</span>
                </div>
                <ChevronDown size={20} className={`report-chevron ${isOpen ? 'rotated' : ''}`} />
              </button>
              {isOpen && (
                <div className="report-results">
                  <div className="report-results-header">Qualified Students</div>
                  <div className="report-results-list">
                    {r?.loading && <div className="muted" style={{ padding: 12 }}>Running query…</div>}
                    {r?.error && <div className="auth-alert" style={{ margin: 12 }}>{r.error}</div>}
                    {(r?.students || []).map(p => (
                      <Link key={p.studentID} to={`/students/${p.studentID}`} className="report-result-item">
                        <span className="report-result-name">{p.firstName} {p.lastName}</span>
                        <span className="report-result-meta">ID: {p.studentID} • Year {p.yearLevel}</span>
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
