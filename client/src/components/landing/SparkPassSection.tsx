import { Link } from 'react-router-dom';
import { useScrollReveal } from '@/hooks/landing/useScrollReveal';

const FEATURES = [
  { id: 'gender', label: 'Gender filters', hint: 'match who you want' },
  { id: 'priority', label: 'Priority queue', hint: 'skip the wait' },
  { id: 'voice', label: 'Voice notes', hint: 'say it out loud' },
  { id: 'refind', label: 'Re-find credits', hint: 'one more chance' },
  { id: 'receipts', label: 'Read receipts', hint: 'know they saw it' },
] as const;

const SparkPassIllustration = () => (
  <svg
    viewBox="0 0 200 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="spark-pass__art"
    aria-hidden
  >
    <ellipse cx="100" cy="72" rx="78" ry="42" fill="rgba(212,170,90,0.06)" />

    {/* Ticket body */}
    <rect
      x="28"
      y="28"
      width="144"
      height="86"
      rx="12"
      fill="rgba(26,21,32,0.85)"
      stroke="rgba(212,170,90,0.35)"
      strokeWidth="1.2"
    />
    {/* Perforation */}
    <line
      x1="92"
      y1="28"
      x2="92"
      y2="114"
      stroke="rgba(212,170,90,0.18)"
      strokeWidth="1"
      strokeDasharray="3 4"
    />
    {/* Notch cuts */}
    <circle cx="92" cy="28" r="6" fill="var(--color-black-dark, #1a1520)" />
    <circle cx="92" cy="114" r="6" fill="var(--color-black-dark, #1a1520)" />

    {/* Left: spark lockup */}
    <circle
      cx="60"
      cy="62"
      r="16"
      fill="rgba(212,170,90,0.12)"
      stroke="rgba(212,170,90,0.45)"
      strokeWidth="1"
    />
    <text x="60" y="67" textAnchor="middle" fontSize="16" fill="rgba(212,170,90,0.9)">
      ✦
    </text>
    <text
      x="60"
      y="92"
      textAnchor="middle"
      fontSize="7.5"
      fill="rgba(212,170,90,0.7)"
      fontFamily="DM Sans, sans-serif"
      letterSpacing="0.12em"
    >
      PASS
    </text>

    {/* Right: vibe names + stamp */}
    <text
      x="108"
      y="52"
      fontSize="8"
      fill="rgba(235,236,236,0.35)"
      fontFamily="DM Sans, sans-serif"
    >
      midnight_fox
    </text>
    <text
      x="108"
      y="66"
      fontSize="8"
      fill="rgba(235,236,236,0.55)"
      fontFamily="DM Sans, sans-serif"
    >
      + blue_static
    </text>
    <rect
      x="108"
      y="78"
      width="52"
      height="18"
      rx="9"
      fill="rgba(212,170,90,0.12)"
      stroke="rgba(212,170,90,0.35)"
      strokeWidth="1"
    />
    <text
      x="134"
      y="90"
      textAnchor="middle"
      fontSize="8"
      fontWeight="600"
      fill="rgba(212,170,90,0.9)"
      fontFamily="DM Sans, sans-serif"
    >
      VERIFIED
    </text>
  </svg>
);

const SparkPassSection = () => {
  const { ref, isVisible } = useScrollReveal<HTMLElement>(0.2);

  return (
    <section
      ref={ref}
      className={`spark-pass${isVisible ? ' spark-pass--visible' : ''}`}
      aria-label="Spark Pass"
    >
      <div className="spark-pass__ambience" aria-hidden>
        <div className="spark-pass__orb spark-pass__orb--a" />
        <div className="spark-pass__orb spark-pass__orb--b" />
      </div>

      <div className="spark-pass__inner">
        <div className="spark-pass__card">
          <div className="spark-pass__sheen" aria-hidden />

          <SparkPassIllustration />

          <p className="spark-pass__eyebrow">
            <span className="spark-pass__glyph">✦</span>
            Spark Pass
          </p>

          <h2 className="spark-pass__title font-display">
            For the ones who vibe harder.
          </h2>

          <p className="spark-pass__sub">
            Same anonymous match. More control when you want it — filters,
            priority, and a way back if you skipped too soon.
          </p>

          <ul className="spark-pass__pills">
            {FEATURES.map((feature) => (
              <li key={feature.id} className="spark-pass__pill">
                <span className="spark-pass__pill-label">{feature.label}</span>
                <span className="spark-pass__pill-hint">{feature.hint}</span>
              </li>
            ))}
          </ul>

          <p className="spark-pass__price">
            <span className="spark-pass__price-main">₹199</span>
            <span className="spark-pass__price-unit"> / month</span>
            <span className="spark-pass__price-sep">·</span>
            <span>₹1,499 / year</span>
          </p>

          <Link to="/auth" className="spark-pass__cta">
            Get Spark Pass
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
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
    </section>
  );
};

export default SparkPassSection;
