import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { GraduationCap, Lock, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const canSubmit = useMemo(() => form.email.trim() && form.password, [form.email, form.password])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')

    const email = form.email.trim().toLowerCase()
    if (!email.includes('@')) {
      setError('Please enter a valid email.')
      setBusy(false)
      return
    }
    if (String(form.password).length < 6) {
      setError('Password must be at least 6 characters.')
      setBusy(false)
      return
    }

    const res = login({ email, password: form.password })
    if (!res.ok) {
      setError(res.error || 'Login failed.')
      setBusy(false)
      return
    }

    navigate(from, { replace: true })
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">
            <GraduationCap size={28} />
          </div>
          <div>
            <h1>Welcome back</h1>
            <p className="muted">Sign in to continue to Student Profiling LMS</p>
          </div>
        </div>

        {error && <div className="auth-alert">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>Email</label>
          <div className="auth-input">
            <Mail size={18} />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@school.edu"
              autoComplete="email"
              required
            />
          </div>

          <label>Password</label>
          <div className="auth-input">
            <Lock size={18} />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button className="btn btn-primary auth-submit" type="submit" disabled={!canSubmit || busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="auth-footer">
            <span className="muted">No account?</span>
            <Link className="auth-link" to="/signup">Create one</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

