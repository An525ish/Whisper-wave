type Props = {
  /** The room's first letter, carved on the plaque above the arch. */
  initial: string;
};

/**
 * An arched gate at night: stone frame and steps, a wooden door standing ajar,
 * people's silhouettes against the light inside, chatter leaking out, dust
 * drifting in the beam on the floor. The room's tint (`--tone`) colours the
 * light. Knocking (`.rmq-open` on the page) swings the door wider and brightens
 * the room. Pure inline SVG, decorative only.
 */
const RoomDoorScene = ({ initial }: Props) => (
  <svg
    className="rmq-scene"
    viewBox="0 0 400 500"
    fill="none"
    aria-hidden
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <linearGradient id="rmq-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1f1633" />
        <stop offset="1" stopColor="#0f0a18" />
      </linearGradient>
      <linearGradient id="rmq-stone" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#4a4062" />
        <stop offset="0.5" stopColor="#2f2744" />
        <stop offset="1" stopColor="#40375a" />
      </linearGradient>
      <linearGradient id="rmq-wood" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#6a4a8c" />
        <stop offset="1" stopColor="#2c1d44" />
      </linearGradient>
      <radialGradient id="rmq-room" cx="50%" cy="55%" r="60%">
        <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
        <stop offset="0.35" style={{ stopColor: 'rgb(var(--tone))' }} stopOpacity="0.85" />
        <stop offset="1" style={{ stopColor: 'rgb(var(--tone))' }} stopOpacity="0.25" />
      </radialGradient>
      <radialGradient id="rmq-halo" cx="50%" cy="50%" r="50%">
        <stop offset="0" style={{ stopColor: 'rgb(var(--tone))' }} stopOpacity="0.5" />
        <stop offset="1" style={{ stopColor: 'rgb(var(--tone))' }} stopOpacity="0" />
      </radialGradient>
      <linearGradient id="rmq-spill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={{ stopColor: 'rgb(var(--tone))' }} stopOpacity="0.7" />
        <stop offset="1" style={{ stopColor: 'rgb(var(--tone))' }} stopOpacity="0" />
      </linearGradient>
      <radialGradient id="rmq-lamp" cx="50%" cy="50%" r="50%">
        <stop offset="0" stopColor="#ffd592" stopOpacity="0.9" />
        <stop offset="1" stopColor="#ffd592" stopOpacity="0" />
      </radialGradient>
      <clipPath id="rmq-opening">
        <path d="M120 420V150A80 80 0 0 1 280 150V420Z" />
      </clipPath>
      <filter id="rmq-soft" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.6" />
      </filter>
      <filter id="rmq-grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0" />
      </filter>
    </defs>

    {/* wall, grain, floor */}
    <rect width="400" height="500" fill="url(#rmq-wall)" />
    <rect width="400" height="500" filter="url(#rmq-grain)" opacity="0.06" />
    <rect y="420" width="400" height="80" fill="#0a0612" opacity="0.7" />

    {/* light halo behind the frame and its spill on the floor */}
    <circle cx="200" cy="290" r="190" fill="url(#rmq-halo)" className="rmq-halo" />
    <polygon points="120,420 280,420 372,500 28,500" fill="url(#rmq-spill)" className="rmq-spill" />

    {/* leaked chatter */}
    <g className="rmq-bubble">
      <rect x="22" y="150" width="62" height="34" rx="17" fill="#2a2140" stroke="rgba(139,107,255,0.55)" strokeWidth="1.2" />
      <rect x="36" y="162" width="30" height="5" rx="2.5" fill="#efeaf9" opacity="0.8" />
      <rect x="36" y="171" width="38" height="4" rx="2" fill="#efeaf9" opacity="0.4" />
    </g>
    <g className="rmq-bubble" style={{ animationDelay: '-2s' }}>
      <rect x="326" y="200" width="52" height="30" rx="15" fill="#16281f" stroke="rgba(53,224,200,0.45)" strokeWidth="1.2" />
      <rect x="338" y="211" width="28" height="5" rx="2.5" fill="#86f2e4" opacity="0.7" />
    </g>
    <g className="rmq-bubble" style={{ animationDelay: '-3.4s' }}>
      <rect x="40" y="226" width="44" height="26" rx="13" fill="#2a2140" stroke="rgba(139,107,255,0.4)" strokeWidth="1.2" />
      <rect x="50" y="235" width="24" height="5" rx="2.5" fill="#b6a4ff" opacity="0.7" />
    </g>

    {/* wall lanterns */}
    <g className="rmq-lamp">
      <circle cx="62" cy="300" r="42" fill="url(#rmq-lamp)" />
      <rect x="55" y="288" width="14" height="24" rx="4" fill="#ffd592" opacity="0.95" />
      <rect x="53" y="284" width="18" height="5" rx="2" fill="#3a2f52" />
      <rect x="53" y="311" width="18" height="5" rx="2" fill="#3a2f52" />
    </g>
    <g className="rmq-lamp" style={{ animationDelay: '-1.8s' }}>
      <circle cx="338" cy="300" r="42" fill="url(#rmq-lamp)" />
      <rect x="331" y="288" width="14" height="24" rx="4" fill="#ffd592" opacity="0.95" />
      <rect x="329" y="284" width="18" height="5" rx="2" fill="#3a2f52" />
      <rect x="329" y="311" width="18" height="5" rx="2" fill="#3a2f52" />
    </g>

    {/* steps and stone frame */}
    <rect x="62" y="436" width="276" height="14" rx="3" fill="url(#rmq-stone)" />
    <rect x="78" y="420" width="244" height="16" rx="3" fill="url(#rmq-stone)" />
    <path d="M100 420V150A100 100 0 0 1 300 150V420Z" fill="url(#rmq-stone)" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
    <path d="M110 420V150A90 90 0 0 1 290 150V420Z" fill="#0c0814" opacity="0.55" />

    {/* plaque with the room's letter */}
    <rect x="172" y="30" width="56" height="30" rx="8" fill="#241c38" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />
    <text
      x="200"
      y="52"
      textAnchor="middle"
      fontSize="22"
      style={{ fill: 'rgb(var(--tone))', fontFamily: 'var(--font-display)' }}
    >
      {initial}
    </text>

    {/* the room inside: warm light and silhouettes */}
    <g clipPath="url(#rmq-opening)">
      <rect x="120" y="70" width="160" height="350" fill="url(#rmq-room)" className="rmq-room" />
      <g filter="url(#rmq-soft)" fill="#0b0711" opacity="0.88">
        <g className="rmq-sway">
          <circle cx="168" cy="300" r="11" />
          <rect x="157" y="312" width="22" height="108" rx="11" />
        </g>
        <g className="rmq-sway" style={{ animationDelay: '-2.2s' }}>
          <circle cx="214" cy="290" r="12" />
          <rect x="202" y="303" width="24" height="117" rx="12" />
        </g>
        <g className="rmq-sway" style={{ animationDelay: '-4s' }}>
          <circle cx="250" cy="322" r="8" />
          <rect x="242" y="331" width="16" height="89" rx="8" />
        </g>
      </g>
    </g>

    {/* the door, hinged on the left, standing ajar */}
    <g className="rmq-leaf">
      <path d="M120 420V150A80 80 0 0 1 280 150V420Z" fill="url(#rmq-wood)" stroke="rgba(182,164,255,0.45)" strokeWidth="1.4" />
      <path d="M134 410V160A66 66 0 0 1 266 160V230H134Z" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" />
      <rect x="134" y="246" width="132" height="152" rx="4" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" />
      <circle cx="262" cy="320" r="6" fill="#ffd592" />
      <circle cx="262" cy="320" r="10" stroke="#ffd592" strokeWidth="1" opacity="0.4" />
    </g>

    {/* dust in the beam */}
    <g fill="#fff">
      <circle className="rmq-dust" cx="170" cy="470" r="1.6" />
      <circle className="rmq-dust" cx="205" cy="480" r="1.2" style={{ animationDelay: '-2s' }} />
      <circle className="rmq-dust" cx="240" cy="468" r="1.8" style={{ animationDelay: '-4s' }} />
      <circle className="rmq-dust" cx="130" cy="485" r="1.2" style={{ animationDelay: '-5s' }} />
      <circle className="rmq-dust" cx="275" cy="478" r="1.4" style={{ animationDelay: '-1s' }} />
    </g>
  </svg>
);

export default RoomDoorScene;
