import { Link } from 'react-router-dom';
import { cn } from '@/shared/utils/cn';
import { ROUTES } from '@/shared/constants/routes';
import { COPY, LEFT_BEATS, STEP_INDEX, toLeftBeat } from '../../heroCopyContent';
import type { HeroCopyBlock, MatchArcPhase } from '../../types';
import HeroArcStepper from './HeroArcStepper';

const focusRing =
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-lw-teal-2';

type Props = {
  phase: MatchArcPhase;
};

const renderLine2 = (copy: HeroCopyBlock) => {
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
      <HeroArcStepper activeIndex={activeIndex} isSpark={isSpark} />

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
      <h3
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
      </h3>

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
          to={ROUTES.whisper}
          className={cn(
            'lw-sheen group inline-flex min-w-[12.5rem] items-center justify-center gap-2.5 rounded-full border border-white-pure/20 px-[26px] py-[15px]',
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

