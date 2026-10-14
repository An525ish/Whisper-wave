/**
 * The tap that never runs dry — a faucet pouring liquid laughter into a
 * tumbler, with rising bubbles, falling drips and twinkling sparkles.
 * Flat SVG in the home-stage palette (violet metal, teal pour, green glow).
 * Decorative (`aria-hidden`); motion freezes under `prefers-reduced-motion`.
 */
const MemeTapArt = () => (
  <svg viewBox="0 0 220 190" fill="none" aria-hidden xmlns="http://www.w3.org/2000/svg" className="mm-tap">
    <defs>
      <radialGradient id="mm-tap-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#8b6bff" stopOpacity="0.28" />
        <stop offset="65%" stopColor="#8b6bff" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="mm-tap-metal" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#4a3a6e" />
        <stop offset="1" stopColor="#241a34" />
      </linearGradient>
      <linearGradient id="mm-tap-pour" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#35e0c8" />
        <stop offset="1" stopColor="#01c36d" />
      </linearGradient>
      <linearGradient id="mm-tap-liquid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#35e0c8" stopOpacity="0.85" />
        <stop offset="1" stopColor="#01c36d" stopOpacity="0.7" />
      </linearGradient>
    </defs>

    <ellipse cx="112" cy="98" rx="96" ry="76" fill="url(#mm-tap-glow)" />

    {/* twinkles */}
    <g stroke="#b6a4ff" strokeWidth="1.6" strokeLinecap="round">
      <g transform="translate(52,64)" className="mm-twinkle">
        <path d="M0 -5 V5 M-5 0 H5" />
      </g>
      <g transform="translate(184,44)" className="mm-twinkle" style={{ animationDelay: '-1.2s' }}>
        <path d="M0 -4 V4 M-4 0 H4" />
      </g>
      <g transform="translate(62,152)" className="mm-twinkle" style={{ animationDelay: '-2.1s' }}>
        <path d="M0 -4 V4 M-4 0 H4" />
      </g>
    </g>

    {/* faucet */}
    <g>
      <rect x="96" y="4" width="28" height="9" rx="4.5" fill="url(#mm-tap-metal)" stroke="rgba(182,164,255,0.5)" strokeWidth="1" />
      <rect x="107" y="11" width="6" height="10" fill="url(#mm-tap-metal)" />
      <rect x="102" y="20" width="16" height="26" rx="7" fill="url(#mm-tap-metal)" stroke="rgba(182,164,255,0.5)" strokeWidth="1" />
      <rect x="102" y="44" width="42" height="14" rx="7" fill="url(#mm-tap-metal)" stroke="rgba(182,164,255,0.5)" strokeWidth="1" />
      <rect x="132" y="52" width="13" height="15" rx="4" fill="url(#mm-tap-metal)" stroke="rgba(53,224,200,0.5)" strokeWidth="1" />
      <rect x="106" y="24" width="3" height="34" rx="1.5" fill="#b6a4ff" opacity="0.35" />
    </g>

    {/* pour */}
    <path
      d="M138 69 C 135 85, 141 97, 138 115"
      stroke="url(#mm-tap-pour)"
      strokeWidth="7"
      strokeLinecap="round"
      strokeDasharray="7 9"
      className="mm-pour"
    />
    <circle cx="153" cy="82" r="2.4" fill="#35e0c8" className="mm-drip" />
    <circle cx="124" cy="92" r="2" fill="#7dffb8" className="mm-drip" style={{ animationDelay: '-1.4s' }} />

    {/* tumbler */}
    <g>
      <path
        d="M114 118 L121 168 Q138 176 155 168 L162 118"
        fill="rgba(255,255,255,0.03)"
        stroke="rgba(235,236,236,0.3)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M119 133 L157 133 L153 165 Q138 171 123 165 Z"
        fill="url(#mm-tap-liquid)"
      />
      <circle cx="126" cy="130" r="6" fill="#b6a4ff" opacity="0.9" />
      <circle cx="138" cy="127" r="7.5" fill="#b6a4ff" />
      <circle cx="150" cy="130" r="6" fill="#8b6bff" opacity="0.9" />
      <text x="138" y="156" textAnchor="middle" fontSize="24">
        😂
      </text>
      <circle cx="128" cy="160" r="2.2" fill="#eafff4" opacity="0.8" className="mm-bubble" />
      <circle cx="147" cy="162" r="2.6" fill="#eafff4" opacity="0.7" className="mm-bubble" style={{ animationDelay: '-0.9s' }} />
      <circle cx="138" cy="158" r="1.8" fill="#eafff4" opacity="0.8" className="mm-bubble" style={{ animationDelay: '-1.7s' }} />
      <path d="M118 140 L122 164" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.25" />
    </g>

    {/* saucer ripple */}
    <ellipse cx="138" cy="176" rx="34" ry="8" stroke="rgba(1,195,109,0.4)" strokeWidth="1.2" strokeDasharray="3 6" />
  </svg>
);

export default MemeTapArt;
