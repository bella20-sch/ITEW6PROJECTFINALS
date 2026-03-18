import { useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const pageTitles = {
  '/': 'Dashboard',
  '/students': 'Students',
  '/departments': 'Departments',
  '/courses': 'Courses',
  '/faculty': 'Faculty',
  '/reports': 'Reports & Queries',
}

export default function Header({ onMenuClick }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  const path = location.pathname
  const title = path.startsWith('/students/') ? 'Student Profile' : pageTitles[path] || 'Student Profiling LMS'

  return (
    <header className="header">
      <button className="header-menu-btn" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={24} />
      </button>
      <h1 className="header-title">{title}</h1>
      <div className="header-actions">
        <span className="header-badge">School Year 2024-2025</span>
        {currentUser && (
          <span className="header-user">
            <Shield size={16} />
            {currentUser.firstName} {currentUser.lastName}
          </span>
        )}
        <button
          className="btn btn-outline header-logout"
          onClick={() => {
            logout()
            navigate('/login', { replace: true })
          }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  )
}
