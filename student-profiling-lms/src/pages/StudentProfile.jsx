import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  User, Mail, Calendar, Award, AlertTriangle, BookOpen, Briefcase, Heart, Users,
  Sparkles, ArrowLeft, GraduationCap, Pencil, Trash2, Plus,
} from 'lucide-react'
import { useData } from '../context/DataContext'
import StudentFormModal from '../components/StudentFormModal'
import Modal from '../components/Modal'

function ProfileSection({ icon: Icon, title, children, action }) {
  return (
    <section className="profile-section">
      <h3><Icon size={18} /> {title} {action}</h3>
      <div className="profile-section-content">{children}</div>
    </section>
  )
}

export default function StudentProfile() {
  const { id } = useParams()
  const { crud, courses, departments } = useData()
  const [student, setStudent] = useState(() => crud.students.getOne(id))
  const [loading, setLoading] = useState(!student)
  const [loadError, setLoadError] = useState('')
  const [editModal, setEditModal] = useState(false)

  useEffect(() => {
    let cancelled = false
    const existing = crud.students.getOne(id)
    if (existing) {
      setStudent(existing)
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError('')
    crud.students.fetchOne(id)
      .then((p) => {
        if (cancelled) return
        setStudent(p)
        setLoading(false)
      })
      .catch((e) => {
        if (cancelled) return
        setLoadError(e?.message || 'Failed to load student.')
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading student profile…</p>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="page">
        <p>{loadError || 'Student not found.'} <Link to="/students">Back to Students</Link></p>
      </div>
    )
  }

  const fullName = `${student.firstName} ${student.middleName || ''} ${student.lastName} ${student.suffix || ''}`.trim()
  const course = courses.find(c => c.courseID === student.courseID)
  const latestAcademic = student.academicHistory[student.academicHistory.length - 1]
  const gpa = latestAcademic?.gpa

  const handleDelete = async () => {
    if (!confirm('Delete this student? All related records will be removed.')) return
    await crud.students.delete(student.studentID)
    window.location.href = '/students'
  }

  return (
    <div className="page">
      <div className="profile-toolbar">
        <Link to="/students" className="back-link"><ArrowLeft size={18} /> Back to Students</Link>
        <div>
          <button className="btn btn-outline" onClick={() => setEditModal(true)}><Pencil size={16} /> Edit</button>
          <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={16} /> Delete</button>
        </div>
      </div>

      <div className="profile-header">
        <div className="profile-avatar">{student.firstName[0]}{student.lastName[0]}</div>
        <div className="profile-meta">
          <h1>{fullName}</h1>
          <span className="profile-id">Student ID: {student.studentID}</span>
          <span className="profile-badge">Year {student.yearLevel} • {student.section} • {course?.courseCode || '—'}</span>
          {gpa != null && (
            <div className="profile-gpa"><GraduationCap size={18} /> GPA: {gpa} • {latestAcademic?.academicStanding}</div>
          )}
        </div>
      </div>

      <div className="profile-grid">
        <ProfileSection icon={User} title="Basic Info">
          <ul className="profile-list">
            <li><Mail size={16} /> {student.email}</li>
            <li><Calendar size={16} /> Birth: {student.birthDate} {student.birthPlace && `• ${student.birthPlace}`}</li>
            <li>Gender: {student.gender} • {student.nationality} • {student.civilStatus}</li>
            <li>Contact: {student.contactNumber || '—'}</li>
            <li>Address: {student.address || '—'}</li>
            <li>Status: <span className="badge-active">{student.enrollmentStatus}</span></li>
            <li>Enrolled: {student.dateEnrolled}</li>
          </ul>
        </ProfileSection>

        <ProfileSection icon={BookOpen} title="Academic History">
          {student.academicHistory.length ? (
            <div className="table-wrap">
              <table className="profile-table">
                <thead>
                  <tr><th>School Year</th><th>Semester</th><th>GPA</th><th>Standing</th><th>Units</th></tr>
                </thead>
                <tbody>
                  {student.academicHistory.map(ah => (
                    <tr key={ah.academicID}>
                      <td>{ah.schoolYear}</td><td>{ah.semester}</td><td>{ah.gpa}</td><td>{ah.academicStanding}</td>
                      <td>{ah.completedUnits}/{ah.totalUnits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="muted">No records</p>}
        </ProfileSection>

        <ProfileSection icon={Heart} title="Medical History">
          {student.medicalHistory.length ? (
            <ul className="profile-list">
              {student.medicalHistory.map(m => (
                <li key={m.medicalID}>
                  Blood: {m.bloodType} • {m.medicalConditions || 'None'}
                  <small>Emergency: {m.emergencyContactName} ({m.emergencyContactRelationship}) {m.emergencyContactNumber}</small>
                </li>
              ))}
            </ul>
          ) : <p className="muted">No records</p>}
        </ProfileSection>

        <ProfileSection icon={Users} title="Guardians">
          {student.guardians.length ? (
            <ul className="profile-list">
              {student.guardians.map(g => (
                <li key={g.guardianID}>
                  <strong>{g.guardianName}</strong> — {g.relationship}
                  <small>{g.email} • {g.occupation}</small>
                </li>
              ))}
            </ul>
          ) : <p className="muted">No guardians on file</p>}
        </ProfileSection>

        <ProfileSection icon={Briefcase} title="Affiliations">
          {student.affiliations.length ? (
            <ul className="profile-list">
              {student.affiliations.map(a => (
                <li key={a.affiliationID}>
                  <strong>{a.organizationName}</strong> — {a.position} ({a.status})
                  <small>Joined: {a.dateJoined} • Adviser: {a.adviserName}</small>
                </li>
              ))}
            </ul>
          ) : <p className="muted">No affiliations</p>}
        </ProfileSection>

        <ProfileSection icon={AlertTriangle} title="Violations">
          {student.violations.length ? (
            <ul className="profile-list violations">
              {student.violations.map(v => (
                <li key={v.violationID}>
                  <span className={`violation-${v.severityLevel?.toLowerCase()}`}>{v.violationType}</span>: {v.description}
                  <small>{v.dateReported} • {v.actionTaken} • {v.status}</small>
                </li>
              ))}
            </ul>
          ) : <p className="muted">No violations</p>}
        </ProfileSection>

        <ProfileSection icon={Sparkles} title="Skills">
          <div className="skills-grid">
            {student.skills.map(sk => (
              <div key={sk.skillID} className="skill-card">
                <span className="skill-name">{sk.skillName}</span>
                <span className="skill-category">{sk.category}</span>
                {sk.description && <span className="skill-desc">{sk.description}</span>}
              </div>
            ))}
          </div>
        </ProfileSection>
      </div>

      <StudentFormModal
        open={editModal}
        onClose={() => setEditModal(false)}
        student={student}
        courses={courses}
        departments={departments}
        onSave={async (s) => {
          const updated = await crud.students.update(student.studentID, s)
          setStudent(updated)
          setEditModal(false)
        }}
      />
    </div>
  )
}
