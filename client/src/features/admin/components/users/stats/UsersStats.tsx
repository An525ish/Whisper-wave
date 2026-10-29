import StatChip from '../../shared/StatChip';
import StatDivider from '../../shared/StatDivider';

type Props = {
  platformTotal: number;
  matchesLabel: string;
  matchesValue: number;
  newThisWeek: number;
};

const UsersStats = ({
  platformTotal,
  matchesLabel,
  matchesValue,
  newThisWeek,
}: Props) => (
  <section aria-label="User summary" className="relative shrink-0">
    <div
      className="pointer-events-none absolute -left-6 top-0 h-28 w-48 rounded-full bg-blue/8 blur-3xl"
      aria-hidden
    />
    <div className="relative flex flex-wrap items-end border-b border-border/40 pb-6">
      <StatChip label="Total Users" value={platformTotal} accent="text-body" />
      <StatDivider />
      <StatChip label={matchesLabel} value={matchesValue} accent="text-blue" />
      <StatDivider />
      <StatChip label="New this week" value={newThisWeek} accent="text-green" />
    </div>
  </section>
);

export default UsersStats;
