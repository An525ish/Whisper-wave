import { useState } from 'react';
import { offenderLabel, slaStatus, targetLabel } from '../../../utils/reports';
import type { AdminBanScope, AdminReportRow } from '../../../types';
import ReportActions from './ReportActions';
import ReportEvidence from './ReportEvidence';
import ReportReviewForm from './ReportReviewForm';

type Props = {
  report: AdminReportRow;
  busy: boolean;
  onHide: (id: string) => void;
  onBan: (id: string, scope: AdminBanScope, durationMin: number) => void;
  onReview: (id: string, actionNote: string) => Promise<boolean>;
};

const ReportCard = ({ report, busy, onHide, onBan, onReview }: Props) => {
  const [reviewing, setReviewing] = useState(false);
  const sla = slaStatus(report.createdAt, report.reason);

  return (
    <li className="rounded-2xl border border-border/60 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-white">
          {report.reason.replace(/_/g, ' ')} · {targetLabel(report)}
        </p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            sla.breached ? 'bg-red/20 text-red' : 'bg-white/10 text-body-300'
          }`}
        >
          {sla.label}
        </span>
      </div>

      <p className="mt-1 text-xs text-body-300">
        Offender: <span className="font-mono text-body">{offenderLabel(report)}</span>
        {report.targetGid && <span className="font-mono text-body-700"> ({report.targetGid})</span>}
      </p>

      {report.details && <p className="mt-1 text-sm text-body-300">Note: {report.details}</p>}

      {report.evidence && report.evidence.length > 0 && <ReportEvidence items={report.evidence} />}

      <p className="mt-2 text-xs text-body-700">
        {new Date(report.createdAt).toLocaleString()}
        {report.roomSlug ? ` · /rooms/${report.roomSlug}` : ''}
      </p>

      {reviewing ? (
        <ReportReviewForm
          reportId={report._id}
          busy={busy}
          onSubmit={(note) => onReview(report._id, note)}
          onCancel={() => setReviewing(false)}
        />
      ) : (
        <ReportActions
          report={report}
          busy={busy}
          onHide={() => onHide(report._id)}
          onBan={(scope, minutes) => onBan(report._id, scope, minutes)}
          onReview={() => setReviewing(true)}
        />
      )}
    </li>
  );
};

export default ReportCard;
