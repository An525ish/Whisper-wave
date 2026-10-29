import { useState } from 'react';
import { BAN_DURATIONS, isRoomReport } from '../../../utils/reports';
import type { AdminBanScope, AdminReportRow } from '../../../types';

type Props = {
  report: AdminReportRow;
  busy: boolean;
  onHide: () => void;
  onBan: (scope: AdminBanScope, durationMin: number) => void;
  onReview: () => void;
};

const selectClass =
  'rounded-full border border-border/60 bg-white/[0.03] px-2 py-1.5 text-xs text-body outline-none focus:border-green/50';

const ReportActions = ({ report, busy, onHide, onBan, onReview }: Props) => {
  const [scope, setScope] = useState<AdminBanScope>('room');
  const [minutes, setMinutes] = useState(BAN_DURATIONS[1].minutes);
  const room = isRoomReport(report);
  const canHide = room && Boolean(report.roomInstanceId && report.roomMessageId);
  const canBan = room && Boolean(report.targetGid || report.targetUserId);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {room && (
        <button
          type="button"
          onClick={onHide}
          disabled={busy || !canHide}
          title={canHide ? undefined : 'No live message reference on this report'}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-body-300 hover:text-body disabled:opacity-40"
        >
          Hide message
        </button>
      )}
      {room && (
        <span className="flex flex-wrap items-center gap-1.5">
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value === 'global' ? 'global' : 'room')}
            aria-label="Ban scope"
            className={selectClass}
          >
            <option value="room">This room</option>
            <option value="global">All rooms</option>
          </select>
          <select
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            aria-label="Ban duration"
            className={selectClass}
          >
            {BAN_DURATIONS.map((d) => (
              <option key={d.minutes} value={d.minutes}>
                {d.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onBan(scope, minutes)}
            disabled={busy || !canBan}
            title={canBan ? undefined : 'No offender identity on this report'}
            className="rounded-full bg-red/20 px-3 py-1.5 text-xs font-medium text-red hover:bg-red/30 disabled:opacity-40"
          >
            Ban offender
          </button>
        </span>
      )}
      <button
        type="button"
        onClick={onReview}
        disabled={busy}
        className="ml-auto rounded-full bg-green/15 px-3 py-1.5 text-xs font-medium text-green hover:bg-green/25 disabled:opacity-50"
      >
        Mark reviewed
      </button>
    </div>
  );
};

export default ReportActions;
