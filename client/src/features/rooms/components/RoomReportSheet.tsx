import { useState } from 'react';
import BottomSheet from '@/shared/components/ui/BottomSheet';
import { useReportRoomMutation } from '../hooks/useRoomMutations';

const REASONS = [
  { id: 'inappropriate_content', label: 'Inappropriate content' },
  { id: 'harassment', label: 'Harassment or hate' },
  { id: 'spam', label: 'Spam or scam' },
  { id: 'underage', label: 'Possibly underage' },
  { id: 'other', label: 'Something else' },
] as const;

type Props = {
  slug: string;
  messageId: string | null;
  onClose: () => void;
};

/**
 * Report one room message. Names the message, never the person — the sheet
 * says so. At three distinct reporters the message hides pending review.
 */
const RoomReportSheet = ({ slug, messageId, onClose }: Props) => {
  const [reason, setReason] = useState<string>('harassment');
  const [details, setDetails] = useState('');
  const report = useReportRoomMutation(slug);

  const submit = () => {
    if (!messageId) return;
    report.mutate(
      { messageId, reason, details: details.trim() || undefined },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <BottomSheet open={messageId !== null} onClose={onClose} labelledBy="room-report-title">
      <div className="px-5 pb-6 pt-2">
        <h2 id="room-report-title" className="text-lg font-semibold text-white">
          Report message
        </h2>
        <p className="mt-1 text-sm text-body-300">
          Reports go to a human reviewer. Three reports from different people hide the message for everyone.
        </p>
        <div role="radiogroup" aria-label="Reason" className="mt-3 flex flex-col gap-1">
          {REASONS.map((r) => (
            <label
              key={r.id}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-2 text-sm text-body hover:bg-white/5"
            >
              <input
                type="radio"
                name="room-report-reason"
                checked={reason === r.id}
                onChange={() => setReason(r.id)}
                className="accent-green"
              />
              {r.label}
            </label>
          ))}
        </div>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Anything the reviewer should know? (optional)"
          maxLength={500}
          rows={2}
          aria-label="Details"
          className="mt-3 w-full rounded-xl border border-border/60 bg-white/[0.03] px-3 py-2 text-sm text-body outline-none placeholder:text-body-700 focus:border-green/50"
        />
        <button
          type="button"
          onClick={submit}
          disabled={report.isPending}
          className="mt-4 w-full rounded-3xl bg-gradient-action-button-green px-5 py-2.5 text-sm font-medium text-body transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {report.isPending ? 'Reporting…' : 'Send report'}
        </button>
      </div>
    </BottomSheet>
  );
};

export default RoomReportSheet;
