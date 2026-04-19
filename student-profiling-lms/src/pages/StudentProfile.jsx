import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  User, Mail, Calendar, AlertTriangle, BookOpen, Briefcase, Heart, Users,
  Sparkles, ArrowLeft, GraduationCap, Pencil, Trash2, Plus,
} from 'lucide-react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useLmsBase, lmsPath } from '../lib/lmsPaths'
import ReqStar from '../components/ReqStar'
import Modal from '../components/Modal'

const PNC_GRADES = [
  { min: 1.00, max: 1.25, label: "President's List" },
  { min: 1.26, max: 1.50, label: "VPAA's List" },
  { min: 1.51, max: 2.50, label: "Dean's Lister" },
  { min: 2.51, max: 3.00, label: "Passing" },
  { min: 3.01, max: 5.00, label: "Failed" },
]

function getPNCDesc(gpa) {
  const val = parseFloat(gpa)
  if (isNaN(val)) return ''
  const match = PNC_GRADES.find(g => val >= g.min && val <= (g.max + 0.001))
  return match ? match.label : ''
}

/** Sort key: later school year + semester sorts higher (for newest-first lists). */
function academicTermSortKey(ah) {
  const sy = String(ah.schoolYear || '')
  const start = parseInt(sy.split(/[-–]/)[0], 10) || 0
  const sem = String(ah.semester || '').toLowerCase()
  let semOrder = 1
  if (sem.includes('2nd') || sem === '2' || sem.includes('second')) semOrder = 2
  else if (sem.includes('summer')) semOrder = 3
  return start * 10 + semOrder
}

/** Visual tone for standing text only (keeps UI consistent; two accents + neutral). */
function academicStandingTone(standing) {
  const s = String(standing || '').toLowerCase()
  if (s.includes('fail') || s.includes('inc') || s.includes('drop')) return 'risk'
  if (s.includes('president') || s.includes('vpaa') || s.includes('dean')) return 'honors'
  return 'neutral'
}

// Confirmation modal
function ConfirmModal({ open, title, message, onConfirm, onCancel, danger }) {
  return (
    <Modal title={title || 'Confirm'} open={open} onClose={onCancel} closeOnOverlayClick={false}>
      <p className="confirm-modal-message">{message}</p>
      <div className="form-actions">
        <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
          {danger ? 'Delete' : 'Confirm'}
        </button>
      </div>
    </Modal>
  )
}

// Generic sub-record form modal
function SubModal({ title, open, onClose, fields, initial, onSave }) {
  const [data, setData] = useState(initial || {})
  const [busy, setBusy] = useState(false)
  const prevOpen = useRef(false)
  
  useEffect(() => {
    if (open && !prevOpen.current) setData(initial || {})
    prevOpen.current = open
  }, [open, initial])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try { await onSave(data) } finally { setBusy(false) }
  }

  const handleFieldChange = (key, val) => {
    const next = { ...data, [key]: val }
    if (title.includes('Academic') && key === 'gpa') {
      const desc = getPNCDesc(val)
      if (desc) next.academicStanding = desc
    }
    setData(next)
  }

  return (
    <Modal title={title} open={open} onClose={onClose} closeOnOverlayClick={false}>
      <form onSubmit={handleSubmit} className="form">
        {fields.map(f => {
          const isSelect = f.type === 'select'
          const hasOther = isSelect && f.options.includes('Other')
          // Determine if current value is a custom "Other" value
          const isOtherSelected = hasOther && !f.options.slice(0, -1).includes(data[f.key]) && data[f.key] !== '' && data[f.key] !== undefined
          const selectValue = isOtherSelected ? 'Other' : (data[f.key] ?? '')

          return (
            <div key={f.key}>
              <label>{f.label}{f.required ? <> <ReqStar /></> : null}</label>
              {isSelect ? (
                <>
                  <select
                    value={selectValue}
                    onChange={e => {
                      if (e.target.value === 'Other') handleFieldChange(f.key, 'Other')
                      else handleFieldChange(f.key, e.target.value)
                    }}
                    required={f.required && !isOtherSelected}
                  >
                    <option value="">— Select —</option>
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  {(selectValue === 'Other') && (
                    <input
                      type="text"
                      value={data[f.key] === 'Other' ? '' : (data[f.key] ?? '')}
                      onChange={e => handleFieldChange(f.key, e.target.value || 'Other')}
                      placeholder={`Please specify...`}
                      style={{ marginTop: 6 }}
                      autoFocus
                    />
                  )}
                </>
              ) : (
                <input
                  type={f.type || 'text'}
                  value={data[f.key] ?? ''}
                  onChange={e => handleFieldChange(f.key, e.target.value)}
                  placeholder={f.placeholder || ''}
                  required={f.required}
                  pattern={f.pattern || undefined}
                  title={f.pattern ? 'Enter 11-digit number (09XXXXXXXXX) or +63 format' : undefined}
                />
              )}
            </div>
          )
        })}
        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  )
}

