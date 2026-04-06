import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { pathname } = useLocation()
  const adminBleed = pathname === '/admin'

  return (
    <div className="layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={sidebarCollapsed} />
      <main className="main-content">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebarCollapse={() => setSidebarCollapsed((c) => !c)}
        />
        <div className={`content-area${adminBleed ? ' content-area--admin-bleed' : ''}`}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
