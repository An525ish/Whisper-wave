/**
 * The crowd — a scatter of anonymous people around the central chat scene.
 * Each is a small glass avatar with an *incognito* face (no identity), a few
 * tethered to the center by a live "signal" thread so the scene reads as: one
 * open line right now, thousands of strangers around it. Violet = strangers,
 * teal = the you-side; the spark green stays withheld.
 *
 * Decorative → aria-hidden. Threads + float are `motion-safe` gated so the
 * whole crowd holds still under reduced-motion.
 */

import IncognitoGlyph from '@/components/landing/ui/IncognitoGlyph';

type Tone = 'violet' | 'teal';
type Node = { x: number; y: number; tone: Tone; size: number; delay: number; dot?: boolean; link?: boolean };

// positions are % of the square stage; center scene sits around 50/50
const NODES: Node[] = [
  { x: 13, y: 19, tone: 'violet', size: 15, delay: 0, dot: true, link: true },
  { x: 87, y: 13, tone: 'violet', size: 12, delay: 1.1, link: true },
  { x: 93, y: 50, tone: 'teal', size: 14, delay: 0.6, dot: true, link: true },
  { x: 82, y: 85, tone: 'violet', size: 11, delay: 1.7 },
  { x: 15, y: 82, tone: 'teal', size: 13, delay: 0.3, dot: true, link: true },
  { x: 5, y: 49, tone: 'violet', size: 12, delay: 0.9, link: true },
];

const TONE = {
  violet: { ring: 'rgba(139,107,255,0.55)', glyph: '#b6a4ff', glow: 'rgba(139,107,255,0.45)' },
  teal: { ring: 'rgba(53,224,200,0.5)', glyph: '#86f2e4', glow: 'rgba(53,224,200,0.4)' },
} as const;

const AnonCrowd = () => (
  <div className="pointer-events-none absolute inset-0" aria-hidden>
    {/* signal threads from the center to the linked strangers */}
    <svg viewBox="0 0 100 100" fill="none" className="absolute inset-0 size-full" preserveAspectRatio="none">
      {NODES.filter((n) => n.link).map((n, i) => (
        <line
          key={i}
          x1="50"
          y1="50"
          x2={n.x}
          y2={n.y}
          stroke={n.tone === 'teal' ? 'rgba(53,224,200,0.35)' : 'rgba(139,107,255,0.32)'}
          strokeWidth="0.4"
          strokeDasharray="1.4 2.6"
          className="motion-safe:animate-lw-signal"
          style={{ animationDelay: `${i * 0.4}s` }}
        />
      ))}
    </svg>

    {/* the people — outer div centers on the point; inner div does the
        floating so the `translate`-based float can't fight the centering. */}
    {NODES.map((n, i) => {
      const tone = TONE[n.tone];
      return (
        <div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${n.x}%`, top: `${n.y}%`, width: `${n.size}%` }}
        >
          <div
            className="motion-safe:animate-lw-float"
            style={{ animationDelay: `${n.delay}s` }}
          >
            <div
              className="relative grid aspect-square place-items-center rounded-full border bg-lw-ink/70 backdrop-blur-md"
              style={{
                borderColor: tone.ring,
                boxShadow: `0 10px 26px -8px ${tone.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
              }}
            >
              <IncognitoGlyph color={tone.glyph} className="size-[58%]" />
              {n.dot && (
                <span
                  className="absolute right-[6%] top-[6%] size-[16%] rounded-full motion-safe:animate-lw-blink"
                  style={{ background: tone.glyph, boxShadow: `0 0 6px ${tone.glow}` }}
                />
              )}
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

export default AnonCrowd;
