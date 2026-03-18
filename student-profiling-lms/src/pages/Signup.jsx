import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, Lock, Mail, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const canSubmit = useMemo(() => (
    form.firstName.trim() && form.lastName.trim() && form.email.trim() && form.password
  ), [form])

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

    const res = signup({ firstName: form.firstName, lastName: form.lastName, email, password: form.password })
    if (!res.ok) {
      setError(res.error || 'Signup failed.')
      setBusy(false)
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">
            <GraduationCap size={28} />
          </div>
          <div>
            <h1>Create your account</h1>
            <p className="muted">Set up access for Student Profiling LMS</p>
          </div>
        </div>

        {error && <div className="auth-alert">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>First Name</label>
          <div className="auth-input">
            <User size={18} />
            <input
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              placeholder="Bella"
              autoComplete="given-name"
              required
            />
          </div>

          <label>Last Name</label>
          <div className="auth-input">
            <User size={18} />
            <input
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              placeholder="Mendoza"
              autoComplete="family-name"
              required
            />
          </div>

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
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
            />
          </div>

          <button className="btn btn-primary auth-submit" type="submit" disabled={!canSubmit || busy}>
            {busy ? 'Creating…' : 'Create account'}
          </button>

          <div className="auth-footer">
            <span className="muted">Already have an account?</span>
            <Link className="auth-link" to="/login">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

