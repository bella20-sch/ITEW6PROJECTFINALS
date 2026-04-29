import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch, checkApiHealth } from '../lib/api'

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
  /** null = checking; true = API reachable; false = offline / server down / DB unreadable */
  const [serverReachable, setServerReachable] = useState(true)

  useEffect(() => {
    let cancelled = false
    const c = loadCurrentUser()
    const t = localStorage.getItem(STORAGE_KEYS.token) || ''
    setCurrentUser(c)
    setToken(t)

    if (!c || !t) {
      setServerReachable(true)
      setReady(true)
      return () => {
        cancelled = true
      }
    }

    setServerReachable(null)
    checkApiHealth().then((r) => {
      if (!cancelled) setServerReachable(!!r.ok)
      if (!cancelled) setReady(true)
    })

    return () => {
      cancelled = true
    }
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

  const recheckServer = useCallback(async () => {
    if (!token || !currentUser) {
      setServerReachable(true)
      return { ok: true }
    }
    setServerReachable(null)
    const r = await checkApiHealth()
    setServerReachable(!!r.ok)
    return r
  }, [token, currentUser])

  useEffect(() => {
    const onOnline = () => {
      if (token && currentUser) recheckServer()
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [token, currentUser, recheckServer])

  const value = useMemo(() => {
    const login = async ({ email, password }) => {
      try {
        const res = await apiFetch('/api/auth/login', { method: 'POST', body: { email, password } })
        setToken(res.token || '')
        setCurrentUser(res.user || null)
        setServerReachable(true)
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
        setServerReachable(true)
      }
    }

    const changeFirstLoginPassword = async ({ currentPassword, newPassword }) => {
      try {
        const res = await apiFetch('/api/auth/first-login-password', {
          method: 'POST',
          token,
          body: { currentPassword, newPassword },
        })
        const nextUser = {
          ...(currentUser || {}),
          ...(res?.user || {}),
          mustChangePassword: false,
        }
        setCurrentUser(nextUser)
        return { ok: true, user: nextUser }
      } catch (e) {
        return { ok: false, error: e?.message || 'Unable to update password.' }
      }
    }

    return {
      ready,
      token,
      currentUser,
      isAuthenticated: !!currentUser,
      serverReachable,
      recheckServer,
      login,
      logout,
      changeFirstLoginPassword,
    }
  }, [currentUser, ready, recheckServer, serverReachable, token])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
