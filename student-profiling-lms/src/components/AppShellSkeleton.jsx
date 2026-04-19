/** Mimics layout chrome while auth session + API reachability are checked. */
export default function AppShellSkeleton() {
  return (
    <div className="layout layout--skeleton" aria-busy="true" aria-live="polite">
      <aside className="app-shell-skel-sidebar" aria-hidden>
        <div className="skel-block skel-block--logo" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skel-sidebar-row" />
        ))}
      </aside>
      <main className="main-content app-shell-skel-main">
        <header className="app-shell-skel-header">
          <div className="skel-block skel-block--header-title" />
          <div className="skel-block skel-block--header-actions" />
        </header>
        <div className="content-area app-shell-skel-body">
          <div className="skel-panel skel-panel--wide">
            <div className="skel-block skel-block--lg" />
            <div className="skel-block skel-block--sm skel-mt" />
            <div className="content-skeleton-grid skel-mt-lg">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="content-skeleton-card">
                  <div className="skel-block skel-block--icon" />
                  <div className="skel-block skel-block--stat" />
                  <div className="skel-block skel-block--xs skel-mt" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
