import { Link } from 'react-router-dom'
import { Users, FileBarChart, Building2, BookOpen, UserCircle } from 'lucide-react'
import { useData } from '../context/DataContext'

export default function Dashboard() {
  const { students, departments, courses, faculty } = useData()

  const stats = [
    { label: 'Students', value: students.length, icon: Users, to: '/students', color: 'accent' },
    { label: 'Departments', value: departments.length, icon: Building2, to: '/departments', color: 'green' },
    { label: 'Courses', value: courses.length, icon: BookOpen, to: '/courses', color: 'teal' },
    { label: 'Faculty', value: faculty.length, icon: UserCircle, to: '/faculty', color: 'blue' },
  ]

  return (
    <div className="dashboard">
      <section className="dashboard-hero">
        <h2 className="dashboard-hero-title">Student Profiling LMS</h2>
        <p className="dashboard-hero-subtitle">
          Comprehensive student data: affiliations, violations, academic & medical history, guardians, and skills. CRUD on all entities.
        </p>
      </section>

      <section className="dashboard-stats">
        {stats.map(({ label, value, icon: Icon, to, color }) => (
          <Link key={label} to={to} className={`stat-card stat-card-${color} stat-card-link`}>
            <div className="stat-icon"><Icon size={24} /></div>
            <div className="stat-content">
              <span className="stat-value">{value}</span>
              <span className="stat-label">{label}</span>
            </div>
          </Link>
        ))}
      </section>

      <section className="dashboard-actions">
        <Link to="/students" className="action-card">
          <Users size={32} />
          <h3>Students</h3>
          <p>View, add, edit students. Full profiles with Academic, Medical, Guardians, Skills, Affiliations, Violations.</p>
        </Link>
        <Link to="/departments" className="action-card">
          <Building2 size={32} />
          <h3>Departments</h3>
          <p>Manage departments with CRUD.</p>
        </Link>
        <Link to="/courses" className="action-card">
          <BookOpen size={32} />
          <h3>Courses</h3>
          <p>Manage courses linked to departments.</p>
        </Link>
        <Link to="/faculty" className="action-card">
          <UserCircle size={32} />
          <h3>Faculty</h3>
          <p>Manage faculty and link to departments.</p>
        </Link>
        <Link to="/reports" className="action-card">
          <FileBarChart size={32} />
          <h3>Reports & Queries</h3>
          <p>Generate reports: basketball tryouts, programming contest, honor roll, etc.</p>
        </Link>
      </section>
    </div>
  )
}