function ProfileSection({ icon: Icon, title, children, action }) {
  return (
    <section className="profile-section">
      <h3><Icon size={18} /> {title} {action}</h3>
      <div className="profile-section-content">{children}</div>
    </section>
  )
}

// Generate school year choices: 1998-1999 up to current SY (e.g. 2025-2026 if 2025, 2026-2027 if 2026)
const currentYear = new Date().getFullYear()
const startYear = 1998
const SCHOOL_YEARS = [
  ...Array.from({ length: currentYear - startYear + 1 }, (_, i) => {
    const y = startYear + i
    return `${y}-${y + 1}`
  }),
  'Other'
]



const RELATIONSHIPS = [
  'Father', 'Mother', 'Step-Father', 'Step-Mother', 'Guardian',
  'Grandfather', 'Grandmother', 'Uncle', 'Aunt',
  'Brother', 'Sister', 'Relative', 'Other',
]

const OCCUPATIONS = [
  'Teacher / Educator', 'Engineer', 'Nurse / Medical Professional', 'Doctor',
  'Lawyer', 'Accountant', 'Government Employee', 'Military / Police',
  'Businessman / Entrepreneur', 'Farmer', 'Driver', 'Overseas Worker (OFW)',
  'Housewife / Homemaker', 'Retired', 'Unemployed', 'Other',
]

const PH_CITIES_SUB = [
  'Calamba', 'Cabuyao', 'San Pedro', 'Biñan', 'Santa Rosa', 'Calauan', 'Los Baños',
  'Bay', 'Victoria', 'Pila', 'Pagsanjan', 'Lumban', 'Pangil', 'Mabitac', 'Siniloan',
  'Manila', 'Quezon City', 'Makati', 'Pasig', 'Taguig', 'Mandaluyong', 'Marikina',
  'Parañaque', 'Las Piñas', 'Muntinlupa', 'Valenzuela', 'Malabon', 'Navotas',
  'Pasay', 'Caloocan', 'Pateros', 'Cebu City', 'Davao City', 'Zamboanga City',
  'Cagayan de Oro', 'Iloilo City', 'Bacolod', 'General Santos', 'Antipolo',
  'Bacoor', 'Dasmariñas', 'Imus', 'Batangas City', 'Lipa', 'Baguio', 'Other',
].sort()

const SKILL_CATEGORIES = [
  'Programming', 'Web Development', 'Mobile Development', 'Data Science',
  'Networking', 'Cybersecurity', 'Design / Arts', 'Music', 'Sports',
  'Leadership', 'Communication', 'Research', 'Mathematics', 'Science',
  'Language', 'Other',
]

const VIOLATION_TYPES = [
  'Tardiness', 'Absences', 'Dress Code Violation', 'Cheating / Academic Dishonesty',
  'Bullying', 'Vandalism', 'Disrespect to Faculty', 'Use of Mobile Phone',
  'Possession of Prohibited Items', 'Fighting / Physical Altercation',
  'Substance Use', 'Other',
]

