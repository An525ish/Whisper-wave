import { Link } from 'react-router-dom';

const FOOTER_LINKS = [
  { id: 'terms', label: 'Terms', href: '#terms' },
  { id: 'privacy', label: 'Privacy', href: '#privacy' },
  { id: 'report', label: 'Report abuse', href: '#report' },
] as const;

const LandingFooter = () => (
  <footer className="landing-footer">
    <div className="landing-footer__inner">
      <Link to="/" className="landing-footer__brand" aria-label="Whisper Wave home">
        <span className="landing-footer__glyph" aria-hidden>
          <img src="/logo-4.png" alt="" />
        </span>
        <span className="landing-footer__wordmark font-display">
          <span className="landing-nav__w-rest">hisper</span>
          <span className="landing-nav__w-wave">Wave</span>
        </span>
      </Link>

      <p className="landing-footer__tagline">Anon chat for the real ones.</p>

      <nav className="landing-footer__links" aria-label="Legal">
        {FOOTER_LINKS.map((link) => (
          <a key={link.id} href={link.href} className="landing-footer__link">
            {link.label}
          </a>
        ))}
      </nav>

      <p className="landing-footer__copy">© 2026 Whisper Wave</p>
    </div>
  </footer>
);

export default LandingFooter;
