import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from './Layout'

/** Faculty and students use the main LMS shell; MIS admins are mirrored under `/mis/...`. */
export default function NonAdminLayout() {
  const { currentUser } = useAuth()
  const { pathname, search } = useLocation()
  if (currentUser?.role === 'Admin') {
    const target = pathname === '/' ? '/mis' : `/mis${pathname}`
    return <Navigate to={`${target}${search}`} replace />
  }
  return <Layout />
}
