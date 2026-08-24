import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const LandingNav = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`landing-nav${scrolled ? ' landing-nav--scrolled' : ''}`}>
      <div className="landing-nav__inner">
        {/* Wordmark */}
        <Link to="/" className="landing-nav__brand" aria-label="Whisper Wave home">
          <span className="landing-nav__glyph" aria-hidden>
            <img src="/logo-4.png" alt="" />
          </span>
          <span className="landing-nav__wordmark font-display">
            <span className="landing-nav__w-rest">hisper</span>
            <span className="landing-nav__w-wave">Wave</span>
          </span>
        </Link>

        {/* CTA */}
        <Link to="/auth" className="landing-nav__cta">
          Open app
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 12H19M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </nav>
  );
};

export default LandingNav;
