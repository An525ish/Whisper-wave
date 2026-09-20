/**
 * The anonymous-chat illustration at the heart of the hero — a clean, flat
 * device scene (echoing the auth page's phone illustration) reworked for the
 * landing's story: an *incognito* avatar with no face, a redacted name, and a
 * live back-and-forth where the stranger's words stay masked. Violet = the
 * stranger, teal = you; the spark green is withheld.
 *
 * Pure inline SVG so it's crisp at any size and themed from the lw-* palette.
 * Decorative → aria-hidden; the hero's real heading lives in the DOM.
 */

const AnonScene = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 400 440" fill="none" className={className} aria-hidden xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="anon-screen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#241a34" />
        <stop offset="1" stopColor="#160f22" />
      </linearGradient>
      <linearGradient id="anon-rim" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#8b6bff" />
        <stop offset="0.55" stopColor="#b6a4ff" stopOpacity="0.2" />
        <stop offset="1" stopColor="#35e0c8" />
      </linearGradient>
      <linearGradient id="anon-violet" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#8b6bff" />
        <stop offset="1" stopColor="#5a3fd6" />
      </linearGradient>
      <linearGradient id="anon-teal" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#35e0c8" />
        <stop offset="1" stopColor="#17a493" />
      </linearGradient>
      <linearGradient id="anon-avatar" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#b6a4ff" />
        <stop offset="1" stopColor="#8b6bff" />
      </linearGradient>
    </defs>

    {/* device body */}
    <g>
      <rect x="70" y="34" width="260" height="372" rx="34" fill="url(#anon-screen)" />
      <rect
        x="70.75"
        y="34.75"
        width="258.5"
        height="370.5"
        rx="33.25"
        stroke="url(#anon-rim)"
        strokeWidth="1.5"
        opacity="0.9"
      />
      {/* soft inner top light */}
      <rect x="82" y="46" width="236" height="120" rx="26" fill="#8b6bff" opacity="0.06" />

      {/* ── header: incognito identity ─────────────────────────── */}
      {/* avatar disc */}
      <circle cx="118" cy="86" r="22" fill="#1d1530" stroke="url(#anon-avatar)" strokeWidth="1.5" />
      {/* incognito glyph: hat brim + shades = no face */}
      <path d="M104 82 h28 a2 2 0 0 1 0 4 h-28 a2 2 0 0 1 0-4 Z" fill="#b6a4ff" />
      <path d="M110 80 q8 -9 16 0" stroke="#b6a4ff" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="112" cy="92" r="4.4" fill="#8b6bff" />
      <circle cx="124" cy="92" r="4.4" fill="#35e0c8" />
      <path d="M116.4 92 h3.2" stroke="#b6a4ff" strokeWidth="1.6" strokeLinecap="round" />

      {/* name = redacted, status = anonymous */}
      <rect x="150" y="76" width="78" height="9" rx="4.5" fill="#5b5372" />
      <rect x="150" y="76" width="40" height="9" rx="4.5" fill="#8b6bff" opacity="0.7" />
      <circle cx="154" cy="99" r="3" fill="#35e0c8" />
      <rect x="162" y="96" width="66" height="6" rx="3" fill="#35e0c8" opacity="0.35" />
      {/* lock chip */}
      <rect x="270" y="74" width="40" height="26" rx="13" fill="#8b6bff" opacity="0.12" />
      <rect x="285" y="84" width="10" height="8" rx="2" fill="none" stroke="#b6a4ff" strokeWidth="1.6" />
      <path d="M287 84 v-2 a3 3 0 0 1 6 0 v2" stroke="#b6a4ff" strokeWidth="1.6" fill="none" />

      <line x1="86" y1="120" x2="314" y2="120" stroke="#b6a4ff" strokeWidth="1" opacity="0.1" />

      {/* ── conversation ───────────────────────────────────────── */}
      {/* stranger bubble (violet, left) */}
      <g>
        <rect x="86" y="140" width="150" height="46" rx="18" fill="url(#anon-violet)" opacity="0.9" />
        <rect x="86" y="176" width="14" height="12" rx="4" fill="url(#anon-violet)" opacity="0.9" />
        <rect x="102" y="156" width="58" height="7" rx="3.5" fill="#efeaf9" opacity="0.85" />
        <rect x="102" y="168" width="96" height="7" rx="3.5" fill="#efeaf9" opacity="0.45" />
      </g>

      {/* your bubble (teal, right) — redacted */}
      <g>
        <rect x="176" y="204" width="138" height="46" rx="18" fill="url(#anon-teal)" opacity="0.85" />
        <rect x="300" y="240" width="14" height="12" rx="4" fill="url(#anon-teal)" opacity="0.85" />
        <rect x="192" y="220" width="106" height="7" rx="3.5" fill="#04231f" opacity="0.55" />
        <rect x="192" y="232" width="64" height="7" rx="3.5" fill="#04231f" opacity="0.4" />
      </g>

      {/* stranger bubble w/ mini waveform (violet, left) */}
      <g>
        <rect x="86" y="268" width="128" height="48" rx="18" fill="#2a2140" stroke="#8b6bff" strokeWidth="1" opacity="0.95" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <rect
            key={i}
            x={104 + i * 12}
            y={284}
            width="5"
            height="16"
            rx="2.5"
            className="motion-safe:animate-lw-eq"
            style={{
              animationDelay: `${(i % 5) * 0.09}s`,
              transformBox: 'fill-box',
              transformOrigin: 'bottom',
            }}
            fill={i % 3 === 0 ? '#35e0c8' : '#8b6bff'}
          />
        ))}
      </g>

      {/* composer hint */}
      <rect x="86" y="344" width="180" height="34" rx="17" fill="#1c1430" stroke="#b6a4ff" strokeWidth="1" opacity="0.5" />
      <rect x="102" y="358" width="96" height="6" rx="3" fill="#8078a0" opacity="0.6" />
      <circle cx="292" cy="361" r="18" fill="url(#anon-violet)" />
      <path d="M285 361 h13 M293 356 l6 5 -6 5" stroke="#efeaf9" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

export default AnonScene;
