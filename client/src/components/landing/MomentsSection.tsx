import { Link } from 'react-router-dom';
import { useScrollReveal } from '@/hooks/landing/useScrollReveal';
import HoloMesh from '@/components/landing/ui/HoloMesh';
import IncognitoGlyph from '@/components/landing/ui/IncognitoGlyph';
import { cn } from '@/utils/cn';

/**
 * "The moments" — the emotional why. A stack of things people only say to a
 * stranger fades in like anonymous confessions, and lands on a single teal
 * reply ("me too.") — the payoff that someone out there gets it. Violet =
 * the strangers/unsaid things, teal = the you-side reply; green withheld.
 *
 * Layout mirrors the other sections (copy + visual, two columns). Reveal is
 * driven by one scroll observer and degrades to fully-visible + still under
 * reduced-motion.
 */

const focusRing =
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-lw-teal-2';

const MOMENTS = [
  'the 3am thought I’d never post',
  'an opinion my group chat would hate',
  'something I’m still figuring out about myself',
  'grief I haven’t said out loud',
  'a question that feels too dumb to ask',
] as const;

// Each unsaid thing comes from a different stranger — vibe-name handles (never
// real identities) in the brand's style, with staggered "time ago" so the
// thread reads like a live room, not one person posting five times.
const VOICES = [
  { handle: 'midnight_fox', time: 'just now' },
  { handle: 'paper_moth', time: '2m' },
  { handle: 'quiet_tide', time: '4m' },
  { handle: 'echo_ghost', time: '7m' },
  { handle: 'slow_comet', time: '11m' },
] as const;

