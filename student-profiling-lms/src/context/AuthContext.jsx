import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(null)

const STORAGE_KEYS = {
  users: 'sp_users',
  current: 'sp_currentUser',
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function loadUsers() {
  const raw = localStorage.getItem(STORAGE_KEYS.users)
  const users = safeJsonParse(raw, [])
  return Array.isArray(users) ? users : []
}

function loadCurrentUser() {
  const raw = localStorage.getItem(STORAGE_KEYS.current)
  const user = safeJsonParse(raw, null)
  return user && typeof user === 'object' ? user : null
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const u = loadUsers()
    const c = loadCurrentUser()
    setUsers(u)
    setCurrentUser(c)
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users))
  }, [users, ready])

  useEffect(() => {
    if (!ready) return
    if (currentUser) localStorage.setItem(STORAGE_KEYS.current, JSON.stringify(currentUser))
    else localStorage.removeItem(STORAGE_KEYS.current)
  }, [currentUser, ready])

  const value = useMemo(() => {
    const signup = ({ firstName, lastName, email, password }) => {
      const normalizedEmail = String(email).trim().toLowerCase()
      if (users.some(u => u.email === normalizedEmail)) {
        return { ok: false, error: 'Email already exists.' }
      }

      const newUser = {
        id: crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        email: normalizedEmail,
        password: String(password),
        role: 'Admin',
        createdAt: new Date().toISOString(),
      }

      setUsers(prev => [...prev, newUser])
      setCurrentUser({ id: newUser.id, firstName: newUser.firstName, lastName: newUser.lastName, email: newUser.email, role: newUser.role })
      return { ok: true }
    }

    const login = ({ email, password }) => {
      const normalizedEmail = String(email).trim().toLowerCase()
      const user = users.find(u => u.email === normalizedEmail)
      if (!user || user.password !== String(password)) {
        return { ok: false, error: 'Invalid email or password.' }
      }
      setCurrentUser({ id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role })
      return { ok: true }
    }

    const logout = () => setCurrentUser(null)

    return {
      ready,
      users,
      currentUser,
      isAuthenticated: !!currentUser,
      signup,
      login,
      logout,
    }
  }, [users, currentUser, ready])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

