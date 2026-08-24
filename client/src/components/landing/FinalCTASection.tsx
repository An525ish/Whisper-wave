import { Link } from 'react-router-dom';
import { useScrollReveal } from '@/hooks/landing/useScrollReveal';

const FinalCTASection = () => {
  const { ref, isVisible } = useScrollReveal<HTMLElement>(0.25);

  return (
    <section
      ref={ref}
      className={`final-cta${isVisible ? ' final-cta--visible' : ''}`}
      aria-label="Get started"
    >
      <div className="final-cta__ambience" aria-hidden>
        <div className="final-cta__orb" />
      </div>

      <div className="final-cta__inner">
        <p className="final-cta__eyebrow">the last wave</p>
        <h2 className="final-cta__title font-display">
          Ready to{' '}
          <span className="final-cta__accent">disappear</span>?
        </h2>
        <p className="final-cta__sub">
          Pick a vibe name. Find someone. If it&apos;s a vibe — keep them.
        </p>

        <Link to="/auth" className="final-cta__button">
          <span>Find Someone</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 12H19M12 5L19 12L12 19"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>

      <div className="final-cta__waves" aria-hidden>
        <svg viewBox="0 0 1440 180" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <g className="final-cta__wave final-cta__wave--a">
            <path
              d="M-80 92 C120 42 280 142 480 92 C680 42 860 142 1080 92 C1240 62 1360 92 1520 78 L1520 180 L-80 180 Z"
              fill="rgba(42,33,54,0.9)"
            />
          </g>
          <g className="final-cta__wave final-cta__wave--b">
            <path
              d="M-80 110 C140 70 320 150 520 110 C720 70 900 150 1120 114 C1280 92 1400 114 1560 108 L1560 180 L-80 180 Z"
              fill="rgba(1,195,109,0.16)"
            />
          </g>
          <g className="final-cta__wave final-cta__wave--c">
            <path
              d="M-80 132 C160 108 340 158 560 132 C780 106 980 158 1200 136 C1340 122 1460 136 1600 130 L1600 180 L-80 180 Z"
              fill="rgba(1,195,109,0.28)"
            />
          </g>
        </svg>
      </div>
    </section>
  );
};

export default FinalCTASection;
