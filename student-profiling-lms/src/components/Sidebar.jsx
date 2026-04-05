import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, BookOpen, UserCircle, FileBarChart, X, Shield, ClipboardList } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '', icon: LayoutDashboard, label: 'Dashboard' },
  { path: 'students', icon: Users, label: 'Students' },
  { path: 'courses', icon: BookOpen, label: 'Courses' },
  { path: 'faculty', icon: UserCircle, label: 'Faculty' },
  { path: 'reports', icon: FileBarChart, label: 'Reports & Queries' },
]

export default function Sidebar({ open, onClose }) {
  const { currentUser } = useAuth()
  let items = navItems
  if (currentUser?.role === 'Admin') {
    items = [...navItems, { path: 'admin', icon: Shield, label: 'MIS/Admin' }]
  } else if (currentUser?.role === 'Faculty') {
    items = [
      { path: '', icon: LayoutDashboard, label: 'Dashboard' },
      { path: 'students', icon: Users, label: 'My Students' },
      { path: 'courses', icon: BookOpen, label: 'My Courses' },
      { path: 'faculty', icon: UserCircle, label: 'My Profile' },
      { path: 'workspace', icon: ClipboardList, label: 'Teaching Workspace' },
    ]
  } else if (currentUser?.role === 'Student') {
    items = [
      { path: '', icon: LayoutDashboard, label: 'Dashboard' },
      { path: 'students', icon: Users, label: 'My Profile' },
      { path: 'workspace', icon: ClipboardList, label: 'My Activities' },
    ]
  }

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'active' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
          <X size={24} />
        </button>
      <div className="sidebar-brand">
        <img src="/logo.png" alt="CCS Logo" className="sidebar-logo-image" style={{ width: 40, height: 40, objectFit: 'contain', marginRight: 12 }} onError={(e) => { e.target.src = 'https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/Pamantasan_ng_Cabuyao_logo.svg/1200px-Pamantasan_ng_Cabuyao_logo.svg.png'; e.target.onError = null; }} />
        <span className="sidebar-title">Student Profiling LMS</span>
      </div>
      <nav className="sidebar-nav">
        {items.map(({ path, icon: Icon, label }) => (
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
        <p className="sidebar-credits">
          System developed by:<br />
          Bella, Mourine Kate Oshlen C.<br />
          Borabo, Nicole S.<br />
          Lorica, Ken Eubert R.<br />
          Mendoza, Mayen Sofia T.
        </p>
      </div>
    </aside>
    </>
  )
}
