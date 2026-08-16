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

type MessagesStatsProps = {
  platformTotal: number;
  matchesLabel: string;
  matchesValue: number;
  failedLoaded: number;
  newThisWeek: number;
};

const MessagesStats = ({
  platformTotal,
  matchesLabel,
  matchesValue,
  failedLoaded,
  newThisWeek,
}: MessagesStatsProps) => (
  <section aria-label="Message summary" className="relative shrink-0">
    <div
      className="pointer-events-none absolute -left-6 top-0 h-28 w-48 rounded-full bg-blue/8 blur-3xl"
      aria-hidden
    />
    <div className="relative flex flex-wrap items-end border-b border-border/40 pb-6">
      <StatChip label="Total messages" value={platformTotal} accent="text-body" />
      <StatDivider />
      <StatChip label={matchesLabel} value={matchesValue} accent="text-blue" />
      <StatDivider />
      <StatChip label="Failed (loaded)" value={failedLoaded} accent="text-red" />
      <StatDivider />
      <StatChip label="New this week" value={newThisWeek} accent="text-green" />
    </div>
  </section>
);

export default MessagesStats;
