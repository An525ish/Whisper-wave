type StatChipProps = {
  label: string;
  value: number;
  accent: string;
};

const StatChip = ({ label, value, accent }: StatChipProps) => (
  <div className="min-w-0 flex-1 px-4 first:pl-0 last:pr-0">
    <p className={`font-display text-2xl leading-none tabular-nums sm:text-3xl ${accent}`}>
      {value}
    </p>
    <p className="mt-1.5 text-xs font-medium text-body-300">{label}</p>
  </div>
);

const StatDivider = () => (
  <div
    className="hidden w-px shrink-0 self-stretch bg-linear-to-b from-transparent via-border/60 to-transparent sm:block"
    aria-hidden
  />
);

type GroupsStatsProps = {
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
}: GroupsStatsProps) => (
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
