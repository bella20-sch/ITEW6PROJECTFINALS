import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppShellSkeleton from './AppShellSkeleton'
import ServerOfflineScreen from './ServerOfflineScreen'
import { homePathForRole } from '../lib/lmsPaths'

export default function RequireAuth({ children }) {
  const { ready, isAuthenticated, currentUser, serverReachable, recheckServer } = useAuth()
  const location = useLocation()
  const [retryBusy, setRetryBusy] = useState(false)

  if (!ready) {
    return <AppShellSkeleton />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (currentUser?.mustChangePassword && location.pathname !== '/first-login-password') {
    return <Navigate to="/first-login-password" replace />
  }

  if (!currentUser?.mustChangePassword && location.pathname === '/first-login-password') {
    return <Navigate to={homePathForRole(currentUser?.role)} replace />
  }

  if (serverReachable === null) {
    return <AppShellSkeleton />
  }

  if (serverReachable === false) {
    return (
      <ServerOfflineScreen
        busy={retryBusy}
        onRetry={async () => {
          setRetryBusy(true)
          try {
            await recheckServer()
          } finally {
            setRetryBusy(false)
          }
        }}
      />
    )
  }

  return children
}
