import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Moon, Sun, PanelLeftClose, PanelLeftOpen, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useState, useCallback, useRef, useEffect } from 'react'
import { getTheme, setTheme } from '../lib/theme'
import { getSelfProfilePath } from '../lib/lmsPaths'

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
  '/my-classes': 'My classes',
  '/classes': 'Classes',
  '/activities': 'Activities',
  '/materials': 'Materials',
}

function headerInitials(user) {
  const fn = String(user?.firstName || '').trim()
  const ln = String(user?.lastName || '').trim()
  const a = fn ? fn[0].toUpperCase() : ''
  const b = ln ? ln[0].toUpperCase() : ''
  if (a && b) return a + b
  if (a) return a + (fn.length > 1 ? fn[1].toUpperCase() : '')
  if (b) return b
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.name || user?.email || ''
  return name ? name.slice(0, 2).toUpperCase() : '?'
}

export default function Header({ onMenuClick, sidebarCollapsed, onToggleSidebarCollapse }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [colorMode, setColorMode] = useState(() => getTheme())
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [headerAvatarFailed, setHeaderAvatarFailed] = useState(false)
  const userMenuRef = useRef(null)
  const path = location.pathname

  const appPath = path.startsWith('/mis')
    ? path === '/mis'
      ? '/'
      : path.slice(4) || '/'
    : path

  const isStudentProfile = /^\/(?:mis\/)?students\/\d+$/.test(path)
  const isStudentEdit = /^\/(?:mis\/)?students\/\d+\/edit$/.test(path)
  const facultyPathMatch = path.match(/^\/(?:mis\/)?faculty\/(\d+)$/)
  const facultyRouteTitle = facultyPathMatch
    ? currentUser?.role === 'Faculty' && Number(facultyPathMatch[1]) === Number(currentUser?.id)
      ? 'My profile'
      : 'Faculty'
    : null

  const myClassesRouteTitle = /^\/(?:mis\/)?my-classes$/.test(path)
    ? 'My classes'
    : /^\/(?:mis\/)?my-classes\/\d+\/activities\/\d+$/.test(path)
      ? 'Class activity'
      : /^\/(?:mis\/)?my-classes\/\d+\/students\/\d+$/.test(path)
        ? 'Student progress'
        : /^\/(?:mis\/)?my-classes\/\d+$/.test(path)
          ? 'Class section'
          : null

  const studentClassesRouteTitle = /^\/classes\/\d+$/.test(path) ? 'Class' : null

  const toggleColorMode = useCallback(() => {
    const next = colorMode === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setColorMode(next)
  }, [colorMode])

  const isStudentOrFaculty =
    currentUser?.role === 'Student' || currentUser?.role === 'Faculty'
  const headerPhoto =
    typeof currentUser?.photo === 'string' && currentUser.photo.trim() ? currentUser.photo.trim() : ''
  const showHeaderPhoto = isStudentOrFaculty && headerPhoto && !headerAvatarFailed

  useEffect(() => {
    setHeaderAvatarFailed(false)
  }, [currentUser?.id, currentUser?.photo])

  useEffect(() => {
    if (!userMenuOpen) return
    const onDown = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [userMenuOpen])
  const title =
    path === '/mis'
      ? 'MIS dashboard'
      : facultyRouteTitle
        ? facultyRouteTitle
        : myClassesRouteTitle
          ? myClassesRouteTitle
          : studentClassesRouteTitle
            ? studentClassesRouteTitle
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
        <button
          type="button"
          className="header-theme-toggle"
          onClick={toggleColorMode}
          aria-label={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-pressed={colorMode === 'dark'}
        >
          {colorMode === 'dark' ? <Sun size={18} strokeWidth={2} aria-hidden /> : <Moon size={18} strokeWidth={2} aria-hidden />}
        </button>
        {isStudentOrFaculty && userDisplayName && (
          <>
            <span className="header-user-name">{userDisplayName}</span>
            <div className="header-user-menu" ref={userMenuRef}>
              <button
                type="button"
                className="header-user-menu-trigger"
                onClick={() => setUserMenuOpen((o) => !o)}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                aria-label="Account menu"
              >
                <span className="header-user-avatar" aria-hidden>
                  {showHeaderPhoto ? (
                    <img
                      src={headerPhoto}
                      alt=""
                      className="header-user-avatar-img"
                      onError={() => setHeaderAvatarFailed(true)}
                    />
                  ) : (
                    <span className="header-user-initials">{headerInitials(currentUser)}</span>
                  )}
                </span>
              </button>
              {userMenuOpen && (
                <div className="header-user-menu-dropdown" role="menu">
                  <button
                    type="button"
                    className="header-user-menu-item"
                    role="menuitem"
                    onClick={() => {
                      navigate(getSelfProfilePath(currentUser))
                      setUserMenuOpen(false)
                    }}
                  >
                    My Profile
                  </button>
                </div>
              )}
            </div>
          </>
        )}
        {currentUser &&
          userDisplayName &&
          !isStudentOrFaculty && (
          <span className="header-user" title="Signed-in account">
            <Shield size={16} strokeWidth={2} className="header-user-shield" aria-hidden />
            {userDisplayName}
          </span>
        )}
      </div>
    </header>
  )
}
