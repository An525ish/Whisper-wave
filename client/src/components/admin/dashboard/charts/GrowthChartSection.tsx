import { useState } from 'react';
import AreaChart from '@/components/ui/charts/AreaChart';
import type { AreaChartSeries } from '@/components/ui/charts/AreaChart';
import SectionHead from '../shared/SectionHead';
import GrowthBadge from '../shared/GrowthBadge';

type GrowthChartSectionProps = {
  seriesLabels: string[];
  newUsersSeries: number[];
  googleUsersSeries: number[];
  emailUsersSeries: number[];
  weekUsers: number;
};

const SERIES_META: Pick<AreaChartSeries, 'label' | 'color'>[] = [
  { label: 'Total',  color: '#5698FF' },
  { label: 'Google', color: '#34D399' },
  { label: 'Email',  color: '#A78BFA' },
];

const GrowthChartSection = ({
  seriesLabels,
  newUsersSeries,
  googleUsersSeries,
  emailUsersSeries,
  weekUsers,
}: GrowthChartSectionProps) => {
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());

  const toggle = (label: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
        return next;
      }
      if (SERIES_META.length - next.size <= 1) return prev;
      next.add(label);
      return next;
    });
  };

  const extraSeries: AreaChartSeries[] = [
    { label: 'Google', values: googleUsersSeries, color: '#34D399' },
    { label: 'Email',  values: emailUsersSeries,  color: '#A78BFA' },
  ].filter((s) => !hidden.has(s.label));

  return (
    <div className="lg:col-span-7">
      <SectionHead
        title="User growth"
        subtitle="New sign-ups over the last 7 days"
        badge={<GrowthBadge count={weekUsers} />}
      />

      {/* Chart box — legend sits inside, centered at the top */}
      <div className="relative mt-6 h-60 sm:h-64">
        <div
          className="pointer-events-none absolute inset-x-4 top-1/2 h-32 -translate-y-1/2 rounded-full bg-blue/10 blur-3xl"
          aria-hidden
        />

        {/* Legend — absolute, centered at top of the chart box */}
        <div className="absolute inset-x-0 top-0 z-10 flex justify-center gap-1.5">
          {SERIES_META.map((s) => {
            const isOff = hidden.has(s.label);
            return (
              <button
                key={s.label}
                type="button"
                aria-pressed={!isOff}
                onClick={() => toggle(s.label)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40 ${
                  isOff
                    ? 'border-border/20 bg-background/40 text-body-300/35'
                    : 'border-border/40 bg-background/70 text-body-300 hover:border-border/65 hover:text-body'
                }`}
              >
                <span
                  className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: isOff ? 'currentColor' : s.color }}
                  aria-hidden
                />
                {s.label}
              </button>
            );
          })}
        </div>

        <AreaChart
          labels={seriesLabels as never[]}
          values={hidden.has('Total') ? [] : newUsersSeries}
          label="Total"
          extraSeries={extraSeries}
        />
      </div>
    </div>
  );
};

export default GrowthChartSection;
