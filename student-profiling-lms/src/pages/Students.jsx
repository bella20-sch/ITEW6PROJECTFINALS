import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronRight, Plus } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import StudentFormModal from '../components/StudentFormModal'
import FilterDropdown from '../components/FilterDropdown'
import ConfirmModal from '../components/ConfirmModal'

export default function Students() {
  const { students, courses, departments, crud } = useData()
  const { currentUser } = useAuth()
  const { showToast } = useToast()
  const isAdmin = currentUser?.role === 'Admin'

  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortOrder, setSortOrder] = useState('az') // az | za
  const [modal, setModal] = useState(false)
  const [pendingSave, setPendingSave] = useState(null)
  const [confirm, setConfirm] = useState({ open: false })

  const filtered = useMemo(() => {
    let list = [...students]

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(s =>
        `${s.firstName} ${s.middleName || ''} ${s.lastName}`.toLowerCase().includes(q) ||
        String(s.studentID).includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.section?.toLowerCase().includes(q)
      )
    }

    // Course filter
    if (courseFilter) list = list.filter(s => String(s.courseID) === courseFilter)

    // Year level filter
    if (yearFilter) list = list.filter(s => String(s.yearLevel) === yearFilter)

    // Enrollment status filter
    if (statusFilter) list = list.filter(s => s.enrollmentStatus === statusFilter)

    // Sort alphabetically by last name
    list.sort((a, b) => {
      const nameA = `${a.lastName} ${a.firstName}`.toLowerCase()
      const nameB = `${b.lastName} ${b.firstName}`.toLowerCase()
      return sortOrder === 'az' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })

    return list
  }, [students, search, courseFilter, yearFilter, statusFilter, sortOrder])

  return (
    <div className="page">
      <div className="students-page-header">
        <div className="students-page-title-row">
          <h2>All Students</h2>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setModal(true)}>
              <Plus size={18} /> Add Student
            </button>
          )}
        </div>
        <div className="students-search-row">
          <div className="search-box" style={{ flex: 1 }}>
            <Search size={18} />
            <input
              type="search"
              placeholder="Search by name, ID, email, section..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <div className="students-filter-row">
          <FilterDropdown
            ariaLabel="Filter by course"
            value={courseFilter}
            onChange={setCourseFilter}
            placeholder="All Courses"
            options={[
              { value: '', label: 'All Courses' },
              ...courses.map(c => ({ value: String(c.courseID), label: c.courseCode })),
            ]}
          />
          <FilterDropdown
            ariaLabel="Filter by year level"
            value={yearFilter}
            onChange={setYearFilter}
            placeholder="All Year Levels"
            options={[
              { value: '', label: 'All Year Levels' },
              { value: '1', label: '1st Year' },
              { value: '2', label: '2nd Year' },
              { value: '3', label: '3rd Year' },
              { value: '4', label: '4th Year' },
              { value: '5', label: '5th Year' },
              { value: '6', label: '6th Year' },
            ]}
          />
          <FilterDropdown
            ariaLabel="Filter by enrollment status"
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Statuses"
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'Enrolled', label: 'Enrolled' },
              { value: 'Dropped', label: 'Dropped' },
              { value: 'Graduated', label: 'Graduated' },
              { value: 'Leave of Absence', label: 'Leave of Absence' },
            ]}
          />
          <FilterDropdown
            ariaLabel="Sort order"
            value={sortOrder}
            onChange={setSortOrder}
            placeholder="Sort"
            options={[
              { value: 'az', label: 'A → Z (Last Name)' },
              { value: 'za', label: 'Z → A (Last Name)' },
            ]}
          />
        </div>
      </div>

      <div className="student-list">
        {filtered.map(student => {
          const course = courses.find(c => c.courseID === student.courseID)
          return (
            <Link key={student.studentID} to={`/students/${student.studentID}`} className="student-card">
              <div className="student-avatar">
                {student.photo
                  ? <img src={student.photo} alt={student.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : <>{student.firstName[0]}{student.lastName[0]}</>
                }
              </div>
              <div className="student-info">
                <h3>{student.lastName}, {student.firstName} {student.middleName || ''} {student.suffix || ''}</h3>
                <span className="student-id">{student.email || '—'}</span>
                <span className="student-meta">
                  Year {student.yearLevel} • {student.section} • {course?.courseCode || '—'}
                </span>
              </div>
              <span className="student-badge">{student.enrollmentStatus}</span>
              <ChevronRight size={20} className="student-arrow" />
            </Link>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <p>No students match your filters.</p>
        </div>
      )}

      {isAdmin && (
        <StudentFormModal
          open={modal}
          onClose={() => setModal(false)}
          courses={courses}
          departments={departments}
          onSave={async s => {
            setModal(false)
            setPendingSave(s)
            setConfirm({ open: true })
          }}
        />
      )}

      <ConfirmModal
        open={confirm.open}
        title="Add Student"
        message="Are you sure you want to add this student?"
        onConfirm={async () => {
          setConfirm({ open: false })
          try {
            await crud.students.create(pendingSave)
          } catch (err) {
            showToast(err?.message || 'Failed to create student.', 'error')
          }
          setPendingSave(null)
        }}
        onCancel={() => {
          setConfirm({ open: false })
          setModal(true)
        }}
      />
    </div>
  )
}
