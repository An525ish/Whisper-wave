import BarChart from '@/components/ui/charts/BarChart';
import SectionHead from '../shared/SectionHead';
import GrowthBadge from '../shared/GrowthBadge';

type MessageVolumeSectionProps = {
  seriesLabels: string[];
  messagesSeries: number[];
  weekMessages: number;
};

const MessageVolumeSection = ({
  seriesLabels,
  messagesSeries,
  weekMessages,
}: MessageVolumeSectionProps) => (
  <div className="lg:col-span-5">
    <SectionHead
      title="Message volume"
      subtitle="Daily messages this week"
      badge={<GrowthBadge count={weekMessages} />}
    />
    <div className="relative mt-6 h-60 sm:h-64">
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 h-28 -translate-y-1/2 rounded-full bg-green/10 blur-3xl opacity-70"
        aria-hidden
      />
      <BarChart
        labels={seriesLabels as never[]}
        values={messagesSeries as never[]}
        label="Messages"
      />
    </div>
  </div>
);

export default MessageVolumeSection;
