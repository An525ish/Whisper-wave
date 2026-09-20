import IncognitoGlyph from '@/components/landing/ui/IncognitoGlyph';

/**
 * Floating strangers — faceless people drifting in the hero's side space, each
 * carrying a single anonymous line. They're interactive: hover one and it
 * "answers" — the avatar lifts and glows, a signal ping rings out, and its
 * message pops forward. It makes the edges feel like a room full of strangers
 * you could poke at any moment, not decoration. Violet = strangers (left),
 * teal = the you-side (right); the spark green stays withheld.
 *
 * Each floater centers on its point via an outer wrapper and floats on an
 * inner one, so `lw-float`'s `translate` can't fight the centering. Motion is
 * `motion-safe` gated; the set hides on narrow viewports so it never crowds
 * the center. Pointer-interactive → NOT aria-hidden as a group, but purely
 * decorative content, so each is aria-hidden individually.
 */

type Tone = 'violet' | 'teal';
type Floater = { x: number; y: number; tone: Tone; scale: number; delay: number; dur: number; msg: string };

const TONE = {
  violet: { glyph: '#b6a4ff', ring: 'rgba(139,107,255,0.5)', glow: 'rgba(139,107,255,0.55)' },
  teal: { glyph: '#86f2e4', ring: 'rgba(53,224,200,0.48)', glow: 'rgba(53,224,200,0.5)' },
} as const;

const FLOATERS: Floater[] = [
  { x: 8, y: 24, tone: 'violet', scale: 1.1, delay: 0, dur: 7, msg: 'hey' },
  { x: 15, y: 55, tone: 'violet', scale: 0.9, delay: 0.8, dur: 8.5, msg: 'no name here' },
  { x: 9, y: 80, tone: 'violet', scale: 1, delay: 1.6, dur: 7.6, msg: 'just needed to talk' },
  { x: 91, y: 21, tone: 'teal', scale: 1.05, delay: 0.4, dur: 8, msg: "who's this?" },
  { x: 85, y: 52, tone: 'teal', scale: 0.92, delay: 1.2, dur: 7.2, msg: "it's a vibe" },
  { x: 92, y: 78, tone: 'teal', scale: 0.85, delay: 0.6, dur: 9, msg: 'same tbh' },
];

const BASE = 'clamp(40px,4.4vw,60px)';

const FloatingStrangers = () => (
  <div className="absolute inset-0 z-[2] hidden min-[1024px]:block">
    {FLOATERS.map((f, i) => {
      const tone = TONE[f.tone];
      const left = f.tone === 'violet'; // violet strangers on the left, teal on the right
      return (
        <div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${f.x}%`, top: `${f.y}%` }}
        >
          {/* float layer */}
          <div className="motion-safe:animate-lw-float" style={{ animationDelay: `${f.delay}s`, animationDuration: `${f.dur}s` }}>
            {/* interactive group */}
            <div
              className={`group pointer-events-auto flex cursor-default items-center gap-2.5 ${left ? 'flex-row' : 'flex-row-reverse'}`}
            >
              {/* avatar */}
              <div className="relative shrink-0" aria-hidden>
                {/* signal ping on hover */}
                <span
                  className="absolute inset-0 rounded-full border opacity-0 motion-safe:group-hover:animate-lw-radar group-hover:opacity-100"
                  style={{ borderColor: tone.glyph, transformOrigin: 'center' }}
                />
                <div
                  className="relative grid aspect-square place-items-center rounded-full border bg-lw-ink/70 backdrop-blur-md"
                  style={{
                    width: `calc(${BASE} * ${f.scale})`,
                    borderColor: tone.ring,
                    boxShadow: `0 10px 26px -8px ${tone.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
                  }}
                >
                  <IncognitoGlyph color={tone.glyph} className="size-[56%]" />
                  <span
                    className="absolute right-[4%] top-[4%] size-[16%] rounded-full motion-safe:animate-lw-blink"
                    style={{ background: tone.glyph, boxShadow: `0 0 6px ${tone.glow}` }}
                  />
                </div>
              </div>

              {/* carried message — dim at rest, pops forward on hover */}
              <div
                aria-hidden
                className={[
                  'whitespace-nowrap rounded-2xl border px-3.5 py-2 font-lw-body text-[0.84rem] leading-none backdrop-blur-md',
                  'opacity-70 transition-opacity duration-300 group-hover:opacity-100',
                  left
                    ? 'rounded-bl-sm border-lw-violet/30 bg-lw-violet/[0.16] text-lw-violet-2'
                    : 'rounded-br-sm border-lw-teal/30 bg-lw-teal/[0.14] text-lw-teal-2',
                ].join(' ')}
              >
                {f.msg}
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

export default FloatingStrangers;
