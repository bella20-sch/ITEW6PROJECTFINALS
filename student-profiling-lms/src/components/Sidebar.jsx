import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Building2, BookOpen, UserCircle, FileBarChart, GraduationCap, X } from 'lucide-react'

const navItems = [
  { path: '', icon: LayoutDashboard, label: 'Dashboard' },
  { path: 'students', icon: Users, label: 'Students' },
  { path: 'departments', icon: Building2, label: 'Departments' },
  { path: 'courses', icon: BookOpen, label: 'Courses' },
  { path: 'faculty', icon: UserCircle, label: 'Faculty' },
  { path: 'reports', icon: FileBarChart, label: 'Reports & Queries' },
]

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <div className={`sidebar-overlay ${open ? 'active' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
          <X size={24} />
        </button>
      <div className="sidebar-brand">
        <GraduationCap className="sidebar-logo" size={32} />
        <span className="sidebar-title">Student Profiling LMS</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path === '' ? '/' : `/${path}`}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            end={path === ''}
            onClick={onClose}
          >
            <Icon size={20} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span className="sidebar-version">v1.0</span>
      </div>
    </aside>
    </>
  )
}
