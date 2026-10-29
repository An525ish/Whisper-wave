/**
 * Home hero stage: two signals (a stranger's and yours) drift toward each
 * other and meet at a green spark, with a tiny live chat floating over them.
 * No faces, no avatars. It shows what Whisper is: anonymous, one-to-one, and
 * quick to start.
 *
 * Violet = the stranger, teal = you, green is kept for the spark where they
 * match. Decorative (`aria-hidden`); the hero's real heading lives in the DOM.
 */

type Props = {
  liveCount: number;
};

/** Two full periods plus lead-in, so a one-period shift loops with no seam. */
const WAVE = 'M-120 180 Q-90 130 -60 180 T0 180 T60 180 T120 180 T180 180 T240 180 T300 180 T360 180 T420 180';

const HomeStage = ({ liveCount }: Props) => (
  <div className="hw-stage" aria-hidden>
    <div className="hw-stage__glow" />

    <svg className="hw-stage__rings" viewBox="0 0 360 360" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle className="hw-stage__ring" cx="180" cy="180" r="80" />
      <circle className="hw-stage__ring hw-stage__ring--b" cx="180" cy="180" r="122" />
      <circle className="hw-stage__ring hw-stage__ring--c" cx="180" cy="180" r="162" />
    </svg>

    <svg className="hw-stage__signal" viewBox="0 0 360 360" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hw-sig-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.08" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.28" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.72" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.92" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="hw-sig-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="360" height="360">
          <rect width="360" height="360" fill="url(#hw-sig-fade)" />
        </mask>
        <radialGradient id="hw-sig-orb-v" cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#c9bcff" />
          <stop offset="0.55" stopColor="#8b6bff" />
          <stop offset="1" stopColor="#3d2b6e" />
        </radialGradient>
        <radialGradient id="hw-sig-orb-t" cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#a8f6ea" />
          <stop offset="0.55" stopColor="#35e0c8" />
          <stop offset="1" stopColor="#0f6f63" />
        </radialGradient>
        <radialGradient id="hw-sig-spark" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#7dffb8" stopOpacity="0.9" />
          <stop offset="1" stopColor="#01c36d" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g mask="url(#hw-sig-mask)">
        <path className="hw-sig-wave hw-sig-wave--v" d={WAVE} />
        <path className="hw-sig-wave hw-sig-wave--t" d={WAVE} />
        <path className="hw-sig-wave hw-sig-wave--g" d={WAVE} />
      </g>

      {/* the match: both signals land on one point */}
      <circle cx="180" cy="180" r="34" fill="url(#hw-sig-spark)" className="hw-sig-halo" />
      <circle cx="180" cy="180" r="6" fill="#01c36d" />
      <circle cx="180" cy="180" r="6" fill="none" stroke="#7dffb8" strokeWidth="1.2" className="hw-sig-ping" />

      {/* the two ends */}
      <g className="hw-sig-orb hw-sig-orb--l">
        <circle cx="52" cy="180" r="30" fill="url(#hw-sig-orb-v)" />
        <text x="52" y="187" textAnchor="middle" className="hw-sig-glyph">?</text>
      </g>
      <g className="hw-sig-orb hw-sig-orb--r">
        <circle cx="308" cy="180" r="30" fill="url(#hw-sig-orb-t)" />
        <text x="308" y="185" textAnchor="middle" className="hw-sig-glyph hw-sig-glyph--sm">you</text>
      </g>
    </svg>

    {/* a live exchange, the way it looks once you match */}
    <div className="hw-bubble hw-bubble--them">
      <span className="hw-bubble__who">ANON_7K2</span>
      anyone up?
    </div>
    <div className="hw-bubble hw-bubble--you">can&apos;t sleep, you?</div>
    <div className="hw-bubble hw-bubble--typing">
      <span /><span /><span />
    </div>

    <div className="hw-stage__chip hw-stage__chip--a">
      <span className="hw-stage__chip-dot" />
      {liveCount > 0 ? `${liveCount} online` : 'Online'}
    </div>
    <div className="hw-stage__chip hw-stage__chip--b">
      Matched in seconds
    </div>
  </div>
);

export default HomeStage;
