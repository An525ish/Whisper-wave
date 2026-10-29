import { pct } from './WhisperCharts';

const HUES: [string, string][] = [
  ['#5ef2a8', '#01a35c'],
  ['#5fd8d0', '#0f8f9a'],
  ['#6cb8f5', '#2766c9'],
  ['#c3aaff', '#6b45d6'],
];

const calm = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Glossy bubbles, packed so none overlap, bobbing gently. #1 wears a crown. */
const Bubbles = ({ rows }: { rows: [string, number][] }) => {
  const max = rows[0][1];
  const placed: { x: number; y: number; r: number; tag: string; v: number }[] = [];
  for (const [tag, v] of rows) {
    const r = 20 + Math.sqrt(v / max) * 28;
    for (let t = 0; t < 5000; t += 1) {
      const x = 200 + Math.cos(t * 0.5) * t * 0.11 * 1.7;
      const y = 120 + Math.sin(t * 0.5) * t * 0.11;
      if (placed.every((p) => Math.hypot(p.x - x, p.y - y) >= p.r + r + 4)) {
        placed.push({ x, y, r, tag, v });
        break;
      }
    }
  }
  const still = calm();
  return (
    <svg viewBox="0 0 400 240" className="w-full" role="img" aria-label="Top vibe tags">
      <defs>
        {HUES.map(([hi, lo], i) => (
          <radialGradient key={i} id={`wv-b${i}`} cx="32%" cy="26%" r="80%">
            <stop offset="0%" stopColor={hi} stopOpacity=".95" />
            <stop offset="100%" stopColor={lo} stopOpacity=".55" />
          </radialGradient>
        ))}
      </defs>
      {placed.map((p, i) => (
        <g key={p.tag}>
          {!still && <animateTransform attributeName="transform" type="translate" values={`0 0; 0 ${i % 2 ? -3 : 3}; 0 0`} dur={`${5 + (i % 4)}s`} repeatCount="indefinite" />}
          <circle cx={p.x} cy={p.y} r={p.r} fill={`url(#wv-b${i % 4})`} stroke="rgba(255,255,255,.35)" strokeWidth=".8"
            style={{ filter: `drop-shadow(0 4px 10px ${HUES[i % 4][1]}aa)` }} />
          <ellipse cx={p.x - p.r * 0.3} cy={p.y - p.r * 0.45} rx={p.r * 0.38} ry={p.r * 0.2} fill="#fff" fillOpacity=".25" />
          <text x={p.x} y={p.y + 1} textAnchor="middle" className="fill-white font-semibold" style={{ fontSize: Math.max(8, p.r / 2.8) }}>
            #{p.tag.length > 9 ? `${p.tag.slice(0, 8)}…` : p.tag}
          </text>
          <text x={p.x} y={p.y + p.r / 2.4 + 3} textAnchor="middle" className="fill-white/80" style={{ fontSize: Math.max(7, p.r / 3.6) }}>{p.v}</text>
          {i === 0 && (
            <path d={`M${p.x - 7} ${p.y - p.r - 2} l3 -7 l4 4 l4 -4 l3 7 z`} fill="#f2b84b" style={{ filter: 'drop-shadow(0 0 4px #f2b84b)' }} />
          )}
          <title>{`#${p.tag}: ${p.v}`}</title>
        </g>
      ))}
    </svg>
  );
};

