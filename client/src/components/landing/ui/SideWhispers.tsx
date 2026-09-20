import IncognitoGlyph from '@/components/landing/ui/IncognitoGlyph';

/**
 * The side life — small anonymous moments drifting in the left and right
 * gutters of the hero so the space around the central scene feels populated
 * and alive. Left is the stranger side (violet): someone typing, a first
 * "hey", a voice-note waveform. Right is the you side (teal): a reply, a
 * "quietly online" presence, a redacted line. Ephemeral, low-key, on-brand.
 *
 * Hidden on narrow viewports (they'd crowd the center); shown from ~1080px up.
 * Decorative → aria-hidden. All motion is `motion-safe` gated.
 */

const violet = '#b6a4ff';
const teal = '#86f2e4';

const Avatar = ({ color }: { color: string }) => (
  <span
    className="grid size-7 shrink-0 place-items-center rounded-full border bg-lw-ink/70"
    style={{ borderColor: `${color}66` }}
  >
    <IncognitoGlyph color={color} className="size-[64%]" />
  </span>
);

const Pill = ({ tone, children }: { tone: 'violet' | 'teal'; children: React.ReactNode }) => (
  <div
    className="flex items-center gap-2.5 rounded-2xl border bg-lw-ink/70 px-3 py-2 backdrop-blur-md shadow-[0_12px_30px_-12px_rgba(10,6,20,0.8)]"
    style={{ borderColor: tone === 'violet' ? 'rgba(139,107,255,0.28)' : 'rgba(53,224,200,0.26)' }}
  >
    {children}
  </div>
);

const Bubble = ({ tone, children }: { tone: 'violet' | 'teal'; children: React.ReactNode }) => (
  <div
    className={[
      'inline-block rounded-2xl border px-3.5 py-2 font-lw-body text-[0.86rem] leading-none backdrop-blur-md',
      tone === 'violet'
        ? 'rounded-bl-sm border-lw-violet/30 bg-lw-violet/[0.16] text-lw-violet-2'
        : 'rounded-br-sm border-lw-teal/30 bg-lw-teal/[0.14] text-lw-teal-2',
    ].join(' ')}
  >
    {children}
  </div>
);

const TypingDots = ({ color }: { color: string }) => (
  <span className="flex items-end gap-1">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="size-1.5 rounded-full motion-safe:animate-lw-typing"
        style={{ background: color, animationDelay: `${i * 0.16}s` }}
      />
    ))}
  </span>
);

const MiniEq = ({ color }: { color: string }) => (
  <span className="flex h-4 items-end gap-[3px]">
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <span
        key={i}
        className="w-[3px] rounded-full motion-safe:animate-lw-eq"
        style={{ height: '100%', background: color, transformOrigin: 'bottom', animationDelay: `${(i % 4) * 0.1}s` }}
      />
    ))}
  </span>
);

/** A floating wrapper: gentle drift, staggered, optional horizontal nudge. */
const Float = ({
  delay,
  nudge,
  children,
}: {
  delay: number;
  nudge?: string;
  children: React.ReactNode;
}) => (
  <div className="motion-safe:animate-lw-float" style={{ animationDelay: `${delay}s`, marginLeft: nudge, marginRight: nudge }}>
    {children}
  </div>
);

const SideWhispers = () => (
  <div className="pointer-events-none absolute inset-0 z-[1] hidden min-[1080px]:block" aria-hidden>
    {/* left — the stranger side (violet) */}
    <div className="absolute left-[clamp(16px,4.5vw,88px)] top-1/2 flex -translate-y-1/2 flex-col gap-8">
      <Float delay={0} nudge="14%">
        <Pill tone="violet">
          <Avatar color={violet} />
          <TypingDots color={violet} />
        </Pill>
      </Float>
      <Float delay={1.2}>
        <Bubble tone="violet">hey</Bubble>
      </Float>
      <Float delay={0.6} nudge="20%">
        <Pill tone="violet">
          <Avatar color={violet} />
          <MiniEq color={violet} />
          <span className="font-lw-mono text-[0.6rem] tracking-[0.08em] text-lw-text-faint">voice note</span>
        </Pill>
      </Float>
    </div>

    {/* right — the you side (teal) */}
    <div className="absolute right-[clamp(16px,4.5vw,88px)] top-1/2 flex -translate-y-1/2 flex-col items-end gap-8">
      <Float delay={0.4} nudge="18%">
        <Bubble tone="teal">it&apos;s a vibe</Bubble>
      </Float>
      <Float delay={1.5}>
        <Pill tone="teal">
          <Avatar color={teal} />
          <span className="flex items-center gap-1.5 font-lw-body text-[0.78rem] font-semibold text-lw-text-dim">
            <span className="size-1.5 rounded-full bg-lw-teal shadow-[0_0_6px_var(--color-lw-teal)] motion-safe:animate-lw-blink" />
            quietly online
          </span>
        </Pill>
      </Float>
      <Float delay={0.9} nudge="12%">
        <Bubble tone="teal">
          <span className="font-lw-mono tracking-[0.06em] text-lw-text-faint">████ ██</span>
        </Bubble>
      </Float>
    </div>
  </div>
);

export default SideWhispers;
