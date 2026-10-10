import { useState } from 'react';
import {
  useAdminReportsQuery,
  useReviewReportMutation,
} from '@/features/admin/hooks';
import { slaStatus } from '@/features/admin/utils/reports';
import type { AdminReportRow } from '@/features/admin/types';

const targetLabel = (report: AdminReportRow): string => {
  switch (report.targetType) {
    case 'roomMessage':
      return report.roomSlug ? `room message · ${report.roomSlug}` : 'room message';
    case 'anonSession':
      return 'anonymous session';
    case 'user':
      return 'user';
  }
};

/**
 * Moderation queue: unreviewed reports with evidence and SLA ages. Reviewing
 * marks done; acting (ban/close/delete) happens from the Rooms page and the
 * thread — this queue is triage, not the whole toolkit.
 */
const Reports = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminReportsQuery(page);
  const review = useReviewReportMutation();
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const markReviewed = (id: string) => {
    setReviewingId(id);
    review.mutate({ id, reviewed: true }, { onSettled: () => setReviewingId(null) });
  };

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-end justify-between gap-3">
        <h1 className="font-display text-2xl text-white">Reports</h1>
        {data && (
          <p className="text-sm text-body-300" aria-live="polite">
            {data.total} unreviewed
          </p>
        )}
      </div>

      {isLoading && (
        <div aria-label="Loading reports" className="h-40 animate-pulse rounded-2xl bg-white/5 motion-reduce:animate-none" />
      )}

      <ul className="flex flex-col gap-3" aria-label="Unreviewed reports">
        {data?.reports.map((report) => {
          const sla = slaStatus(report.createdAt, report.reason);
          return (
            <li key={report._id} className="rounded-2xl border border-border/60 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-white">
                  {report.reason.replace(/_/g, ' ')} · {targetLabel(report)}
                </p>
                <span
                  role="status"
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    sla.breached ? 'bg-red/20 text-red' : 'bg-white/10 text-body-300'
                  }`}
                >
                  {sla.label}
                </span>
              </div>

              {report.details && (
                <p className="mt-1 text-sm text-body-300">Note: {report.details}</p>
              )}

              {report.evidence && report.evidence.length > 0 && (
                <div className="mt-2 rounded-xl bg-black/20 p-3" aria-label="Evidence snapshot">
                  {report.evidence.map((item, i) => (
                    <p key={`${item.ts}-${i}`} className="truncate text-[13px] leading-relaxed text-body-300">
                      <span className="font-medium text-body">{item.alias}:</span> {item.text}
                    </p>
                  ))}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-xs text-body-700">
                  {new Date(report.createdAt).toLocaleString()}
                  {report.roomSlug ? ` · /rooms/${report.roomSlug}` : ''}
                </p>
                <button
                  type="button"
                  onClick={() => markReviewed(report._id)}
                  disabled={reviewingId === report._id}
                  className="rounded-full bg-green/15 px-3 py-1.5 text-xs font-medium text-green hover:bg-green/25 disabled:opacity-50"
                >
                  Mark reviewed
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {data && data.hasMore && (
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          className="self-center rounded-full border border-border px-5 py-2 text-sm text-body-300 hover:text-body"
        >
          Load more
        </button>
      )}
    </div>
  );
};

export default Reports;
