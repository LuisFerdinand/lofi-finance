// app/(dashboard)/tasks/[id]/loading.tsx
// Shown instantly while a task page streams in.
export default function TaskLoading() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="loading task">
      <div className="h-4 w-48 bg-muted" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px] items-start">
        <div className="space-y-4">
          <div className="pixel-box bg-card p-5 space-y-3">
            <div className="h-5 w-28 bg-muted" />
            <div className="h-8 w-3/4 bg-muted" />
          </div>
          <div className="pixel-box bg-card p-5 h-44" />
          <div className="pixel-box bg-card p-5 h-32" />
        </div>
        <div className="pixel-box bg-card h-96" />
      </div>
    </div>
  );
}
