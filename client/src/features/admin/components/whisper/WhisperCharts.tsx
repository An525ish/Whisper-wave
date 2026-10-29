import type { ReactNode } from 'react';

export const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : '-');

export const Panel = ({ title, hint, children, className = '' }: { title: string; hint?: string; children: ReactNode; className?: string }) => (
  <section className={`relative overflow-hidden rounded-3xl border border-white/[0.07] bg-primary/40 p-5 backdrop-blur ${className}`}>
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-sm font-semibold text-body">{title}</h2>
      {hint && <p className="text-[11px] text-body-300/70">{hint}</p>}
    </div>
    <div className="mt-5">{children}</div>
  </section>
);

/** Smooth glowing area chart. `values` oldest first. */
export const AreaTrend = ({ values, labels }: { values: number[]; labels: string[] }) => {
  const W = 320;
  const H = 70;
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? W / (values.length - 1) : W;
  const pts = values.map((v, i) => [i * step, H - 6 - (v / max) * (H - 14)] as const);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-16 w-full overflow-visible" role="img" aria-label="Joins per day">
      <defs>
        <linearGradient id="wh-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#01c36d" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#01c36d" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${W} ${H} L0 ${H} Z`} fill="url(#wh-area)" />
      <path d={line} fill="none" stroke="#01c36d" strokeWidth="2" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 6px rgba(1,195,109,.7))' }} />
      {last && <circle cx={last[0]} cy={last[1]} r="3.5" fill="#01c36d" />}
      <title>{labels.map((l, i) => `${l}: ${values[i]}`).join(', ')}</title>
    </svg>
  );
};

const HUES = ['#01c36d', '#19b6a0', '#3a9bd9', '#a98bf5'];

/** Funnel as a connected journey: node size = volume, chip = % of the step before. */
export const Journey = ({ steps }: { steps: [string, number][] }) => {
  const top = Math.max(steps[0]?.[1] ?? 0, 1);
  return (
    <div className="relative grid grid-cols-2 gap-y-8 md:grid-cols-4">
      <div className="absolute left-[12.5%] right-[12.5%] top-[3.25rem] hidden h-px bg-gradient-to-r from-green/60 via-blue/50 to-[#a98bf5]/60 md:block" />
      {steps.map(([label, v], i) => {
        const size = 52 + Math.sqrt(v / top) * 36;
        const prev = steps[i - 1]?.[1];
        return (
          <div key={label} className="relative flex flex-col items-center text-center">
            <div className="flex h-[6.5rem] items-center">
              <div
                className="grid place-items-center rounded-full font-semibold tabular-nums text-white"
                style={{
                  width: size,
                  height: size,
                  background: `radial-gradient(circle at 30% 25%, ${HUES[i]}, ${HUES[i]}55)`,
                  boxShadow: `0 0 28px -4px ${HUES[i]}`,
                  fontSize: size > 70 ? '1.25rem' : '1rem',
                }}
              >
                {v}
              </div>
            </div>
            <p className="mt-1 text-xs font-medium text-body">{label}</p>
            <p className="mt-1 h-5 rounded-full bg-white/[0.06] px-2 text-[10px] leading-5 text-body-300">
              {prev === undefined ? 'everyone' : `${pct(v, prev)} of ${steps[i - 1][0].toLowerCase()}`}
            </p>
          </div>
        );
      })}
    </div>
  );
};

/** One glowing capsule split by share, with big percentages underneath. */
export const SplitBar = ({ rows, colors }: { rows: [string, number][]; colors: string[] }) => {
  const total = rows.reduce((s, [, v]) => s + v, 0);
  if (!total) return <p className="text-xs text-body-300">No data yet.</p>;
  return (
    <div>
      <div className="flex h-5 gap-1 overflow-hidden rounded-full">
        {rows.map(([label, v], i) => (
          <div key={label} title={`${label}: ${v}`} style={{ width: `${(v / total) * 100}%`, background: colors[i % colors.length], boxShadow: `0 0 14px ${colors[i % colors.length]}88` }} className="rounded-full" />
        ))}
      </div>
      <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {rows.map(([label, v], i) => (
          <li key={label}>
            <p className="font-semibold text-2xl tabular-nums" style={{ color: colors[i % colors.length] }}>{pct(v, total)}</p>
            <p className="text-xs text-body-300">{label} · {v}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

/** Blocked categories as chips with a count. */
export const ShieldChips = ({ rows }: { rows: [string, number][] }) =>
  rows.length === 0 ? (
    <p className="text-xs text-body-300">Nothing blocked.</p>
  ) : (
    <ul className="flex flex-wrap gap-2">
      {rows.map(([label, v]) => (
        <li key={label} className="flex items-center gap-2 rounded-full border border-red/30 bg-red/10 py-1 pl-3 pr-1 text-xs capitalize text-body">
          {label}
          <span className="rounded-full bg-red/80 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white">{v}</span>
        </li>
      ))}
    </ul>
  );
