import { WifiOff } from 'lucide-react'

export default function ServerOfflineScreen({ onRetry, busy }) {
  return (
    <div className="layout layout--offline">
      <div className="server-offline-panel">
        <div className="server-offline-icon" aria-hidden>
          <WifiOff size={40} strokeWidth={1.75} />
        </div>
        <h1 className="server-offline-title">Cannot reach the server</h1>
        <p className="muted server-offline-copy">
          Check that Wi‑Fi is on, the API is running (for example port 5000), and the database file is available. The app will not
          show cached school data until the connection is restored.
        </p>
        <div className="server-offline-actions">
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => onRetry?.()}>
            {busy ? 'Checking…' : 'Try again'}
          </button>
        </div>
      </div>
    </div>
  )
}
