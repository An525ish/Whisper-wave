import { useScrollReveal } from '@/hooks/landing/useScrollReveal';
import HoloMesh from '@/components/landing/ui/HoloMesh';
import IncognitoGlyph from '@/components/landing/ui/IncognitoGlyph';
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

/* ── Tile 1 · Zero profile (violet, tall left pillar) ────────────────────── */
const NON_IDENTITY = ['real name', 'photo', 'phone number', 'socials'] as const;

const ZeroProfileTile = ({ visible }: { visible: boolean }) => (
  <Tile
    visible={visible}
    delay={0}
    className="min-[960px]:col-start-1 min-[960px]:row-start-1 min-[960px]:row-span-2"
  >
    <Tag className="text-lw-violet-2/80">zero profile</Tag>

    {/* The "you" here — a faceless avatar with a redacted name card */}
    <div className="mt-6 flex items-center gap-3.5" aria-hidden>
      <span className="lw-rim relative grid size-14 shrink-0 place-items-center rounded-2xl border border-lw-violet/40 bg-lw-violet/10">
        <IncognitoGlyph color="#b6a4ff" className="size-[56%]" />
      </span>
      <div className="flex flex-col gap-2">
        <span className="relative h-2.5 w-28 overflow-hidden rounded-full bg-lw-violet/25">
          <span className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(139,107,255,0.55)_0_6px,transparent_6px_11px)]" />
        </span>
        <span className="h-2 w-16 rounded-full bg-white-pure/10" />
      </div>
    </div>

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

    {/* a stranger dissolving — no trace */}
    <div className="mt-4 flex items-center gap-3" aria-hidden>
      <span className="grid size-11 place-items-center rounded-full border border-white-pure/15 bg-white-pure/[0.04] motion-safe:animate-lw-vanish-loop">
        <IncognitoGlyph color="#b6a4ff" className="size-[58%]" />
      </span>
      <span className="font-lw-mono text-[0.6rem] uppercase tracking-[0.14em] text-lw-text-faint">
        no trace left
      </span>
    </div>

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
    <div className="mt-7 flex flex-col items-center gap-4" aria-hidden>
      <div className="relative flex items-center">
        {/* connecting thread behind the pair */}
        <span className="absolute inset-x-6 top-1/2 h-px -translate-y-1/2 bg-[linear-gradient(90deg,rgba(139,107,255,0.5),rgba(1,195,109,0.6),rgba(53,224,200,0.5))]" />

        {/* violet anonymous */}
        <span className="lw-rim relative grid size-12 place-items-center rounded-2xl border border-lw-violet/40 bg-lw-violet/10">
          <IncognitoGlyph color="#b6a4ff" className="size-[56%]" />
        </span>

        {/* the mutual spark */}
        <span className="relative z-[1] mx-1.5 grid size-10 place-items-center">
          <span className="absolute inset-0 rounded-full border border-lw-spark/40 motion-safe:animate-lw-radar" />
          <span className="grid size-9 place-items-center rounded-full border border-lw-spark/50 bg-lw-spark/[0.14] text-[0.95rem] text-lw-spark [filter:drop-shadow(0_0_10px_var(--lw-spark-glow))]">
            ✦
          </span>
        </span>

        {/* teal you */}
        <span className="lw-rim relative grid size-12 place-items-center rounded-2xl border border-lw-teal/40 bg-lw-teal/10">
          <IncognitoGlyph color="#86f2e4" className="size-[56%]" />
        </span>
      </div>

      <span className="inline-flex items-center gap-1.5 rounded-full border border-lw-spark/30 bg-lw-spark/10 px-3 py-1 font-lw-mono text-[0.62rem] uppercase tracking-[0.12em] text-lw-spark">
        <span className="size-1 rounded-full bg-lw-spark shadow-[0_0_6px_var(--lw-spark-glow)]" />
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
      {/* Shared mesh grid — texture carried from the hero, no coloured glow */}
      <HoloMesh blobs={false} className="absolute inset-0 z-0" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-[linear-gradient(90deg,transparent,var(--color-lw-line)_30%,rgba(139,107,255,0.35)_50%,var(--color-lw-line)_70%,transparent)]"
        aria-hidden
      />
      <div className="lw-grain pointer-events-none absolute inset-0 z-[1] opacity-[0.045] mix-blend-overlay" aria-hidden />

      <header className="relative z-[2] mx-auto mb-[clamp(36px,6vh,64px)] max-w-[1180px]">
        {/* big faint "not-equal" watermark — literally "built different" */}
        <span
          className="pointer-events-none absolute -top-10 right-0 select-none font-lw-display text-[10rem] italic leading-none text-lw-violet-2/[0.07] max-[720px]:hidden"
          aria-hidden
        >
          ≠
        </span>

        <p className="relative flex items-center gap-3 font-lw-mono text-[0.72rem] uppercase tracking-[0.22em] text-lw-text-faint">
          <span className="inline-flex gap-1" aria-hidden>
            <span className="size-1.5 rounded-full bg-lw-violet-2/80" />
            <span className="size-1.5 rounded-full bg-lw-teal/80 motion-safe:animate-lw-blink" />
          </span>
          built different
        </p>
        <h2 className="relative mt-4 font-lw-display text-[clamp(2.1rem,5vw,3.4rem)] font-medium leading-[1.05] tracking-[-0.02em] text-lw-text">
          Why Whisper Wave.
        </h2>
        <p className="relative mt-4 max-w-[52ch] text-[clamp(0.95rem,1.6vw,1.08rem)] leading-relaxed text-lw-text-dim">
          No profiles to perform, no feed to scroll, no score to chase. Every choice here protects one
          thing — a real moment between two strangers.
        </p>
      </header>

      <div
        ref={ref}
        className="relative z-[2] mx-auto grid max-w-[1180px] gap-4 min-[720px]:grid-cols-2 min-[960px]:grid-cols-[1fr_1.4fr_1fr]"
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
