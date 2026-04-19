import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, BookOpen, UserCircle, FileBarChart, X, ClipboardList } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '', icon: LayoutDashboard, label: 'Dashboard' },
  { path: 'students', icon: Users, label: 'Students' },
  { path: 'courses', icon: BookOpen, label: 'Courses' },
  { path: 'faculty', icon: UserCircle, label: 'Faculty' },
  { path: 'reports', icon: FileBarChart, label: 'Reports & Queries' },
]

export default function Sidebar({ open, onClose, collapsed }) {
  const { currentUser } = useAuth()
  let items = navItems
  if (currentUser?.role === 'Faculty') {
    const fid = currentUser?.id
    const profilePath = fid != null && fid !== '' ? `faculty/${fid}` : 'faculty'
    items = [
      { path: '', icon: LayoutDashboard, label: 'Dashboard' },
      { path: 'students', icon: Users, label: 'My Students' },
      { path: 'my-classes', icon: BookOpen, label: 'My Classes' },
      { path: profilePath, icon: UserCircle, label: 'My Profile', end: true },
      { path: 'workspace', icon: ClipboardList, label: 'Teaching Workspace' },
    ]
  } else if (currentUser?.role === 'Student') {
    const sid = currentUser?.studentID ?? currentUser?.id
    const profilePath = sid != null && sid !== '' ? `students/${sid}` : 'students'
    items = [
      { path: '', icon: LayoutDashboard, label: 'Dashboard' },
      { path: profilePath, icon: Users, label: 'My Profile', end: true },
      { path: 'workspace', icon: ClipboardList, label: 'My Activities' },
    ]
  }

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'active' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar ${open ? 'sidebar-open' : ''} ${collapsed ? 'sidebar--collapsed' : ''}`}>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
          <X size={24} />
        </button>
      <div className="sidebar-brand">
        <img src="/logo.png" alt="CCS Logo" className="sidebar-logo-image" onError={(e) => { e.target.src = 'https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/Pamantasan_ng_Cabuyao_logo.svg/1200px-Pamantasan_ng_Cabuyao_logo.svg.png'; e.target.onError = null; }} />
        <span className="sidebar-title">Student Profiling LMS</span>
      </div>
      <nav className="sidebar-nav">
        {items.map(({ path, icon: Icon, label, end }) => (
          <NavLink
            key={path}
            to={path === '' ? '/' : `/${path}`}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            end={end ?? path === ''}
            onClick={onClose}
            title={label}
          >
            <Icon size={20} strokeWidth={2} />
            <span className="sidebar-link-text">{label}</span>
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
