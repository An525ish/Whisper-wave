import type { AdminReportEvidenceItem } from '../../../types';

type Props = {
  items: AdminReportEvidenceItem[];
};

const ReportEvidence = ({ items }: Props) => (
  <ul className="mt-2 flex flex-col gap-0.5 rounded-xl bg-black/20 p-3" aria-label="Evidence snapshot">
    {items.map((item, i) => (
      <li key={`${item.ts}-${i}`} className="flex items-baseline gap-2 text-[13px] leading-relaxed text-body-300">
        <span className="min-w-0 flex-1 truncate">
          <span className="font-medium text-body">{item.alias}:</span> {item.text}
        </span>
        {item.hidden && (
          <span className="shrink-0 rounded-full bg-yellow/15 px-2 py-0.5 text-[10px] font-medium text-yellow">
            hidden
          </span>
        )}
      </li>
    ))}
  </ul>
);

export default ReportEvidence;
