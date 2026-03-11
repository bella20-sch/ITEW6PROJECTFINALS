import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Code, FlaskConical, Award, ChevronDown, Users } from 'lucide-react'
import { useData } from '../context/DataContext'

const iconMap = { basketball: Trophy, code: Code, flask: FlaskConical, award: Award }

const reportTemplates = [
  {
    id: 'basketball',
    title: 'Basketball Try-outs Qualified',
    description: 'Students with basketball skill',
    query: (profile) => {
      const p = profile
      if (!p?.skills) return false
      return p.skills.some(sk => sk.skillName?.toLowerCase().includes('basketball'))
    },
    icon: 'basketball',
  },
  {
    id: 'programming',
    title: 'Programming Contest Qualified',
    description: 'Students with Programming skills',
    query: (profile) => {
      if (!profile?.skills) return false
      return profile.skills.some(sk => sk.category?.toLowerCase().includes('programming'))
    },
    icon: 'code',
  },
  {
    id: 'honor-roll',
    title: 'Honor Roll (GPA 3.5+)',
    description: 'Students with latest GPA ≥ 3.5',
    query: (profile) => {
      const ah = profile?.academicHistory
      if (!ah?.length) return false
      const latest = ah[ah.length - 1]
      return latest.gpa >= 3.5
    },
    icon: 'award',
  },
  {
    id: 'dean-lister',
    title: "Dean's Lister",
    description: "Students with academic standing Dean's Lister",
    query: (profile) => {
      const ah = profile?.academicHistory
      if (!ah?.length) return false
      return ah.some(a => a.academicStanding?.toLowerCase().includes('dean'))
    },
    icon: 'award',
  },
]

export default function Reports() {
  const { students, crud } = useData()
  const [selected, setSelected] = useState(null)

  const getProfiles = () => students.map(s => crud.students.getOne(s.studentID))

  return (
    <div className="page">
      <div className="page-header">
        <h2>Reports & Queries</h2>
        <p className="page-description">Run pre-defined queries. Results update with your data.</p>
      </div>

      <div className="reports-grid">
        {reportTemplates.map(template => {
          const profiles = getProfiles().filter(p => template.query(p))
          const Icon = iconMap[template.icon] || Award
          const isOpen = selected === template.id

          return (
            <div key={template.id} className={`report-card ${isOpen ? 'open' : ''}`}>
              <button className="report-card-header" onClick={() => setSelected(isOpen ? null : template.id)}>
                <div className="report-icon"><Icon size={24} /></div>
                <div className="report-info">
                  <h3>{template.title}</h3>
                  <p>{template.description}</p>
                  <span className="report-count"><Users size={14} /> {profiles.length} student{profiles.length !== 1 ? 's' : ''} qualified</span>
                </div>
                <ChevronDown size={20} className={`report-chevron ${isOpen ? 'rotated' : ''}`} />
              </button>
              {isOpen && (
                <div className="report-results">
                  <div className="report-results-header">Qualified Students</div>
                  <div className="report-results-list">
                    {profiles.map(p => (
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
