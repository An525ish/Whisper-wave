import type { DashboardCompositionSegment } from '@/types/admin';

type CompositionBarProps = {
  segments: DashboardCompositionSegment[];
  className?: string;
};

const CompositionBar = ({ segments, className = '' }: CompositionBarProps) => {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const active = segments.filter((segment) => segment.value > 0);

  let cursor = 0;
  const conicStops =
    active.length > 0
      ? active
          .map((segment) => {
            const pct = (segment.value / total) * 100;
            const start = cursor;
            cursor += pct;
            return `${segment.glow} ${start}% ${cursor}%`;
          })
          .join(', ')
      : 'rgba(235,236,236,0.08) 0% 100%';

  return (
    <div className={`flex h-full w-full items-center ${className}`}>
      <div className="flex w-full flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div
          className="relative h-36 w-36 shrink-0 rounded-full p-2 sm:h-40 sm:w-40"
          style={{ background: `conic-gradient(from 220deg, ${conicStops})` }}
        >
          <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-background text-center">
            <p className="font-display text-xl leading-none tabular-nums text-body sm:text-2xl">
              {total.toLocaleString()}
            </p>
            <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-body-300/55">
              Total
            </p>
          </div>
        </div>

        <ul className="w-full min-w-0 flex-1 space-y-3">
          {segments.map((segment) => {
            const pct = Math.round((segment.value / total) * 100);
            return (
              <li key={segment.label} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-body-300">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: segment.glow }}
                    />
                    {segment.label}
                  </span>
                  <span className="shrink-0 tabular-nums text-xs">
                    <span className="font-display text-body">{segment.value.toLocaleString()}</span>
                    <span className="ml-1.5 text-body-300/50">{pct}%</span>
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-primary/35">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${pct}%`, backgroundColor: segment.glow }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default CompositionBar;
