import { useEffect, useState, type CSSProperties } from 'react';
import { useScrollReveal } from '@/hooks/landing/useScrollReveal';
import { cn } from '@/utils/cn';

type SafetyBeat = 0 | 1 | 2;

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

const SHARDS = [
  { dx: '36px', dy: '-42px', delay: '0ms', size: 'size-2', color: 'bg-lw-violet-2' },
  { dx: '48px', dy: '-8px', delay: '120ms', size: 'size-1.5', color: 'bg-lw-teal' },
  { dx: '28px', dy: '34px', delay: '240ms', size: 'size-2.5', color: 'bg-lw-spark' },
  { dx: '-32px', dy: '40px', delay: '80ms', size: 'size-1.5', color: 'bg-lw-violet' },
  { dx: '-46px', dy: '-18px', delay: '200ms', size: 'size-2', color: 'bg-lw-teal-2' },
  { dx: '8px', dy: '-52px', delay: '160ms', size: 'size-1', color: 'bg-white-pure/70' },
] as const;

const BEAT_META = [
  {
    kicker: '01 · before you enter',
    title: 'Age gate first.',
    caption: 'Confirm you’re 18+. No queue until you do.',
  },
  {
    kicker: '02 · inside the chat',
    title: 'Exits always on.',
    caption: 'Report, block, or safe-exit — partner never gets a goodbye note.',
  },
  {
    kicker: '03 · when it ends',
    title: 'Skip = gone forever.',
    caption: 'No history. No re-find. Mutual spark is the only way they stay.',
  },
] as const;

/** Beat 0 — age gate */
const SceneAgeGate = () => (
  <div className="flex flex-1 flex-col items-center justify-center gap-5 px-2 text-center">
    <div className="relative grid size-[7.5rem] place-items-center">
      <span
        className="absolute inset-0 rounded-full border border-dashed border-lw-violet-2/40 motion-safe:animate-lw-radar"
        aria-hidden
      />
      <span
        className="absolute inset-[-14%] rounded-full border border-lw-violet/25 motion-safe:animate-lw-ripple"
        aria-hidden
      />
      <span className="relative grid size-[4.75rem] place-items-center rounded-[22px] border border-lw-violet-2/50 bg-lw-violet/20 font-lw-display text-[1.85rem] tracking-tight text-lw-violet-2 shadow-[0_0_32px_-8px_rgba(139,107,255,0.8)]">
        18+
      </span>
    </div>
    <div className="w-full max-w-[15rem] space-y-2">
      <div className="rounded-xl border border-lw-line bg-white-pure/[0.04] px-3 py-2.5 text-left">
        <p className="font-lw-mono text-[0.58rem] uppercase tracking-[0.14em] text-lw-text-faint">
          confirm to continue
        </p>
        <p className="mt-1 text-[0.92rem] text-lw-text">I am 18 or older</p>
      </div>
      <div className="rounded-xl border border-lw-violet/40 bg-[linear-gradient(135deg,rgba(139,107,255,0.35),rgba(90,63,214,0.25))] px-3 py-2.5 font-semibold text-lw-text shadow-[0_10px_28px_-12px_rgba(90,63,214,0.7)]">
        Enter the queue →
      </div>
    </div>
  </div>
);

/** Beat 1 — report / block / safe exit in a live chat */
const SceneInChat = () => (
  <div className="flex flex-1 flex-col justify-center gap-3">
    <div className="mr-auto max-w-[82%] rounded-2xl rounded-bl-md border border-lw-violet/30 bg-lw-violet/15 px-3.5 py-2.5 text-[0.88rem] leading-snug text-lw-text">
      hey, random but… moon or sun person?
    </div>
    <div className="ml-auto max-w-[82%] rounded-2xl rounded-br-md border border-border bg-primary/85 px-3.5 py-2.5 text-[0.88rem] leading-snug text-body">
      moon. also please don’t be weird
    </div>

    <div className="mt-2 grid grid-cols-3 gap-1.5">
      {[
        { label: 'Report', hint: 'we see it', tone: 'text-lw-teal-2 border-lw-teal/35 bg-lw-teal/10' },
        { label: 'Block', hint: 'cut wave', tone: 'text-lw-violet-2 border-lw-violet/35 bg-lw-violet/10' },
        { label: 'Safe exit', hint: 'instant', tone: 'text-lw-spark border-lw-spark/35 bg-lw-spark/10' },
      ].map((action) => (
        <div
          key={action.label}
          className={cn(
            'rounded-xl border px-2 py-2 text-center motion-safe:animate-lw-pop',
            action.tone,
          )}
        >
          <p className="font-lw-mono text-[0.68rem] font-semibold uppercase tracking-[0.08em]">
            {action.label}
          </p>
          <p className="mt-0.5 text-[0.62rem] text-lw-text-faint">{action.hint}</p>
        </div>
      ))}
    </div>
    <p className="text-center font-lw-mono text-[0.58rem] uppercase tracking-[0.14em] text-lw-text-faint">
      partner never sees that you left
    </p>
  </div>
);

