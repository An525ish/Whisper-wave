import { useEffect, useRef, useState } from 'react';
import { pct } from './WhisperCharts';

/** Number that eases to its new value, so a refresh feels alive. */
export const CountUp = ({ value }: { value: number }) => {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = from.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - t0) / 700, 1);
      const v = Math.round(start + (value - start) * (1 - (1 - p) ** 3));
      from.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{shown.toLocaleString()}</>;
};

const Spark = ({ values, color }: { values: number[]; color: string }) => {
  const max = Math.max(...values, 1);
  const W = 100;
  const H = 28;
  const step = values.length > 1 ? W / (values.length - 1) : W;
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${(i * step).toFixed(1)} ${(H - 3 - (v / max) * (H - 6)).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-7 w-full overflow-visible" aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
    </svg>
  );
};

/** Headline number with a coloured glow edge and a per-day sparkline. */
export const KpiTile = ({ label, value, series, color, hint }: { label: string; value: number; series: number[]; color: string; hint?: string }) => (
  <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-primary/40 p-4">
    <div className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full opacity-30 blur-2xl" style={{ background: color }} />
    <p className="relative text-[10px] font-medium uppercase tracking-[0.16em] text-body-300">{label}</p>
    <p className="relative mt-2 font-semibold text-3xl leading-none tabular-nums text-body"><CountUp value={value} /></p>
    <p className="relative mt-1 h-4 text-[10px] text-body-300/70">{hint}</p>
    <div className="relative mt-2"><Spark values={series} color={color} /></div>
  </div>
);

/** One capsule split by share, plus a legend with counts. */
export const Capsule = ({ rows }: { rows: [string, number, string][] }) => {
  const total = rows.reduce((s, [, v]) => s + v, 0);
  if (!total) return <p className="text-xs text-body-300">No data yet.</p>;
  return (
    <div>
      <div className="flex h-4 gap-1 overflow-hidden rounded-full">
        {rows.filter(([, v]) => v > 0).map(([label, v, c]) => (
          <div key={label} title={`${label}: ${v}`} className="rounded-full" style={{ width: `${(v / total) * 100}%`, background: c, boxShadow: `0 0 12px ${c}88` }} />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
        {rows.map(([label, v, c]) => (
          <li key={label} className="flex items-center gap-1.5 text-body-300">
            <span className="size-2 rounded-full" style={{ background: c }} />
            {label} <span className="font-semibold tabular-nums text-body">{v}</span>
            <span className="text-body-300/60">{pct(v, total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/** Small labelled number used under the capsules. */
export const Fact = ({ label, value, hint }: { label: string; value: string | number; hint?: string }) => (
  <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-3 py-2.5">
    <p className="font-semibold text-lg tabular-nums text-body">{value}</p>
    <p className="text-[11px] text-body-300">{label}</p>
    {hint && <p className="text-[10px] text-body-300/60">{hint}</p>}
  </div>
);

/** Last N days as glowing cells, brighter = more joins. */
export const HeatDays = ({ days }: { days: { date: string; v: number }[] }) => {
  const max = Math.max(...days.map((d) => d.v), 1);
  return (
    <div>
      <div className="grid grid-cols-10 gap-1.5 sm:grid-cols-[repeat(15,minmax(0,1fr))]">
        {days.map((d) => (
          <div
            key={d.date}
            title={`${d.date}: ${d.v} joined`}
            className="aspect-square rounded-md"
            style={{ background: d.v ? `rgba(1,195,109,${0.15 + (d.v / max) * 0.8})` : 'rgba(255,255,255,.05)', boxShadow: d.v === max && d.v > 0 ? '0 0 12px rgba(1,195,109,.7)' : undefined }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-body-300/60">
        <span>{days[0]?.date.slice(5)}</span>
        <span>{days[days.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
};
