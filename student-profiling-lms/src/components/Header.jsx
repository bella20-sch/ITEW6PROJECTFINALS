import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'

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
      </div>
    </header>
  )
}
