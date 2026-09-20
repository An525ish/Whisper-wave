import { cn } from '@/utils/cn';

/**
 * The ambient "signal" — a calm band of drifting sine waves that gives the
 * landing its namesake Whisper *Wave* texture and echoes the auth page's
 * ripple/equalizer language. Deliberately quiet: a couple of thin, glowing
 * strokes in the stranger-violet and you-teal, moving at different speeds so
 * they read as a living signal rather than decoration.
 *
 * The track is 200% wide and holds two identical tiles; translating it by
 * exactly -50% (via `animate-lw-wave`) loops seamlessly. Motion is gated to
 * `motion-safe`, so under reduced-motion the waves simply sit still.
 *
 * Purely decorative → aria-hidden. The host controls placement/size.
 */

/** Build a smooth sine path spanning `width`, with `periods` full waves. */
const wavePath = (width: number, periods: number, amp: number, mid: number) => {
  const seg = width / (periods * 2);
  let d = `M0 ${mid}`;
  for (let i = 0; i < periods * 2; i += 1) {
    const dir = i % 2 === 0 ? -1 : 1;
    const cx = seg * i + seg / 2;
    const ex = seg * (i + 1);
    d += ` Q ${cx} ${mid + dir * amp} ${ex} ${mid}`;
  }
  return d;
};

const W = 1440; // one tile's width in viewBox units
const H = 120;

type Layer = { periods: number; amp: number; stroke: string; width: number; opacity: number; dur: string };

const LAYERS: Layer[] = [
  { periods: 3, amp: 26, stroke: 'var(--color-lw-violet)', width: 1.5, opacity: 0.5, dur: '26s' },
  { periods: 4, amp: 18, stroke: 'var(--color-lw-teal)', width: 1.25, opacity: 0.4, dur: '19s' },
  { periods: 6, amp: 10, stroke: 'var(--color-lw-violet-2)', width: 1, opacity: 0.25, dur: '32s' },
];

type Props = { className?: string };

const SignalWave = ({ className }: Props) => (
  <div className={cn('pointer-events-none overflow-hidden', className)} aria-hidden>
    {LAYERS.map((layer, i) => {
      const d = wavePath(W, layer.periods, layer.amp, H / 2);
      return (
        <div
          key={i}
          className="absolute inset-0 w-[200%] motion-safe:animate-lw-wave"
          style={{ animationDuration: layer.dur }}
        >
          <svg
            viewBox={`0 0 ${W * 2} ${H}`}
            preserveAspectRatio="none"
            className="size-full"
            fill="none"
          >
            {/* two identical tiles side by side → seamless -50% loop */}
            <path d={d} stroke={layer.stroke} strokeWidth={layer.width} opacity={layer.opacity} />
            <path
              d={d}
              transform={`translate(${W} 0)`}
              stroke={layer.stroke}
              strokeWidth={layer.width}
              opacity={layer.opacity}
            />
          </svg>
        </div>
      );
    })}
  </div>
);

export default SignalWave;
