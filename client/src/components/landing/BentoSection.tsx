import { useScrollReveal } from '@/hooks/landing/useScrollReveal';
import HoloMesh from '@/components/landing/ui/HoloMesh';
import IncognitoGlyph from '@/components/landing/ui/IncognitoGlyph';
import { cn } from '@/utils/cn';

/**
 * "Why Whisper Wave" — an asymmetric frosted-glass bento carrying the colour
 * journey: violet (anonymity) → the reserved spark green (connection) → teal
 * (you), with ephemerality + safety between and a premium strip beneath. Each
 * tile carries one refined, minimal specimen (thin line-art, redaction, a
 * drawn spark) rather than cartoon icons, so the grid reads as a system.
 *
 * One scroll observer drives a staggered reveal; degrades to fully-visible +
 * still under `prefers-reduced-motion`.
 */

/* ── Shared refined primitives ───────────────────────────────────────────── */

/* An anonymous face = the shared incognito mark (hat + shades) set in a
   tonal glass disc, so bento avatars match the rest of the landing. */
const AnonFace = ({ tone, className }: { tone: 'violet' | 'teal'; className?: string }) => {
  const hex = tone === 'violet' ? '#b6a4ff' : '#86f2e4';
  const rgb = tone === 'violet' ? '139,107,255' : '53,224,200';
  return (
    <span
      className={cn('relative grid place-items-center overflow-hidden rounded-full border', className)}
      style={{
        borderColor: `rgba(${rgb},0.42)`,
        background: `radial-gradient(120% 120% at 50% 20%, rgba(${rgb},0.16), rgba(${rgb},0.04))`,
      }}
    >
      <IncognitoGlyph color={hex} className="size-[56%]" />
    </span>
  );
};

/* A resolved identity — the anonymous face has become a real, named account.
   A monogram on a teal disc (the you-side colour), the visual opposite of the
   incognito AnonFace. Used only at the connection payoff. */
const NamedFace = ({ initial, className }: { initial: string; className?: string }) => (
  <span
    className={cn('relative grid place-items-center overflow-hidden rounded-full border font-lw-display font-medium text-white-pure', className)}
    style={{
      borderColor: 'rgba(53,224,200,0.55)',
      background: 'radial-gradient(120% 120% at 50% 15%, rgba(53,224,200,0.42), rgba(53,224,200,0.12))',
    }}
  >
    {initial}
  </span>
);

/* A precise four-point spark, drawn (not a glyph), with a soft green bloom. */
const Spark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path
      d="M12 1.5c.6 4.7 1.8 5.9 6.5 6.5-4.7.6-5.9 1.8-6.5 6.5-.6-4.7-1.8-5.9-6.5-6.5C10.2 7.4 11.4 6.2 12 1.5Z"
      transform="translate(0 4)"
      fill="currentColor"
      fillOpacity="0.9"
    />
  </svg>
);

type TileProps = {
  visible: boolean;
  delay?: number;
  className?: string;
  children: React.ReactNode;
};

/* Frosted tile with a hairline top-highlight for real glass depth. */
const Tile = ({ visible, delay = 0, className, children }: TileProps) => (
  <div
    style={{ animationDelay: `${delay}ms` }}
    className={cn(
      'lw-glass lw-rim group relative flex flex-col overflow-hidden rounded-[24px] p-6 min-[960px]:p-7',
      'transition-[translate,box-shadow] duration-300 ease-out hover:-translate-y-1',
      visible ? 'motion-safe:animate-lw-pop' : 'opacity-0 motion-reduce:opacity-100',
      className,
    )}
  >
    {/* top edge highlight */}
    <span
      className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)]"
      aria-hidden
    />
    {children}
  </div>
);

/* Editorial index + kicker row shared by every tile. */
const Head = ({ index, kicker, tone }: { index: string; kicker: string; tone?: string }) => (
  <div className="flex items-center gap-2.5">
    <span className="font-lw-mono text-[0.7rem] tabular-nums text-lw-text-faint/70">{index}</span>
    <span className="h-3 w-px bg-white-pure/15" aria-hidden />
    <span className={cn('font-lw-mono text-[0.66rem] uppercase tracking-[0.18em]', tone ?? 'text-lw-text-faint')}>
      {kicker}
    </span>
  </div>
);

