import { Link, useLocation, useNavigate } from 'react-router-dom';

// Explore points at landing section ids. `href` is kept only as a no-JS
// fallback; clicks are intercepted so the URL stays clean (no #hash) — we
// smooth-scroll on the landing, or navigate home carrying the target in
// router state when clicked from another page.
const EXPLORE_LINKS = [
  { id: 'how', label: 'How it works' },
  { id: 'why', label: 'Why Whisper Wave' },
  { id: 'safety', label: 'Safety' },
] as const;

const LEGAL_LINKS = [
  { id: 'terms', label: 'Terms', to: '/terms' },
  { id: 'privacy', label: 'Privacy', to: '/privacy' },
  { id: 'report', label: 'Report abuse', to: '/report' },
] as const;

const LandingFooter = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const goToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // navigate home; Landing reads state.scrollTo and scrolls after mount
      navigate('/', { state: { scrollTo: id } });
    }
  };

  return (
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
              <a
                key={link.id}
                href={`/#${link.id}`}
                onClick={(e) => goToSection(e, link.id)}
                className="landing-footer__link"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <nav className="landing-footer__group" aria-label="Legal">
            <span className="landing-footer__grouptitle">Legal</span>
            {LEGAL_LINKS.map((link) => (
              <Link key={link.id} to={link.to} className="landing-footer__link">
                {link.label}
              </Link>
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
};

export default LandingFooter;
