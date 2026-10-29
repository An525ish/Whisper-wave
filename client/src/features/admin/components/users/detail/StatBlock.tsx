import CopyButton from '@/shared/components/ui/CopyButton';

type Props = {
  label: string;
  value: string;
  valueClass?: string;
  loading?: boolean;
  copyValue?: string | null;
};

const StatBlock = ({
  label,
  value,
  valueClass = 'text-body',
  loading,
  copyValue,
}: Props) => (
  <div className="group relative px-4 py-4 text-center sm:px-5">
    {copyValue && !loading ? (
      <div className="absolute right-1.5 top-1.5 opacity-70 transition group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
        <CopyButton value={copyValue} label={label} variant="panel" />
      </div>
    ) : null}
    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-body-300/45">
      {label}
    </p>
    {loading ? (
      <div className="mx-auto mt-2.5 h-4 w-20 animate-pulse rounded bg-border/25" />
    ) : (
      <p className={`mt-2 font-semibold text-lg leading-tight tabular-nums ${valueClass}`}>
        {value}
      </p>
    )}
  </div>
);

export default StatBlock;
