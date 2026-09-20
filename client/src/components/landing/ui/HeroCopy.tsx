import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import type { MatchArcPhase } from '@/types/landing';

const focusRing =
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-lw-teal-2';

/** Left column follows three beats — matched keeps searching. */
type LeftBeat = 'searching' | 'chatting' | 'spark';

const LEFT_BEATS: LeftBeat[] = ['searching', 'chatting', 'spark'];

function SearchRadarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
      <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.4" opacity="0.85" />
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeDasharray="2.5 3.5"
        opacity="0.55"
      />
      <path
        d="M12 3v2.2M21 12h-2.2M12 21v-2.2M3 12h2.2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

function WhisperIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M5.5 7.5h8.2c1.4 0 2.5 1.1 2.5 2.5v3.2c0 1.4-1.1 2.5-2.5 2.5H11l-3.2 2.4V15.7H5.5C4.1 15.7 3 14.6 3 13.2V10c0-1.4 1.1-2.5 2.5-2.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M14.2 5.2h4.3C19.8 5.2 21 6.4 21 7.9v2.6c0 1.5-1.2 2.7-2.5 2.7h-.7v1.8l-2.2-1.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <path
        d="M7.2 10.4h5.2M7.2 12.8h3.4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M12 3.2 13.4 9.2 19.5 10.5 13.4 11.8 12 17.8 10.6 11.8 4.5 10.5 10.6 9.2 12 3.2Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path
        d="M18.2 4.8v2.6M19.5 6.1h-2.6M6.2 16.2v2.2M7.3 17.3H5.1"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}

const ARC_STEPS = [
  { id: 'searching' as const, label: 'search', Icon: SearchRadarIcon },
  { id: 'chatting' as const, label: 'chat', Icon: WhisperIcon },
  { id: 'spark' as const, label: 'vibe', Icon: SparkIcon },
];

const STEP_INDEX: Record<LeftBeat, number> = {
  searching: 0,
  chatting: 1,
  spark: 2,
};

/**
 * Straight dotted trail between icon nodes (SVG dash dots).
 * Two gap-only segments so circles stay clear.
 */
const ArcDottedPath = ({ progress }: { progress: number }) => {
  const segments = [
    {
      id: 'a',
      // After search circle → before chat circle
      className: 'left-[calc(16.666%+28px)] right-[calc(50%+28px)]',
      lit: progress >= 1,
    },
    {
      id: 'b',
      // After chat circle → before vibe circle
      className: 'left-[calc(50%+28px)] right-[calc(16.666%+28px)]',
      lit: progress >= 2,
    },
  ];

  return (
    <>
      {segments.map((seg) => (
        <span
          key={seg.id}
          aria-hidden
          className={cn('pointer-events-none absolute top-[21px] z-0 h-[2px]', seg.className)}
        >
          <svg className="h-full w-full overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`arcTrail-${seg.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(139,107,255,0.95)" />
                <stop offset="100%" stopColor="rgba(53,224,200,1)" />
              </linearGradient>
            </defs>
            <line
              x1="0"
              y1="1"
              x2="100%"
              y2="1"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeDasharray="1.6 6.5"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="0"
              y1="1"
              x2="100%"
              y2="1"
              stroke={`url(#arcTrail-${seg.id})`}
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeDasharray="1.6 6.5"
              vectorEffect="non-scaling-stroke"
              className="transition-opacity duration-500"
              opacity={seg.lit ? 1 : 0}
            />
          </svg>
        </span>
      ))}
    </>
  );
};

const toLeftBeat = (phase: MatchArcPhase): LeftBeat => {
  if (phase === 'spark') return 'spark';
  if (phase === 'chatting') return 'chatting';
  return 'searching';
};

type CopyBlock = {
  kicker: string;
  line1: string;
  line2: string;
  accent?: string;
  body: [string, string, string];
  cta: string;
};

/**
 * Two-line titles + three-line subs, length-matched across beats
 * so the column fills the same way in every state.
 */
