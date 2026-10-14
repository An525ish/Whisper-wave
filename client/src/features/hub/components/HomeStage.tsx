/**
 * Home hero stage — the "quiet circle" treatment (glow, orbiting rings,
 * breathing arc, floating chips, live equalizer) wrapped around a bespoke
 * cove scene: two faceless drifters tethered by a signal thread over quiet
 * water, with the spark where they meet.
 *
 * Violet = the stranger, teal = you, green withheld for the spark —
 * the same story the landing tells, retold as a harbour instead of a phone.
 * Decorative (`aria-hidden`); the hero's real heading lives in the DOM.
 */

type Props = {
  liveCount: number;
};

const EQ_BARS = Array.from({ length: 22 }, (_, i) => i);

const HomeStage = ({ liveCount }: Props) => (
  <div className="hw-stage" aria-hidden>
    <div className="hw-stage__glow" />

    <svg
      className="hw-stage__rings"
      viewBox="0 0 360 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle className="hw-stage__ring" cx="180" cy="180" r="80" />
      <circle
        className="hw-stage__ring hw-stage__ring--b"
        cx="180"
        cy="180"
        r="122"
      />
      <circle
        className="hw-stage__ring hw-stage__ring--c"
        cx="180"
        cy="180"
        r="162"
      />
      <path className="hw-stage__arc" d="M52 180 A128 128 0 0 1 180 52" strokeLinecap="round" />
    </svg>

    {/* ── the cove: two drifters, one thread, one spark ── */}
    <svg
      className="hw-stage__scene"
      viewBox="0 0 360 330"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="hw-cove-violet" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b6bff" />
          <stop offset="1" stopColor="#5a3fd6" />
        </linearGradient>
        <linearGradient id="hw-cove-teal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#35e0c8" />
          <stop offset="1" stopColor="#17a493" />
        </linearGradient>
        <radialGradient id="hw-cove-lagoon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8b6bff" stopOpacity="0.28" />
          <stop offset="60%" stopColor="#35e0c8" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#35e0c8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hw-cove-avatar-v" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b6a4ff" />
          <stop offset="1" stopColor="#8b6bff" />
        </linearGradient>
        <linearGradient id="hw-cove-avatar-t" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#86f2e4" />
          <stop offset="1" stopColor="#35e0c8" />
        </linearGradient>
      </defs>

      {/* lagoon */}
      <ellipse cx="180" cy="238" rx="128" ry="64" fill="url(#hw-cove-lagoon)" />
      <ellipse cx="180" cy="238" rx="112" ry="46" stroke="rgba(139,107,255,0.3)" strokeWidth="1" strokeDasharray="3 10" className="hw-orbit" style={{ transformOrigin: '180px 238px' }} />
      <ellipse cx="180" cy="238" rx="84" ry="34" stroke="rgba(53,224,200,0.28)" strokeWidth="1" strokeDasharray="2 12" className="hw-orbit-rev" style={{ transformOrigin: '180px 238px' }} />
      <ellipse cx="180" cy="238" rx="56" ry="22" stroke="rgba(235,236,236,0.14)" strokeWidth="1" />
      {/* moonlit path on the water */}
      <rect x="150" y="232" width="60" height="5" rx="2.5" fill="#01c36d" opacity="0.35" />
      <rect x="160" y="242" width="40" height="4" rx="2" fill="#7dffb8" opacity="0.3" />
      <rect x="168" y="251" width="24" height="3" rx="1.5" fill="#ebecec" opacity="0.18" />

      {/* signal thread between the drifters */}
      <path
        d="M141 148 C 158 118, 202 118, 219 148"
        stroke="rgba(53,224,200,0.55)"
        strokeWidth="1.5"
        strokeDasharray="5 6"
        strokeLinecap="round"
        className="hw-thread"
      />
      {/* the spark where they meet */}
      <circle cx="180" cy="122" r="10" fill="#01c36d" opacity="0.14" />
      <circle cx="180" cy="122" r="5.5" fill="#01c36d" />
      <circle cx="180" cy="122" r="5.5" fill="none" stroke="#7dffb8" strokeWidth="1" className="hw-ping-ring" style={{ transformOrigin: '180px 122px' }} />
      <path d="M180 110 v-7 M180 141 v-7 M168 122 h-7 M199 122 h-7" stroke="rgba(125,255,184,0.7)" strokeWidth="1.5" strokeLinecap="round" />

      {/* ── left drifter: the stranger (violet, incognito) ── */}
      <g className="hw-drifter hw-drifter--l">
        <rect x="82" y="66" width="96" height="34" rx="17" fill="url(#hw-cove-violet)" opacity="0.9" />
        <rect x="96" y="78" width="44" height="6" rx="3" fill="#efeaf9" opacity="0.85" />
        <rect x="96" y="88" width="68" height="5" rx="2.5" fill="#efeaf9" opacity="0.4" />
        <circle cx="130" cy="152" r="27" fill="#1d1530" stroke="url(#hw-cove-avatar-v)" strokeWidth="1.5" />
        <path d="M112 148 h36 a2 2 0 0 1 0 4 h-36 a2 2 0 0 1 0-4 Z" fill="#b6a4ff" />
        <path d="M121 145 q9 -10 18 0" stroke="#b6a4ff" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="122" cy="158" r="4.6" fill="#8b6bff" />
        <circle cx="138" cy="158" r="4.6" fill="#35e0c8" />
        <path d="M126.6 158 h6.8" stroke="#b6a4ff" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M104 186 q26 -14 52 0 l-8 30 h-36 Z" fill="#241a34" stroke="#8b6bff" strokeWidth="1" opacity="0.95" />
      </g>

      {/* ── right drifter: you (teal) ── */}
      <g className="hw-drifter hw-drifter--r">
        <rect x="182" y="66" width="96" height="34" rx="17" fill="url(#hw-cove-teal)" opacity="0.85" />
        <rect x="196" y="78" width="68" height="6" rx="3" fill="#04231f" opacity="0.5" />
        <rect x="196" y="88" width="44" height="5" rx="2.5" fill="#04231f" opacity="0.38" />
        <circle cx="230" cy="152" r="27" fill="#122b28" stroke="url(#hw-cove-avatar-t)" strokeWidth="1.5" />
        <path d="M212 148 h36 a2 2 0 0 1 0 4 h-36 a2 2 0 0 1 0-4 Z" fill="#86f2e4" />
        <circle cx="222" cy="158" r="4.6" fill="#35e0c8" />
        <circle cx="238" cy="158" r="4.6" fill="#b6a4ff" />
        <path d="M226.6 158 h6.8" stroke="#86f2e4" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M204 186 q26 -14 52 0 l-8 30 h-36 Z" fill="#16281f" stroke="#35e0c8" strokeWidth="1" opacity="0.95" />
      </g>

      {/* scattered night motes */}
      <circle cx="70" cy="150" r="1.6" fill="#ebecec" opacity="0.5" className="hw-star" />
      <circle cx="292" cy="140" r="1.6" fill="#ebecec" opacity="0.5" className="hw-star" style={{ animationDelay: '-2s' }} />
      <circle cx="262" cy="70" r="1.2" fill="#b6a4ff" opacity="0.6" className="hw-star" style={{ animationDelay: '-4s' }} />
      <circle cx="98" cy="70" r="1.2" fill="#35e0c8" opacity="0.6" className="hw-star" style={{ animationDelay: '-1s' }} />
    </svg>

    {/* floating glass chips */}
    <div className="hw-stage__chip hw-stage__chip--a">
      <span className="hw-stage__chip-dot" />
      {liveCount > 0 ? `${liveCount} drifting now` : 'quietly online'}
    </div>
    <div className="hw-stage__chip hw-stage__chip--b">
      <span className="hw-stage__chip-anon">ANON_</span>████
    </div>

    {/* live equalizer pill */}
    <div className="hw-stage__wave">
      {EQ_BARS.map((i) => (
        <span
          key={i}
          className="hw-stage__bar"
          style={{ animationDelay: `${(i % 8) * 0.09}s` }}
        />
      ))}
    </div>
  </div>
);

export default HomeStage;
