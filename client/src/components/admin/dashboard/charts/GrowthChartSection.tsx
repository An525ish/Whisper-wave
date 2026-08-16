import AreaChart from '@/components/ui/charts/AreaChart';
import SectionHead from '../shared/SectionHead';
import GrowthBadge from '../shared/GrowthBadge';

type GrowthChartSectionProps = {
  seriesLabels: string[];
  newUsersSeries: number[];
  weekUsers: number;
};

const GrowthChartSection = ({
  seriesLabels,
  newUsersSeries,
  weekUsers,
}: GrowthChartSectionProps) => (
  <div className="lg:col-span-7">
    <SectionHead
      title="User growth"
      subtitle="New sign-ups over the last 7 days"
      badge={<GrowthBadge count={weekUsers} />}
    />
    <div className="relative mt-6 h-60 sm:h-64">
      <div
        className="pointer-events-none absolute inset-x-4 top-1/2 h-32 -translate-y-1/2 rounded-full bg-blue/10 blur-3xl"
        aria-hidden
      />
      <AreaChart
        labels={seriesLabels as never[]}
        values={newUsersSeries as never[]}
        label="New users"
      />
    </div>
  </div>
);

export default GrowthChartSection;
