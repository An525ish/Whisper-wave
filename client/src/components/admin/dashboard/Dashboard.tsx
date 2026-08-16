import { useDashboardPage } from '@/hooks/admin';
import DashboardHeader from './header/DashboardHeader';
import MetricStrip from './metrics/MetricStrip';
import GrowthChartSection from './charts/GrowthChartSection';
import MessageVolumeSection from './charts/MessageVolumeSection';
import PlatformMixSection from './composition/PlatformMixSection';
import WeeklyPulseSection from './charts/WeeklyPulseSection';

const Dashboard = () => {
  const {
    metrics,
    seriesLabels,
    newUsersSeries,
    messagesSeries,
    groupsSeries,
    requestsSeries,
    weekUsers,
    weekMessages,
    composition,
    lastUpdated,
    onlineUsers,
    totalUsers,
  } = useDashboardPage();

  return (
    <div className="mx-auto max-w-7xl space-y-12 pb-4">
      <DashboardHeader lastUpdated={lastUpdated} />

      <MetricStrip
        metrics={metrics}
        seriesLabels={seriesLabels}
        newUsersSeries={newUsersSeries}
        groupsSeries={groupsSeries}
        messagesSeries={messagesSeries}
        requestsSeries={requestsSeries}
        onlineUsers={onlineUsers}
        totalUsers={totalUsers}
      />

      <section className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <GrowthChartSection
          seriesLabels={seriesLabels}
          newUsersSeries={newUsersSeries}
          weekUsers={weekUsers}
        />
        <MessageVolumeSection
          seriesLabels={seriesLabels}
          messagesSeries={messagesSeries}
          weekMessages={weekMessages}
        />
      </section>

      <section className="grid items-stretch gap-12 border-t border-border/40 pt-10 lg:grid-cols-12 lg:gap-10">
        <PlatformMixSection composition={composition} />
        <WeeklyPulseSection
          seriesLabels={seriesLabels}
          messagesSeries={messagesSeries}
        />
      </section>
    </div>
  );
};

export default Dashboard;
