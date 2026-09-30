// app/(dashboard)/loading.tsx
// Instant placeholder while any dashboard page streams in — the sidebar and
// top bar (layout) stay put, only the content area swaps.
export default function DashboardLoading() {
  return (
    <div className="space-y-5 animate-pulse" aria-busy="true" aria-label="loading">
      <div className="space-y-2">
        <div className="h-5 w-40 bg-muted" />
        <div className="h-4 w-64 bg-muted" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="pixel-box bg-card h-24" />
        ))}
      </div>
      <div className="pixel-box bg-card h-72" />
    </div>
  );
}
