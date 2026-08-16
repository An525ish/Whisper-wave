import SingleAreaChart from '@/components/ui/charts/SingleAreaChart';
import type { SparkVariant } from '@/components/ui/charts/SingleAreaChart';
import type { DashboardMetric, DashboardMetricKey } from '@/types/admin';
import Metric from './Metric';
import OnlineGauge from './OnlineGauge';
import MetricDivider from '../shared/MetricDivider';

const SPARK_CONFIG: Record<
  Exclude<DashboardMetricKey, 'online'>,
  { label: string; variant: SparkVariant }
> = {
  users: { label: 'Signups', variant: 'blue' },
  groups: { label: 'New groups', variant: 'gold' },
  messages: { label: 'Messages sent', variant: 'coral' },
  pending: { label: 'Requests received', variant: 'yellow' },
};

type MetricStripProps = {
  metrics: DashboardMetric[];
  seriesLabels: string[];
  newUsersSeries: number[];
  groupsSeries: number[];
  messagesSeries: number[];
  requestsSeries: number[];
  onlineUsers: number;
  totalUsers: number;
};

const metricSpark = (
  labels: string[],
  values: number[],
  label: string,
  variant: SparkVariant,
) => (
  <SingleAreaChart
    labels={labels as never[]}
    values={values as never[]}
    label={label}
    variant={variant}
  />
);

const MetricStrip = ({
  metrics,
  seriesLabels,
  newUsersSeries,
  groupsSeries,
  messagesSeries,
  requestsSeries,
  onlineUsers,
  totalUsers,
}: MetricStripProps) => {
  const seriesByKey: Record<Exclude<DashboardMetricKey, 'online'>, number[]> = {
    users: newUsersSeries,
    groups: groupsSeries,
    messages: messagesSeries,
    pending: requestsSeries,
  };

  const sparkFor = (key: DashboardMetricKey) => {
    if (key === 'online') {
      return <OnlineGauge online={onlineUsers} total={totalUsers} />;
    }
    const config = SPARK_CONFIG[key];
    return metricSpark(seriesLabels, seriesByKey[key], config.label, config.variant);
  };

  return (
    <section aria-label="Key metrics">
      <div className="relative flex flex-wrap items-end">
        <div
          className="pointer-events-none absolute -left-8 -top-8 h-40 w-56 rounded-full bg-blue/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-0 top-1/2 h-32 w-40 -translate-y-1/2 rounded-full bg-green/10 blur-3xl opacity-80"
          aria-hidden
        />
        <div className="relative flex w-full flex-wrap items-stretch">
          {metrics.map((metric, index) => (
            <div key={metric.key} className="contents">
              {index > 0 && <MetricDivider />}
              <Metric
                label={metric.label}
                value={metric.value}
                accent={metric.accent}
                hint={metric.hint}
                spark={sparkFor(metric.key)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MetricStrip;
