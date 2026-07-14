export default function WorkspaceLoading() {
  return (
    <div aria-label="Loading workspace" className="route-loading" role="status">
      <div className="route-loading-heading">
        <span className="loading-skeleton skeleton-eyebrow" />
        <span className="loading-skeleton skeleton-title" />
        <span className="loading-skeleton skeleton-copy" />
      </div>
      <div className="route-loading-metrics">
        {Array.from({ length: 4 }, (_, index) => (
          <span className="loading-skeleton skeleton-card" key={index} />
        ))}
      </div>
      <span className="loading-skeleton skeleton-panel" />
      <span className="sr-only">Loading Planisher…</span>
    </div>
  );
}
