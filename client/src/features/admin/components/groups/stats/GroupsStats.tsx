import StatChip from '../../shared/StatChip';
import StatDivider from '../../shared/StatDivider';

type Props = {
  platformTotal: number;
  matchesLabel: string;
  matchesValue: number;
  totalMembers: number;
  newThisWeek: number;
};

const GroupsStats = ({
  platformTotal,
  matchesLabel,
  matchesValue,
  totalMembers,
  newThisWeek,
}: Props) => (
  <section aria-label="Group summary" className="relative shrink-0">
    <div
      className="pointer-events-none absolute -left-6 top-0 h-28 w-48 rounded-full bg-gold/8 blur-3xl"
      aria-hidden
    />
    <div className="relative flex flex-wrap items-end border-b border-border/40 pb-6">
      <StatChip label="Total groups" value={platformTotal} accent="text-body" />
      <StatDivider />
      <StatChip label={matchesLabel} value={matchesValue} accent="text-gold" />
      <StatDivider />
      <StatChip label="Members loaded" value={totalMembers} accent="text-blue" />
      <StatDivider />
      <StatChip label="New this week" value={newThisWeek} accent="text-green" />
    </div>
  </section>
);

export default GroupsStats;
