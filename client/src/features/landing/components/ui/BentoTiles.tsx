import { cn } from '@/shared/utils/cn';
import IncognitoGlyph from './IncognitoGlyph';
import { Copy, GlassSphere, GlassStage, Head, Spark, Tile } from './BentoGlass';

/* ── 1 · Zero profile ────────────────────────────────────────────────────────
   A frosted glass credential — a portrait redacted to nothing but a made-up
   handle. The identity you'd normally hand over, struck out. */
export const ZeroProfileTile = () => (
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
export const GoneTile = () => (
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
export const ConnectionsTile = () => (
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
export const SafeExitTile = () => (
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
