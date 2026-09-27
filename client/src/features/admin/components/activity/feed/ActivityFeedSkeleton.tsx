const ActivityFeedSkeleton = () => (
  <div className="space-y-6">
    {Array.from({ length: 2 }).map((_, gi) => (
      <div key={gi}>
        <div className="mb-4 h-3 w-16 animate-pulse rounded bg-border/30" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3">
              <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-border/25" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-40 animate-pulse rounded bg-border/30" />
                <div className="h-3 w-full max-w-sm animate-pulse rounded bg-border/20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default ActivityFeedSkeleton;
