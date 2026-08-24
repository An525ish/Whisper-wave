import { useScrollReveal } from '@/hooks/landing/useScrollReveal';

/* ─────────────────────────────────────────────────────────────
   Tile 1 — Zero Profile (tall left tile)
   ───────────────────────────────────────────────────────────── */
const ZeroProfileTile = () => (
  <div className="bento-tile bento-tile--zero-profile">
    <div className="bento-tile__inner">
      <div className="bento-tile__tag">zero profile</div>

      {/* SVG — ghost silhouette with strikethrough data labels */}
      <div className="bento-tile__illustration" aria-hidden>
        <svg viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ghost body */}
          <ellipse cx="80" cy="52" rx="28" ry="28" fill="rgba(1,195,109,0.08)" stroke="rgba(1,195,109,0.25)" strokeWidth="1.2" />
          <rect x="52" y="52" width="56" height="42" rx="0" fill="rgba(1,195,109,0.06)" />
          <path d="M52 52 L52 82 Q56 94 64 88 Q72 82 80 88 Q88 82 96 88 Q104 94 108 82 L108 52" fill="rgba(1,195,109,0.07)" stroke="rgba(1,195,109,0.2)" strokeWidth="1.2" />
          {/* Face — just two dots */}
          <circle cx="71" cy="50" r="3.5" fill="rgba(1,195,109,0.35)" />
          <circle cx="89" cy="50" r="3.5" fill="rgba(1,195,109,0.35)" />

          {/* Crossed-out data labels floating around */}
          <rect x="4" y="16" width="50" height="14" rx="7" fill="rgba(53,47,61,0.9)" stroke="rgba(53,47,61,1)" strokeWidth="1" />
          <text x="29" y="26" textAnchor="middle" fontSize="7.5" fill="rgba(235,236,236,0.3)" fontFamily="DM Sans, sans-serif">real name</text>
          <line x1="6" y1="23" x2="52" y2="23" stroke="rgba(255,88,99,0.5)" strokeWidth="1.5" strokeLinecap="round" />

          <rect x="108" y="10" width="44" height="14" rx="7" fill="rgba(53,47,61,0.9)" stroke="rgba(53,47,61,1)" strokeWidth="1" />
          <text x="130" y="20" textAnchor="middle" fontSize="7.5" fill="rgba(235,236,236,0.3)" fontFamily="DM Sans, sans-serif">photo</text>
          <line x1="110" y1="17" x2="150" y2="17" stroke="rgba(255,88,99,0.5)" strokeWidth="1.5" strokeLinecap="round" />

          <rect x="4" y="102" width="60" height="14" rx="7" fill="rgba(53,47,61,0.9)" stroke="rgba(53,47,61,1)" strokeWidth="1" />
          <text x="34" y="112" textAnchor="middle" fontSize="7.5" fill="rgba(235,236,236,0.3)" fontFamily="DM Sans, sans-serif">phone number</text>
          <line x1="6" y1="109" x2="62" y2="109" stroke="rgba(255,88,99,0.5)" strokeWidth="1.5" strokeLinecap="round" />

          <rect x="96" y="106" width="60" height="14" rx="7" fill="rgba(53,47,61,0.9)" stroke="rgba(53,47,61,1)" strokeWidth="1" />
          <text x="126" y="116" textAnchor="middle" fontSize="7.5" fill="rgba(235,236,236,0.3)" fontFamily="DM Sans, sans-serif">social account</text>
          <line x1="98" y1="113" x2="154" y2="113" stroke="rgba(255,88,99,0.5)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <h3 className="bento-tile__headline">No login.<br />No photo.<br />No algorithm.</h3>
      <p className="bento-tile__body">
        Just a name you made up 30 seconds ago and a vibe tag. That's your entire identity here.
      </p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   Tile 2 — Gone If You Skip (dissolve tile)
   ───────────────────────────────────────────────────────────── */
const DISSOLVE_WORDS = ['They', 'vanish.', 'Real', 'stakes.', 'Pure', 'magic.', 'No', 'second', 'chances.', 'Just', 'this', 'moment.'];

