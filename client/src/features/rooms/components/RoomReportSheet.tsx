import { useState } from 'react';
import BottomSheet from '@/shared/components/ui/BottomSheet';
import { useReportRoomMutation } from '../hooks/useRoomMutations';
import RoomSheetHead from './RoomSheetHead';
import './rooms.css';

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
      <div className="rm-sheetbody">
        <RoomSheetHead
          titleId="room-report-title"
          tone="red"
          eyebrow="Breaking the vibe?"
          title="Report message"
          icon={
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 21V4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M5 4h13l-2.5 4L18 12H5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
        <p className="rm-sheetsub">
          Reports go to a human reviewer. Three reports from different people hide the message for everyone.
        </p>
        <div role="radiogroup" aria-label="Reason" className="rm-options">
          {REASONS.map((r) => {
            const selected = reason === r.id;
            return (
              <label key={r.id} className={`rm-option${selected ? ' rm-option--on' : ''}`}>
                <input
                  type="radio"
                  name="room-report-reason"
                  checked={selected}
                  onChange={() => setReason(r.id)}
                  className="sr-only"
                />
                <span aria-hidden className="rm-option__radio">
                  {selected && (
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                {r.label}
              </label>
            );
          })}
        </div>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Anything the reviewer should know? (optional)"
          maxLength={500}
          rows={2}
          aria-label="Details"
          className="rm-textarea"
        />
        <button
          type="button"
          onClick={submit}
          disabled={report.isPending}
          className="rm-joinbtn"
        >
          {report.isPending ? 'Reporting…' : 'Send report'}
        </button>
      </div>
    </BottomSheet>
  );
};

export default RoomReportSheet;