const ACTIVITY_TYPES = [
  'Sports Tournament', 'Academic Competition', 'Cultural Event', 'Community Service',
  'Leadership Training', 'Seminar / Workshop', 'Club Activity', 'Volunteer Work',
  'Science Fair', 'Arts Exhibition', 'Debate', 'Other',
]

const SUB_ID_KEYS = {
  skills: 'skillID', affiliations: 'affiliationID', violations: 'violationID',
  activities: 'activityID', medical: 'medicalID', guardians: 'guardianID', academic: 'academicID',
}

const SUB_FIELDS = {
  skills: [
    { key: 'skillName', label: 'Skill Name', required: true },
    { key: 'category', label: 'Category', required: true, type: 'select', options: SKILL_CATEGORIES },
    { key: 'description', label: 'Description' },
  ],
  affiliations: [
    { key: 'organizationName', label: 'Organization Name', required: true },
    { key: 'position', label: 'Position', required: true },
    { key: 'dateJoined', label: 'Date Joined', type: 'date' },
    { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive', 'Alumni'] },
    { key: 'adviserName', label: 'Adviser Name' },
  ],
  violations: [
    { key: 'violationType', label: 'Violation Type', required: true, type: 'select', options: VIOLATION_TYPES },
    { key: 'severityLevel', label: 'Severity', type: 'select', options: ['Minor', 'Major', 'Critical'] },
    { key: 'description', label: 'Description' },
    { key: 'dateReported', label: 'Date Reported', type: 'date' },
    { key: 'actionTaken', label: 'Action Taken' },
    { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Resolved', 'Appealed'] },
  ],
  activities: [
    { key: 'activityType', label: 'Type of Activity', required: true, type: 'select', options: ACTIVITY_TYPES },
    { key: 'activityName', label: 'Activity Name', required: true },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'description', label: 'Description' },
  ],
  medical: [
    { key: 'bloodType', label: 'Blood Type', type: 'select', options: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
    { key: 'medicalConditions', label: 'Medical Conditions', placeholder: 'None if none' },
    { key: 'emergencyContactName', label: 'Emergency Contact Name' },
    { key: 'emergencyContactRelationship', label: 'Relationship', type: 'select', options: RELATIONSHIPS },
    { key: 'emergencyContactNumber', label: 'Contact Number (11 digits or +63...)', type: 'tel', placeholder: '09XXXXXXXXX', pattern: '^(09\\d{9}|\\+63\\d{10})$' },
  ],
  guardians: [
    { key: 'guardianName', label: 'Guardian Name', required: true },
    { key: 'relationship', label: 'Relationship', required: true, type: 'select', options: RELATIONSHIPS },
    { key: 'contactNumber', label: 'Contact Number (11 digits or +63...)', type: 'tel', placeholder: '09XXXXXXXXX', pattern: '^(09\\d{9}|\\+63\\d{10})$' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'occupation', label: 'Occupation', type: 'select', options: OCCUPATIONS },
    { key: 'streetAddress', label: 'Street / Unit / House No.' },
    { key: 'municipality', label: 'Municipality / City', type: 'select', options: PH_CITIES_SUB },
  ],
  academic: [
    { key: 'schoolYear', label: 'School Year', required: true, type: 'select', options: SCHOOL_YEARS },
    { key: 'semester', label: 'Semester', type: 'select', options: ['1st', '2nd', 'Summer'] },
    { key: 'gpa', label: 'GPA (e.g. 1.25)', type: 'number', placeholder: '1.25', required: true },
    { key: 'academicStanding', label: 'Rating / Standing', type: 'select', options: ["President's List", "VPAA's List", "Dean's Lister", "Passing", "Failed", "INC", "DROP"] },
    { key: 'totalUnits', label: 'Total Units', type: 'number' },
    { key: 'completedUnits', label: 'Completed Units', type: 'number' },
  ],
}

export default function StudentProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { crud, subCrud, profiles, courses, departments } = useData()
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'Admin'
  const base = useLmsBase()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [subModal, setSubModal] = useState({ open: false, type: null, item: null })
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null, danger: false })

  const student = profiles[Number(id)] || null

  const sortedAcademicHistory = useMemo(() => {
    const list = [...(student?.academicHistory || [])]
    list.sort((a, b) => academicTermSortKey(b) - academicTermSortKey(a))
    return list
  }, [student?.academicHistory])

  useEffect(() => {
    let cancelled = false
    if (profiles[Number(id)]) { setLoading(false); return }
    setLoading(true)
    crud.students.fetchOne(id)
      .then(() => { if (!cancelled) setLoading(false) })
      .catch(e => { if (!cancelled) { setLoadError(e?.message || 'Failed to load.'); setLoading(false) } })
    return () => { cancelled = true }
  }, [id, crud.students, profiles])

  const askConfirm = (title, message, onConfirm, danger = false) => {
    setConfirm({ open: true, title, message, onConfirm, danger })
  }
  const closeConfirm = () => setConfirm(c => ({ ...c, open: false }))

  if (loading) return <div className="page"><p className="muted">Loading student profile…</p></div>
  if (!student) return <div className="page"><p>{loadError || 'Student not found.'} <Link to={lmsPath(base, '/students')}>Back</Link></p></div>

  const fullName = `${student.firstName} ${student.middleName || ''} ${student.lastName} ${student.suffix || ''}`.trim()
  const course = courses.find(c => c.courseID === student.courseID)
  const latestAcademic = (student.academicHistory || []).slice(-1)[0]
  const gpa = latestAcademic?.gpa

  const handleDeleteStudent = () => {
    askConfirm(
      'Delete Student',
      `Are you sure you want to delete ${fullName}? This will permanently remove all their records.`,
      async () => {
        closeConfirm()
        await crud.students.delete(student.studentID)
        navigate(lmsPath(base, '/students'), { replace: true })
      },
      true
    )
  }

  const closeSubModal = () => setSubModal({ open: false, type: null, item: null })

  const handleSubSave = async (formData) => {
    const { type, item } = subModal
    const sid = student.studentID
    closeSubModal()
    if (item) {
      askConfirm(
        'Confirm Edit',
        'Save changes to this record?',
        async () => {
          closeConfirm()
          await subCrud[type].update(sid, item[SUB_ID_KEYS[type]], formData)
        }
      )
    } else {
      await subCrud[type].create(sid, formData)
    }
  }

  const handleSubDelete = (type, item) => {
    askConfirm(
      'Delete Record',
      'Are you sure you want to delete this record? This action cannot be undone.',
      async () => {
        closeConfirm()
        await subCrud[type].delete(student.studentID, item[SUB_ID_KEYS[type]])
      },
      true
    )
  }

  const addBtn = (type) => isAdmin ? (
    <button className="btn-icon" style={{ marginLeft: 'auto' }}
      onClick={() => setSubModal({ open: true, type, item: null })} aria-label={`Add ${type}`}>
      <Plus size={15} />
    </button>
  ) : null

  const editDeleteBtns = (type, item) => isAdmin ? (
    <span style={{ display: 'inline-flex', gap: 4, marginLeft: 'auto', flexShrink: 0 }}>
      <button className="btn-icon" onClick={() => setSubModal({ open: true, type, item })}><Pencil size={14} /></button>
      <button className="btn-icon btn-danger" onClick={() => handleSubDelete(type, item)}><Trash2 size={14} /></button>
    </span>
  ) : null

  return (
    <div className="page">
      <div className="profile-toolbar">
        <Link to={lmsPath(base, '/students')} className="back-link"><ArrowLeft size={18} /> Back to Students</Link>
        <div>
          {isAdmin && (
            <Link to={lmsPath(base, `/students/${id}/edit`)} className="btn btn-outline">
              <Pencil size={16} /> Edit
            </Link>
          )}
          {isAdmin && <button className="btn btn-danger" onClick={handleDeleteStudent}><Trash2 size={16} /> Delete</button>}
        </div>
      </div>

      <div className="profile-header">
        <div className="profile-avatar">
          {student.photo
            ? <img src={student.photo} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : <>{student.firstName[0]}{student.lastName[0]}</>
          }
        </div>
        <div className="profile-meta">
          <h1>{fullName}</h1>
          <span className="profile-id">Student No.: {student.studentNumber || student.studentID}</span>
          <span className="profile-badge">Year {student.yearLevel} • {student.section} • {course?.courseCode || '—'} • {student.studentType || 'Regular'}</span>
          {gpa != null && <div className="profile-gpa"><GraduationCap size={18} /> GPA: {gpa} • {latestAcademic?.academicStanding}</div>}
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
            <li>Student type: <strong>{student.studentType || 'Regular'}</strong></li>
            <li>Status: <span className="badge-active">{student.enrollmentStatus}</span></li>
            <li>Enrolled: {student.dateEnrolled}</li>
          </ul>
        </ProfileSection>

        <ProfileSection icon={BookOpen} title="Academic History" action={addBtn('academic')}>
          {sortedAcademicHistory.length ? (
            <ul className="academic-history-list" aria-label="Academic terms, newest first">
              {sortedAcademicHistory.map((ah) => {
                const standingTone = academicStandingTone(ah.academicStanding)
                const standingClass = `academic-standing academic-standing--${standingTone}`
                const completed = Number(ah.completedUnits)
                const total = Number(ah.totalUnits)
                const unitsDd = Number.isFinite(completed) && Number.isFinite(total)
                  ? `${completed} / ${total} completed`
                  : '—'
                const tierFromGpa = getPNCDesc(ah.gpa)
                const showTierHint = tierFromGpa && tierFromGpa !== ah.academicStanding
                const semRaw = String(ah.semester || '').trim()
                const semesterPart = !semRaw
                  ? '—'
                  : /semester/i.test(semRaw)
                    ? semRaw
                    : `${semRaw} semester`
                const termTitle = [ah.schoolYear, semesterPart].filter(Boolean).join(' · ')
                return (
                  <li key={ah.academicID} className="academic-history-item">
                    <div className="academic-history-item-body">
                      <p className="academic-history-term">{termTitle}</p>
                      <dl className="academic-history-dl">
                        <dt>GPA</dt>
                        <dd>
                          <span className="academic-history-gpa-num">{ah.gpa ?? '—'}</span>
                          {showTierHint && (
                            <span className="academic-history-dl-note"> ({tierFromGpa} by scale)</span>
                          )}
                        </dd>
                        <dt>Standing</dt>
                        <dd><span className={standingClass}>{ah.academicStanding || '—'}</span></dd>
                        <dt>Units</dt>
                        <dd><span className="academic-history-units">{unitsDd}</span></dd>
                      </dl>
                    </div>
                    {isAdmin && (
                      <div className="academic-history-item-actions">
                        <button type="button" className="btn-icon" aria-label="Edit term" onClick={() => setSubModal({ open: true, type: 'academic', item: ah })}>
                          <Pencil size={14} />
                        </button>
                        <button type="button" className="btn-icon btn-danger" aria-label="Delete term" onClick={() => handleSubDelete('academic', ah)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="muted">No records</p>
          )}
        </ProfileSection>

        <ProfileSection icon={Heart} title="Medical History" action={addBtn('medical')}>
          {(student.medicalHistory || []).length ? (
            <ul className="profile-list">
              {student.medicalHistory.map(m => (
                <li key={m.medicalID} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    Blood: {m.bloodType} • {m.medicalConditions || 'None'}
                    <small>Emergency: {m.emergencyContactName} ({m.emergencyContactRelationship}) {m.emergencyContactNumber}</small>
                  </div>
                  {editDeleteBtns('medical', m)}
                </li>
              ))}
            </ul>
          ) : <p className="muted">No records</p>}
        </ProfileSection>

        <ProfileSection icon={Briefcase} title="Non-Academic Activities" action={addBtn('activities')}>
          {(student.activities || []).length ? (
            <ul className="profile-list">
              {student.activities.map(ac => (
                <li key={ac.activityID} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <strong>{ac.activityName}</strong>
                    <small>{ac.activityType && `${ac.activityType} • `}{ac.description} ({ac.date})</small>
                  </div>
                  {editDeleteBtns('activities', ac)}
                </li>
              ))}
            </ul>
          ) : <p className="muted">No activities recorded</p>}
        </ProfileSection>

        <ProfileSection icon={Users} title="Guardians" action={addBtn('guardians')}>
          {(student.guardians || []).length ? (
            <ul className="profile-list">
              {student.guardians.map(g => (
                <li key={g.guardianID} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <strong>{g.guardianName}</strong> — {g.relationship}
                    <small>{g.email} • {g.occupation}</small>
                  </div>
                  {editDeleteBtns('guardians', g)}
                </li>
              ))}
            </ul>
          ) : <p className="muted">No guardians on file</p>}
        </ProfileSection>

        <ProfileSection icon={Briefcase} title="Affiliations" action={addBtn('affiliations')}>
          {(student.affiliations || []).length ? (
            <ul className="profile-list">
              {student.affiliations.map(a => (
                <li key={a.affiliationID} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <strong>{a.organizationName}</strong> — {a.position} ({a.status})
                    <small>Joined: {a.dateJoined} • Adviser: {a.adviserName}</small>
                  </div>
                  {editDeleteBtns('affiliations', a)}
                </li>
              ))}
            </ul>
          ) : <p className="muted">No affiliations</p>}
        </ProfileSection>

        <ProfileSection icon={AlertTriangle} title="Violations" action={addBtn('violations')}>
          {(student.violations || []).length ? (
            <ul className="profile-list violations">
              {student.violations.map(v => (
                <li key={v.violationID} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <span className={`violation-${v.severityLevel?.toLowerCase()}`}>{v.violationType}</span>: {v.description}
                    <small>{v.dateReported} • {v.actionTaken} • {v.status}</small>
                  </div>
                  {editDeleteBtns('violations', v)}
                </li>
              ))}
            </ul>
          ) : <p className="muted">No violations</p>}
        </ProfileSection>

        <ProfileSection icon={Sparkles} title="Skills" action={addBtn('skills')}>
          {(student.skills || []).length ? (
            <div className="skills-grid">
              {student.skills.map(sk => (
                <div key={sk.skillID} className="skill-card">
                  <span className="skill-name">{sk.skillName}</span>
                  <span className="skill-category">{sk.category}</span>
                  {sk.description && <span className="skill-desc">{sk.description}</span>}
                  {isAdmin && (
                    <span style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      <button className="btn-icon" onClick={() => setSubModal({ open: true, type: 'skills', item: sk })}><Pencil size={13} /></button>
                      <button className="btn-icon btn-danger" onClick={() => handleSubDelete('skills', sk)}><Trash2 size={13} /></button>
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : <p className="muted">No skills recorded</p>}
        </ProfileSection>
      </div>

      {subModal.open && (
        <SubModal
          title={`${subModal.item ? 'Edit' : 'Add'} ${subModal.type?.charAt(0).toUpperCase() + subModal.type?.slice(1).replace(/s$/, '')}`}
          open={subModal.open}
          onClose={closeSubModal}
          fields={SUB_FIELDS[subModal.type] || []}
          initial={subModal.item || {}}
          onSave={handleSubSave}
        />
      )}

      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        danger={confirm.danger}
        onConfirm={confirm.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  )
}
