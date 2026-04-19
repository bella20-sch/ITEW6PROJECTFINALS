import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  UserCircle,
  FileBarChart,
  X,
  UserPlus,
} from 'lucide-react'

const misNavItems = [
  { path: '/mis', end: true, icon: LayoutDashboard, label: 'MIS dashboard' },
  { path: '/mis/provision', end: false, icon: UserPlus, label: 'Account provisioning' },
  { path: '/mis/students', end: false, icon: Users, label: 'Students' },
  { path: '/mis/courses', end: false, icon: BookOpen, label: 'Courses' },
  { path: '/mis/faculty', end: false, icon: UserCircle, label: 'Faculty' },
  { path: '/mis/reports', end: false, icon: FileBarChart, label: 'Reports & queries' },
]

export default function MisSidebar({ open, onClose, collapsed }) {
  return (
    <>
      <div className={`sidebar-overlay ${open ? 'active' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside
        className={`sidebar sidebar--mis ${open ? 'sidebar-open' : ''} ${collapsed ? 'sidebar--collapsed' : ''}`}
      >
        <button type="button" className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
          <X size={24} />
        </button>
        <div className="sidebar-brand">
          <img
            src="/logo.png"
            alt="CCS Logo"
            className="sidebar-logo-image"
            onError={(e) => {
              e.target.src =
                'https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/Pamantasan_ng_Cabuyao_logo.svg/1200px-Pamantasan_ng_Cabuyao_logo.svg.png'
              e.target.onError = null
            }}
          />
          <span className="sidebar-title">MIS console</span>
        </div>
        <p className="sidebar-mis-kicker">College of Computer Studies</p>
        <nav className="sidebar-nav" aria-label="MIS navigation">
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
        <div className="sidebar-footer">
          <span className="sidebar-version">MIS · v1.0</span>
          <p className="sidebar-credits">
            System developed by:
            <br />
            Bella, Mourine Kate Oshlen C.
            <br />
            Borabo, Nicole S.
            <br />
            Lorica, Ken Eubert R.
            <br />
            Mendoza, Mayen Sofia T.
          </p>
        </div>
      </aside>
    </>
  )
}