/** Bubbles on the left, ranked top 5 with share bars on the right. */
export const TopVibes = ({ rows, total }: { rows: [string, number][]; total: number }) => {
  if (rows.length === 0) return <p className="text-xs text-body-300">No tags yet.</p>;
  return (
    <div className="grid items-center gap-6 md:grid-cols-[1fr_13rem]">
      <Bubbles rows={rows} />
      <ol className="space-y-3">
        {rows.slice(0, 5).map(([tag, v], i) => (
          <li key={tag}>
            <div className="flex items-center gap-2 text-xs">
              <span className="grid size-5 place-items-center rounded-full text-[10px] font-bold text-black" style={{ background: HUES[i % 4][0] }}>{i + 1}</span>
              <span className="min-w-0 flex-1 truncate font-medium text-body">#{tag}</span>
              <span className="tabular-nums text-body-300">{pct(v, total)}</span>
            </div>
            <div className="ml-7 mt-1 h-1 rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full" style={{ width: `${(v / rows[0][1]) * 100}%`, background: `linear-gradient(90deg, ${HUES[i % 4][1]}, ${HUES[i % 4][0]})` }} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

const PERIODS = [
  { name: 'Night', from: 0, to: 6, color: '#a98bf5' },
  { name: 'Morning', from: 6, to: 12, color: '#f2b84b' },
  { name: 'Afternoon', from: 12, to: 18, color: '#01c36d' },
  { name: 'Evening', from: 18, to: 24, color: '#3a9bd9' },
];
const periodOf = (h: number) => PERIODS[Math.floor(h / 6)];
const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;

/**
 * 24h clock in the admin's own time zone. Counters are stored per UTC hour, so each
 * is shifted by the browser's offset (rounded to the hour; fine for a trend view).
 * Spokes are coloured by part of the day, the busiest glows, and a hand marks "now".
 */
export const DayClock = ({ hours: utc }: { hours: number[] }) => {
  const off = -new Date().getTimezoneOffset(); // minutes ahead of UTC
  const hours = Array<number>(24).fill(0);
  utc.forEach((v, h) => {
    hours[(((Math.floor((h * 60 + off) / 60)) % 24) + 24) % 24] += v;
  });

  const total = hours.reduce((s, v) => s + v, 0);
  const max = Math.max(...hours, 1);
  const best = hours.indexOf(Math.max(...hours));
  const nowH = new Date().getHours() + new Date().getMinutes() / 60;
  const ang = (h: number) => ((h / 24) * 360 - 90) * (Math.PI / 180);
  const at = (r: number, h: number): [number, number] => [60 + r * Math.cos(ang(h)), 60 + r * Math.sin(ang(h))];
  const [nx, ny] = at(50, nowH);

  return (
    <div>
      <svg viewBox="0 0 120 120" className="mx-auto size-64" role="img" aria-label="Matches by hour of day, your time">
        <circle cx="60" cy="60" r="28" fill="rgba(255,255,255,.03)" stroke="rgba(255,255,255,.1)" />
        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.05)" strokeDasharray="1 3" />
        {hours.map((v, h) => {
          const c = periodOf(h).color;
          const hot = total > 0 && h === best;
          const [x1, y1] = at(32, h + 0.5);
          const [x2, y2] = at(32 + 3 + (v / max) * 17, h + 0.5);
          return (
            <line key={h} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeOpacity={hot ? 1 : 0.3 + (v / max) * 0.6}
              strokeWidth={hot ? 4 : 3} strokeLinecap="round" style={hot ? { filter: `drop-shadow(0 0 4px ${c})` } : undefined}>
              <title>{`${hh(h)}, ${v} matches`}</title>
            </line>
          );
        })}
        {[0, 6, 12, 18].map((h) => {
          const [x, y] = at(57, h);
          return <text key={h} x={x} y={y} textAnchor="middle" dominantBaseline="central" className="fill-body-300 text-[4.5px]">{String(h).padStart(2, '0')}</text>;
        })}
        {/* now hand */}
        <line x1="60" y1="60" x2={nx} y2={ny} stroke="#fff" strokeOpacity=".35" strokeDasharray="1.5 2" />
        <circle cx={nx} cy={ny} r="2" fill="#fff" style={{ filter: 'drop-shadow(0 0 3px #fff)' }} />
        <text x="60" y="52" textAnchor="middle" className="fill-body-300 text-[4.5px]">busiest</text>
        <text x="60" y="62" textAnchor="middle" className="fill-body text-[11px] font-semibold">{total ? hh(best) : '-'}</text>
        <text x="60" y="69" textAnchor="middle" className="fill-body-300 text-[4px]">{total} matches</text>
      </svg>

      <ul className="mt-2 grid grid-cols-2 gap-2 text-xs">
        {PERIODS.map((p) => {
          const sum = hours.slice(p.from, p.to).reduce((s, v) => s + v, 0);
          return (
            <li key={p.name} className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-1.5">
              <span className="size-2 rounded-full" style={{ background: p.color, boxShadow: `0 0 8px ${p.color}` }} />
              <span className="text-body-300">{p.name}</span>
              <span className="ml-auto font-semibold tabular-nums text-body">{pct(sum, total)}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-center text-[10px] text-body-300/60">Your local time. The dotted hand is now.</p>
    </div>
  );
};
