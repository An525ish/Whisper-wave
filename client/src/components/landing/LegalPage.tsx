import { useEffect, type ReactNode } from 'react';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';

/**
 * Shared shell for the static legal pages (Terms, Privacy, Report abuse). Keeps
 * the landing identity — nav + deep-plum base + Fraunces title — with a single
 * readable prose column. Body content is plain semantic HTML styled by the
 * `.lw-legal` block in landing.css.
 */

type Props = { title: string; updated?: string; intro?: string; children: ReactNode };

const LegalPage = ({ title, updated, intro, children }: Props) => {
  // SPA navigation keeps the old scroll position (footer is at the bottom), so
  // land at the top when a legal page mounts.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
  <div className="landing-page">
    <LandingNav />
    <main className="relative isolate min-h-screen bg-lw-base px-[clamp(16px,5vw,40px)] pb-[clamp(64px,10vh,120px)] pt-[clamp(96px,14vh,150px)] font-lw-body text-lw-text">
      <article className="mx-auto max-w-[720px]">
        <p className="font-lw-mono text-[0.72rem] uppercase tracking-[0.2em] text-lw-text-faint">Whisper Wave</p>
        <h1 className="mt-3 font-lw-display text-[clamp(2.1rem,5vw,3.1rem)] font-normal leading-[1.05] tracking-[-0.02em] text-lw-text">
          {title}
        </h1>
        {updated && <p className="mt-3 font-lw-mono text-[0.72rem] tracking-[0.04em] text-lw-text-faint">Last updated {updated}</p>}
        {intro && <p className="mt-6 text-[1.05rem] leading-[1.7] text-lw-text-dim">{intro}</p>}

        <div className="lw-legal mt-10 flex flex-col gap-9 text-lw-text-dim">{children}</div>
      </article>
    </main>
    <LandingFooter />
  </div>
  );
};

export default LegalPage;
