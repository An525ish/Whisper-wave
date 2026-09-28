const MessagesFeedSkeleton = () => (
  <div className="space-y-1">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="rounded-xl px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-border/25" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-36 animate-pulse rounded bg-border/30" />
            <div className="h-3 w-28 animate-pulse rounded bg-border/20" />
          </div>
          <div className="h-3 w-10 animate-pulse rounded bg-border/20" />
        </div>
        <div className="mt-3 ml-13 h-14 animate-pulse rounded-2xl bg-border/15" />
      </div>
    ))}
  </div>
);

export default MessagesFeedSkeleton;
