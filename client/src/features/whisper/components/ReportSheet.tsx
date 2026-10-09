import { useState } from 'react';
import { MAX_REPORT_DETAILS, REPORT_REASONS } from '../constants';
import { useReportMutation } from '../hooks/useReportMutation';
import WhisperDialog from './WhisperDialog';
import type { ReportReason } from '../types';

type Props = {
  open: boolean;
  sessionId: string | null;
  onClose: () => void;
  /** Called after a successful report so the caller can end the chat + move on. */
  onReported: () => void;
};

/**
 * Abuse report sheet. Presentational only — the mutation, its toasts and its
 * analytics live in `useReportMutation`; the dialog behaviour (focus trap, Escape,
 * scroll lock) comes from `WhisperDialog`. Reporting also ends the chat — the
 * button says so ("Report & leave").
 */
export default function ReportSheet({ open, sessionId, onClose, onReported }: Props) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const { mutate, isPending } = useReportMutation({ onSuccess: onReported });

  // Reset per open via the render-time comparison pattern — a stale reason from
  // a previous report must never be pre-selected.
  const [resetFor, setResetFor] = useState(open);
  if (resetFor !== open) {
    setResetFor(open);
    setReason(null);
    setDetails('');
  }

  const handleSubmit = () => {
    if (!reason || !sessionId || isPending) return;
    mutate({ sessionId, reason, details: details.trim() || undefined });
  };

  return (
    <WhisperDialog
      open={open}
      onClose={onClose}
      labelledBy="report-sheet-title"
      rootClassName="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      backdropClassName="absolute inset-0 bg-black/60 backdrop-blur-sm"
      panelClassName="relative z-10 w-full max-w-md rounded-t-2xl border border-white/10 bg-[rgba(33,26,42,0.98)] p-5 shadow-[0_-8px_40px_rgba(0,0,0,0.5)] outline-none sm:rounded-2xl"
    >
      <div>
        <h2 id="report-sheet-title" className="text-base font-semibold text-white">
          Report this person
        </h2>
        <p className="mt-1 text-sm text-body-400">
          Reports are anonymous. We’ll stop matching you two right away.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {REPORT_REASONS.map((r) => {
            const active = reason === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setReason(r.value)}
                aria-pressed={active}
                className={[
                  'rounded-xl border px-4 py-3 text-left text-sm transition-colors',
                  active
                    ? 'border-red/45 bg-red/12 text-white'
                    : 'border-white/10 bg-white/[0.03] text-body-300 hover:border-white/20 hover:text-white',
                ].join(' ')}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        <label htmlFor="report-details" className="sr-only">
          Extra details (optional)
        </label>
        <textarea
          id="report-details"
          value={details}
          onChange={(e) => setDetails(e.target.value.slice(0, MAX_REPORT_DETAILS))}
          placeholder="Add any details (optional)"
          rows={2}
          className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black-dark/70 px-3 py-2.5 text-sm text-white outline-none placeholder:text-body-300/50 focus:border-white/25"
        />

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-body-300 transition-colors hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!reason || !sessionId || isPending}
            className="flex-1 rounded-xl border border-red/45 bg-red/15 px-4 py-3 text-sm font-semibold text-red transition-colors hover:bg-red/25 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isPending ? 'Sending…' : 'Report & leave'}
          </button>
        </div>
      </div>
    </WhisperDialog>
  );
}
