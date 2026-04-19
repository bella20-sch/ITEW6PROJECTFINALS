export default function DirectoryLoadErrorPanel({ onRetry }) {
  return (
    <div className="page data-directory-error-page">
      <div className="data-directory-error-card">
        <h1 className="data-directory-error-title">Could not load data</h1>
        <p className="muted">
          The server responded with an error or the connection dropped while loading the directory. Cached lists were cleared so
          nothing misleading is shown.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => onRetry?.()}>
          Retry
        </button>
      </div>
    </div>
  )
}
