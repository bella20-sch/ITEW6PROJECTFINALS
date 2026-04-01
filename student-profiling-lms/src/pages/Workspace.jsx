import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'

export default function Workspace() {
  const { token, currentUser } = useAuth()
  const [activities, setActivities] = useState([])
  const [materials, setMaterials] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ courseID: '', section: '', title: '', description: '', deadline: '', allow_late: false })
  const [matForm, setMatForm] = useState({ courseID: '', section: '', title: '', content: '', link: '' })
  const [submission, setSubmission] = useState({})

  const isFaculty = currentUser?.role === 'Faculty'
  const isStudent = currentUser?.role === 'Student'

  const loadAll = async () => {
    setLoading(true)
    try {
      const [a, m, asg] = await Promise.all([
        apiFetch('/api/me/activities', { token }),
        apiFetch('/api/me/materials', { token }),
        apiFetch('/api/me/assignments', { token }),
      ])
      setActivities(a || [])
      setMaterials(m || [])
      setAssignments(asg || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const assignedCourses = useMemo(() => {
    const map = new Map()
    assignments.forEach(a => {
      const key = `${a.courseID}|${a.section || ''}`
      map.set(key, a)
    })
    return Array.from(map.values())
  }, [assignments])

  if (loading) return <div className="page"><p className="muted">Loading workspace…</p></div>

  return (
    <div className="page">
      <div className="page-header">
        <h2>{isFaculty ? 'Faculty Workspace' : 'Student Workspace'}</h2>
        <p className="page-description">Activities, submissions, and course materials.</p>
      </div>

      {msg && <div className="auth-alert" style={{ marginBottom: 12 }}>{msg}</div>}

      {isFaculty && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3>Create Activity</h3>
            <form className="form" onSubmit={async (e) => {
              e.preventDefault()
              setBusyId('createActivity')
              setMsg('')
              try {
                await apiFetch('/api/faculty/activities', { token, method: 'POST', body: { ...form, courseID: Number(form.courseID) } })
                setMsg('Activity created.')
                setForm({ courseID: '', section: '', title: '', description: '', deadline: '', allow_late: false })
                await loadAll()
              } catch (err) {
                setMsg(err?.message || 'Failed to create activity.')
              } finally {
                setBusyId('')
              }
            }}>
              <label>Assigned Course/Section</label>
              <select value={`${form.courseID}|${form.section || ''}`} onChange={(e) => {
                const [courseID, section] = e.target.value.split('|')
                setForm({ ...form, courseID, section })
              }} required>
                <option value="">Select assignment</option>
                {assignedCourses.map(a => <option key={`${a.courseID}-${a.section || 'all'}`} value={`${a.courseID}|${a.section || ''}`}>Course {a.courseID} {a.section ? `- ${a.section}` : '(All sections)'}</option>)}
              </select>
              <label>Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <label>Deadline</label>
              <input type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              <label><input type="checkbox" checked={form.allow_late} onChange={(e) => setForm({ ...form, allow_late: e.target.checked })} /> Allow late submissions</label>
              <button className="btn btn-primary" disabled={busyId === 'createActivity'}>{busyId === 'createActivity' ? 'Saving…' : 'Create Activity'}</button>
            </form>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h3>Send Material</h3>
            <form className="form" onSubmit={async (e) => {
              e.preventDefault()
              setBusyId('createMaterial')
              setMsg('')
              try {
                await apiFetch('/api/faculty/materials', { token, method: 'POST', body: { ...matForm, courseID: Number(matForm.courseID) } })
                setMsg('Material posted.')
                setMatForm({ courseID: '', section: '', title: '', content: '', link: '' })
                await loadAll()
              } catch (err) {
                setMsg(err?.message || 'Failed to post material.')
              } finally {
                setBusyId('')
              }
            }}>
              <label>Assigned Course/Section</label>
              <select value={`${matForm.courseID}|${matForm.section || ''}`} onChange={(e) => {
                const [courseID, section] = e.target.value.split('|')
                setMatForm({ ...matForm, courseID, section })
              }} required>
                <option value="">Select assignment</option>
                {assignedCourses.map(a => <option key={`${a.courseID}-${a.section || 'all'}-m`} value={`${a.courseID}|${a.section || ''}`}>Course {a.courseID} {a.section ? `- ${a.section}` : '(All sections)'}</option>)}
              </select>
              <label>Title</label>
              <input value={matForm.title} onChange={(e) => setMatForm({ ...matForm, title: e.target.value })} required />
              <label>Content</label>
              <textarea value={matForm.content} onChange={(e) => setMatForm({ ...matForm, content: e.target.value })} />
              <label>Link (optional)</label>
              <input value={matForm.link} onChange={(e) => setMatForm({ ...matForm, link: e.target.value })} />
              <button className="btn btn-primary" disabled={busyId === 'createMaterial'}>{busyId === 'createMaterial' ? 'Saving…' : 'Post Material'}</button>
            </form>
          </div>
        </>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Activities</h3>
        {!activities.length && <p className="muted">No activities yet.</p>}
        {activities.map(a => (
          <div key={a.id} style={{ borderTop: '1px solid var(--border)', padding: '10px 0' }}>
            <strong>{a.title}</strong> <span className="muted">Course {a.courseID} {a.section ? `- ${a.section}` : ''}</span>
            <div className="muted">{a.description}</div>
            <div className="muted">Deadline: {a.deadline || 'None'} {a.allow_late ? '(Late allowed)' : ''}</div>
            {isStudent && (
              <form className="form" onSubmit={async (e) => {
                e.preventDefault()
                setBusyId(`submit-${a.id}`)
                setMsg('')
                try {
                  await apiFetch(`/api/student/activities/${a.id}/submit`, { token, method: 'POST', body: { content: submission[a.id] || '' } })
                  setMsg(`Submitted: ${a.title}`)
                } catch (err) {
                  setMsg(err?.message || 'Submission failed.')
                } finally {
                  setBusyId('')
                }
              }}>
                <label>Your submission</label>
                <textarea value={submission[a.id] || ''} onChange={(e) => setSubmission(prev => ({ ...prev, [a.id]: e.target.value }))} required />
                <button className="btn btn-primary" disabled={busyId === `submit-${a.id}`}>{busyId === `submit-${a.id}` ? 'Submitting…' : 'Submit Activity'}</button>
              </form>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Materials</h3>
        {!materials.length && <p className="muted">No materials yet.</p>}
        {materials.map(m => (
          <div key={m.id} style={{ borderTop: '1px solid var(--border)', padding: '10px 0' }}>
            <strong>{m.title}</strong> <span className="muted">Course {m.courseID} {m.section ? `- ${m.section}` : ''}</span>
            {m.content && <div>{m.content}</div>}
            {m.link && <a href={m.link} target="_blank" rel="noreferrer">{m.link}</a>}
          </div>
        ))}
      </div>
    </div>
  )
}

