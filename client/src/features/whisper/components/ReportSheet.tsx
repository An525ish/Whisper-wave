import { useEffect, useRef, useState } from 'react';
import { useReportMutation } from '../hooks/useReportMutation';
import type { ReportReason } from '../types';

type Props = {
  open: boolean;
  sessionId: string | null;
  onClose: () => void;
  /** Called after a successful report so the caller can end the chat + move on. */
  onReported: () => void;
};

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'harassment', label: 'Harassment or hate' },
  { value: 'spam', label: 'Spam or scam' },
  { value: 'underage', label: 'Underage user' },
  { value: 'other', label: 'Something else' },
];

const MAX_DETAILS = 500;

/**
 * Abuse report sheet. Presentational only — the mutation, its toasts and its
 * analytics live in `useReportMutation`; the dialog chrome comes from the
 * shared `BottomSheet` (escape handling, focus trap, scroll lock).
 */
export default function ReportSheet({ open, sessionId, onClose, onReported }: Props) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const { mutate, isPending } = useReportMutation({ onSuccess: onReported });

  // Reset per open via the render-time comparison pattern — a stale reason from
  // a previous report must never be pre-selected, and doing it in an effect
  // costs an extra render on every open.
  const [resetFor, setResetFor] = useState(open);
  if (resetFor !== open) {
    setResetFor(open);
    setReason(null);
    setDetails('');
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!reason || !sessionId || isPending) return;
    mutate({ sessionId, reason, details: details.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-sheet-title"
        tabIndex={-1}
        className="relative z-10 w-full max-w-md rounded-t-2xl border border-white/10 bg-[rgba(33,26,42,0.98)] p-5 shadow-[0_-8px_40px_rgba(0,0,0,0.5)] outline-none sm:rounded-2xl"
      >
        <h2 id="report-sheet-title" className="text-base font-semibold text-white">
          Report this person
        </h2>
        <p className="mt-1 text-sm text-body-400">
          Reports are anonymous. We’ll stop matching you two right away.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {REASONS.map((r) => {
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
          onChange={(e) => setDetails(e.target.value.slice(0, MAX_DETAILS))}
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
            disabled={!reason || isPending}
            className="flex-1 rounded-xl border border-red/45 bg-red/15 px-4 py-3 text-sm font-semibold text-red transition-colors hover:bg-red/25 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isPending ? 'Sending…' : 'Report & leave'}
          </button>
        </div>
      </div>
    </div>
  );
}
