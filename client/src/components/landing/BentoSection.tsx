import { useScrollReveal } from '@/hooks/landing/useScrollReveal';
import { cn } from '@/utils/cn';

/**
 * Section 3 — "Why Whisper Wave": a deliberately asymmetric bento that carries
 * the same colour journey as the loop above — violet (anonymity) on the left,
 * the reserved spark green (connection) on the right, with the ephemerality +
 * safety story stacked between them and the premium strip beneath. Two tall
 * glass pillars frame two stacked middle tiles, then a full-width Spark Pass
 * teaser. All tiles share one frosted material so the grid reads as a system,
 * not five stray cards; boldness stays in the palette, not in scattered motion.
 *
 * A single IntersectionObserver on the grid drives a gentle staggered reveal;
 * everything degrades to fully-visible + still under `prefers-reduced-motion`.
 */

/* ── Shared frosted tile shell ───────────────────────────────────────────
   Glass material + iridescent rim + a small hover lift, plus a stagger-in
   reveal gated by the section observer. `translate` (hover) and `transform`
   (the pop keyframe) are separate CSS properties in Tailwind v4, so they
   compose without fighting each other. */
type TileProps = {
  visible: boolean;
  delay?: number;
  className?: string;
  children: React.ReactNode;
};

const Tile = ({ visible, delay = 0, className, children }: TileProps) => (
  <div
    style={{ animationDelay: `${delay}ms` }}
    className={cn(
      'lw-glass lw-rim relative flex flex-col overflow-hidden rounded-[24px] p-6 min-[960px]:p-7',
      'transition-[translate] duration-300 ease-out hover:-translate-y-1',
      visible ? 'motion-safe:animate-lw-pop' : 'opacity-0 motion-reduce:opacity-100',
      className,
    )}
  >
    {children}
  </div>
);

/* Mono kicker sitting at the top of each tile. */
const Tag = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span
    className={cn(
      'font-lw-mono text-[0.66rem] uppercase tracking-[0.18em] text-lw-text-faint',
      className,
    )}
  >
    {children}
  </span>
);

/* Anonymous identity tile — reused from the loop's visual vocabulary. */
const Monogram = ({ tone, children }: { tone: 'violet' | 'teal'; children: React.ReactNode }) => (
  <span
    className={cn(
      'grid size-10 place-items-center rounded-xl font-lw-mono text-sm font-bold',
      tone === 'violet'
        ? 'bg-lw-violet/15 text-lw-violet-2 shadow-[0_0_0_1px_rgba(139,107,255,0.3)]'
        : 'bg-lw-teal/15 text-lw-teal-2 shadow-[0_0_0_1px_rgba(53,224,200,0.3)]',
    )}
  >
    {children}
  </span>
);

/* ── Tile 1 · Zero profile (violet, tall left pillar) ────────────────────── */
const NON_IDENTITY = ['real name', 'photo', 'phone number', 'socials'] as const;

const ZeroProfileTile = ({ visible }: { visible: boolean }) => (
  <Tile
    visible={visible}
    delay={0}
    className="min-[960px]:col-start-1 min-[960px]:row-start-1 min-[960px]:row-span-2"
  >
    <Tag className="text-lw-violet-2/80">zero profile</Tag>

    {/* Everything you DON'T hand over — struck-through identity chips */}
    <div className="mt-6 flex flex-wrap gap-2" aria-hidden>
      {NON_IDENTITY.map((label) => (
        <span
          key={label}
          className="relative inline-flex items-center rounded-full border border-lw-line bg-white-pure/[0.03] px-3 py-1.5 font-lw-mono text-[0.72rem] leading-none text-lw-text-faint"
        >
          {label}
          <span className="absolute inset-x-2.5 top-1/2 h-px -translate-y-1/2 bg-lw-violet/60" />
        </span>
      ))}
    </div>

    <div className="mt-auto pt-8">
      <h3 className="font-lw-display text-[clamp(1.5rem,2.6vw,2rem)] font-medium leading-[1.12] tracking-[-0.02em] text-lw-text">
        No login.
        <br />
        No photo.
        <br />
        No algorithm.
      </h3>
      <p className="mt-3 text-[0.95rem] leading-[1.6] text-lw-text-dim">
        Just a name you made up thirty seconds ago and a vibe tag. That&apos;s your entire identity here.
      </p>
    </div>
  </Tile>
);