const MomentsSection = () => {
  const { ref, isVisible } = useScrollReveal<HTMLElement>(0.15);

  return (
    <section
      ref={ref}
      aria-label="Why people come here"
      className="relative isolate overflow-hidden bg-background px-[clamp(16px,4vw,40px)] py-[clamp(80px,13vh,140px)] font-lw-body text-lw-text"
    >
      {/* Shared mesh grid — texture carried from the hero, no coloured glow */}
      <HoloMesh blobs={false} className="absolute inset-0 z-0" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-[linear-gradient(90deg,transparent,var(--color-lw-line)_30%,rgba(139,107,255,0.35)_50%,var(--color-lw-line)_70%,transparent)]"
        aria-hidden
      />
      <div className="lw-grain pointer-events-none absolute inset-0 z-[1] opacity-[0.045] mix-blend-overlay" aria-hidden />

      <div className="relative z-[2] mx-auto grid w-full max-w-[1180px] items-center gap-[clamp(36px,6vw,80px)] min-[900px]:grid-cols-[0.95fr_1.05fr]">
        {/* Copy */}
        <div
          className={cn(
            'relative max-[900px]:text-center transition-[opacity,translate] duration-700 ease-out',
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
          )}
        >
          {/* oversized quotation-mark watermark — editorial, "the unsaid" */}
          <span
            className="pointer-events-none absolute -left-3 -top-[4.5rem] select-none font-lw-display text-[9rem] leading-none text-lw-violet-2/[0.09] max-[900px]:hidden"
            aria-hidden
          >
            “
          </span>

          <p className="relative flex items-center gap-3 font-lw-mono text-[0.72rem] uppercase tracking-[0.26em] text-lw-teal-2 max-[900px]:justify-center">
            <span className="h-px w-8 bg-lw-line max-[900px]:hidden" />
            the unsaid
          </p>
          <h2 className="relative mt-4 font-lw-display text-[clamp(2.2rem,4.6vw,3.4rem)] font-normal leading-[1.06] tracking-[-0.03em] text-lw-text">
            Say the thing you can’t say...
            <br />
            to anyone who{' '}
            <em className="relative lw-iri font-medium italic">
              knows you
              {/* hand-drawn underline flourish */}
              <svg
                className="pointer-events-none absolute -bottom-2 left-0 w-full text-lw-teal-2/70"
                viewBox="0 0 200 12"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  d="M2 8C40 3 80 3 118 6C140 7.6 168 6 198 3.5"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
            </em>
            .
          </h2>
          <p className="relative mt-6 max-w-[36rem] text-[clamp(1.02rem,1.5vw,1.18rem)] leading-[1.6] text-lw-text-dim max-[900px]:mx-auto">
            No history with you. No opinion of you. No way to bring it up later. Just a stranger
            who’ll actually listen — and then let it go.
          </p>

          <Link
            to="/auth"
            className={cn(
              'lw-sheen group mt-8 inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-[1rem] font-semibold text-white-pure no-underline',
              'bg-[linear-gradient(135deg,var(--color-lw-violet),var(--color-lw-violet-deep)_58%,var(--color-lw-teal-deep)_150%)]',
              'shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_14px_34px_-12px_rgba(90,63,214,0.85)]',
              'transition-[translate,box-shadow] duration-[240ms] hover:-translate-y-0.5',
              focusRing,
            )}
          >
            Get it off your chest
            <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-[17px] transition-transform duration-[240ms] group-hover:translate-x-[3px]">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        {/* Confession thread */}
        <div className="relative" aria-hidden>
          {/* big faint speech-bubble motif behind the thread */}
          <svg
            className="pointer-events-none absolute -right-6 -top-10 -z-0 w-[min(58%,320px)] opacity-[0.06]"
            viewBox="0 0 200 180"
            fill="none"
          >
            <path
              d="M24 20h152a12 12 0 0 1 12 12v92a12 12 0 0 1-12 12H70l-34 28v-28H24a12 12 0 0 1-12-12V32a12 12 0 0 1 12-12Z"
              stroke="currentColor"
              className="text-lw-violet-2"
              strokeWidth="2.5"
            />
          </svg>

          {/* running thread line linking the anonymous voices */}
          <span
            className="pointer-events-none absolute left-[16px] top-9 bottom-[104px] w-px bg-[linear-gradient(180deg,rgba(139,107,255,0.5),rgba(53,224,200,0.35))]"
          />

          <div className="relative flex flex-col gap-3.5">
            {MOMENTS.map((moment, i) => (
              <div
                key={moment}
                className={cn(
                  'flex items-start gap-2.5 transition-[opacity,translate] duration-500 ease-out',
                  i % 2 === 1 ? 'min-[900px]:ml-7' : '',
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
                )}
                style={{ transitionDelay: isVisible ? `${150 + i * 120}ms` : '0ms' }}
              >
                <span className="relative z-[1] mt-1 grid size-8 shrink-0 place-items-center rounded-full border border-lw-violet/40 bg-lw-ink/80">
                  <IncognitoGlyph color="#b6a4ff" className="size-[62%]" />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="rounded-2xl rounded-tl-sm border border-lw-violet/25 bg-lw-violet/[0.14] px-4 py-3 text-[clamp(0.95rem,1.4vw,1.06rem)] leading-snug text-lw-violet-2 backdrop-blur-md">
                    {moment}
                  </span>
                  <span className="pl-1 font-lw-mono text-[0.58rem] tracking-[0.1em] text-lw-text-faint">
                    {VOICES[i].handle} · {VOICES[i].time}
                  </span>
                </span>
              </div>
            ))}

            {/* the turn — a spark, then the reply that says you're not alone */}
            <div
              className={cn(
                'mt-3 flex items-start justify-end gap-2.5 transition-[opacity,translate] duration-500 ease-out',
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              )}
              style={{ transitionDelay: isVisible ? `${150 + MOMENTS.length * 120}ms` : '0ms' }}
            >
              <span className="flex flex-col items-end gap-1">
                <span className="rounded-2xl rounded-tr-sm border border-lw-teal/30 bg-lw-teal/[0.14] px-4 py-3 text-[clamp(0.95rem,1.4vw,1.06rem)] font-medium leading-snug text-lw-teal-2 backdrop-blur-md shadow-[0_12px_34px_-14px_rgba(53,224,200,0.65)]">
                  me too. more than you’d think.
                </span>
                <span className="inline-flex items-center gap-1.5 pr-1 font-lw-mono text-[0.58rem] tracking-[0.1em] text-lw-text-faint">
                  <span className="size-1 rounded-full bg-lw-teal shadow-[0_0_6px_var(--color-lw-teal)] motion-safe:animate-lw-blink" />
                  a stranger · replying
                </span>
              </span>
              <span className="relative z-[1] mt-1 grid size-8 shrink-0 place-items-center rounded-full border border-lw-teal/40 bg-lw-ink/80">
                <IncognitoGlyph color="#86f2e4" className="size-[62%]" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MomentsSection;
