import { useReportsPage } from '../../hooks/useReportsPage';
import InfiniteScrollSentinel from '../shared/InfiniteScrollSentinel';
import ReportCard from './card/ReportCard';

/**
 * Moderation queue: unreviewed reports with evidence and SLA clocks. Hide the
 * message, ban the offender, then resolve with a note on what was done.
 */
const Reports = () => {
  const {
    scrollRef,
    reports,
    total,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    sentinelEnabled,
    busyId,
    hideMessage,
    banOffender,
    markReviewed,
  } = useReportsPage();

  return (
    <div className="mx-auto flex h-[calc(100dvh-3rem)] max-h-[calc(100dvh-3rem)] min-h-0 w-full max-w-6xl flex-col gap-6 lg:h-[calc(100dvh-3.5rem)] lg:max-h-[calc(100dvh-3.5rem)]">
      <header className="flex shrink-0 items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue">Console</p>
          <h1 className="mt-1 font-semibold text-3xl leading-none tracking-tight text-body sm:text-4xl">Reports</h1>
        </div>
        {!isLoading && !isError && (
          <p className="text-sm text-body-300" aria-live="polite">
            {total} unreviewed
          </p>
        )}
      </header>

      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-1 scrollbar-hide">
        {isLoading && (
          <div aria-label="Loading reports" className="h-40 animate-pulse rounded-2xl bg-white/5 motion-reduce:animate-none" />
        )}

        {isError && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <p className="text-sm font-medium text-body">Couldn&apos;t load reports</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-full border border-border/50 bg-primary/35 px-4 py-2 text-xs font-semibold text-body-300 hover:text-body"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && reports.length === 0 && (
          <p className="py-20 text-center text-sm text-body-700">Queue is clear.</p>
        )}

        {reports.length > 0 && (
          <ul className="flex flex-col gap-3" aria-label="Unreviewed reports">
            {reports.map((report) => (
              <ReportCard
                key={report._id}
                report={report}
                busy={busyId === report._id}
                onHide={(id) => void hideMessage(id)}
                onBan={(id, scope, minutes) => void banOffender(id, scope, minutes)}
                onReview={markReviewed}
              />
            ))}
          </ul>
        )}

        <InfiniteScrollSentinel
          scrollRef={scrollRef}
          hasNextPage={Boolean(hasNextPage)}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => void fetchNextPage()}
          enabled={sentinelEnabled}
        />
      </div>
    </div>
  );
};

export default Reports;