/** Beat 2 — fork: skip dissolves, mutual keeps */
const SceneOutcome = ({ active }: { active: boolean }) => (
  <div className="flex flex-1 flex-col justify-center gap-4">
    <div className="grid grid-cols-2 gap-2">
      {/* Skip path */}
      <div className="relative overflow-hidden rounded-2xl border border-white-pure/10 bg-white-pure/[0.03] p-3">
        <p className="font-lw-mono text-[0.58rem] uppercase tracking-[0.14em] text-lw-text-faint">
          you skip
        </p>
        <div className="relative mt-3 flex justify-center">
          <span
            className={cn(
              'grid size-11 place-items-center rounded-xl border border-dashed border-white-pure/25 font-lw-mono text-sm text-lw-text-faint',
              active && 'motion-safe:animate-lw-vanish-loop',
            )}
          >
            ?
          </span>
          {active &&
            SHARDS.slice(0, 5).map((shard, i) => (
              <span
                key={i}
                aria-hidden
                className={cn(
                  'pointer-events-none absolute top-2 rounded-full motion-safe:animate-lw-shard motion-reduce:hidden',
                  shard.size,
                  shard.color,
                )}
                style={
                  {
                    '--dx': shard.dx,
                    '--dy': shard.dy,
                    animationDelay: shard.delay,
                  } as CSSProperties
                }
              />
            ))}
        </div>
        <p className="mt-3 font-lw-display text-[1.05rem] tracking-[-0.02em] text-lw-text">
          Gone.
        </p>
        <p className="mt-0.5 text-[0.72rem] leading-snug text-lw-text-dim">No trail. No re-find.</p>
      </div>

      {/* Mutual path */}
      <div className="relative overflow-hidden rounded-2xl border border-lw-spark/35 bg-lw-spark/10 p-3">
        <p className="font-lw-mono text-[0.58rem] uppercase tracking-[0.14em] text-lw-spark">
          mutual vibe
        </p>
        <div className="mt-3 flex items-center justify-center gap-1.5">
          <span className="grid size-9 place-items-center rounded-lg border border-lw-violet-2/40 bg-lw-violet/20 font-lw-mono text-[0.65rem] text-lw-violet-2">
            you
          </span>
          <span className="text-lw-spark">✦</span>
          <span className="grid size-9 place-items-center rounded-lg border border-lw-spark/40 bg-lw-spark/15 font-lw-mono text-[0.65rem] text-lw-spark">
            them
          </span>
        </div>
        <p className="mt-3 font-lw-display text-[1.05rem] tracking-[-0.02em] text-lw-text">
          Keep DM.
        </p>
        <p className="mt-0.5 text-[0.72rem] leading-snug text-lw-text-dim">Only if both spark.</p>
      </div>
    </div>
    <p className="text-center font-lw-mono text-[0.58rem] uppercase tracking-[0.14em] text-lw-text-faint">
      ephemeral by default · permanent by choice
    </p>
  </div>
);

/**
 * Floating glass that plays the full safety loop:
 * age gate → report/block/exit → skip dissolve vs mutual keep.
 */
