import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, BookOpen, UserCircle, FileBarChart, X, ClipboardList, LogOut, FileText } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import logoUrl from '../assets/logo.png'

const FALLBACK_LOGO_URL =
  'https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/Pamantasan_ng_Cabuyao_logo.svg/1200px-Pamantasan_ng_Cabuyao_logo.svg.png'

const navItems = [
  { path: '', icon: LayoutDashboard, label: 'Dashboard' },
  { path: 'students', icon: Users, label: 'Students' },
  { path: 'courses', icon: BookOpen, label: 'Courses' },
  { path: 'faculty', icon: UserCircle, label: 'Faculty' },
  { path: 'reports', icon: FileBarChart, label: 'Reports & Queries' },
]

export default function Sidebar({ open, onClose, collapsed }) {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [loggingOut, setLoggingOut] = useState(false)
  let items = navItems
  if (currentUser?.role === 'Faculty') {
    items = [
      { path: '', icon: LayoutDashboard, label: 'Dashboard' },
      { path: 'students', icon: Users, label: 'My Students' },
      { path: 'my-classes', icon: BookOpen, label: 'My Classes' },
      { path: 'workspace', icon: ClipboardList, label: 'Teaching Workspace' },
    ]
  } else if (currentUser?.role === 'Student') {
    items = [
      { path: '', icon: LayoutDashboard, label: 'Dashboard', end: true },
      { path: 'classes', icon: BookOpen, label: 'Classes', end: false },
      { path: 'activities', icon: ClipboardList, label: 'Activities', end: true },
      { path: 'materials', icon: FileText, label: 'Materials', end: true },
    ]
  }

  const portalTitle =
    currentUser?.role === 'Faculty'
      ? 'Faculty Portal'
      : currentUser?.role === 'Student'
        ? 'Student Portal'
        : 'Student Profiling LMS'
  const portalTitleClass =
    currentUser?.role === 'Faculty' || currentUser?.role === 'Student'
      ? 'sidebar-title sidebar-title--portal'
      : 'sidebar-title'

  const handleLogout = async () => {
    onClose()
    setLoggingOut(true)
    await logout()
    showToast('Logged out successfully.', 'success')
    setTimeout(() => navigate('/login', { replace: true }), 1200)
    setLoggingOut(false)
  }

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'active' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar ${open ? 'sidebar-open' : ''} ${collapsed ? 'sidebar--collapsed' : ''}`}>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
          <X size={24} />
        </button>
      <div className="sidebar-brand">
        <img
          src={logoUrl}
          alt="CCS Logo"
          className="sidebar-logo-image"
          onError={(e) => {
            e.target.src = FALLBACK_LOGO_URL
            e.target.onError = null
          }}
        />
        <div className="sidebar-brand-text">
          <span className={portalTitleClass}>{portalTitle}</span>
          {(currentUser?.role === 'Faculty' || currentUser?.role === 'Student') && (
            <span className="sidebar-school-year">School Year 2024-2025</span>
          )}
        </div>
      </div>
      <nav className="sidebar-nav">
        {items.map(({ path, icon: Icon, label, end }) => (
          <NavLink
            key={path || 'home'}
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
      {currentUser && (
        <div className="sidebar-logout-wrap">
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            disabled={loggingOut}
            title="Logout"
          >
            <LogOut size={20} strokeWidth={2} />
            <span className="sidebar-logout-btn-text">{loggingOut ? 'Logging out…' : 'Logout'}</span>
          </button>
        </div>
      )}
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