const COPY: Record<LeftBeat, CopyBlock> = {
  searching: {
    kicker: 'anonymous queue',
    line1: 'Meet a stranger.',
    line2: 'Ditch the résumé.',
    accent: 'résumé.',
    body: [
      'No bio. No algo. No main-character bit.',
      'Pick a vibe name, drop in cold,',
      'talk to whoever shows up next.',
    ],
    cta: 'Find a stranger',
  },
  chatting: {
    kicker: 'live whisper',
    line1: 'Say the weird bit.',
    line2: 'Skip if it’s mid.',
    accent: 'mid.',
    body: [
      'No receipts. No feed. No “u up?” lore.',
      'Vibe if it’s clicking. Skip if not.',
      'That person can vanish forever.',
    ],
    cta: 'Find a stranger',
  },
  spark: {
    kicker: 'mutual vibe',
    line1: 'Okay... it’s mutual.',
    line2: 'Don’t ghost now.',
    accent: 'ghost',
    body: [
      'Anonymous just became a real person.',
      'Connect if you want to keep the DM,',
      'or wave bye and rewrite history.',
    ],
    cta: 'Keep this vibe',
  },
};

type Props = {
  phase: MatchArcPhase;
};

const renderLine2 = (copy: CopyBlock) => {
  if (!copy.accent || !copy.line2.includes(copy.accent)) {
    return copy.line2;
  }
  const [before, after = ''] = copy.line2.split(copy.accent);
  return (
    <>
      {before}
      <em className="lw-iri font-medium italic">{copy.accent}</em>
      {after}
    </>
  );
};

/**
 * Left hero column — arc stepper + phase copy.
 * Titles/subs are stacked so all three beats fill the same box.
 */
