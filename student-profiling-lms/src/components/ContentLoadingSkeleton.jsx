/**
 * Shimmer placeholders for main content while directory/API data is loading.
 */
export default function ContentLoadingSkeleton({ title = 'Loading…' }) {
  return (
    <div className="page content-skeleton-page" aria-busy="true" aria-live="polite">
      <div className="content-skeleton-masthead">
        <div className="skel-block skel-block--lg" />
        <div className="skel-block skel-block--md skel-mt" />
        <div className="skel-block skel-block--sm skel-mt" />
        <div className="skel-row skel-mt-lg">
          <div className="skel-chip" />
          <div className="skel-chip" />
          <div className="skel-chip" />
        </div>
      </div>
      <div className="content-skeleton-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="content-skeleton-card">
            <div className="skel-block skel-block--icon" />
            <div className="skel-block skel-block--stat" />
            <div className="skel-block skel-block--xs skel-mt" />
          </div>
        ))}
      </div>
      <div className="content-skeleton-panels">
        <div className="skel-panel">
          <div className="skel-block skel-block--md" />
          <div className="skel-line skel-mt" />
          <div className="skel-line skel-mt" />
          <div className="skel-line skel-line--short skel-mt" />
        </div>
        <div className="skel-panel">
          <div className="skel-block skel-block--md" />
          <div className="skel-line skel-mt" />
          <div className="skel-line skel-mt" />
          <div className="skel-line skel-line--short skel-mt" />
        </div>
      </div>
      <p className="content-skeleton-caption muted">{title}</p>
    </div>
  )
}
