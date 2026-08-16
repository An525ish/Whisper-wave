const UsersFeedSkeleton = () => (
  <div className="space-y-1">
    {Array.from({ length: 8 }).map((_, index) => (
      <div key={index} className="flex items-center gap-4 px-4 py-3.5">
        <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-border/25" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-36 animate-pulse rounded bg-border/30" />
          <div className="h-3 w-44 animate-pulse rounded bg-border/20" />
        </div>
        <div className="h-3 w-16 animate-pulse rounded bg-border/20" />
      </div>
    ))}
  </div>
);

export default UsersFeedSkeleton;
