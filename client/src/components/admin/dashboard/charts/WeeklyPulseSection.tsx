import SingleAreaChart from '@/components/ui/charts/SingleAreaChart';
import { DASHBOARD_PULSE_PANEL_CLASS } from '@/constants/admin/dashboard';
import SectionHead from '../shared/SectionHead';

type WeeklyPulseSectionProps = {
  seriesLabels: string[];
  messagesSeries: number[];
};

const WeeklyPulseSection = ({
  seriesLabels,
  messagesSeries,
}: WeeklyPulseSectionProps) => (
  <div className="flex flex-col lg:col-span-7">
    <SectionHead
      title="Weekly pulse"
      subtitle="Message rhythm across the last 7 days"
    />
    <div className={DASHBOARD_PULSE_PANEL_CLASS}>
      <div className="relative h-44 w-full overflow-visible sm:h-48">
        <div
          className="pointer-events-none absolute inset-x-8 top-1/2 h-24 -translate-y-1/2 rounded-full bg-green/10 blur-3xl"
          aria-hidden
        />
        <SingleAreaChart
          labels={seriesLabels as never[]}
          values={messagesSeries as never[]}
          label="Messages"
          variant="green"
          inset
        />
      </div>
    </div>
  </div>
);

export default WeeklyPulseSection;
