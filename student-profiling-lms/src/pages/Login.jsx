import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { GraduationCap, Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Login() {
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const canSubmit = useMemo(() => form.email.trim() && form.password, [form.email, form.password])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')

    const email = form.email.trim().toLowerCase()
    if (!email.includes('@')) {
      showToast('Please enter a valid academic email.', 'error')
      setBusy(false)
      return
    }
    if (String(form.password).length < 6) {
      showToast('Password must be at least 6 characters.', 'error')
      setBusy(false)
      return
    }

    const res = await login({ email, password: form.password })
    if (!res.ok) {
      showToast(res.error || 'Invalid credentials. Please try again.', 'error')
      setBusy(false)
      return
    }

    showToast('Login successful. Redirecting...', 'success')

    navigate(from, { replace: true })
  }

  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-left-logo">
          <img src="/logo.png" alt="CCS Logo" />
        </div>
        <h1>College of Computer Studies</h1>
        <p className="auth-description">
          <strong>Student Profiling Portal</strong><br />
          <span className="institution">Pamantasan ng Cabuyao</span><br />
          <span className="programs-badge">
            BSIT • BSCS • BSIS
          </span>
        </p>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2>Admin Login</h2>
          <p className="subtitle">Please enter your credentials to access the Student Profiling System.</p>

          {/* Toast takes over error display */}

          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label>Email Address</label>
              <div className="auth-input-wrapper">
                <Mail size={20} />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@school.edu"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label>Security Password</label>
              <div className="auth-input-wrapper">
                <Lock size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button className="auth-submit-btn" type="submit" disabled={!canSubmit || busy}>
              {busy ? 'Logging in...' : 'Log In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

