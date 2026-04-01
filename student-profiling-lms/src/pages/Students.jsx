import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronRight, Plus } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import StudentFormModal from '../components/StudentFormModal'
import FilterDropdown from '../components/FilterDropdown'

export default function Students() {
  const { students, courses, departments, crud } = useData()
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'Admin'
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [modal, setModal] = useState(false)

  const sections = Array.from(new Set(students.map(s => s.section).filter(Boolean))).sort((a, b) => a.localeCompare(b))

  const filtered = students.filter(s => {
    const fullName = `${s.firstName} ${s.middleName || ''} ${s.lastName} ${s.suffix || ''}`.toLowerCase()
    const query = search.toLowerCase()
    const matchesSearch = fullName.includes(query) || String(s.studentID).includes(query) || s.email?.toLowerCase().includes(query)
    const matchesSection = !sectionFilter || s.section === sectionFilter
    const matchesCourse = !courseFilter || String(s.courseID) === courseFilter
    return matchesSearch && matchesSection && matchesCourse
  })

  return (
    <div className="page">
      <div className="page-header">
        <h2>All Students</h2>
        <div className="page-header-actions">
          <div className="search-box">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search by name, ID, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <FilterDropdown
            ariaLabel="Filter by section"
            value={sectionFilter}
            onChange={setSectionFilter}
            placeholder="All Sections"
            options={[
              { value: '', label: 'All Sections' },
              ...sections.map(sec => ({ value: sec, label: sec })),
            ]}
          />
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
          {isAdmin && <button className="btn btn-primary" onClick={() => setModal(true)}>
            <Plus size={18} /> Add Student
          </button>}
        </div>
      </div>

      <div className="student-list">
        {filtered.map((student) => {
          const course = courses.find(c => c.courseID === student.courseID)
          return (
            <Link key={student.studentID} to={`/students/${student.studentID}`} className="student-card">
              <div className="student-avatar">
                {student.firstName[0]}{student.lastName[0]}
              </div>
              <div className="student-info">
                <h3>{student.firstName} {student.middleName} {student.lastName} {student.suffix || ''}</h3>
                <span className="student-id">ID: {student.studentID}</span>
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
          <p>No students match your search.</p>
        </div>
      )}

      {isAdmin && <StudentFormModal
        open={modal}
        onClose={() => setModal(false)}
        courses={courses}
        departments={departments}
        onSave={async (s) => {
          await crud.students.create(s)
          setModal(false)
        }}
      />}
    </div>
  )
}
