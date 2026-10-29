import StatChip from '../../shared/StatChip';
import StatDivider from '../../shared/StatDivider';

type Props = {
  onlineCount: number;
  platformUsers: number;
  platformMessages: number;
};

const ActivityStats = ({ onlineCount, platformUsers, platformMessages }: Props) => (
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
