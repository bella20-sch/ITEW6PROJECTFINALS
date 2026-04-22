import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  UserCircle,
  FileBarChart,
  X,
  UserPlus,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import logoUrl from '../assets/logo.png'

const FALLBACK_LOGO_URL =
  'https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/Pamantasan_ng_Cabuyao_logo.svg/1200px-Pamantasan_ng_Cabuyao_logo.svg.png'

const misNavItems = [
  { path: '/mis', end: true, icon: LayoutDashboard, label: 'MIS dashboard' },
  { path: '/mis/provision', end: false, icon: UserPlus, label: 'Account provisioning' },
  { path: '/mis/students', end: false, icon: Users, label: 'Students' },
  { path: '/mis/courses', end: false, icon: BookOpen, label: 'Courses' },
  { path: '/mis/faculty', end: false, icon: UserCircle, label: 'Faculty' },
  { path: '/mis/reports', end: false, icon: FileBarChart, label: 'Reports & queries' },
]

export default function MisSidebar({ open, onClose, collapsed }) {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [loggingOut, setLoggingOut] = useState(false)

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
        <button type="button" className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
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
            <span className="sidebar-title sidebar-title--portal">MIS Console</span>
            <span className="sidebar-school-year">School Year 2024-2025</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {misNavItems.map(({ path, end, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
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
