import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { homePathForRole } from '../lib/lmsPaths'

export default function FirstLoginPassword() {
  const { currentUser, changeFirstLoginPassword } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [busy, setBusy] = useState(false)

  const canSubmit = useMemo(() => {
    return (
      form.currentPassword &&
      form.newPassword &&
      form.confirmPassword &&
      String(form.newPassword).length >= 6 &&
      form.newPassword === form.confirmPassword &&
      form.newPassword !== form.currentPassword
    )
  }, [form])

  if (!currentUser) return <Navigate to="/login" replace />
  if (!currentUser.mustChangePassword) return <Navigate to={homePathForRole(currentUser.role)} replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (String(form.newPassword).length < 6) {
      showToast('New password must be at least 6 characters.', 'error')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      showToast('New password and confirm password must match.', 'error')
      return
    }
    if (form.newPassword === form.currentPassword) {
      showToast('New password must be different from current password.', 'error')
      return
    }

    setBusy(true)
    const res = await changeFirstLoginPassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    })
    setBusy(false)
    if (!res.ok) {
      showToast(res.error || 'Failed to update password.', 'error')
      return
    }
    showToast('Password updated. You can now use your account normally.', 'success')
    navigate(homePathForRole(currentUser.role), { replace: true })
  }

  return (
    <div className="auth-shell">
      <div className="auth-right" style={{ margin: 'auto', maxWidth: 560 }}>
        <div className="auth-card">
          <div className="auth-card-head">
            <h2>Change Password</h2>
            <p className="subtitle">
              First-time login detected for this account. Please change your password to continue.
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label>Current Password</label>
              <div className="auth-input-wrapper">
                <input
                  type="password"
                  value={form.currentPassword}
                  onChange={(e) => setForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label>New Password</label>
              <div className="auth-input-wrapper">
                <input
                  type="password"
                  value={form.newPassword}
                  onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label>Confirm New Password</label>
              <div className="auth-input-wrapper">
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button className="auth-submit-btn" type="submit" disabled={!canSubmit || busy}>
              {busy ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
