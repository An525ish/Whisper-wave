import ArrowUp from '@/components/ui/icons/ArrowUp';

type GrowthBadgeProps = {
  count: number;
};

const GrowthBadge = ({ count }: GrowthBadgeProps) =>
  count > 0 ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green">
      <ArrowUp className="h-3 w-3" />
      {count} this week
    </span>
  ) : null;

export default GrowthBadge;
