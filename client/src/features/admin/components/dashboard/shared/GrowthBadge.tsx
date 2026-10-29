import ArrowUp from '@/shared/components/ui/icons/ArrowUp';

type Props = {
  count: number;
};

const GrowthBadge = ({ count }: Props) =>
  count > 0 ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green">
      <ArrowUp className="h-3 w-3" />
      {count} this week
    </span>
  ) : null;

export default GrowthBadge;
