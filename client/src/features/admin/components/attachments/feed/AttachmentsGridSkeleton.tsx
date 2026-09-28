const AttachmentsGridSkeleton = () => (
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className="aspect-square animate-pulse rounded-xl bg-surface-100" />
    ))}
  </div>
);

export default AttachmentsGridSkeleton;
