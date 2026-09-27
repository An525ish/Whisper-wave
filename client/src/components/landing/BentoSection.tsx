import { Link } from 'react-router-dom';
import { useScrollReveal } from '@/hooks/landing/useScrollReveal';
import HoloMesh from '@/components/landing/ui/HoloMesh';
import IncognitoGlyph from '@/components/landing/ui/IncognitoGlyph';
import { cn } from '@/utils/cn';

/**
 * "Why Whisper Wave" — an asymmetric frosted-glass bento. Each tile carries ONE
 * crafted glass specimen (a blown-glass object with real depth: rim light,
 * specular highlight, inner shadow, a soft cast glow) rather than a flat icon,
 * so the whole grid reads as one liquid-glass material system — the brand's
 * own mark, made physical. Colour keeps its meaning: violet = anonymity /
 * the stranger, teal = you, green = the spark (reserved for the connection
 * climax only).
 *
 * One scroll observer drives a staggered reveal; everything degrades to
 * fully-visible + still under `prefers-reduced-motion`.
 */

/* ── Shared glass material ───────────────────────────────────────────────── */

type Tone = 'violet' | 'teal' | 'spark';

const RGB: Record<Tone, string> = {
  violet: '139,107,255',
  teal: '53,224,200',
  spark: '1,195,109',
};

/* A blown-glass sphere: bright top-left specular, coloured body, dark base for
   weight, a rim light, and a cast glow. The signature primitive of the grid. */
