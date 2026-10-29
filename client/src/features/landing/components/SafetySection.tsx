import { useEffect, useState } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import HoloMesh from './ui/HoloMesh';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { cn } from '@/shared/utils/cn';
import type { SafetyBeat } from '../types';
import { SafetyStage } from './ui/SafetyStage';

const BEAT_MS = 3400;

const POINTS = [
  {
    id: 'age',
    label: '18+ only',
    body: 'Age gate before the queue. This isn’t a playground.',
    tone: 'violet' as const,
  },
  {
    id: 'report',
    label: 'Report & block',
    body: 'One tap. They’re cut from your wave — and we see it.',
    tone: 'teal' as const,
  },
  {
    id: 'ephemeral',
    label: 'Gone unless mutual',
    body: 'Skip or leave and that stranger dissolves. No stalkable trail.',
    tone: 'spark' as const,
  },
] as const;

const TONE = {
  violet: {
    text: 'text-lw-violet-2',
    border: 'border-lw-violet/35',
    glow: 'bg-[radial-gradient(circle,rgba(139,107,255,0.35),transparent_65%)]',
    icon: 'text-lw-violet-2',
    ring: 'border-lw-violet-2/60 shadow-[0_0_24px_-6px_rgba(139,107,255,0.65)]',
  },
  teal: {
    text: 'text-lw-teal-2',
    border: 'border-lw-teal/35',
    glow: 'bg-[radial-gradient(circle,rgba(53,224,200,0.3),transparent_65%)]',
    icon: 'text-lw-teal-2',
    ring: 'border-lw-teal/60 shadow-[0_0_24px_-6px_rgba(53,224,200,0.55)]',
  },
  spark: {
    text: 'text-lw-spark',
    border: 'border-lw-spark/35',
    glow: 'bg-[radial-gradient(circle,rgba(1,195,109,0.28),transparent_65%)]',
    icon: 'text-lw-spark',
    ring: 'border-lw-spark/60 shadow-[0_0_24px_-6px_var(--lw-spark-glow)]',
  },
} as const;

const PointIcon = ({ id, className }: { id: string; className?: string }) => {
  if (id === 'age') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8.2 12.2h7.6M12 8.4v7.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === 'report') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
        <path
          d="M12 3.5 19.2 7v5.2c0 4.2-2.9 7.2-7.2 8.3-4.3-1.1-7.2-4.1-7.2-8.3V7L12 3.5Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M12 8.2v4.2M12 15.2h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <circle cx="9" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="15.5" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2 2.5" opacity="0.55" />
    </svg>
  );
};

/**
 * Safety — glass plays the full loop; right rail mirrors the active beat.
 */
const SafetySection = () => {
  const { ref, isVisible } = useScrollReveal<HTMLElement>(0.15);
  const [cycleBeat, setCycleBeat] = useState<SafetyBeat>(0);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  // Reduced motion skips the cycle and rests on the final beat.
  const beat: SafetyBeat = reducedMotion && isVisible ? 2 : cycleBeat;

  useEffect(() => {
    if (!isVisible || reducedMotion) return;
    const id = window.setInterval(() => {
      setCycleBeat((prev) => ((prev + 1) % 3) as SafetyBeat);
    }, BEAT_MS);
    return () => window.clearInterval(id);
  }, [isVisible, reducedMotion]);

  return (
    <section
      ref={ref}
      id="safety"
      aria-label="Safety"
      className="relative isolate overflow-hidden bg-lw-base px-[clamp(16px,4vw,40px)] py-[clamp(80px,14vh,140px)] font-lw-body text-lw-text"
    >
      {/* Shared mesh grid — texture carried from the hero, no coloured glow */}
      <HoloMesh blobs={false} className="absolute inset-0 z-0" />
      <div
        className="pointer-events-none absolute left-1/2 top-0 z-[1] h-px w-[min(80%,42rem)] -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgba(182,164,255,0.5),rgba(53,224,200,0.4),transparent)]"
        aria-hidden
      />
      <div className="lw-grain pointer-events-none absolute inset-0 z-[1] opacity-[0.045] mix-blend-overlay" aria-hidden />

      <div className="relative z-[2] mx-auto grid w-full max-w-[1200px] items-center gap-[clamp(36px,6vw,72px)] min-[900px]:grid-cols-[0.95fr_1.05fr]">
        <div
          className={cn(
            'transition-[opacity,translate] duration-700 ease-out',
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
          )}
        >
          <SafetyStage active={isVisible} beat={beat} />
        </div>

        <div
          className={cn(
            'max-[900px]:text-center transition-[opacity,translate] duration-700 ease-out',
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
          )}
          style={{ transitionDelay: isVisible ? '100ms' : '0ms' }}
        >
          <p className="font-lw-mono text-[0.72rem] uppercase tracking-[0.26em] text-lw-teal-2">
            not another omegle
          </p>
          <h2 className="mt-4 font-lw-display text-[clamp(2.35rem,5vw,3.6rem)] font-normal leading-[1.05] tracking-[-0.03em] text-lw-text">
            Anonymous doesn’t
            <br />
            mean{' '}
            <em className="lw-iri font-medium italic">unprotected.</em>
          </h2>
          <p className="mt-5 max-w-[32rem] text-[clamp(1.05rem,1.5vw,1.18rem)] leading-[1.6] text-lw-text-dim max-[900px]:mx-auto min-[901px]:max-w-none min-[901px]:whitespace-nowrap">
            Gate → exits → dissolve. The whole safety loop, not just a slogan.
          </p>

          <ul className="mt-10 flex flex-col gap-3 max-[900px]:mx-auto max-[900px]:max-w-[28rem]">
            {POINTS.map((point, i) => {
              const tone = TONE[point.tone];
              const current = beat === i;
              return (
                <li
                  key={point.id}
                  className={cn(
                    'lw-glass lw-rim group relative overflow-hidden rounded-[18px] px-4 py-3.5 border transition-[opacity,translate,border-color,box-shadow] duration-500',
                    current ? tone.ring : 'border-transparent',
                    isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
                  )}
                  style={{ transitionDelay: isVisible ? `${200 + i * 110}ms` : '0ms' }}
                >
                  <div
                    className={cn(
                      'pointer-events-none absolute -left-8 top-1/2 size-28 -translate-y-1/2 blur-xl transition-opacity duration-500',
                      tone.glow,
                      current ? 'opacity-80' : 'opacity-35',
                    )}
                    aria-hidden
                  />
                  <div className="relative flex items-start gap-3.5">
                    <span
                      className={cn(
                        'mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl border bg-white-pure/[0.03]',
                        tone.border,
                        tone.icon,
                      )}
                    >
                      <PointIcon id={point.id} className="size-5" />
                    </span>
                    <div className="min-w-0 text-left">
                      <div className="flex items-baseline gap-2.5">
                        <span className={cn('font-lw-mono text-[0.62rem] tracking-[0.16em]', tone.text)}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <h3 className="font-lw-display text-[1.2rem] tracking-[-0.02em] text-lw-text">
                          {point.label}
                        </h3>
                      </div>
                      <p className="mt-1 text-[0.95rem] leading-[1.5] text-lw-text-dim">{point.body}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default SafetySection;

