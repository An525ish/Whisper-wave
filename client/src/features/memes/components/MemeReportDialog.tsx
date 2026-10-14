import Dialog from '@/shared/components/ui/modal/Dialog';
import { MEME_REPORT_REASONS } from '../constants';
import { useReportMeme } from '../hooks/useReportMeme';
import type { MemeItem } from '../types';

type Props = {
  item: MemeItem;
  open: boolean;
  onClose: () => void;
};

const TITLE_ID = 'meme-report-title';

/** Pick a reason to report a joke. Reporting hides it here and flags it for review. */
const MemeReportDialog = ({ item, open, onClose }: Props) => {
  const report = useReportMeme();

  return (
    <Dialog open={open} onClose={onClose} labelledBy={TITLE_ID}>
      <h2 id={TITLE_ID} className="font-display text-xl text-white">
        Report this joke
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-body-300">
        What&apos;s wrong with it? Enough reports remove it for everyone.
      </p>
      <ul className="mt-4 flex flex-col gap-1.5">
        {MEME_REPORT_REASONS.map((reason) => (
          <li key={reason.id}>
            <button
              type="button"
              disabled={report.isPending}
              onClick={() =>
                report.mutate({ id: item.id, reason: reason.id }, { onSuccess: onClose })
              }
              className="w-full rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-body transition hover:border-green/40 hover:bg-green/10 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-green"
            >
              {reason.label}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onClose}
        className="mt-3 w-full rounded-full px-5 py-2 text-sm font-medium text-body-300 transition hover:text-body focus-visible:outline-2 focus-visible:outline-green"
      >
        Cancel
      </button>
    </Dialog>
  );
};

export default MemeReportDialog;