/* ── Tile 1 · Zero profile (violet, tall left pillar) ────────────────────── */
const ZeroProfileTile = ({ visible }: { visible: boolean }) => (
  <Tile
    visible={visible}
    delay={0}
    className="min-[960px]:col-start-1 min-[960px]:row-start-1 min-[960px]:row-span-2"
  >
    <Head index="01" kicker="zero profile" tone="text-lw-violet-2/80" />

    {/* your entire identity — a blurred face, a made-up handle, one vibe */}
    <div
      className="relative mt-6 flex flex-col items-center gap-4 overflow-hidden rounded-2xl border border-lw-line bg-black/25 px-4 py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
      aria-hidden
    >
      {/* soft glow behind the portrait */}
      <span className="pointer-events-none absolute -top-6 size-32 rounded-full bg-lw-violet/25 blur-[42px]" />

      <AnonFace tone="violet" className="relative size-[4.5rem]" />

      <div className="relative text-center">
        <p className="font-lw-mono text-[0.9rem] tracking-[0.04em] text-lw-violet-2">midnight_moth</p>
        <p className="mt-1.5 font-lw-mono text-[0.56rem] uppercase tracking-[0.22em] text-lw-text-faint">
          unverified · anonymous
        </p>
      </div>

      <span className="relative inline-flex items-center gap-1.5 rounded-full border border-lw-violet/30 bg-lw-violet/10 px-3 py-1 font-lw-mono text-[0.62rem] text-lw-violet-2">
        <span className="size-1 rounded-full bg-lw-violet-2" />
        vibe · night owl
      </span>
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
        Just a name you made up thirty seconds ago and a vibe tag — that&apos;s your entire identity, until you
        want to connect.
      </p>
    </div>
  </Tile>
);

/* ── Tile 2 · Gone forever (ephemeral, middle top) ───────────────────────── */
const GoneTile = ({ visible }: { visible: boolean }) => (
  <Tile visible={visible} delay={80} className="min-[960px]:col-start-2 min-[960px]:row-start-1">
    <Head index="02" kicker="skip = gone forever" />

    {/* the stranger's redacted portrait dissolving away — gone for good */}
    <div className="relative mt-6 flex h-20 items-center gap-4" aria-hidden>
      <span className="relative">
        <AnonFace tone="violet" className="size-14 motion-safe:animate-lw-vanish-loop" />
        {/* fragments drifting off as it goes */}
        <span className="pointer-events-none absolute -right-3 top-1/2 h-12 w-20 -translate-y-1/2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className="absolute rounded-full bg-lw-violet-2/70 motion-safe:animate-lw-vanish-loop"
              style={{
                left: `${i * 13}px`,
                top: `${20 + Math.sin(i * 1.6) * 14}px`,
                width: `${Math.max(2, 6 - i)}px`,
                height: `${Math.max(2, 6 - i)}px`,
                animationDelay: `${i * 0.26}s`,
              }}
            />
          ))}
        </span>
      </span>
      <span className="font-lw-mono text-[0.6rem] uppercase tracking-[0.14em] text-lw-text-faint">
        gone · no trace
      </span>
    </div>

    <h3 className="mt-2 font-lw-display text-[clamp(1.4rem,2.4vw,1.9rem)] font-medium leading-[1.2] tracking-[-0.02em] text-lw-text">
      Say it, then let it go.
    </h3>
    <p className="mt-3 text-[0.95rem] leading-[1.6] text-lw-text-dim">
      Skip or leave and that stranger dissolves — no history, no re-find, no trace to haunt you later.
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
    <Head index="03" kicker="real connections" tone="text-lw-spark/80" />

    {/* the connect moment — two anonymous faces, the spark, then a real DM */}
    <div
      className="relative mt-6 flex flex-col items-center overflow-hidden rounded-2xl border border-lw-line bg-black/25 px-4 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
      aria-hidden
    >
      {/* soft spark glow */}
      <span className="pointer-events-none absolute -top-6 size-32 rounded-full bg-lw-spark/20 blur-[46px]" />

      {/* the pairing — two anonymous people linked by a live signal, the mutual
          spark blooming at the join */}
      <div className="relative flex flex-col items-center gap-2.5 pt-1">
        <div className="relative flex items-center justify-center">
          <span className="relative z-[1] flex flex-col items-center gap-1.5">
            <AnonFace tone="violet" className="size-[4.25rem]" />
            <span className="font-lw-mono text-[0.5rem] uppercase tracking-[0.16em] text-lw-violet-2/70">stranger</span>
          </span>

          {/* the mutual spark at the meeting point — two signals merging into
              one: overlapping rings with a lit core, radar rippling out */}
          <span className="relative z-[2] mx-[-0.5rem] grid size-10 shrink-0 -translate-y-2.5 place-items-center text-lw-spark">
            <span className="absolute size-8 rounded-full border border-lw-spark/30 motion-safe:animate-lw-radar" />
            <span className="absolute size-8 rounded-full border border-lw-spark/20 motion-safe:animate-lw-radar [animation-delay:0.8s]" />
            <svg viewBox="0 0 32 24" fill="none" className="relative size-[2rem] drop-shadow-[0_0_10px_var(--lw-spark-glow)]" aria-hidden>
              {/* two rings overlapping — the two people meeting */}
              <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.75" opacity="0.9" />
              <circle cx="20" cy="12" r="7" stroke="currentColor" strokeWidth="1.75" opacity="0.9" />
              {/* the lit core where they overlap — the spark */}
              <circle cx="16" cy="12" r="2.4" fill="currentColor" />
            </svg>
          </span>

          <span className="relative z-[1] flex flex-col items-center gap-1.5">
            <AnonFace tone="teal" className="size-[4.25rem]" />
            <span className="font-lw-mono text-[0.5rem] uppercase tracking-[0.16em] text-lw-teal-2/70">you</span>
          </span>
        </div>

        {/* the "it's mutual" seal */}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-lw-spark/40 bg-lw-spark/10 px-3 py-1 font-lw-mono text-[0.6rem] uppercase tracking-[0.14em] text-lw-spark">
          <span className="size-1 rounded-full bg-lw-spark shadow-[0_0_6px_var(--lw-spark-glow)] motion-safe:animate-lw-blink" />
          it&apos;s mutual
        </span>
      </div>

      {/* the arc down to the payoff */}
      <span className="my-3 h-5 w-px bg-[linear-gradient(180deg,var(--color-lw-spark),rgba(53,224,200,0.4))]" aria-hidden />

      {/* the payoff — anonymity resolves: a real, named account, a real DM */}
      <div className="relative w-full rounded-xl border border-lw-teal/20 bg-[linear-gradient(180deg,rgba(53,224,200,0.06),rgba(255,255,255,0.02))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2.5">
          <NamedFace initial="M" className="size-9 shrink-0 text-[0.95rem]" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[0.82rem] font-semibold leading-none text-lw-text">
              Maya
              <span className="rounded-full bg-lw-teal/15 px-1.5 py-0.5 font-lw-mono text-[0.5rem] uppercase tracking-[0.12em] text-lw-teal-2">
                real account
              </span>
            </p>
            <p className="mt-1 flex items-center gap-1.5 font-lw-mono text-[0.54rem] uppercase tracking-[0.14em] text-lw-spark">
              <span className="size-1 rounded-full bg-lw-spark shadow-[0_0_6px_var(--lw-spark-glow)]" />
              dm unlocked
            </p>
          </div>
        </div>
        <p className="mt-2.5 w-fit rounded-2xl rounded-tl-sm border border-lw-teal/20 bg-lw-teal/[0.12] px-3 py-1.5 text-[0.84rem] leading-snug text-lw-teal-2">
          hey — it&apos;s actually me.
        </p>
      </div>
    </div>

    <div className="mt-auto pt-8">
      <h3 className="font-lw-display text-[clamp(1.5rem,2.6vw,2rem)] font-medium leading-[1.12] tracking-[-0.02em] text-lw-text">
        Mutual spark,
        <br />
        real DM.
      </h3>
      <p className="mt-3 text-[0.95rem] leading-[1.6] text-lw-text-dim">
        If you both feel it, the anonymous session becomes a permanent connection — their real account, your real DM.
      </p>
    </div>
  </Tile>
);