const GlassSphere = ({
  tone,
  className,
  style,
  children,
}: {
  tone: Tone;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) => {
  const rgb = RGB[tone];
  return (
    <span
      className={cn('relative grid shrink-0 place-items-center rounded-full', className)}
      style={{
        background: `radial-gradient(circle at 34% 24%, rgba(255,255,255,0.6), rgba(${rgb},0.34) 36%, rgba(${rgb},0.14) 62%, rgba(8,5,16,0.5) 100%)`,
        border: `1px solid rgba(${rgb},0.45)`,
        boxShadow: `inset 0 2px 6px rgba(255,255,255,0.55), inset 0 -10px 20px rgba(0,0,0,0.5), 0 16px 34px -10px rgba(${rgb},0.6)`,
        ...style,
      }}
    >
      {/* crisp specular highlight */}
      <span className="pointer-events-none absolute left-[24%] top-[15%] h-[24%] w-[34%] -rotate-12 rounded-full bg-white-pure/70 blur-[3px]" aria-hidden />
      {/* faint lower inner bounce */}
      <span
        className="pointer-events-none absolute inset-x-[18%] bottom-[10%] h-[22%] rounded-full opacity-60 blur-[6px]"
        style={{ background: `radial-gradient(ellipse, rgba(${rgb},0.5), transparent 70%)` }}
        aria-hidden
      />
      <span className="relative z-[1] grid size-full place-items-center">{children}</span>
    </span>
  );
};

/* The specimen "well" — a recessed dark pane the glass object sits inside, with
   a soft coloured glow behind it and a hairline floor reflection. Gives every
   illustration the same lit-vitrine feel. */
const GlassStage = ({
  tone,
  className,
  children,
}: {
  tone: Tone;
  className?: string;
  children?: React.ReactNode;
}) => {
  const rgb = RGB[tone];
  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-2xl border border-white-pure/10',
        className,
      )}
      style={{
        background: `linear-gradient(158deg, rgba(${rgb},0.14), rgba(255,255,255,0.04) 42%, rgba(10,7,18,0.55))`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -20px 40px -24px rgba(${rgb},0.5)`,
      }}
    >
      {/* cast glow behind the specimen */}
      <span
        className="pointer-events-none absolute left-1/2 top-1/2 size-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80 blur-2xl"
        style={{ background: `radial-gradient(circle, rgba(${rgb},0.42), transparent 70%)` }}
        aria-hidden
      />
      {/* hairline floor reflection */}
      <span
        className="pointer-events-none absolute inset-x-6 bottom-5 h-px opacity-50"
        style={{ background: `linear-gradient(90deg, transparent, rgba(${rgb},0.55), transparent)` }}
        aria-hidden
      />
      <span className="relative z-[1] grid size-full place-items-center">{children}</span>
    </div>
  );
};

/* Two glass rings fusing at a bright core — the spark mark, in glass. */
const Spark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 24" className={cn('drop-shadow-[0_0_12px_var(--lw-spark-glow)]', className)} aria-hidden>
    <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.6" opacity="0.9" fill="none" />
    <circle cx="20" cy="12" r="7" stroke="currentColor" strokeWidth="1.6" opacity="0.9" fill="none" />
    <circle cx="16" cy="12" r="2.6" fill="currentColor" />
  </svg>
);

/* ── Tile chrome ─────────────────────────────────────────────────────────── */

const Head = ({ index, kicker, tone }: { index: string; kicker: string; tone: Tone }) => (
  <div className="flex items-center gap-2.5">
    <span
      className="grid size-6 place-items-center rounded-full font-lw-mono text-[0.6rem] font-bold"
      style={{ color: `rgb(${RGB[tone]})`, background: `rgba(${RGB[tone]},0.12)`, border: `1px solid rgba(${RGB[tone]},0.35)` }}
    >
      {index}
    </span>
    <span className="font-lw-mono text-[0.66rem] uppercase tracking-[0.24em] text-lw-text-faint">{kicker}</span>
  </div>
);

/* A frosted-glass panel that holds one specimen + its copy. */
const Tile = ({
  className,
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) => (
  <article
    className={cn(
      'lw-glass lw-rim relative flex flex-col gap-4 overflow-hidden rounded-[1.6rem] p-5 sm:p-6',
      className,
    )}
    style={style}
  >
    {/* top edge highlight */}
    <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white-pure/40 to-transparent" aria-hidden />
    {children}
  </article>
);

/* Copy block shared by all tiles. */
const Copy = ({ title, body }: { title: string; body: string }) => (
  <div className="mt-auto flex flex-col gap-2">
    <h3 className="font-lw-display text-[1.4rem] font-medium leading-tight tracking-[-0.01em] text-lw-text">{title}</h3>
    <p className="text-[0.92rem] leading-relaxed text-lw-text-dim">{body}</p>
  </div>
);

/* ── 1 · Zero profile ────────────────────────────────────────────────────────
   A frosted glass credential — a portrait redacted to nothing but a made-up
   handle. The identity you'd normally hand over, struck out. */
const ZeroProfileTile = () => (
  <Tile className="min-[960px]:col-start-1 min-[960px]:row-span-2">
    <Head index="01" kicker="zero profile" tone="violet" />
    <div className="flex flex-1 items-center justify-center py-2">
      <div
        className="relative w-[14rem] max-w-full -rotate-[4deg] rounded-2xl border border-white-pure/15 p-4 backdrop-blur-md animate-lw-float"
        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28), 0 20px 40px -20px rgba(90,63,214,0.6)' }}
      >
        <div className="flex items-center gap-3">
          <GlassSphere tone="violet" className="size-11">
            <IncognitoGlyph className="size-6" color="#b6a4ff" />
          </GlassSphere>
          <div className="flex flex-col gap-1.5">
            {/* redacted "real name" */}
            <span className="block h-2.5 w-24 rounded-full bg-lw-violet-2/25" />
            <span className="block h-2 w-16 rounded-full bg-lw-violet-2/15" />
          </div>
        </div>
        {/* the only real field: the invented handle (label stacked above the value
            so the two never collide on the narrow card) */}
        <div className="mt-4 rounded-lg border border-lw-violet/25 bg-lw-violet/10 px-3 py-2">
          <span className="block font-lw-mono text-[0.5rem] uppercase tracking-[0.22em] text-lw-text-faint">
            vibe name
          </span>
          <span className="mt-0.5 block font-lw-mono text-[0.85rem] text-lw-violet-2">midnight_moth</span>
        </div>
        {/* redacted rows */}
        <div className="mt-3 flex flex-col gap-2">
          {['w-full', 'w-4/5'].map((w) => (
            <span key={w} className={cn('block h-2 rounded-full bg-white-pure/10', w)} />
          ))}
        </div>
      </div>
    </div>
    <Copy
      title="No login. No photo. No feed."
      body="Your whole identity is a name you made up a minute ago. Nothing to curate, nothing to defend — just you, talking."
    />
  </Tile>
);

/* ── 2 · Ephemeral ───────────────────────────────────────────────────────────
   A pane of glass mid-dissolve — the message breaking into shards that drift
   off and vanish. Nothing is kept. */
const GoneTile = () => (
  <Tile className="min-[960px]:col-start-2 min-[960px]:row-start-1">
    <Head index="02" kicker="skip = gone" tone="violet" />
    <div className="flex items-stretch gap-5">
      <GlassStage tone="violet" className="w-28 shrink-0">
        <span className="relative grid size-16 place-items-center">
          {/* the anonymous face, mid-vanish */}
          <GlassSphere tone="violet" className="size-16 animate-lw-vanish-loop">
            <IncognitoGlyph className="size-8" color="#b6a4ff" />
          </GlassSphere>
          {/* shards flying off as it dissolves */}
          {[
            { '--dx': '26px', '--dy': '-22px', top: '6%', left: '64%' },
            { '--dx': '-24px', '--dy': '-18px', top: '16%', left: '14%' },
            { '--dx': '20px', '--dy': '26px', top: '70%', left: '68%' },
          ].map((s, i) => (
            <span
              key={i}
              className="absolute size-2 rounded-[3px] bg-lw-violet-2/70 animate-lw-shard"
              style={{ ...(s as React.CSSProperties), animationDelay: `${i * 0.5}s` }}
              aria-hidden
            />
          ))}
        </span>
      </GlassStage>
      <Copy
        title="Say it, then let it go."
        body="Skip or leave and the conversation dissolves — no log, no re-find, nothing left to haunt you later."
      />
    </div>
  </Tile>
);

/* ── 3 · Real connections (the climax — the ONLY green tile) ──────────────────
   Two glass orbs — the stranger (violet) and you (teal) — drawn toward each
   other, fusing at a bright green spark core. Below, the payoff: the anonymous
   thread has become a real, named DM. */
const ConnectionsTile = () => (
  <Tile className="min-[960px]:col-start-3 min-[960px]:row-span-2">
    <Head index="03" kicker="real connections" tone="spark" />
    <GlassStage tone="spark" className="flex-1">
      <div className="relative flex w-full items-center justify-between px-7 py-9">
        {/* the connecting link runs behind both orbs (centre-to-centre) so they read
            as genuinely joined; a solid gradient thread + brighter energy marching across */}
        <div className="pointer-events-none absolute inset-x-14 top-1/2 z-[1] h-8 -translate-y-1/2">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 32" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="ww-link" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#8b6bff" />
                <stop offset="0.5" stopColor="#01c36d" />
                <stop offset="1" stopColor="#35e0c8" />
              </linearGradient>
            </defs>
            {/* the permanent connection */}
            <line x1="0" y1="16" x2="200" y2="16" stroke="url(#ww-link)" strokeWidth="2.5" opacity="0.55" />
            {/* energy flowing along it */}
            <line
              x1="0"
              y1="16"
              x2="200"
              y2="16"
              stroke="#dfffe9"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="4 22"
              opacity="0.9"
              className="animate-lw-signal"
            />
          </svg>
        </div>

        {/* stranger (label absolute so it never pulls the orb's centre off the link) */}
        <div className="relative z-[2] flex flex-col items-center">
          <GlassSphere tone="violet" className="size-14">
            <IncognitoGlyph className="size-6" color="#b6a4ff" />
          </GlassSphere>
          <span className="absolute top-full mt-2 font-lw-mono text-[0.55rem] uppercase tracking-[0.2em] text-lw-text-faint">
            stranger
          </span>
        </div>

        {/* the spark node riding the centre of the link */}
        <span className="absolute left-1/2 top-1/2 z-[3] grid -translate-x-1/2 -translate-y-1/2 place-items-center text-lw-spark">
          <span className="absolute size-9 rounded-full bg-lw-spark/30 blur-md animate-lw-blink" aria-hidden />
          <span className="absolute size-7 rounded-full border border-lw-spark/50 animate-lw-radar" aria-hidden />
          <Spark className="relative size-8" />
        </span>

        {/* you */}
        <div className="relative z-[2] flex flex-col items-center">
          <GlassSphere tone="teal" className="size-14">
            <span className="font-lw-display text-lg font-semibold text-lw-teal-2">Y</span>
          </GlassSphere>
          <span className="absolute top-full mt-2 font-lw-mono text-[0.55rem] uppercase tracking-[0.2em] text-lw-text-faint">
            you
          </span>
        </div>
      </div>
    </GlassStage>
    <Copy
      title="Mutual spark, real DM."
      body="When you both feel it, the anonymous session turns permanent — real accounts, a real inbox, someone you actually kept."
    />
  </Tile>
);

/* ── 4 · Safe exit ───────────────────────────────────────────────────────────
   A glass shield — the way out, built in glass. Teal = your control. */
const SafeExitTile = () => (
  <Tile className="min-[960px]:col-start-2 min-[960px]:row-start-2">
    <Head index="04" kicker="built-in safety" tone="teal" />
    <div className="flex items-stretch gap-5">
      <GlassStage tone="teal" className="w-28 shrink-0">
        <svg viewBox="0 0 48 52" className="size-16 drop-shadow-[0_8px_18px_rgba(53,224,200,0.5)]" aria-hidden>
          <defs>
            <linearGradient id="ww-shield" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="rgba(134,242,228,0.55)" />
              <stop offset="0.5" stopColor="rgba(53,224,200,0.28)" />
              <stop offset="1" stopColor="rgba(8,5,16,0.5)" />
            </linearGradient>
          </defs>
          <path
            d="M24 3 L43 11 V26 C43 39 34 46 24 49 C14 46 5 39 5 26 V11 Z"
            fill="url(#ww-shield)"
            stroke="rgba(134,242,228,0.7)"
            strokeWidth="1.4"
          />
          <path d="M16 25 l6 6 l11 -13" fill="none" stroke="#86f2e4" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </GlassStage>
      <Copy
        title="Safe Exit. Always."
        body="One tap and you're gone — instantly, silently. We built the way out before we built anything else."
      />
    </div>
  </Tile>
);

/* ── 5 · Spark Pass teaser (full-width iridescent strip) ──────────────────────
   The premium tier, previewed as a glass "pass": a brand line + a real CTA, over
   a row of three perks (each tied to getting more/better connections). */
const SPARK_PERKS = [
  {
    label: 'Priority queue',
    desc: 'Skip the wait',
    icon: (
      <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden>
        <path d="M13 2 4 14h6l-1 8 9-12h-6z" fill="currentColor" opacity="0.9" />
      </svg>
    ),
  },
  {
    label: 'Rewind a skip',
    desc: 'Give them a second look',
    icon: (
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M11 5 5 11l6 6M18 5l-6 6 6 6" />
      </svg>
    ),
  },
  {
    label: 'Choose who',
    desc: 'Finer match control',
    icon: (
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M4 7h10M17 7h3M4 17h3M10 17h10" />
        <circle cx="15" cy="7" r="2.2" fill="currentColor" stroke="none" />
        <circle cx="8" cy="17" r="2.2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

const SparkPassTeaser = () => (
  <Tile className="min-[960px]:col-span-3">
    {/* iridescent wash + sweeping sheen for a premium, "unlocked tier" feel */}
    <span
      className="pointer-events-none absolute inset-0 opacity-80"
      style={{
        background:
          'radial-gradient(120% 180% at 8% 0%, rgba(139,107,255,0.18), transparent 46%), radial-gradient(120% 180% at 100% 120%, rgba(53,224,200,0.16), transparent 52%)',
      }}
      aria-hidden
    />
    <span
      className="pointer-events-none absolute inset-0 animate-lw-sheen opacity-50"
      style={{ background: 'linear-gradient(120deg, transparent 32%, rgba(255,255,255,0.16) 50%, transparent 68%)' }}
      aria-hidden
    />
    <div className="relative flex flex-col gap-5">
      {/* brand line + CTA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <GlassSphere tone="teal" className="size-12">
            <Spark className="size-6 text-lw-teal-2" />
          </GlassSphere>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <h3 className="font-lw-display text-[1.3rem] font-medium tracking-[-0.01em] text-lw-text">
                <span className="lw-iri">Spark Pass</span>
              </h3>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-lw-teal/30 bg-lw-teal/10 px-2 py-0.5 font-lw-mono text-[0.5rem] uppercase tracking-[0.22em] text-lw-teal-2">
                <span className="size-1 rounded-full bg-lw-teal animate-lw-blink" aria-hidden />
                coming soon
              </span>
            </div>
            <p className="text-[0.84rem] leading-snug text-lw-text-dim">More sparks, better odds of clicking with someone.</p>
          </div>
        </div>
        <Link
          to="/spark-pass"
          className="lw-sheen inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-lw-teal/40 bg-lw-teal/10 px-4 py-2 text-[0.82rem] font-medium text-lw-teal-2 transition-colors hover:bg-lw-teal/20 sm:self-auto"
        >
          Get early access
          <span aria-hidden>→</span>
        </Link>
      </div>

      {/* perks */}
      <div className="grid grid-cols-1 gap-2.5 border-t border-white-pure/10 pt-4 sm:grid-cols-3">
        {SPARK_PERKS.map((p) => (
          <div
            key={p.label}
            className="flex items-center gap-3 rounded-xl border border-white-pure/10 bg-white-pure/[0.03] px-3 py-2.5"
          >
            <GlassSphere tone="teal" className="size-8 text-lw-teal-2">{p.icon}</GlassSphere>
            <div className="flex flex-col leading-tight">
              <span className="text-[0.82rem] font-medium text-lw-text">{p.label}</span>
              <span className="text-[0.68rem] text-lw-text-faint">{p.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </Tile>
);

/* ── Section ─────────────────────────────────────────────────────────────── */

const BentoSection = () => {
  const { ref, isVisible } = useScrollReveal<HTMLElement>();

  return (
    <section id="why" ref={ref} className="relative overflow-hidden bg-lw-base py-24 sm:py-32">
      <HoloMesh blobs={false} />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        {/* header */}
        <div className="mb-14 flex flex-col gap-4">
          <span className="font-lw-mono text-[0.7rem] uppercase tracking-[0.32em] text-lw-text-faint">
            built different
          </span>
          <h2 className="max-w-2xl font-lw-display text-[clamp(2rem,4.5vw,3.1rem)] font-medium leading-[1.05] tracking-[-0.02em] text-lw-text">
            Why Whisper Wave.
          </h2>
          <p className="max-w-xl text-[1.02rem] leading-relaxed text-lw-text-dim">
            Every choice here bends toward the same thing: honest talk between strangers, with a clean way in and a clean
            way out.
          </p>
        </div>

        {/* bento grid — staggered reveal */}
        <div
          className={cn(
            'grid grid-cols-1 gap-4 transition-all duration-700 ease-out min-[720px]:grid-cols-2 min-[960px]:grid-cols-[1fr_1.4fr_1fr] min-[960px]:auto-rows-fr',
            isVisible ? 'opacity-100' : 'translate-y-6 opacity-0',
          )}
        >
          {[ZeroProfileTile, GoneTile, ConnectionsTile, SafeExitTile, SparkPassTeaser].map((TileEl, i) => (
            <TileEl key={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BentoSection;
