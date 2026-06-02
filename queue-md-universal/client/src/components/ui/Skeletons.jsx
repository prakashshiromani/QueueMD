export function SkeletonCard() {
  return (
    <div className="bg-bg-secondary p-4 rounded-xl border border-border-muted/50 animate-pulse">
      <div className="h-4 bg-surface-variant rounded w-3/4 mb-3"></div>
      <div className="h-8 bg-surface-variant rounded w-1/2"></div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="bg-bg-secondary rounded-2xl border border-border-muted/50 overflow-hidden animate-pulse">
      <div className="p-5 border-b border-border-muted">
        <div className="h-6 bg-surface-variant rounded w-1/4"></div>
      </div>
      <div className="space-y-3 p-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-surface-variant rounded"></div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonQueue() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-bg-secondary p-4 rounded-xl border border-border-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-variant"></div>
              <div>
                <div className="h-4 bg-surface-variant rounded w-24 mb-2"></div>
                <div className="h-3 bg-surface-variant rounded w-16"></div>
              </div>
            </div>
            <div className="h-8 bg-surface-variant rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
