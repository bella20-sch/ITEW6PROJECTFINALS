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

/** Path to the signed-in student or faculty member's profile page. */
export function getSelfProfilePath(user) {
  if (!user) return '/'
  if (user.role === 'Faculty') {
    const fid = user.id
    return fid != null && fid !== '' ? `/faculty/${fid}` : '/faculty'
  }
  if (user.role === 'Student') {
    const sid = user.studentID ?? user.id
    return sid != null && sid !== '' ? `/students/${sid}` : '/students'
  }
  return '/'
}
