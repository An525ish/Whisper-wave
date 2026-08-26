import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

const NAV_LINKS = [
  { label: 'how it works', href: '#how' },
  { label: 'spark pass', href: '#spark' },
] as const;

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
        'px-[clamp(16px,4vw,40px)] transition-[background-color,backdrop-filter,border-color,padding] duration-[400ms] ease-out',
        scrolled
          ? 'border-lw-line-soft bg-background/80 py-3 backdrop-blur-[18px] backdrop-saturate-[1.4]'
          : 'border-transparent py-4',
      )}
    >
      <div className="flex w-full max-w-[1200px] items-center justify-between gap-6">
        <Link to="/" aria-label="Whisper Wave home" className={cn('flex items-center gap-[11px] rounded-lg', focusRing)}>
          <span
            className="grid size-[30px] place-items-center drop-shadow-[0_2px_10px_rgba(139,107,255,0.5)]"
            aria-hidden
          >
            <img src="/logo-4.png" alt="" className="block size-full object-contain" />
          </span>
          <span className="text-[1.12rem] font-semibold leading-none tracking-[-0.01em]">
            <span className="text-lw-text">Whisper</span>
            <span className="lw-iri">Wave</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-[10px] px-[14px] py-2 text-[0.9rem] text-lw-text-dim no-underline transition-colors',
                'hover:bg-white-pure/5 hover:text-lw-text max-[900px]:hidden',
                focusRing,
              )}
            >
              {link.label}
            </a>
          ))}

          <Link
            to="/auth"
            className={cn(
              'lw-sheen inline-flex items-center gap-[7px] rounded-xl border border-white-pure/[0.16] px-[18px] py-[9px]',
              'text-[0.9rem] font-semibold text-lw-text no-underline backdrop-blur-[8px]',
              'bg-[linear-gradient(160deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))]',
              'shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_6px_18px_-8px_rgba(90,63,214,0.6)]',
              'transition-[translate,box-shadow,border-color] duration-[250ms]',
              'hover:-translate-y-px hover:border-lw-violet-2/50 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_10px_26px_-8px_rgba(90,63,214,0.8)]',
              focusRing,
            )}
          >
            Enter
            <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-[13px]">
              <path
                d="M5 12H19M12 5L19 12L12 19"
                stroke="currentColor"
                strokeWidth="2"
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
