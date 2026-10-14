import { useState } from 'react';
import { ROOM_DEFAULT_REPORT_REASON, ROOM_LIMITS, ROOM_REPORT_REASONS } from '../constants';
import { useReportRoomMutation } from '../hooks/useRoomMutations';
import RoomSheetHead from './RoomSheetHead';
import './roomSheets.css';

type Props = {
  slug: string;
  messageId: string;
  onClose: () => void;
};

/** The report form body — mounted per message, so state resets on every open. */
const RoomReportForm = ({ slug, messageId, onClose }: Props) => {
  const [reason, setReason] = useState<string>(ROOM_DEFAULT_REPORT_REASON);
  const [details, setDetails] = useState('');
  const report = useReportRoomMutation(slug);

  const submit = () => {
    report.mutate({ messageId, reason, details: details.trim() || undefined }, { onSuccess: () => onClose() });
  };

  return (
    <div className="rm-sheetbody">
      <RoomSheetHead
        titleId="room-report-title"
        tone="red"
        eyebrow="Breaking the vibe?"
        title="Report message"
        icon={
          <svg viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 21V4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M5 4h13l-2.5 4L18 12H5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        }
      />
      <p className="rm-sheetsub">
        Reports go to a human reviewer. Three reports from different people hide the message for everyone.
      </p>
      <div role="radiogroup" aria-label="Reason" className="rm-options">
        {ROOM_REPORT_REASONS.map((r) => {
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
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
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
        maxLength={ROOM_LIMITS.REPORT_DETAILS_MAX}
        rows={2}
        aria-label="Details"
        className="rm-textarea"
      />
      <button type="button" onClick={submit} disabled={report.isPending} className="rm-joinbtn">
        {report.isPending ? 'Reporting…' : 'Send report'}
      </button>
    </div>
  );
};

export default RoomReportForm;
