import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Renders children only when `currentUser.role` is one of `roles`.
 * Use for route-level guards (e.g. faculty-only class pages).
 */
export default function RequireRole({ roles, redirectTo = '/', children }) {
  const { ready, currentUser } = useAuth()
  const location = useLocation()

  if (!ready) return null

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!roles.includes(currentUser.role)) {
    return <Navigate to={redirectTo} replace />
  }

  return children
}