const HeroCopy = ({ phase }: Props) => {
  const leftBeat = toLeftBeat(phase);
  const activeIndex = STEP_INDEX[leftBeat];
  const isSpark = leftBeat === 'spark';

  return (
    <div className="flex w-full max-w-[38rem] flex-col max-[900px]:mx-auto max-[900px]:items-center max-[900px]:text-center">
      {/* Arc stepper — icons + straight SVG dotted gaps */}
      <div className="relative mb-9 w-full max-w-[28rem] max-[900px]:mx-auto">
        <ArcDottedPath progress={activeIndex} />
        <ol className="relative z-[1] grid grid-cols-3" aria-label="Match arc progress">
          {ARC_STEPS.map((step, i) => {
            const done = i < activeIndex;
            const current = i === activeIndex;
            const { Icon } = step;

            return (
              <li key={step.id} className="relative flex flex-col items-center gap-2.5">
                <span
                  className={cn(
                    'relative grid size-11 place-items-center rounded-full transition-[background,border-color,box-shadow,color,transform] duration-500',
                    'border border-dashed',
                    current &&
                      (isSpark
                        ? 'scale-110 border-lw-spark/80 bg-lw-spark/15 text-lw-spark shadow-[0_0_22px_-4px_var(--lw-spark-glow)]'
                        : 'scale-110 border-lw-teal/75 bg-lw-teal/15 text-lw-teal-2 shadow-[0_0_22px_-4px_rgba(53,224,200,0.7)]'),
                    done && 'border-lw-violet-2/60 border-solid bg-lw-violet/20 text-lw-violet-2',
                    !done && !current && 'border-white-pure/20 bg-[#0c0914] text-lw-text-faint',
                  )}
                >
                  {current && (
                    <span
                      aria-hidden
                      className={cn(
                        'pointer-events-none absolute inset-[-5px] rounded-full border border-dashed opacity-70 motion-safe:animate-lw-ripple',
                        isSpark ? 'border-lw-spark/40' : 'border-lw-teal/40',
                      )}
                    />
                  )}
                  <Icon className="relative size-[22px]" />
                </span>
                <span
                  className={cn(
                    'font-lw-mono text-[0.64rem] uppercase tracking-[0.18em] transition-colors duration-300',
                    current ? 'text-lw-text' : 'text-lw-text-faint',
                  )}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Kicker */}
      <div className="relative mb-4 grid w-full">
        {LEFT_BEATS.map((beat) => {
          const active = beat === leftBeat;
          return (
            <p
              key={`kicker-${beat}`}
              className={cn(
                'col-start-1 row-start-1 font-lw-mono text-[0.75rem] uppercase tracking-[0.26em] text-lw-teal-2',
                'transition-opacity duration-400 ease-out',
                active ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
              aria-hidden={!active}
            >
              {COPY[beat].kicker}
            </p>
          );
        })}
      </div>

      {/* Headline — two lines, sized to fill the column */}
      <h1
        className="relative mb-6 grid w-full font-lw-display text-[clamp(2.65rem,5.2vw,4.05rem)] font-normal leading-[1.06] tracking-[-0.03em] text-lw-text max-[520px]:text-[clamp(2.2rem,9vw,2.9rem)]"
        aria-live="polite"
      >
        {LEFT_BEATS.map((beat) => {
          const copy = COPY[beat];
          const active = beat === leftBeat;
          return (
            <span
              key={`title-${beat}`}
              className={cn(
                'col-start-1 row-start-1 transition-opacity duration-400 ease-out',
                active ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
              aria-hidden={!active}
            >
              <span className="block whitespace-nowrap pb-[0.06em] max-[380px]:whitespace-normal">
                {copy.line1}
              </span>
              <span className="block whitespace-nowrap pb-[0.06em] max-[380px]:whitespace-normal">
                {renderLine2(copy)}
              </span>
            </span>
          );
        })}
      </h1>

      {/* Subheader — three lines, same box every beat */}
      <div className="relative mb-9 grid w-full max-w-[34rem] max-[900px]:mx-auto">
        {LEFT_BEATS.map((beat) => {
          const active = beat === leftBeat;
          const [b1, b2, b3] = COPY[beat].body;
          return (
            <p
              key={`body-${beat}`}
              className={cn(
                'col-start-1 row-start-1 font-lw-display text-[clamp(1.12rem,1.6vw,1.28rem)] font-normal italic leading-[1.55] text-lw-text-dim',
                'transition-opacity duration-400 ease-out',
                active ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
              aria-hidden={!active}
            >
              <span className="block">{b1}</span>
              <span className="block">{b2}</span>
              <span className="block">{b3}</span>
            </p>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 max-[900px]:justify-center">
        <Link
          to="/auth"
          className={cn(
            'lw-sheen group inline-flex min-w-[12.5rem] items-center justify-center gap-2.5 rounded-[15px] border border-white-pure/20 px-[26px] py-[15px]',
            'text-[1.02rem] font-semibold text-white-pure no-underline',
            isSpark
              ? 'bg-[linear-gradient(135deg,var(--color-lw-spark)_0%,#017a4a_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_14px_34px_-12px_var(--lw-spark-glow)]'
              : 'bg-[linear-gradient(135deg,var(--color-lw-violet)_0%,var(--color-lw-violet-deep)_55%,var(--color-lw-teal-deep)_130%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_14px_34px_-12px_rgba(90,63,214,0.85)]',
            'transition-[translate,box-shadow,background] duration-[280ms] ease-[cubic-bezier(0.2,0.7,0.2,1)]',
            'hover:-translate-y-0.5',
            focusRing,
          )}
        >
          <span className="relative grid">
            {LEFT_BEATS.map((beat) => {
              const active = beat === leftBeat;
              return (
                <span
                  key={`cta-${beat}`}
                  className={cn(
                    'col-start-1 row-start-1 inline-flex items-center gap-2.5 transition-opacity duration-300',
                    active ? 'opacity-100' : 'pointer-events-none opacity-0',
                  )}
                  aria-hidden={!active}
                >
                  {COPY[beat].cta}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                    className="size-[17px] transition-[translate] duration-[280ms] group-hover:translate-x-[3px]"
                  >
                    <path
                      d="M5 12H19M12 5L19 12L12 19"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              );
            })}
          </span>
        </Link>
      </div>

      <div className="mt-8 flex w-full max-w-[22rem] flex-col items-start gap-4 max-[900px]:mx-auto max-[900px]:items-center">
        <span
          aria-hidden
          className="h-px w-full bg-[linear-gradient(90deg,transparent_0%,rgba(182,164,255,0.55)_35%,rgba(53,224,200,0.45)_65%,transparent_100%)]"
        />
        <p className="inline-flex items-center gap-2.5 font-lw-mono text-[0.72rem] tracking-[0.12em] text-lw-text-dim uppercase max-[900px]:justify-center">
          <span
            aria-hidden
            className="size-1.5 shrink-0 rounded-full bg-lw-teal shadow-[0_0_10px_rgba(53,224,200,0.65)]"
          />
          no signup needed for guests
        </p>
      </div>
    </div>
  );
};

export default HeroCopy;