const SafetyStage = ({ active, beat }: { active: boolean; beat: SafetyBeat }) => {
  const meta = BEAT_META[beat];

  return (
    <div className="relative mx-auto w-full max-w-[380px] min-[900px]:mx-0 min-[900px]:max-w-none">
      <div
        className="pointer-events-none absolute inset-x-[12%] -bottom-4 h-16 rounded-[100%] bg-[radial-gradient(ellipse,rgba(139,107,255,0.45),transparent_70%)] blur-xl"
        aria-hidden
      />

      <div
        className={cn(
          'lw-glass lw-rim relative flex min-h-[460px] w-full flex-col overflow-hidden rounded-[30px]',
          '[transform:perspective(1200px)_rotateY(8deg)_rotateX(3deg)]',
          'shadow-[0_40px_80px_-28px_rgba(6,3,16,0.95),0_0_0_1px_rgba(255,255,255,0.06)]',
          'max-[900px]:min-h-[420px] max-[900px]:[transform:none]',
          active && 'motion-safe:animate-lw-float',
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[#07050f]" aria-hidden />
        <div
          className="pointer-events-none absolute inset-[-45%] opacity-50 mix-blend-screen blur-[30px] bg-[conic-gradient(from_210deg_at_50%_45%,rgba(139,107,255,0.55),transparent_28%,rgba(53,224,200,0.4),transparent_58%,rgba(1,195,109,0.35),transparent_78%)] motion-safe:animate-lw-refract"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,transparent_18%,rgba(7,5,15,0.78)_78%)]" aria-hidden />

        <div className="relative z-[2] flex flex-1 flex-col px-5 pb-5 pt-5">
          {/* Beat stepper */}
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-white-pure/[0.07] pb-3">
            <p className="font-lw-mono text-[0.62rem] uppercase tracking-[0.18em] text-lw-teal-2">
              {meta.kicker}
            </p>
            <div className="flex items-center gap-1.5" aria-hidden>
              {([0, 1, 2] as const).map((i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1 rounded-full transition-all duration-500',
                    i === beat ? 'w-5 bg-lw-teal' : i < beat ? 'w-2.5 bg-lw-violet-2/70' : 'w-2.5 bg-white-pure/15',
                  )}
                />
              ))}
            </div>
          </div>

          {/* Scenes stacked in one box to avoid layout jump */}
          <div className="relative grid min-h-[280px] flex-1">
            <div
              className={cn(
                'col-start-1 row-start-1 flex transition-opacity duration-500',
                beat === 0 ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
              aria-hidden={beat !== 0}
            >
              <SceneAgeGate />
            </div>
            <div
              className={cn(
                'col-start-1 row-start-1 flex transition-opacity duration-500',
                beat === 1 ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
              aria-hidden={beat !== 1}
            >
              <SceneInChat />
            </div>
            <div
              className={cn(
                'col-start-1 row-start-1 flex transition-opacity duration-500',
                beat === 2 ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
              aria-hidden={beat !== 2}
            >
              <SceneOutcome active={active && beat === 2} />
            </div>
          </div>

          <div className="mt-4 border-t border-white-pure/[0.07] pt-4 text-center">
            <p className="font-lw-display text-[1.2rem] tracking-[-0.02em] text-lw-text">{meta.title}</p>
            <p className="mt-1 text-[0.86rem] leading-snug text-lw-text-dim">{meta.caption}</p>
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.12)_0%,transparent_28%,transparent_72%,rgba(53,224,200,0.07)_100%)]"
          aria-hidden
        />
      </div>
    </div>
  );
};

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
  const [beat, setBeat] = useState<SafetyBeat>(0);

  useEffect(() => {
    if (!isVisible) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setBeat(2);
      return;
    }
    const id = window.setInterval(() => {
      setBeat((prev) => ((prev + 1) % 3) as SafetyBeat);
    }, BEAT_MS);
    return () => window.clearInterval(id);
  }, [isVisible]);

  return (
    <section
      ref={ref}
      id="safety"
      aria-label="Safety"
      className="relative isolate overflow-hidden bg-background px-[clamp(16px,4vw,40px)] py-[clamp(80px,14vh,140px)] font-lw-body text-lw-text"
    >
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute left-[4%] top-[22%] size-[min(70vw,540px)] rounded-full opacity-75 mix-blend-screen blur-[70px] bg-[radial-gradient(circle,rgba(139,107,255,0.45),transparent_62%)]" />
        <div className="absolute bottom-[8%] right-[10%] size-[min(55vw,400px)] rounded-full opacity-50 mix-blend-screen blur-[80px] bg-[radial-gradient(circle,rgba(53,224,200,0.3),transparent_66%)]" />
        <div className="absolute left-1/2 top-0 h-px w-[min(80%,42rem)] -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgba(182,164,255,0.5),rgba(53,224,200,0.4),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_40%_40%,transparent_48%,rgba(13,9,18,0.7)_100%)]" />
      </div>
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
