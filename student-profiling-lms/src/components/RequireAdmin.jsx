import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RequireAdmin({ children }) {
  const { ready, currentUser } = useAuth()
  const location = useLocation()

  if (!ready) return null

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (currentUser.role !== 'Admin') {
    return <Navigate to="/" replace />
  }

  return children
}

