import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Pencil, Sparkles, UserCheck, BookOpen, GraduationCap,
} from 'lucide-react'
import StudentForm from '../components/StudentForm'
import ConfirmModal from '../components/ConfirmModal'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { useLmsBase, lmsPath } from '../lib/lmsPaths'

export default function StudentEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const base = useLmsBase()
  const { students, profiles, courses, departments, crud } = useData()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [pendingSave, setPendingSave] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const numericId = Number(id)
  const student = Number.isFinite(numericId) ? profiles[numericId] || null : null

  useEffect(() => {
    let cancelled = false
    if (!Number.isFinite(numericId)) {
      setLoading(false)
      setLoadError('Invalid student ID.')
      return
    }
    if (profiles[numericId]) {
      setLoading(false)
      setLoadError('')
      return
    }
    setLoading(true)
    setLoadError('')
    crud.students.fetchOne(id)
      .then(() => { if (!cancelled) setLoading(false) })
      .catch((e) => {
        if (!cancelled) {
          setLoadError(e?.message || 'Failed to load.')
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [id, numericId, profiles, crud.students])

  const enrolledCount = useMemo(
    () => students.filter((s) => s.enrollmentStatus === 'Enrolled').length,
    [students],
  )

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading student…</p>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="page">
        <p>
          {loadError || 'Student not found.'}{' '}
          <Link to={lmsPath(base, '/students')}>Back to students</Link>
        </p>
      </div>
    )
  }

  const fullName = `${student.firstName} ${student.lastName}`.trim()

  return (
    <div className="page student-add-page student-edit-page">
      <div className="student-form-page-toolbar">
        <Link to={lmsPath(base, `/students/${id}`)} className="student-form-page-back">
          <ArrowLeft size={18} strokeWidth={2} aria-hidden />
          Back to profile
        </Link>
      </div>

      <header className="students-hero" aria-labelledby="student-edit-hero-title">
        <div className="students-hero-glow" aria-hidden="true" />
        <div className="students-hero-grid" aria-hidden="true" />
        <div className="students-hero-inner">
          <div className="students-hero-copy">
            <div className="students-hero-badge">
              <span className="students-hero-badge-icon">
                <Pencil size={18} strokeWidth={2.25} aria-hidden />
              </span>
              <span className="students-hero-badge-text">CCS · Edit record</span>
            </div>
            <h2 id="student-edit-hero-title" className="students-hero-title">
              Edit student profile
            </h2>
            <p className="students-hero-sub">
              Update directory information for this student. Confirm when you are ready to save your changes.
            </p>
            <ul className="students-hero-tags">
              <li><Sparkles size={12} strokeWidth={2} aria-hidden /> {students.length} students</li>
              <li><UserCheck size={12} strokeWidth={2} aria-hidden /> {enrolledCount} enrolled</li>
              <li><BookOpen size={12} strokeWidth={2} aria-hidden /> {courses.length} programs</li>
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

      <div className="student-form-page">
        <StudentForm
          courses={courses}
          departments={departments}
          student={student}
          onSave={async (payload) => {
            setPendingSave(payload)
            setConfirmOpen(true)
          }}
          onCancel={() => navigate(lmsPath(base, `/students/${id}`))}
        />
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Confirm edit"
        message={`Save changes to ${fullName}'s profile?`}
        onConfirm={async () => {
          setConfirmOpen(false)
          try {
            await crud.students.update(numericId, pendingSave)
            navigate(lmsPath(base, `/students/${id}`))
          } catch (err) {
            showToast(err?.message || 'Failed to update student.', 'error')
          }
          setPendingSave(null)
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
