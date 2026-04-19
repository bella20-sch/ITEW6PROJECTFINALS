import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, UserPlus, Sparkles, UserCheck, BookOpen, GraduationCap,
} from 'lucide-react'
import StudentForm from '../components/StudentForm'
import ConfirmModal from '../components/ConfirmModal'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { useLmsBase, lmsPath } from '../lib/lmsPaths'
import DirectoryFetchBarrier from '../components/DirectoryFetchBarrier'

export default function StudentAdd() {
  const { students, courses, departments, crud } = useData()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const base = useLmsBase()
  const [pendingSave, setPendingSave] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const enrolledCount = useMemo(
    () => students.filter((s) => s.enrollmentStatus === 'Enrolled').length,
    [students],
  )

  return (
    <DirectoryFetchBarrier>
    <div className="page student-add-page">
      <div className="student-form-page-toolbar">
        <Link to={lmsPath(base, '/students')} className="student-form-page-back">
          <ArrowLeft size={18} strokeWidth={2} aria-hidden />
          Back to students
        </Link>
      </div>

      <header className="students-hero" aria-labelledby="student-add-hero-title">
        <div className="students-hero-glow" aria-hidden="true" />
        <div className="students-hero-grid" aria-hidden="true" />
        <div className="students-hero-inner">
          <div className="students-hero-copy">
            <div className="students-hero-badge">
              <span className="students-hero-badge-icon">
                <UserPlus size={18} strokeWidth={2.25} aria-hidden />
              </span>
              <span className="students-hero-badge-text">CCS · Registration</span>
            </div>
            <h2 id="student-add-hero-title" className="students-hero-title">
              Register new student
            </h2>
            <p className="students-hero-sub">
              Add a new record to the CCS student directory. Complete each section accurately — you will confirm before the profile is saved.
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
          student={null}
          onSave={async (payload) => {
            setPendingSave(payload)
            setConfirmOpen(true)
          }}
          onCancel={() => navigate(lmsPath(base, '/students'))}
        />
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Add Student"
        message="Are you sure you want to add this student?"
        onConfirm={async () => {
          setConfirmOpen(false)
          try {
            await crud.students.create(pendingSave)
            navigate(lmsPath(base, '/students'))
          } catch (err) {
            showToast(err?.message || 'Failed to create student.', 'error')
          }
          setPendingSave(null)
        }}
        onCancel={() => {
          setConfirmOpen(false)
        }}
      />
    </div>
    </DirectoryFetchBarrier>
  )
}
