import type { ReactNode } from 'react';
import CopyButton from '@/shared/components/ui/CopyButton';

type Props = {
  label: string;
  children: ReactNode;
  loading?: boolean;
  copyValue?: string | null;
};

const DetailRow = ({ label, children, loading, copyValue }: Props) => (
  <div className="group px-3 py-1 sm:px-4">
    <div className="flex items-start justify-between gap-2 rounded-xl px-2 py-3 transition hover:bg-primary/15 sm:px-3">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-body-300/45">
          {label}
        </p>
        {loading ? (
          <div className="mt-2.5 h-4 w-3/4 max-w-xs animate-pulse rounded bg-border/25" />
        ) : (
          <div className="mt-2">{children}</div>
        )}
      </div>
      {copyValue && !loading ? (
        <CopyButton value={copyValue} label={label} variant="panel" />
      ) : null}
    </div>
  </div>
);

export default DetailRow;
