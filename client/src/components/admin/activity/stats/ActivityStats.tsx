const StatChip = ({ label, value, accent }: { label: string; value: number; accent: string }) => (
  <div className="min-w-0 flex-1 px-4 first:pl-0 last:pr-0">
    <p className={`font-display text-2xl leading-none tabular-nums sm:text-3xl ${accent}`}>{value}</p>
    <p className="mt-1.5 text-xs font-medium text-body-300">{label}</p>
  </div>
);

const StatDivider = () => (
  <div
    className="hidden w-px shrink-0 self-stretch bg-linear-to-b from-transparent via-border/60 to-transparent sm:block"
    aria-hidden
  />
);

type ActivityStatsProps = {
  onlineCount: number;
  platformUsers: number;
  platformMessages: number;
};

const ActivityStats = ({ onlineCount, platformUsers, platformMessages }: ActivityStatsProps) => (
  <section aria-label="Activity summary" className="relative shrink-0">
    <div
      className="pointer-events-none absolute -left-6 top-0 h-28 w-48 rounded-full bg-blue/8 blur-3xl"
      aria-hidden
    />
    <div className="relative flex flex-wrap items-end border-b border-border/40 pb-6">
      <StatChip label="Online now" value={onlineCount} accent="text-green" />
      <StatDivider />
      <StatChip label="Total users" value={platformUsers} accent="text-gold" />
      <StatDivider />
      <StatChip label="Total messages" value={platformMessages} accent="text-blue" />
    </div>
  </section>
);

export default ActivityStats;
