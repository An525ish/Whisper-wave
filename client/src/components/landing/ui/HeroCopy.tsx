import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

/** Shared focus ring for links in the hero copy. */
const focusRing =
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-lw-teal-2';

/**
 * The hero's left-hand column: eyebrow, frost-in headline, supporting copy,
 * primary CTA, and a live-presence indicator. Entrance animations are gated
 * behind `motion-safe`, so with reduced motion everything is simply present.
 */
const HeroCopy = () => (
  <div className="max-w-[33rem] max-[900px]:mx-auto max-[900px]:max-w-[34rem] max-[900px]:text-center">
    <span className="mb-[26px] inline-flex items-center gap-2.5 font-lw-mono text-[0.72rem] uppercase tracking-[0.26em] text-lw-teal-2 opacity-90 before:h-px before:w-[26px] before:bg-[linear-gradient(90deg,var(--color-lw-teal),transparent)] before:content-[''] max-[900px]:justify-center">
      anonymous by default
    </span>

    <h1 className="mb-[26px] font-lw-display text-[clamp(2.7rem,6.2vw,4.7rem)] font-normal leading-[1.06] tracking-[-0.022em] text-lw-text max-[520px]:text-[clamp(2.3rem,11vw,3rem)]">
      <span className="block overflow-hidden pb-[0.1em]">
        <span className="block motion-safe:animate-lw-frostin" style={{ animationDelay: '50ms' }}>
          Talk like
        </span>
      </span>
      <span className="block overflow-hidden pb-[0.1em]">
        <span className="block motion-safe:animate-lw-frostin" style={{ animationDelay: '180ms' }}>
          no one's <em className="lw-iri font-medium italic">watching.</em>
        </span>
      </span>
    </h1>

    <p
      className="mb-[34px] max-w-[30rem] text-[clamp(1.02rem,1.5vw,1.19rem)] leading-[1.62] text-lw-text-dim motion-safe:animate-lw-fade max-[900px]:mx-auto"
      style={{ animationDelay: '500ms' }}
    >
      Pick a vibe name and drop into a live chat with a total stranger. No profile, no history, no
      feed. If you both feel it, you <b className="font-semibold text-lw-text">connect</b> — if not,
      they're gone for good.
    </p>

    <div
      className="flex flex-wrap items-center gap-x-[22px] gap-y-4 motion-safe:animate-lw-fade max-[900px]:justify-center"
      style={{ animationDelay: '620ms' }}
    >
      <Link
        to="/auth"
        className={cn(
          'lw-sheen group inline-flex items-center gap-2.5 rounded-[15px] border border-white-pure/20 px-[26px] py-[15px]',
          'text-[1.02rem] font-semibold text-white-pure no-underline',
          'bg-[linear-gradient(135deg,var(--color-lw-violet)_0%,var(--color-lw-violet-deep)_55%,var(--color-lw-teal-deep)_130%)]',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_14px_34px_-12px_rgba(90,63,214,0.85),0_2px_8px_-2px_rgba(0,0,0,0.5)]',
          'transition-[translate,box-shadow] duration-[280ms] ease-[cubic-bezier(0.2,0.7,0.2,1)]',
          'hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_20px_44px_-12px_rgba(90,63,214,1),0_3px_10px_-2px_rgba(0,0,0,0.5)]',
          focusRing,
        )}
      >
        Find a stranger
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
      </Link>
      <p className="font-lw-mono text-[0.72rem] tracking-[0.04em] text-lw-text-faint">
        no sign-up to start · leave anytime
      </p>
    </div>

    <div
      className="mt-[34px] inline-flex items-center gap-2.5 rounded-full border border-lw-line bg-white-pure/[0.04] py-2 pl-3 pr-4 font-lw-mono text-[0.78rem] tracking-[0.03em] text-lw-text-dim backdrop-blur-[6px] motion-safe:animate-lw-fade"
      style={{ animationDelay: '740ms' }}
    >
      <span className="relative size-2 rounded-full bg-lw-teal shadow-[0_0_10px_var(--color-lw-teal)]">
        <span className="absolute inset-0 rounded-full bg-lw-teal animate-lw-ping motion-reduce:animate-none" />
      </span>
      <span>
        <b className="font-bold text-lw-text">2,318</b> strangers online right now
      </span>
    </div>
  </div>
);

export default HeroCopy;
