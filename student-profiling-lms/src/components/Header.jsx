import { useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu, Moon, Sun, PanelLeftClose, PanelLeftOpen, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useState, useCallback } from 'react'
import { getTheme, setTheme } from '../lib/theme'

const pageTitles = {
  '/': 'Dashboard',
  '/students': 'Students',
  '/students/new': 'Add student',
  '/departments': 'Departments',
  '/courses': 'Courses',
  '/faculty': 'Faculty',
  '/reports': 'Reports & Queries',
  '/workspace': 'Workspace',
  '/provision': 'Account provisioning',
}

export default function Header({ onMenuClick, sidebarCollapsed, onToggleSidebarCollapse }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  const { showToast } = useToast()
  const [loggingOut, setLoggingOut] = useState(false)
  const [colorMode, setColorMode] = useState(() => getTheme())
  const path = location.pathname

  const appPath = path.startsWith('/mis')
    ? path === '/mis'
      ? '/'
      : path.slice(4) || '/'
    : path

  const isStudentProfile = /^\/(?:mis\/)?students\/\d+$/.test(path)
  const isStudentEdit = /^\/(?:mis\/)?students\/\d+\/edit$/.test(path)

  const toggleColorMode = useCallback(() => {
    const next = colorMode === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setColorMode(next)
  }, [colorMode])
  const title =
    path === '/mis'
      ? 'MIS dashboard'
      : isStudentProfile
        ? 'Student profile'
        : isStudentEdit
          ? 'Edit student profile'
          : pageTitles[appPath] || pageTitles[path] || 'Student Profiling LMS'

  const userDisplayName = currentUser
    ? [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ').trim() ||
      currentUser.name ||
      currentUser.email ||
      (currentUser.role ? String(currentUser.role) : '')
    : ''

  return (
    <header className="header">
      <div className="header-start">
        <button className="header-menu-btn" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={24} />
        </button>
        <button
          type="button"
          className="header-sidebar-toggle"
          onClick={onToggleSidebarCollapse}
          aria-expanded={!sidebarCollapsed}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={22} strokeWidth={2} /> : <PanelLeftClose size={22} strokeWidth={2} />}
        </button>
        <h1 className="header-title">{title}</h1>
      </div>
      <div className="header-actions">
        <span className="header-badge">School Year 2024-2025</span>
        <button
          type="button"
          className="header-theme-toggle"
          onClick={toggleColorMode}
          aria-label={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-pressed={colorMode === 'dark'}
        >
          {colorMode === 'dark' ? <Sun size={18} strokeWidth={2} aria-hidden /> : <Moon size={18} strokeWidth={2} aria-hidden />}
        </button>
        {currentUser && userDisplayName && (
          <span className="header-user" title="Signed-in account">
            <Shield size={16} strokeWidth={2} className="header-user-shield" aria-hidden />
            {userDisplayName}
          </span>
        )}
        <button
          className="btn btn-outline header-logout"
          disabled={loggingOut}
          onClick={async () => {
            setLoggingOut(true)
            await logout()
            showToast('Logged out successfully.', 'success')
            setTimeout(() => navigate('/login', { replace: true }), 1200)
            setLoggingOut(false)
          }}
        >
          <LogOut size={16} />
          <span>{loggingOut ? 'Logging out…' : 'Logout'}</span>
        </button>
      </div>
    </header>
  )
}