const GoneTile = () => (
  <div className="bento-tile bento-tile--gone">
    <div className="bento-tile__inner">
      <div className="bento-tile__tag">skip = gone forever</div>

      {/* SVG — figure walking away, dissolving at the edges */}
      <div className="bento-tile__illustration bento-tile__illustration--gone" aria-hidden>
        <svg viewBox="0 0 180 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Fading trail of dots */}
          {[0,1,2,3,4,5,6,7].map((i) => (
            <circle
              key={i}
              cx={20 + i * 18}
              cy={40}
              r={3 - i * 0.25}
              fill={`rgba(235,236,236,${0.35 - i * 0.04})`}
            />
          ))}
          {/* Arrow pointing right — walking away */}
          <path d="M148 40 L162 40 M155 33 L162 40 L155 47" stroke="rgba(235,236,236,0.18)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Ghost silhouette dissolving */}
          <circle cx="125" cy="28" r="10" fill="rgba(235,236,236,0.06)" stroke="rgba(235,236,236,0.12)" strokeWidth="1" strokeDasharray="3 3" />
          <path d="M115 38 Q115 55 118 58 Q121 62 125 59 Q129 62 132 58 Q135 55 135 38 Z" fill="rgba(235,236,236,0.04)" stroke="rgba(235,236,236,0.1)" strokeWidth="1" strokeDasharray="3 3" />
        </svg>
      </div>

      {/* The dissolving text — words with staggered opacity animation */}
      <p className="bento-tile__dissolve-text" aria-label="They vanish. Real stakes. Pure magic. No second chances. Just this moment.">
        {DISSOLVE_WORDS.map((word, i) => (
          <span
            key={i}
            className="bento-tile__dissolve-word"
            style={{ animationDelay: `${i * 0.22}s` }}
          >
            {word}{' '}
          </span>
        ))}
      </p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   Tile 3 — Real Connections (narrow tall tile)
   ───────────────────────────────────────────────────────────── */
const ConnectionsTile = () => (
  <div className="bento-tile bento-tile--connections">
    <div className="bento-tile__inner">
      <div className="bento-tile__tag">real connections</div>

      {/* SVG — two orbs linked by a persistent line */}
      <div className="bento-tile__illustration" aria-hidden>
        <svg viewBox="0 0 140 110" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Link line */}
          <line x1="42" y1="55" x2="98" y2="55" stroke="rgba(1,195,109,0.4)" strokeWidth="1.5" strokeDasharray="0" />
          {/* Left orb */}
          <circle cx="35" cy="55" r="20" fill="rgba(1,195,109,0.1)" stroke="rgba(1,195,109,0.3)" strokeWidth="1.2" />
          <text x="35" y="59" textAnchor="middle" fontSize="14">👤</text>
          {/* Right orb */}
          <circle cx="105" cy="55" r="20" fill="rgba(86,152,255,0.1)" stroke="rgba(86,152,255,0.25)" strokeWidth="1.2" />
          <text x="105" y="59" textAnchor="middle" fontSize="14">👤</text>
          {/* Spark badge center */}
          <circle cx="70" cy="55" r="10" fill="rgba(1,195,109,0.15)" stroke="rgba(1,195,109,0.4)" strokeWidth="1" />
          <text x="70" y="59" textAnchor="middle" fontSize="9">✦</text>
          {/* "DM unlocked" label */}
          <rect x="24" y="82" width="92" height="16" rx="8" fill="rgba(1,195,109,0.1)" stroke="rgba(1,195,109,0.25)" strokeWidth="1" />
          <text x="70" y="93" textAnchor="middle" fontSize="8" fill="rgba(1,195,109,0.75)" fontFamily="DM Sans, sans-serif">DM unlocked forever</text>
        </svg>
      </div>

      <h3 className="bento-tile__headline">Mutual spark →<br />real DM.</h3>
      <p className="bento-tile__body">
        Anonymous session becomes a permanent connection. Their real account, your real DM.
      </p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   Tile 4 — Safe Exit (wide accent banner)
   ───────────────────────────────────────────────────────────── */
const SafeExitTile = () => (
  <div className="bento-tile bento-tile--safe-exit">
    <div className="bento-tile__inner bento-tile__inner--row">
      {/* SVG illustration */}
      <div className="bento-tile__illustration bento-tile__illustration--safe" aria-hidden>
        <svg viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Exit door shape */}
          <rect x="20" y="15" width="40" height="54" rx="4" fill="rgba(1,195,109,0.06)" stroke="rgba(1,195,109,0.3)" strokeWidth="1.2" />
          <rect x="24" y="19" width="32" height="46" rx="3" fill="rgba(26,21,32,0.6)" stroke="rgba(1,195,109,0.15)" strokeWidth="0.8" />
          {/* Door handle */}
          <circle cx="50" cy="42" r="2.5" fill="rgba(1,195,109,0.5)" />
          {/* Arrow exiting */}
          <path d="M68 42 L80 42 M75 36 L80 42 L75 48" stroke="rgba(1,195,109,0.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          {/* Shield badge */}
          <path d="M8 58 L8 68 Q8 73 13 75 Q18 73 18 68 L18 58 L13 55 Z" fill="rgba(1,195,109,0.12)" stroke="rgba(1,195,109,0.35)" strokeWidth="1" />
          <text x="13" y="68" textAnchor="middle" fontSize="8" fill="rgba(1,195,109,0.7)">✓</text>
        </svg>
      </div>

      <div className="bento-tile__safe-text">
        <div className="bento-tile__tag bento-tile__tag--light">built-in safety</div>
        <h3 className="bento-tile__headline bento-tile__headline--lg">Safe Exit. Always.</h3>
        <p className="bento-tile__body">
          One tap. You're out instantly. No message sent. No trace left. We built this first, before any other feature.
        </p>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   Tile 5 — Spark Pass teaser strip (full-width bottom)
   ───────────────────────────────────────────────────────────── */
const SparkPassTeaser = () => (
  <div className="bento-tile bento-tile--spark-teaser">
    <div className="bento-tile__inner bento-tile__inner--row bento-tile__inner--between">
      <div className="bento-tile__spark-left">
        <span className="bento-tile__spark-glyph">✦</span>
        <div>
          <p className="bento-tile__spark-label">Spark Pass</p>
          <p className="bento-tile__body bento-tile__body--sm">
            Gender filters · Priority queue · Voice notes · Re-find credits
          </p>
        </div>
      </div>
      <p className="bento-tile__spark-cta">coming soon →</p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   Full Bento Section
   ───────────────────────────────────────────────────────────── */
const BentoSection = () => {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>(0.1);

  return (
    <section
      ref={ref}
      className={`bento-section${isVisible ? ' bento-section--visible' : ''}`}
      aria-label="Why Whisper Wave"
    >
      <div className="bento-section__inner">
        {/* Header */}
        <div className="bento-section__header">
          <p className="bento-section__eyebrow">built different</p>
          <h2 className="bento-section__title font-display">Why Whisper Wave.</h2>
        </div>

        {/* Grid */}
        <div className="bento-grid">
          {/* Row 1: Zero Profile (tall) + Gone tile */}
          <div className="bento-grid__cell bento-grid__cell--zero-profile">
            <ZeroProfileTile />
          </div>
          <div className="bento-grid__cell bento-grid__cell--gone">
            <GoneTile />
          </div>

          {/* Row 2: Connections + Safe Exit */}
          <div className="bento-grid__cell bento-grid__cell--connections">
            <ConnectionsTile />
          </div>
          <div className="bento-grid__cell bento-grid__cell--safe-exit">
            <SafeExitTile />
          </div>

          {/* Row 3: Spark Pass full width */}
          <div className="bento-grid__cell bento-grid__cell--spark-teaser">
            <SparkPassTeaser />
          </div>
        </div>
      </div>
    </section>
  );
};

export default BentoSection;
