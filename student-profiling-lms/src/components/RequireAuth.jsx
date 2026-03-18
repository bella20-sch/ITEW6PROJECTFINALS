import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RequireAuth({ children }) {
  const { ready, isAuthenticated } = useAuth()
  const location = useLocation()

  if (!ready) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-loading">Loading…</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}

