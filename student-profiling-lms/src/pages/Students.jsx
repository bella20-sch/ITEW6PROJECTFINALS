import { useState, useMemo } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Search, ChevronRight, Plus, Users, UserCheck, BookOpen, Sparkles, GraduationCap } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useLmsBase, lmsPath } from '../lib/lmsPaths'
import FilterDropdown from '../components/FilterDropdown'

export default function Students() {
  const { students, courses, departments } = useData()
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'Admin'
  const isFaculty = currentUser?.role === 'Faculty'
  const base = useLmsBase()

  if (currentUser?.role === 'Student') {
    const sid = Number(currentUser?.studentID ?? currentUser?.id)
    if (Number.isFinite(sid)) {
      return <Navigate to={lmsPath(base, `/students/${sid}`)} replace />
    }
  }

  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sortOrder, setSortOrder] = useState('az') // az | za

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

    // Student type (Regular / Irregular / Transferee)
    if (typeFilter) {
      list = list.filter(s => (s.studentType || 'Regular') === typeFilter)
    }

    // Sort alphabetically by last name
    list.sort((a, b) => {
      const nameA = `${a.lastName} ${a.firstName}`.toLowerCase()
      const nameB = `${b.lastName} ${b.firstName}`.toLowerCase()
      return sortOrder === 'az' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })

    return list
  }, [students, search, courseFilter, yearFilter, statusFilter, typeFilter, sortOrder])

  const enrolledCount = students.filter((s) => s.enrollmentStatus === 'Enrolled').length

  return (
    <div className="page">
      <header className="students-hero" aria-labelledby="students-hero-title">
        <div className="students-hero-glow" aria-hidden="true" />
        <div className="students-hero-grid" aria-hidden="true" />
        <div className="students-hero-inner">
          <div className="students-hero-copy">
            <div className="students-hero-badge">
              <span className="students-hero-badge-icon">
                <Users size={18} strokeWidth={2.25} aria-hidden />
              </span>
              <span className="students-hero-badge-text">CCS · Student directory</span>
            </div>
            <h2 id="students-hero-title" className="students-hero-title">
              {isFaculty ? 'Your sections & advisees' : 'Student records & profiles'}
            </h2>
            <p className="students-hero-sub">
              {isFaculty
                ? 'Only students in sections you teach or advise appear here. Use search and filters to find someone in your roster.'
                : 'Search and filter the CCS student body by course, year level, enrollment, and type. Administrators can register new students from here.'}
            </p>
            <ul className="students-hero-tags">
              <li><Sparkles size={12} strokeWidth={2} aria-hidden /> {students.length} {isFaculty ? 'in your sections' : 'students'}</li>
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

      <div className="students-page-header">
        {isAdmin && (
          <div className="students-page-title-row students-page-title-row--faculty-toolbar">
            <Link to={lmsPath(base, '/students/new')} className="btn btn-primary">
              <Plus size={18} /> Add Student
            </Link>
          </div>
        )}
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
            ariaLabel="Filter by student type"
            value={typeFilter}
            onChange={setTypeFilter}
            placeholder="All types"
            options={[
              { value: '', label: 'All types' },
              { value: 'Regular', label: 'Regular' },
              { value: 'Irregular', label: 'Irregular' },
              { value: 'Transferee', label: 'Transferee' },
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

      <div className="student-list" role="region" aria-labelledby="students-hero-title">
        {filtered.map(student => {
          const course = courses.find(c => c.courseID === student.courseID)
          return (
            <Link key={student.studentID} to={lmsPath(base, `/students/${student.studentID}`)} className="student-card">
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
              <div className="student-card-badges">
                <span className="student-badge student-badge-type">{student.studentType || 'Regular'}</span>
                <span className="student-badge">{student.enrollmentStatus}</span>
              </div>
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

    </div>
  )
}
