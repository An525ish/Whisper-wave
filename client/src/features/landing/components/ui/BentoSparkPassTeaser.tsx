import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { GlassSphere, Spark, Tile } from './BentoGlass';

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

export const SparkPassTeaser = () => (
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
          to={ROUTES.sparkPass}
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
