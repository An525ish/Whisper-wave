/**
 * A door, slightly ajar — light spilling out, chatter leaking through.
 * Hovering the knock swings it wider. Pure inline SVG in the room palette.
 */
const RoomDoorScene = () => (
  <svg
    viewBox="0 0 360 230"
    fill="none"
    aria-hidden
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <linearGradient id="rmq-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#241b33" />
        <stop offset="1" stopColor="#160f1f" />
      </linearGradient>
      <linearGradient id="rmq-door" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#4a3568" />
        <stop offset="1" stopColor="#2a1e40" />
      </linearGradient>
      <linearGradient id="rmq-beam" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#7dffb8" stopOpacity="0.85" />
        <stop offset="1" stopColor="#7dffb8" stopOpacity="0" />
      </linearGradient>
      <radialGradient id="rmq-pool" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#01c36d" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#01c36d" stopOpacity="0" />
      </radialGradient>
    </defs>

    <rect x="0" y="0" width="360" height="230" fill="url(#rmq-wall)" />
    <rect x="0" y="0" width="360" height="230" fill="#000" opacity="0.25" />

    {/* leaked chatter */}
    <g className="rmq-bubble">
      <rect x="42" y="78" width="58" height="32" rx="16" fill="#2a2140" stroke="rgba(139,107,255,0.55)" strokeWidth="1.2" />
      <rect x="54" y="89" width="30" height="4.5" rx="2.25" fill="#efeaf9" opacity="0.8" />
      <rect x="54" y="98" width="38" height="4" rx="2" fill="#efeaf9" opacity="0.4" />
    </g>
    <g className="rmq-bubble" style={{ animationDelay: '-1.7s' }}>
      <rect x="22" y="128" width="48" height="28" rx="14" fill="#16281f" stroke="rgba(53,224,200,0.45)" strokeWidth="1.2" />
      <rect x="32" y="138" width="28" height="4.5" rx="2.25" fill="#86f2e4" opacity="0.7" />
    </g>
    <g className="rmq-bubble" style={{ animationDelay: '-3.1s' }}>
      <rect x="66" y="34" width="44" height="26" rx="13" fill="#2a2140" stroke="rgba(139,107,255,0.4)" strokeWidth="1.2" />
      <rect x="76" y="43" width="24" height="4.5" rx="2.25" fill="#b6a4ff" opacity="0.7" />
    </g>

    {/* frame + dark opening */}
    <rect x="125" y="18" width="110" height="192" rx="8" fill="#0e0a14" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
    <rect x="133" y="26" width="94" height="184" fill="#050308" />

    {/* light spill + floor pool */}
    <g className="rmq-light">
      <polygon points="196,30 232,210 96,210 138,30" fill="url(#rmq-beam)" opacity="0.55" />
      <ellipse cx="168" cy="212" rx="82" ry="12" fill="url(#rmq-pool)" className="rmq-flicker" />
    </g>

    {/* the slab, ajar */}
    <g className="rmq-door">
      <polygon points="133,26 189,38 189,210 133,210" fill="url(#rmq-door)" stroke="rgba(182,164,255,0.4)" strokeWidth="1.2" />
      <polygon points="142,60 176,66 176,120 142,120" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1.2" />
      <polygon points="142,134 176,134 176,188 142,188" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1.2" />
      <circle cx="179" cy="122" r="5" fill="#7dffb8" />
      <circle cx="179" cy="122" r="8.5" fill="none" stroke="#7dffb8" strokeWidth="1" opacity="0.4" />
      <path d="M189 38 L189 210" stroke="#7dffb8" strokeWidth="1.5" opacity="0.55" />
    </g>
  </svg>
);

export default RoomDoorScene;
