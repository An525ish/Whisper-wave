import { Link } from 'react-router-dom';

const EXPLORE_LINKS = [
  { id: 'how', label: 'How it works', href: '#how-it-works' },
  { id: 'why', label: 'Why Whisper Wave', href: '#why' },
  { id: 'safety', label: 'Safety', href: '#safety' },
] as const;

const LEGAL_LINKS = [
  { id: 'terms', label: 'Terms', href: '#terms' },
  { id: 'privacy', label: 'Privacy', href: '#privacy' },
  { id: 'report', label: 'Report abuse', href: '#report' },
] as const;

const LandingFooter = () => (
  <footer className="landing-footer">
    <div className="landing-footer__inner">
      <div className="landing-footer__top">
        {/* brand + a one-line mission for a little substance */}
        <div className="landing-footer__brandcol">
          <Link to="/" className="landing-footer__brand" aria-label="Whisper Wave home">
            <span className="landing-footer__glyph" aria-hidden>
              <img src="/logo-4.png" alt="" />
            </span>
            <span className="landing-footer__wordmark font-display">
              <span className="landing-nav__w-rest">hisper</span>
              <span className="landing-nav__w-wave">Wave</span>
            </span>
          </Link>
          <p className="landing-footer__mission">
            Anonymous, one-to-one conversations that vanish when you leave — and turn real only if you both want them to.
          </p>
        </div>

        {/* grouped links */}
        <div className="landing-footer__nav">
          <nav className="landing-footer__group" aria-label="Explore">
            <span className="landing-footer__grouptitle">Explore</span>
            {EXPLORE_LINKS.map((link) => (
              <a key={link.id} href={link.href} className="landing-footer__link">
                {link.label}
              </a>
            ))}
          </nav>

          <nav className="landing-footer__group" aria-label="Legal">
            <span className="landing-footer__grouptitle">Legal</span>
            {LEGAL_LINKS.map((link) => (
              <a key={link.id} href={link.href} className="landing-footer__link">
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className="landing-footer__base">
        <p className="landing-footer__tagline">Anon chat for the real ones.</p>
        <p className="landing-footer__copy">© 2026 Whisper Wave</p>
      </div>
    </div>
  </footer>
);

export default LandingFooter;