/* ── Tile 2 · Gone forever (ephemeral, middle top) ───────────────────────── */
const DISSOLVE = ['They', 'vanish.', 'Real', 'stakes.', 'Pure', 'magic.', 'No', 'second', 'chances.', 'Just', 'this', 'moment.'] as const;
const DISSOLVE_BRIGHT = new Set([1, 5, 11]); // the three payoff words

const GoneTile = ({ visible }: { visible: boolean }) => (
  <Tile visible={visible} delay={80} className="min-[960px]:col-start-2 min-[960px]:row-start-1">
    <Tag>skip = gone forever</Tag>
    <p
      className="mt-5 font-lw-display text-[clamp(1.35rem,2.4vw,1.85rem)] font-medium leading-[1.32] tracking-[-0.01em]"
      aria-label="They vanish. Real stakes. Pure magic. No second chances. Just this moment."
    >
      {DISSOLVE.map((word, i) => (
        <span
          key={i}
          aria-hidden
          style={{ animationDelay: `${320 + i * 110}ms` }}
          className={cn(
            'inline-block',
            DISSOLVE_BRIGHT.has(i) ? 'text-lw-text' : 'text-lw-text-dim',
            visible ? 'motion-safe:animate-lw-fade' : 'opacity-0 motion-reduce:opacity-100',
          )}
        >
          {word}&nbsp;
        </span>
      ))}
    </p>
  </Tile>
);

/* ── Tile 3 · Real connections (spark green, tall right pillar) ──────────── */
const ConnectionsTile = ({ visible }: { visible: boolean }) => (
  <Tile
    visible={visible}
    delay={160}
    className="min-[960px]:col-start-3 min-[960px]:row-start-1 min-[960px]:row-span-2"
  >
    <Tag className="text-lw-spark/80">real connections</Tag>

    {/* two anonymous identities → the mutual spark → a real DM */}
    <div className="mt-7 flex flex-col items-center gap-3" aria-hidden>
      <div className="flex items-center gap-3">
        <Monogram tone="violet">M</Monogram>
        <span className="grid size-9 place-items-center rounded-full border border-lw-spark/40 bg-lw-spark/[0.12] text-sm text-lw-spark [filter:drop-shadow(0_0_8px_var(--lw-spark-glow))]">
          ✦
        </span>
        <Monogram tone="teal">B</Monogram>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-lw-spark/30 bg-lw-spark/10 px-3 py-1 font-lw-mono text-[0.62rem] uppercase tracking-[0.12em] text-lw-spark">
        DM unlocked
      </span>
    </div>

    <div className="mt-auto pt-8">
      <h3 className="font-lw-display text-[clamp(1.5rem,2.6vw,2rem)] font-medium leading-[1.12] tracking-[-0.02em] text-lw-text">
        Mutual spark →
        <br />
        real DM.
      </h3>
      <p className="mt-3 text-[0.95rem] leading-[1.6] text-lw-text-dim">
        Your anonymous session becomes a permanent connection — their real account, your real DM.
      </p>
    </div>
  </Tile>
);

/* ── Tile 4 · Safe Exit (teal, middle bottom) ────────────────────────────── */
const SafeExitTile = ({ visible }: { visible: boolean }) => (
  <Tile visible={visible} delay={120} className="min-[960px]:col-start-2 min-[960px]:row-start-2">
    <div className="flex items-start gap-5">
      <span
        className="mt-0.5 grid size-12 shrink-0 place-items-center rounded-2xl border border-lw-teal/30 bg-lw-teal/10 text-lw-teal-2"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-6">
          <path
            d="M14 4h3.5A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5H14"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10.5 12H3m0 0 3.6-3.6M3 12l3.6 3.6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <div>
        <Tag className="text-lw-teal-2/80">built-in safety</Tag>
        <h3 className="mt-2 font-lw-display text-[clamp(1.35rem,2.4vw,1.8rem)] font-medium tracking-[-0.02em] text-lw-text">
          Safe Exit. Always.
        </h3>
        <p className="mt-2 text-[0.95rem] leading-[1.6] text-lw-text-dim">
          One tap and you&apos;re out — instantly. No message sent, no trace left. We built this first, before anything else.
        </p>
      </div>
    </div>
  </Tile>
);

