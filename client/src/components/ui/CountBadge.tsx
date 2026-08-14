import { formatUnreadCount } from '@/utils/chat';

type CountBadgeProps = {
  count: number;
  className?: string;
  label?: string;
};

const CountBadge = ({ count, className = '', label }: CountBadgeProps) => {
  if (count <= 0) return null;

  return (
    <span
      className={`inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-green/12 px-1.5 text-[10px] font-semibold tabular-nums leading-none text-green ring-1 ring-inset ring-green/30 ${className}`.trim()}
      aria-label={label}
    >
      {formatUnreadCount(count)}
    </span>
  );
};

export default CountBadge;
