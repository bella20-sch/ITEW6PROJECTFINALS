import { useLocation } from 'react-router-dom'

/** `/mis` for MIS admins; empty string for faculty and students */
export function useLmsBase() {
  const { pathname } = useLocation()
  return pathname.startsWith('/mis') ? '/mis' : ''
}

/** Build path: `('/mis', '/students')` → `/mis/students`; `('', '/students')` → `/students` */
export function lmsPath(base, rel) {
  const r = rel.startsWith('/') ? rel : `/${rel}`
  if (!base) return r
  if (r === '/') return base
  return `${base}${r}`
}

/** Default home after sign-in or when visiting `/login` while already authenticated. */
export function homePathForRole(role) {
  return role === 'Admin' ? '/mis' : '/'
}
