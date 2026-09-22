import { Link } from 'react-router-dom';
import HeroStage from '@/components/landing/ui/HeroStage';
import HoloMesh from '@/components/landing/ui/HoloMesh';
import FloatingStrangers from '@/components/landing/ui/FloatingStrangers';
import SignalWave from '@/components/landing/ui/SignalWave';
import { cn } from '@/utils/cn';

/**
 * Section 1 — the hero, as a single illustrated scene rather than a copy block.
 * At its heart is the anonymous-chat illustration (HeroStage → AnonScene): an
 * incognito, faceless identity in a live, redacted conversation — anonymity
 * you can *see*. It sits in the auth page's "quiet circle" treatment (glow,
 * orbiting rings, signal arc, equalizer, floating chips), retuned to the
 * landing's violet/teal. Text is stripped to almost nothing: a live status
 * line, three words of headline, one glowing way in. The visual carries it.
 *
 * Base is the app's plum surface with an aurora mesh (HoloMesh) + signal wave.
 * Violet = the stranger, teal = you; green is withheld for the spark later.
 */

const focusRing =
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-lw-teal-2';

const TranscriptHero = () => (
  <section
    aria-label="Whisper Wave — talk to a stranger, anonymously"
    className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-lw-base px-[clamp(16px,5vw,56px)] pb-16 pt-24 font-lw-body text-lw-text antialiased"
  >
    {/* ── Atmosphere ─────────────────────────────────────────────── */}
    <HoloMesh className="absolute inset-0 z-0" />
    <SignalWave className="absolute inset-x-0 bottom-[-34px] z-0 h-[168px] opacity-55" />
    <div className="lw-grain pointer-events-none absolute inset-0 z-[1] opacity-[0.045] mix-blend-overlay" aria-hidden />
    <div
      className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(130%_100%_at_50%_46%,transparent_54%,rgba(20,14,32,0.72)_100%)]"
      aria-hidden
    />

    {/* ── Floating strangers, each carrying a line (hover to poke) ── */}
    <FloatingStrangers />

    {/* ── Live status line ───────────────────────────────────────── */}
    <div className="relative z-[3] flex items-center gap-2.5 rounded-full border border-lw-line-soft bg-white-pure/[0.04] px-4 py-1.5 backdrop-blur-md">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full rounded-full bg-lw-teal opacity-60 motion-safe:animate-lw-ping" />
        <span className="relative inline-flex size-2 rounded-full bg-lw-teal shadow-[0_0_8px_var(--color-lw-teal)]" />
      </span>
      <span className="font-lw-mono text-[0.64rem] uppercase tracking-[0.24em] text-lw-text-faint">
        2,417 strangers online now
      </span>
    </div>

    {/* ── The stage: the anonymous-chat illustration ─────────────── */}
    <div className="relative z-[2] my-[clamp(8px,3vh,28px)] aspect-square w-full max-w-[min(84vw,560px)]">
      <HeroStage />
    </div>

    {/* ── Minimal headline + single way in ───────────────────────── */}
    <div className="relative z-[3] flex -translate-y-[clamp(8px,2vh,24px)] flex-col items-center gap-6 text-center">
      <h1 className="font-lw-display text-[clamp(2.4rem,7.5vw,5rem)] font-normal leading-[0.92] tracking-[-0.03em] text-lw-text">
        Let&apos;s open up. <span className="lw-iri italic">No one to judge.</span>
      </h1>
    </div>

    {/* CTA pinned near the bottom so it rides over the signal-wave band,
        without stretching the centered stack above it. */}
    <div className="pointer-events-none absolute inset-x-0 bottom-[3%] z-[3] flex justify-center">
      <Link
        to="/auth"
        className={cn(
          'lw-sheen group pointer-events-auto inline-flex items-center gap-2.5 overflow-hidden rounded-full px-8 py-4 text-[1.05rem] font-semibold text-white-pure no-underline',
          'bg-[linear-gradient(135deg,var(--color-lw-violet),var(--color-lw-violet-deep)_58%,var(--color-lw-teal-deep)_150%)]',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_16px_44px_-12px_rgba(90,63,214,0.85)]',
          'transition-[translate,box-shadow] duration-[240ms] hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_22px_56px_-12px_rgba(90,63,214,0.95)]',
          focusRing,
        )}
      >
        Meet a stranger
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-[18px] transition-transform duration-[240ms] group-hover:translate-x-[3px]">
          <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </div>
  </section>
);

export default TranscriptHero;
