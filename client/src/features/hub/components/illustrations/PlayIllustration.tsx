/**
 * The unopened game — a glass die mid-orbit with a wave-bar pulse. Uncharted
 * on purpose: the copy beside it says dreaming, and the art agrees.
 */
const EQ_BARS = [38, 62, 45, 78, 56, 88, 64, 42];

const PlayIllustration = () => (
  <div className="relative" aria-hidden>
    <svg viewBox="0 0 320 200" fill="none" className="h-auto w-full">
      <defs>
        <radialGradient id="hw-play-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8b6bff" stopOpacity="0.3" />
          <stop offset="66%" stopColor="#8b6bff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hw-die" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3d2b6e" />
          <stop offset="100%" stopColor="#1a1520" />
        </linearGradient>
      </defs>

      <ellipse cx="160" cy="100" rx="130" ry="78" fill="url(#hw-play-glow)" />
      <g className="hw-orbit" style={{ transformOrigin: '160px 100px' }}>
        <ellipse cx="160" cy="100" rx="112" ry="60" stroke="rgba(139,107,255,0.35)" strokeWidth="1" strokeDasharray="4 12" />
      </g>
      <g className="hw-orbit-rev" style={{ transformOrigin: '160px 100px' }}>
        <ellipse cx="160" cy="100" rx="84" ry="44" stroke="rgba(53,224,200,0.25)" strokeWidth="1" strokeDasharray="2 14" />
      </g>

      <g transform="rotate(-10 160 100)">
        <rect x="128" y="68" width="64" height="64" rx="16" fill="url(#hw-die)" stroke="rgba(139,107,255,0.7)" strokeWidth="1.5" />
        <circle cx="146" cy="86" r="4" fill="#ebecec" opacity="0.9" />
        <circle cx="174" cy="86" r="4" fill="#ebecec" opacity="0.9" />
        <circle cx="160" cy="100" r="4" fill="#01c36d" />
        <circle cx="146" cy="114" r="4" fill="#ebecec" opacity="0.9" />
        <circle cx="174" cy="114" r="4" fill="#ebecec" opacity="0.9" />
      </g>

      <g>
        {EQ_BARS.map((h, i) => (
          <rect
            key={i}
            x={52 + i * 8}
            y={160 - h * 0.5}
            width="3.5"
            height={h * 0.5}
            rx="1.75"
            fill="#7dffb8"
            opacity="0.75"
            className="hw-eq-bar"
            style={{ animationDelay: `${(i % 8) * 0.09}s` }}
          />
        ))}
      </g>
    </svg>

    <div className="hw-chip absolute right-3 top-3 rounded-full px-2.5 py-1">
      <span className="hw-hud text-body-300">still dreaming</span>
    </div>
  </div>
);

export default PlayIllustration;
