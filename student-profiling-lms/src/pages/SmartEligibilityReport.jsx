import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Filter, Search, Sparkles, ShieldCheck, FileDown, X } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
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
  selectedSkillTags: ['Basketball', 'Team Sports', 'Leadership'],
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
  const [formError, setFormError] = useState('')
  const [result, setResult] = useState(null)
  const [skillOptions, setSkillOptions] = useState([])
  const [skillOptionsLoading, setSkillOptionsLoading] = useState(false)
  const [skillPickerValue, setSkillPickerValue] = useState('')
  const blockWheelNumberChange = (e) => {
    e.currentTarget.blur()
  }

  const isFaculty = currentUser?.role === 'Faculty'
  const title = isFaculty ? 'My Student Eligibility Report' : 'Smart Student Eligibility Report'

  const skillTags = useMemo(() => form.selectedSkillTags, [form.selectedSkillTags])
  const allSkillOptions = useMemo(() => {
    const merged = new Set([...(skillOptions || []), ...(skillTags || [])])
    return [...merged].sort((a, b) => a.localeCompare(b))
  }, [skillOptions, skillTags])

  useEffect(() => {
    if (!token) return
    let alive = true
    setSkillOptionsLoading(true)
    const loadSkillOptions = async () => {
      try {
        const fromEndpoint = await apiFetch('/api/reports/smart-eligibility/options?scope=global', { token })
        const endpointTags = Array.isArray(fromEndpoint?.skillTags) ? fromEndpoint.skillTags : []
        if (endpointTags.length > 0) return endpointTags
      } catch {
        // Continue to profile-based fallback when endpoint is unavailable/stale.
      }

      // Fallback: derive from profile payloads when options endpoint returns empty.
      const students = await apiFetch('/api/students', { token })
      const list = Array.isArray(students) ? students : []
      const profiles = await Promise.all(
        list.map((s) => apiFetch(`/api/students/${s.studentID}`, { token })),
      )
      const set = new Set()
      profiles.forEach((p) => {
        const rows = Array.isArray(p?.skills) ? p.skills : []
        rows.forEach((row) => {
          const name = String(row?.skillName || row?.name || '').trim()
          if (name) set.add(name)
        })
      })
      return [...set]
    }

    loadSkillOptions()
      .then((data) => {
        if (!alive) return
        const tags = Array.isArray(data) ? data : []
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

  const addSkillTag = (value) => {
    const trimmed = String(value || '').trim()
    if (!trimmed) return
    setForm((prev) => {
      if (prev.selectedSkillTags.some((tag) => tag.toLowerCase() === trimmed.toLowerCase())) return prev
      return { ...prev, selectedSkillTags: [...prev.selectedSkillTags, trimmed] }
    })
    setSkillPickerValue('')
  }

  const removeSkillTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      selectedSkillTags: prev.selectedSkillTags.filter((x) => x.toLowerCase() !== String(tag).toLowerCase()),
    }))
  }

  const downloadPdf = () => {
    if (!result) return
    const doc = new jsPDF({ orientation: 'landscape' })
    const nowLabel = new Date().toLocaleString()
    const orange = [234, 88, 12]
    const orangeLight = [255, 237, 213]
    const orangeDarkText = [124, 45, 18]
    const appliedFilters = [
      `Event Type: ${result?.filters?.eventType || 'General'}`,
      `GPA Min/Max: ${result?.filters?.academic?.gpaMin ?? 'Any'} / ${result?.filters?.academic?.gpaMax ?? 'Any'}`,
      `High Grades Only: ${result?.filters?.academic?.highGradesOnly ? 'Yes' : 'No'}`,
      `Subject Filter: ${result?.filters?.academic?.subjectName || 'Any'} (min ${result?.filters?.academic?.subjectGradeMin ?? 'Any'})`,
      `Physical Fit: ${result?.filters?.physical?.requirePhysicalFit ? 'Required' : 'Optional'}; Min Activities: ${result?.filters?.physical?.minPhysicalActivities ?? 0}`,
      `Skill Tags: ${(result?.filters?.skills?.tags || []).join(', ') || 'Any'} (${result?.filters?.skills?.matchMode || 'any'} match, min score ${result?.filters?.skills?.minSkillScore ?? 0})`,
      `Availability Required: ${result?.filters?.availability?.mustBeAvailable ? 'Yes' : 'No'}`,
      `Scope: ${result?.roleScope === 'faculty-own-students' ? 'Faculty own students' : 'All students'}`,
    ]
    doc.setFontSize(16)
    doc.setTextColor(...orange)
    doc.text('Smart Student Eligibility Report', 14, 14)
    doc.setFontSize(10)
    doc.setTextColor(31, 41, 55)
    doc.text(`Generated: ${nowLabel}`, 14, 21)
    doc.text(`Total Eligible: ${result.totalMatched || 0}`, 14, 27)
    autoTable(doc, {
      startY: 31,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: orange, textColor: [255, 255, 255] },
      bodyStyles: { textColor: orangeDarkText },
      alternateRowStyles: { fillColor: orangeLight },
      head: [['Applied Filters']],
      body: appliedFilters.map((line) => [line]),
      margin: { left: 14, right: 14 },
    })
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 5,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: orange, textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: orangeLight },
      head: [[
        'Student',
        'Student ID',
        'Course / Section',
        'Latest GPA',
        'Academic Standing',
        'Skills Matched',
        'Skill Match Count',
        'Physical Matches',
        'Latest Physical Activity',
        'Availability',
      ]],
      body: (result.students || []).map(({ student, eligibility }) => [
        `${student?.lastName || ''}, ${student?.firstName || ''}`,
        String(student?.studentID ?? ''),
        `${student?.courseID ?? '—'} / ${student?.section || '—'}`,
        eligibility?.latestGpa ?? '—',
        eligibility?.latestAcademicStanding || '—',
        eligibility?.matchedSkillTags?.join(', ') || '—',
        String(eligibility?.matchedSkillCount ?? 0),
        String(eligibility?.physicalActivitiesCount ?? 0),
        eligibility?.latestPhysicalActivityName || '—',
        eligibility?.availabilityStatus || '—',
      ]),
      margin: { left: 14, right: 14 },
    })
    doc.save(`smart-eligibility-report-${Date.now()}.pdf`)
  }

  const runReport = async (e) => {
    e.preventDefault()
    setFormError('')
    const requiredChecks = [
      { ok: !!String(form.eventType || '').trim(), message: 'Event Type is required.' },
      { ok: form.gpaMax !== '', message: 'Max GPA is required.' },
      { ok: form.gpaMin !== '', message: 'Min GPA is required.' },
      { ok: form.subjectGradeMin !== '', message: 'Minimum Subject Grade is required.' },
      { ok: form.selectedSkillTags.length > 0, message: 'At least one Skill Tag is required.' },
      { ok: form.minSkillScore !== '' && Number(form.minSkillScore) >= 1, message: 'Minimum Matched Skills is required (>= 1).' },
      { ok: form.minPhysicalActivities !== '' && Number(form.minPhysicalActivities) >= 1, message: 'Minimum Physical Activities is required (>= 1).' },
    ]
    const failed = requiredChecks.find((x) => !x.ok)
    if (failed) {
      setFormError(failed.message)
      return
    }
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
              {formError && <p className="eligibility-error">{formError}</p>}

              <label className="reports-query-label">Event Type</label>
              <input className="reports-query-input" required value={form.eventType} onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value }))} />

              <label className="reports-query-label">Max GPA (higher eligibility)</label>
              <input type="number" min="1" max="5" step="0.01" required className="reports-query-input" value={form.gpaMax} onWheel={blockWheelNumberChange} onChange={(e) => setForm((f) => ({ ...f, gpaMax: e.target.value }))} />

              <label className="reports-query-label">Min GPA</label>
              <input type="number" min="0" max="5" step="0.01" required className="reports-query-input" value={form.gpaMin} onWheel={blockWheelNumberChange} onChange={(e) => setForm((f) => ({ ...f, gpaMin: e.target.value }))} />

              <label className="reports-query-label">Subject Name (optional)</label>
              <input className="reports-query-input" placeholder="e.g. PE, Math" value={form.subjectName} onChange={(e) => setForm((f) => ({ ...f, subjectName: e.target.value }))} />

              <label className="reports-query-label">Minimum Subject Grade</label>
              <input type="number" min="0" max="100" step="0.01" required className="reports-query-input" value={form.subjectGradeMin} onWheel={blockWheelNumberChange} onChange={(e) => setForm((f) => ({ ...f, subjectGradeMin: e.target.value }))} />

              <label className="reports-query-label">Skill Tags</label>
              <div className="eligibility-skill-picker">
                <select
                  className="reports-query-input"
                  value={skillPickerValue}
                  onChange={(e) => {
                    const value = e.target.value
                    setSkillPickerValue(value)
                    if (value) addSkillTag(value)
                  }}
                >
                  <option value="">
                    {skillOptionsLoading ? 'Loading skill tags...' : 'Select skill tag'}
                  </option>
                  {allSkillOptions.map((tag) => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
              <div className="eligibility-skill-tags">
                {skillTags.length === 0 && <span className="muted">No selected skill tags.</span>}
                {skillTags.map((tag) => (
                  <span key={tag} className="eligibility-skill-chip">
                    {tag}
                    <button type="button" onClick={() => removeSkillTag(tag)} aria-label={`Remove ${tag}`}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>

              <label className="reports-query-label">Skill Match Mode</label>
              <select className="reports-query-input" value={form.matchMode} onChange={(e) => setForm((f) => ({ ...f, matchMode: e.target.value }))}>
                <option value="any">Any skill tag</option>
                <option value="all">All skill tags</option>
              </select>

              <label className="reports-query-label">Minimum Matched Skills</label>
              <input type="number" min="1" step="1" required className="reports-query-input" value={form.minSkillScore} onWheel={blockWheelNumberChange} onChange={(e) => setForm((f) => ({ ...f, minSkillScore: e.target.value }))} />

              <label className="reports-query-label">Minimum Physical Activities</label>
              <input type="number" min="1" step="1" required className="reports-query-input" value={form.minPhysicalActivities} onWheel={blockWheelNumberChange} onChange={(e) => setForm((f) => ({ ...f, minPhysicalActivities: e.target.value }))} />

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
              <div className="eligibility-actions">
                <p className="muted">
                  Scope: {result?.roleScope === 'faculty-own-students' ? 'Your assigned students only' : 'All students'}.
                </p>
                <button type="button" className="btn btn-outline" disabled={!result} onClick={downloadPdf}>
                  <FileDown size={14} /> Export PDF
                </button>
              </div>
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
