import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../lib/api'

const AuthContext = createContext(null)

const STORAGE_KEYS = {
  current: 'sp_currentUser',
  token: 'sp_token',
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function loadCurrentUser() {
  const raw = localStorage.getItem(STORAGE_KEYS.current)
  const user = safeJsonParse(raw, null)
  return user && typeof user === 'object' ? user : null
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [token, setToken] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const c = loadCurrentUser()
    const t = localStorage.getItem(STORAGE_KEYS.token) || ''
    setCurrentUser(c)
    setToken(t)
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    if (currentUser) localStorage.setItem(STORAGE_KEYS.current, JSON.stringify(currentUser))
    else localStorage.removeItem(STORAGE_KEYS.current)
  }, [currentUser, ready])

  useEffect(() => {
    if (!ready) return
    if (token) localStorage.setItem(STORAGE_KEYS.token, token)
    else localStorage.removeItem(STORAGE_KEYS.token)
  }, [token, ready])

  const value = useMemo(() => {
    const login = async ({ email, password }) => {
      try {
        const res = await apiFetch('/api/auth/login', { method: 'POST', body: { email, password } })
        setToken(res.token || '')
        setCurrentUser(res.user || null)
        return { ok: true, user: res.user || null }
      } catch (e) {
        return { ok: false, error: e?.message || 'Login failed.' }
      }
    }

    const logout = async () => {
      try {
        if (token) await apiFetch('/api/auth/logout', { method: 'POST', token })
      } catch {
        // ignore
      } finally {
        setToken('')
        setCurrentUser(null)
      }
    }

    return {
      ready,
      token,
      currentUser,
      isAuthenticated: !!currentUser,
      login,
      logout,
    }
  }, [currentUser, ready, token])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

