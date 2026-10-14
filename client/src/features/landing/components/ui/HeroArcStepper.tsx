import { cn } from '@/shared/utils/cn';

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

type Props = {
  activeIndex: number;
  isSpark: boolean;
};

/** Arc stepper — icons + straight SVG dotted gaps. */
const HeroArcStepper = ({ activeIndex, isSpark }: Props) => {
  return (
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
  );
};

export default HeroArcStepper;
