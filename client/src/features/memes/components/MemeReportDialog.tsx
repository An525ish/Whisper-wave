import { useState } from 'react';
import Dialog from '@/shared/components/ui/modal/Dialog';
import { MEME_REPORT_REASONS } from '../constants';
import { useReportMeme } from '../hooks/useReportMeme';
import SlideToConfirm from './SlideToConfirm';
import type { MemeItem, MemeReportReason } from '../types';

type Props = {
  item: MemeItem;
  open: boolean;
  onClose: () => void;
};

const TITLE_ID = 'meme-report-title';
const DESC_ID = 'meme-report-desc';

const PANEL =
  'relative w-full max-w-sm rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-[#2a2136] to-[#1a1520] p-5 text-left shadow-[0_28px_80px_rgba(0,0,0,0.55)] sm:p-6';

/**
 * Report a joke: pick a reason, then slide to confirm, so a stray tap never
 * reports (and hides) something. Reporting hides it here and
 * flags it for review.
 */
const MemeReportDialog = ({ item, open, onClose }: Props) => {
  const report = useReportMeme();
  const [reason, setReason] = useState<MemeReportReason | null>(null);

  const selected = MEME_REPORT_REASONS.find((r) => r.id === reason);

  const close = () => {
    setReason(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={close} labelledBy={TITLE_ID} describedBy={DESC_ID} panelClassName={PANEL}>
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-red/25 bg-red/10 text-red"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 21V4" />
            <path d="M5 4h11l-2 4 2 4H5" />
          </svg>
        </span>
        <div className="min-w-0">
          <h2 id={TITLE_ID} className="font-display text-xl leading-tight text-white">
            Report this joke
          </h2>
          <p id={DESC_ID} className="mt-1 text-sm leading-snug text-body-300">
            What&apos;s wrong with it? It leaves your feed right away.
          </p>
        </div>
      </div>

      <div role="radiogroup" aria-label="Reason" className="mt-5 flex flex-wrap gap-2">
        {MEME_REPORT_REASONS.map((r) => {
          const on = reason === r.id;
          return (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={report.isPending}
              onClick={() => setReason(r.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition active:scale-[0.98] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-green ${
                on
                  ? 'border-red/60 bg-red/15 text-white'
                  : 'border-white/10 bg-white/[0.03] text-body hover:border-white/25 hover:bg-white/[0.06]'
              }`}
            >
              <span aria-hidden>{r.icon}</span>
              {r.label}
            </button>
          );
        })}
      </div>

      <p className="mt-3 min-h-5 text-xs text-body-300" aria-live="polite">
        {selected ? selected.hint : 'Pick the closest match.'}
      </p>

      <div className="mt-4">
        <SlideToConfirm
          label="Slide to report"
          disabledLabel="Pick a reason first"
          disabled={!reason}
          busy={report.isPending}
          onConfirm={() => reason && report.mutate({ id: item.id, reason }, { onSuccess: close })}
        />
      </div>

      <button
        type="button"
        onClick={close}
        className="mt-2 w-full rounded-2xl py-2.5 text-sm font-medium text-body-300 transition hover:bg-white/5 hover:text-body focus-visible:outline-2 focus-visible:outline-green"
      >
        Cancel
      </button>
    </Dialog>
  );
};

export default MemeReportDialog;
