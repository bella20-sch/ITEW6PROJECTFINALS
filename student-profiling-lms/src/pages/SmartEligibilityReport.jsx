import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Filter, Search, Sparkles, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'
import { useLmsBase, lmsPath } from '../lib/lmsPaths'
import DirectoryFetchBarrier from '../components/DirectoryFetchBarrier'

const defaultForm = {
  eventType: 'Sports',
  gpaMax: '',
  gpaMin: '',
  highGradesOnly: false,
  subjectName: '',
  subjectGradeMin: '',
  requirePhysicalFit: true,
  minPhysicalActivities: 1,
  skillTagsText: 'Basketball, Team Sports, Leadership',
  matchMode: 'any',
  minSkillScore: 1,
  mustBeAvailable: true,
}

export default function SmartEligibilityReport() {
  const { token, currentUser } = useAuth()
  const base = useLmsBase()
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const isFaculty = currentUser?.role === 'Faculty'
  const title = isFaculty ? 'My Student Eligibility Report' : 'Smart Student Eligibility Report'

  const skillTags = useMemo(
    () => form.skillTagsText.split(',').map((x) => x.trim()).filter(Boolean),
    [form.skillTagsText],
  )

  const runReport = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        eventType: form.eventType,
        academic: {
          gpaMax: form.gpaMax !== '' ? Number(form.gpaMax) : null,
          gpaMin: form.gpaMin !== '' ? Number(form.gpaMin) : null,
          highGradesOnly: !!form.highGradesOnly,
          subjectName: form.subjectName || '',
          subjectGradeMin: form.subjectGradeMin !== '' ? Number(form.subjectGradeMin) : null,
        },
        physical: {
          requirePhysicalFit: !!form.requirePhysicalFit,
          minPhysicalActivities: Number(form.minPhysicalActivities) || 0,
        },
        skills: {
          tags: skillTags,
          matchMode: form.matchMode,
          minSkillScore: Number(form.minSkillScore) || 0,
        },
        availability: {
          mustBeAvailable: !!form.mustBeAvailable,
        },
      }
      const data = await apiFetch('/api/reports/smart-eligibility', {
        token,
        method: 'POST',
        body: payload,
      })
      setResult(data)
    } catch (err) {
      setError(err?.message || 'Failed to generate eligibility report.')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DirectoryFetchBarrier>
      <div className="page eligibility-page">
        <header className="reports-hero" aria-labelledby="eligibility-title">
          <div className="reports-hero-glow" aria-hidden="true" />
          <div className="reports-hero-grid" aria-hidden="true" />
          <div className="reports-hero-inner">
            <div className="reports-hero-copy">
              <div className="reports-hero-badge">
                <span className="reports-hero-badge-icon"><ShieldCheck size={18} strokeWidth={2.25} aria-hidden /></span>
                <span className="reports-hero-badge-text">Event Screening</span>
              </div>
              <h2 id="eligibility-title" className="reports-hero-title">{title}</h2>
              <p className="reports-hero-sub">
                Filter by academic standing, physical profile, skill tags, and availability to produce event-ready student lists.
              </p>
            </div>
          </div>
        </header>

        <div className="eligibility-layout">
          <aside className="eligibility-sidebar">
            <form onSubmit={runReport} className="eligibility-form">
              <h3><Filter size={16} /> Filter Sidebar</h3>

              <label className="reports-query-label">Event Type</label>
              <input className="reports-query-input" value={form.eventType} onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value }))} />

              <label className="reports-query-label">Max GPA (higher eligibility)</label>
              <input type="number" min="1" max="5" step="0.01" className="reports-query-input" value={form.gpaMax} onChange={(e) => setForm((f) => ({ ...f, gpaMax: e.target.value }))} />

              <label className="reports-query-label">Min GPA</label>
              <input type="number" min="0" max="5" step="0.01" className="reports-query-input" value={form.gpaMin} onChange={(e) => setForm((f) => ({ ...f, gpaMin: e.target.value }))} />

              <label className="reports-query-label">Subject Name (optional)</label>
              <input className="reports-query-input" placeholder="e.g. PE, Math" value={form.subjectName} onChange={(e) => setForm((f) => ({ ...f, subjectName: e.target.value }))} />

              <label className="reports-query-label">Minimum Subject Grade</label>
              <input type="number" min="0" max="100" step="0.01" className="reports-query-input" value={form.subjectGradeMin} onChange={(e) => setForm((f) => ({ ...f, subjectGradeMin: e.target.value }))} />

              <label className="reports-query-label">Skill Tags (comma separated)</label>
              <input className="reports-query-input" value={form.skillTagsText} onChange={(e) => setForm((f) => ({ ...f, skillTagsText: e.target.value }))} />

              <label className="reports-query-label">Skill Match Mode</label>
              <select className="reports-query-input" value={form.matchMode} onChange={(e) => setForm((f) => ({ ...f, matchMode: e.target.value }))}>
                <option value="any">Any skill tag</option>
                <option value="all">All skill tags</option>
              </select>

              <label className="reports-query-label">Minimum Matched Skills</label>
              <input type="number" min="0" step="1" className="reports-query-input" value={form.minSkillScore} onChange={(e) => setForm((f) => ({ ...f, minSkillScore: e.target.value }))} />

              <label className="reports-query-label">Minimum Physical Activities</label>
              <input type="number" min="0" step="1" className="reports-query-input" value={form.minPhysicalActivities} onChange={(e) => setForm((f) => ({ ...f, minPhysicalActivities: e.target.value }))} />

              <label className="eligibility-check">
                <input type="checkbox" checked={form.highGradesOnly} onChange={(e) => setForm((f) => ({ ...f, highGradesOnly: e.target.checked }))} />
                <span>High grades only</span>
              </label>
              <label className="eligibility-check">
                <input type="checkbox" checked={form.requirePhysicalFit} onChange={(e) => setForm((f) => ({ ...f, requirePhysicalFit: e.target.checked }))} />
                <span>Require physical profile activity</span>
              </label>
              <label className="eligibility-check">
                <input type="checkbox" checked={form.mustBeAvailable} onChange={(e) => setForm((f) => ({ ...f, mustBeAvailable: e.target.checked }))} />
                <span>Must be currently available</span>
              </label>

              <button type="submit" className="btn btn-primary eligibility-run-btn" disabled={loading}>
                {loading ? 'Generating...' : <><Search size={15} /> Generate Report</>}
              </button>
            </form>
          </aside>

          <section className="eligibility-results">
            <div className="eligibility-results-head">
              <h3><Sparkles size={16} /> Results Table</h3>
              <p className="muted">
                Scope: {result?.roleScope === 'faculty-own-students' ? 'Your assigned students only' : 'All students'}.
              </p>
            </div>

            {error && <p className="eligibility-error">{error}</p>}
            {!error && !result && <p className="muted">Run the filters to generate eligibility results.</p>}

            {result && (
              <>
                <p className="eligibility-count">
                  {result.totalMatched} eligible student{result.totalMatched !== 1 ? 's' : ''} found
                </p>
                <div className="eligibility-table-wrap">
                  <table className="eligibility-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Program / Section</th>
                        <th>Latest GPA</th>
                        <th>Skills Matched</th>
                        <th>Physical Profile</th>
                        <th>Availability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.students.map(({ student, eligibility }) => (
                        <tr key={student.studentID}>
                          <td>
                            <Link to={lmsPath(base, `/students/${student.studentID}`)}>
                              {student.lastName}, {student.firstName}
                            </Link>
                          </td>
                          <td>{student.courseID || '—'} / {student.section || '—'}</td>
                          <td>{eligibility.latestGpa ?? '—'}</td>
                          <td>{eligibility.matchedSkillTags?.length ? eligibility.matchedSkillTags.join(', ') : '—'}</td>
                          <td>{eligibility.physicalActivitiesCount || 0} activity matches</td>
                          <td>{eligibility.availabilityStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </DirectoryFetchBarrier>
  )
}