/* ── Tile 4 · Safe Exit (teal, middle bottom) ────────────────────────────── */
const SafeExitTile = ({ visible }: { visible: boolean }) => (
  <Tile visible={visible} delay={120} className="min-[960px]:col-start-2 min-[960px]:row-start-2">
    <div className="flex items-start gap-5">
      <span
        className="relative mt-0.5 grid size-12 shrink-0 place-items-center rounded-2xl border border-lw-teal/30 bg-lw-teal/10 text-lw-teal-2"
        aria-hidden
      >
        <span className="absolute inset-0 rounded-2xl border border-lw-teal/40 opacity-0 group-hover:opacity-100 motion-safe:group-hover:animate-lw-radar" />
        {/* a thin shield with a check — safety, drawn cleanly */}
        <svg viewBox="0 0 24 24" fill="none" className="relative size-6">
          <path
            d="M12 3 5 5.6v5.2c0 4.2 2.9 7.3 7 8.4 4.1-1.1 7-4.2 7-8.4V5.6L12 3Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M9 12.2l2.1 2.1L15.4 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <div>
        <Head index="04" kicker="built-in safety" tone="text-lw-teal-2/80" />
        <h3 className="mt-2.5 font-lw-display text-[clamp(1.35rem,2.4vw,1.8rem)] font-medium tracking-[-0.02em] text-lw-text">
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
          className="grid size-11 shrink-0 place-items-center rounded-2xl border border-white-pure/15 bg-white-pure/[0.05] text-lw-violet-2"
          aria-hidden
        >
          <Spark className="size-5" />
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
      id="why"
      aria-label="Why Whisper Wave"
      className="relative isolate overflow-hidden bg-lw-base px-[clamp(16px,4vw,40px)] py-[clamp(72px,12vh,140px)] font-lw-body text-lw-text"
    >
      {/* Shared mesh grid — texture carried from the hero, no coloured glow */}
      <HoloMesh blobs={false} className="absolute inset-0 z-0" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-[linear-gradient(90deg,transparent,var(--color-lw-line)_30%,rgba(139,107,255,0.35)_50%,var(--color-lw-line)_70%,transparent)]"
        aria-hidden
      />
      <div className="lw-grain pointer-events-none absolute inset-0 z-[1] opacity-[0.045] mix-blend-overlay" aria-hidden />

      <header className="relative z-[2] mx-auto mb-[clamp(36px,6vh,64px)] max-w-[1180px]">
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
