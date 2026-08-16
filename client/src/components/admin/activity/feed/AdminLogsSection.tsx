import type { RefObject } from 'react';
import type { AdminImpersonationLogEntry } from '@/types/admin';
import InfiniteScrollSentinel from '@/components/admin/shared/InfiniteScrollSentinel';

type AdminLogsSectionProps = {
  scrollRef: RefObject<HTMLDivElement | null>;
  logs: AdminImpersonationLogEntry[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  sentinelEnabled: boolean;
  onLoadMore: () => void;
};

const formatLogTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const AdminLogsSection = ({
  scrollRef,
  logs,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  sentinelEnabled,
  onLoadMore,
}: AdminLogsSectionProps) => {
  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-primary/20" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="py-10 text-center text-sm text-body-300">
        Couldn&apos;t load admin logs.
      </p>
    );
  }

  if (logs.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-body-300">
        No impersonation sessions recorded yet.
      </p>
    );
  }

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-1 scrollbar-hide">
      <div className="divide-y divide-border/20">
        {logs.map((log) => (
          <div key={log._id} className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-body">
                Impersonated{' '}
                <span className="font-semibold text-blue">@{log.targetUsername}</span>
                {' '}
                <span className="text-body-300">({log.targetName})</span>
              </p>
              <p className="mt-0.5 text-xs text-body-300">{formatLogTime(log.startedAt)}</p>
            </div>
            <span className="shrink-0 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
              ghost
            </span>
          </div>
        ))}
      </div>

      <InfiniteScrollSentinel
        scrollRef={scrollRef}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={onLoadMore}
        enabled={sentinelEnabled}
      />
    </div>
  );
};

export default AdminLogsSection;