/* ── Tile 5 · Spark Pass teaser (iridescent premium, full-width strip) ───── */
const SparkPassTeaser = ({ visible }: { visible: boolean }) => (
  <Tile
    visible={visible}
    delay={200}
    className="min-[720px]:col-span-2 min-[960px]:col-span-3 min-[960px]:row-start-3"
  >
    <div className="flex flex-col items-start justify-between gap-5 min-[720px]:flex-row min-[720px]:items-center">
      <div className="flex items-center gap-4">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-2xl border border-white-pure/15 bg-white-pure/[0.05] text-lg"
          aria-hidden
        >
          <span className="lw-iri">✦</span>
        </span>
        <div>
          <p className="font-lw-display text-[1.15rem] font-medium tracking-[-0.01em]">
            <span className="lw-iri">Spark Pass</span>
          </p>
          <p className="mt-0.5 font-lw-mono text-[0.72rem] tracking-[0.02em] text-lw-text-dim">
            Gender filters · Priority queue · Voice notes · Re-find credits
          </p>
        </div>
      </div>
      <span className="shrink-0 font-lw-mono text-[0.72rem] uppercase tracking-[0.16em] text-lw-text-faint">
        coming soon →
      </span>
    </div>
  </Tile>
);

/* ── Section ──────────────────────────────────────────────────────────────── */
const BentoSection = () => {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>(0.12);

  return (
    <section
      aria-label="Why Whisper Wave"
      className="relative isolate overflow-hidden bg-background px-[clamp(16px,4vw,40px)] py-[clamp(72px,12vh,140px)] font-lw-body text-lw-text"
    >
      {/* Hairline seam from the section above */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--color-lw-line)_30%,rgba(139,107,255,0.35)_50%,var(--color-lw-line)_70%,transparent)]" />

      {/* Ambient glow — violet upper-left, teal lower-right (the journey again) */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-[12%] top-[8%] size-[40vw] max-w-[560px] rounded-full opacity-40 mix-blend-screen blur-[90px] bg-[radial-gradient(circle,rgba(139,107,255,0.4),transparent_64%)]" />
        <div className="absolute bottom-[4%] right-[8%] size-[36vw] max-w-[520px] rounded-full opacity-30 mix-blend-screen blur-[90px] bg-[radial-gradient(circle,rgba(53,224,200,0.32),transparent_66%)]" />
      </div>

      <header className="relative mx-auto mb-[clamp(36px,6vh,64px)] max-w-[1180px]">
        <p className="flex items-center gap-3 font-lw-mono text-[0.72rem] uppercase tracking-[0.22em] text-lw-text-faint">
          <span className="h-px w-8 bg-lw-line" />
          built different
        </p>
        <h2 className="mt-4 font-lw-display text-[clamp(2.1rem,5vw,3.4rem)] font-medium leading-[1.05] tracking-[-0.02em] text-lw-text">
          Why Whisper Wave.
        </h2>
        <p className="mt-3 max-w-[52ch] text-[clamp(0.95rem,1.6vw,1.08rem)] leading-relaxed text-lw-text-dim">
          No profiles to perform, no feed to scroll, no score to chase. Every choice here protects one thing — a real moment between two strangers.
        </p>
      </header>

      <div
        ref={ref}
        className="relative mx-auto grid max-w-[1180px] gap-4 min-[720px]:grid-cols-2 min-[960px]:grid-cols-[1fr_1.4fr_1fr]"
      >
        <ZeroProfileTile visible={isVisible} />
        <GoneTile visible={isVisible} />
        <ConnectionsTile visible={isVisible} />
        <SafeExitTile visible={isVisible} />
        <SparkPassTeaser visible={isVisible} />
      </div>
    </section>
  );
};

export default BentoSection;
