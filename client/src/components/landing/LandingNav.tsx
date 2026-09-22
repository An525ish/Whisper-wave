import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

/** Shared focus ring for the nav's interactive elements. */
const focusRing =
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-lw-teal-2';

const LandingNav = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        'fixed inset-x-0 top-0 z-50 flex justify-center border-b font-lw-body',
        'px-[clamp(16px,4vw,40px)] transition-[background-color,backdrop-filter,border-color,padding,box-shadow] duration-[400ms] ease-out',
        scrolled
          ? 'border-lw-line-soft bg-lw-base/80 py-[10px] shadow-[0_16px_40px_-24px_rgba(0,0,0,0.9)] backdrop-blur-[18px] backdrop-saturate-[1.4]'
          : 'border-transparent py-[16px]',
      )}
    >
      <div className="flex w-full max-w-[1200px] items-center justify-between gap-4">
        {/* Wordmark */}
        <Link
          to="/"
          aria-label="Whisper Wave home"
          className={cn('inline-flex shrink-0 items-center rounded-lg font-display leading-none', focusRing)}
        >
          <span className="inline-flex items-center gap-[0.22em] text-[clamp(1.45rem,2.1vw,1.75rem)]" aria-hidden>
            <span className="relative inline-flex size-[1.38em] shrink-0 translate-y-[0.03em] overflow-hidden rounded-[0.24em]">
              <img src="/logo-4.png" alt="" className="block size-full object-cover" />
            </span>
            <span className="inline-flex items-baseline tracking-[-0.03em]">
              <span className="font-normal text-[rgba(235,236,236,0.78)]">hisper</span>
              <span className="bg-[linear-gradient(100deg,#01c36d_0%,#7dffb8_42%,#ebecec_100%)] bg-clip-text text-[1.06em] font-medium text-transparent">
                Wave
              </span>
            </span>
          </span>
        </Link>

        {/* Right CTAs */}
        <div className="flex shrink-0 items-center gap-2.5">
          {/* Ghost — Log in */}
          <Link
            to="/auth?mode=login"
            className={cn(
              'inline-flex items-center rounded-full border border-white-pure/[0.12] px-[17px] py-[8px]',
              'text-[0.88rem] font-medium text-lw-text-dim no-underline',
              'bg-white-pure/[0.04] backdrop-blur-[8px]',
              'transition-[border-color,color,background] duration-200',
              'hover:border-lw-teal/40 hover:bg-white-pure/[0.07] hover:text-lw-text',
              'max-[400px]:hidden',
              focusRing,
            )}
          >
            Log in
          </Link>

          {/* Solid — Find a stranger */}
          <Link
            to="/auth"
            className={cn(
              'lw-sheen group inline-flex items-center gap-[7px] rounded-full border border-white-pure/[0.16] px-[18px] py-[8px]',
              'text-[0.88rem] font-semibold text-white-pure no-underline',
              'bg-[linear-gradient(135deg,var(--color-lw-violet)_0%,var(--color-lw-violet-deep)_58%,var(--color-lw-teal-deep)_140%)]',
              'shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_20px_-8px_rgba(90,63,214,0.75)]',
              'transition-[translate,box-shadow] duration-[250ms]',
              'hover:-translate-y-px hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_12px_28px_-8px_rgba(90,63,214,0.9)]',
              focusRing,
            )}
          >
            Find a stranger
            <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-[12px] transition-transform duration-[250ms] group-hover:translate-x-[2px]">
              <path
                d="M5 12H19M12 5L19 12L12 19"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default LandingNav;
