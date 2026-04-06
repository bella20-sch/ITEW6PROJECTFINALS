import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { GraduationCap, Lock, Mail, Eye, EyeOff, Moon, Sun } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getTheme, setTheme } from '../lib/theme'

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
  const [colorMode, setColorMode] = useState(() => getTheme())

  const canSubmit = useMemo(() => form.email.trim() && form.password, [form.email, form.password])

  const toggleColorMode = () => {
    const next = colorMode === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setColorMode(next)
  }

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
        <button
          type="button"
          className="auth-theme-toggle"
          onClick={toggleColorMode}
          aria-label={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-pressed={colorMode === 'dark'}
          title={colorMode === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {colorMode === 'dark' ? <Sun size={18} strokeWidth={2} aria-hidden /> : <Moon size={18} strokeWidth={2} aria-hidden />}
        </button>
        <span className="auth-left-ring auth-left-ring--a" aria-hidden />
        <span className="auth-left-ring auth-left-ring--b" aria-hidden />
        <span className="auth-left-ring auth-left-ring--c" aria-hidden />
        <span className="auth-left-ring auth-left-ring--d" aria-hidden />
        <span className="auth-kicker">CCS Administration</span>
        <div className="auth-left-logo">
          <img src="/logo.png" alt="CCS Logo" />
        </div>
        <h1>Student Profiling Portal</h1>
        <p className="auth-description">
          Secure academic records and student development insights for the College of Computer Studies.
        </p>
        <div className="auth-program-rail">
          <span className="programs-badge">BSIT</span>
          <span className="programs-badge">BSCS</span>
          <span className="programs-badge">BSIS</span>
        </div>
        <ul className="auth-feature-list" aria-hidden>
          <li><GraduationCap size={16} /> Academic monitoring</li>
          <li><Mail size={16} /> Centralized records</li>
          <li><Lock size={16} /> Protected access</li>
        </ul>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-head">
            <h2>Admin Login</h2>
            <p className="subtitle">Sign in to manage the CCS Student Profiling LMS.</p>
          </div>

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
          <p className="auth-note">Authorized CCS personnel only.</p>
        </div>
      </div>
    </div>
  )
}

