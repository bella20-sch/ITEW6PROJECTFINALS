import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import MisSidebar from './MisSidebar'
import Header from './Header'

export default function MisLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { pathname } = useLocation()
  const adminBleed = pathname.startsWith('/mis/provision')

  return (
    <div className="layout layout--mis">
      <MisSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={sidebarCollapsed} />
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
