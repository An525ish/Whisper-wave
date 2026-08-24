import type { StoryChapter } from '@/hooks/landing/useScrollStory';

/* ─── Chapter 1: Name input mockup ─── */
const PickVisual = () => (
  <svg
    viewBox="0 0 280 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="story-visual__svg"
    aria-hidden
  >
    {/* Background glow */}
    <ellipse cx="140" cy="100" rx="110" ry="70" fill="rgba(1,195,109,0.05)" />

    {/* Input card */}
    <rect x="30" y="60" width="220" height="80" rx="14" fill="rgba(42,33,54,0.9)" stroke="rgba(53,47,61,0.9)" strokeWidth="1" />
    <rect x="30" y="60" width="220" height="80" rx="14" stroke="rgba(1,195,109,0.2)" strokeWidth="1" />

    {/* Label */}
    <text x="50" y="84" fontSize="8" fill="rgba(235,236,236,0.35)" fontFamily="DM Sans, sans-serif" letterSpacing="0.08em" textTransform="uppercase">VIBE NAME</text>

    {/* Input field */}
    <rect x="50" y="90" width="160" height="32" rx="8" fill="rgba(26,21,32,0.8)" stroke="rgba(1,195,109,0.35)" strokeWidth="1.2" />
    <text x="62" y="110" fontSize="11" fill="rgba(1,195,109,0.85)" fontFamily="DM Sans, sans-serif" fontWeight="500">midnight_fox</text>
    {/* Cursor blink */}
    <rect x="140" y="100" width="1.5" height="12" rx="1" fill="rgba(1,195,109,0.7)" className="story-visual__cursor" />

    {/* Vibe tags below */}
    <rect x="50" y="132" width="46" height="16" rx="8" fill="rgba(1,195,109,0.12)" stroke="rgba(1,195,109,0.25)" strokeWidth="1" />
    <text x="73" y="143" fontSize="7.5" fill="rgba(1,195,109,0.7)" fontFamily="DM Sans, sans-serif" textAnchor="middle">cozy</text>

    <rect x="102" y="132" width="60" height="16" rx="8" fill="rgba(86,152,255,0.1)" stroke="rgba(86,152,255,0.2)" strokeWidth="1" />
    <text x="132" y="143" fontSize="7.5" fill="rgba(86,152,255,0.65)" fontFamily="DM Sans, sans-serif" textAnchor="middle">deep talks</text>

    <rect x="168" y="132" width="54" height="16" rx="8" fill="rgba(124,58,237,0.1)" stroke="rgba(124,58,237,0.2)" strokeWidth="1" />
    <text x="195" y="143" fontSize="7.5" fill="rgba(180,120,255,0.65)" fontFamily="DM Sans, sans-serif" textAnchor="middle">overthinker</text>

    {/* Floating label */}
    <text x="140" y="172" fontSize="8" fill="rgba(235,236,236,0.2)" fontFamily="DM Sans, sans-serif" textAnchor="middle">no real name · no photo · just a vibe</text>
  </svg>
);

/* ─── Chapter 2: Match visual — two avatars connected by signal ─── */
const MatchVisual = () => (
  <svg
    viewBox="0 0 280 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="story-visual__svg"
    aria-hidden
  >
    {/* Left user card */}
    <rect x="16" y="52" width="86" height="96" rx="14" fill="rgba(42,33,54,0.9)" stroke="rgba(1,195,109,0.2)" strokeWidth="1" />
    <circle cx="59" cy="83" r="18" fill="rgba(1,195,109,0.12)" stroke="rgba(1,195,109,0.3)" strokeWidth="1.2" />
    <text x="59" y="88" textAnchor="middle" fontSize="16" fill="rgba(1,195,109,0.7)">👤</text>
    <text x="59" y="108" textAnchor="middle" fontSize="8" fill="rgba(235,236,236,0.65)" fontFamily="DM Sans, sans-serif" fontWeight="500">midnight_fox</text>
    {/* Tag */}
    <rect x="31" y="116" width="56" height="14" rx="7" fill="rgba(1,195,109,0.1)" stroke="rgba(1,195,109,0.2)" strokeWidth="0.8" />
    <text x="59" y="126" textAnchor="middle" fontSize="7" fill="rgba(1,195,109,0.6)" fontFamily="DM Sans, sans-serif">deep talks</text>
    {/* Online dot */}
    <circle cx="87" cy="53" r="5" fill="rgba(26,21,32,1)" />
    <circle cx="87" cy="53" r="3.5" fill="#01c36d" />

    {/* Right user card */}
    <rect x="178" y="52" width="86" height="96" rx="14" fill="rgba(42,33,54,0.9)" stroke="rgba(86,152,255,0.2)" strokeWidth="1" />
    <circle cx="221" cy="83" r="18" fill="rgba(86,152,255,0.1)" stroke="rgba(86,152,255,0.25)" strokeWidth="1.2" />
    <text x="221" y="88" textAnchor="middle" fontSize="16" fill="rgba(86,152,255,0.65)">👤</text>
    <text x="221" y="108" textAnchor="middle" fontSize="8" fill="rgba(235,236,236,0.65)" fontFamily="DM Sans, sans-serif" fontWeight="500">blue_static</text>
    <rect x="193" y="116" width="56" height="14" rx="7" fill="rgba(86,152,255,0.08)" stroke="rgba(86,152,255,0.18)" strokeWidth="0.8" />
    <text x="221" y="126" textAnchor="middle" fontSize="7" fill="rgba(86,152,255,0.55)" fontFamily="DM Sans, sans-serif">overthinker</text>
    <circle cx="193" cy="53" r="5" fill="rgba(26,21,32,1)" />
    <circle cx="193" cy="53" r="3.5" fill="#01c36d" />

    {/* Signal arc between them */}
    <path
      d="M107 100 C 120 72, 140 128, 153 100 S 170 72, 180 100"
      stroke="rgba(1,195,109,0.45)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeDasharray="4 4"
      className="story-visual__signal"
    />

    {/* Center spark */}
    <circle cx="140" cy="100" r="5" fill="rgba(1,195,109,0.2)" stroke="rgba(1,195,109,0.5)" strokeWidth="1" />
    <circle cx="140" cy="100" r="2.5" fill="rgba(1,195,109,0.8)" />

    {/* Matched label */}
    <rect x="86" y="162" width="108" height="20" rx="10" fill="rgba(1,195,109,0.1)" stroke="rgba(1,195,109,0.25)" strokeWidth="1" />
    <text x="140" y="175" textAnchor="middle" fontSize="8.5" fill="rgba(1,195,109,0.75)" fontFamily="DM Sans, sans-serif" fontWeight="500">✓ match found</text>
  </svg>
);

/* ─── Chapter 3: Spark / connect visual ─── */
const VibeVisual = () => (
  <svg
    viewBox="0 0 280 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="story-visual__svg"
    aria-hidden
  >
    {/* Outer glow rings */}
    <circle cx="140" cy="96" r="68" stroke="rgba(1,195,109,0.07)" strokeWidth="1" />
    <circle cx="140" cy="96" r="50" stroke="rgba(1,195,109,0.1)" strokeWidth="1" />
    <circle cx="140" cy="96" r="33" stroke="rgba(1,195,109,0.14)" strokeWidth="1" />

    {/* Central heart / spark */}
    <circle cx="140" cy="96" r="24" fill="rgba(1,195,109,0.12)" stroke="rgba(1,195,109,0.35)" strokeWidth="1.5" />
    {/* Stylised spark ✦ */}
    <text x="140" y="102" textAnchor="middle" fontSize="22" fill="rgba(1,195,109,0.85)">✦</text>

    {/* "IT'S A VIBE" label */}
    <rect x="84" y="133" width="112" height="22" rx="11" fill="rgba(1,195,109,0.12)" stroke="rgba(1,195,109,0.3)" strokeWidth="1" />
    <text x="140" y="147" textAnchor="middle" fontSize="9" fontWeight="600" fill="rgba(1,195,109,0.9)" fontFamily="DM Sans, sans-serif" letterSpacing="0.06em">IT'S A VIBE</text>

    {/* Left ghost avatar */}
    <circle cx="64" cy="96" r="14" fill="rgba(42,33,54,0.9)" stroke="rgba(1,195,109,0.2)" strokeWidth="1" />
    <text x="64" y="100" textAnchor="middle" fontSize="12" fill="rgba(1,195,109,0.55)">👤</text>

    {/* Right ghost avatar */}
    <circle cx="216" cy="96" r="14" fill="rgba(42,33,54,0.9)" stroke="rgba(86,152,255,0.2)" strokeWidth="1" />
    <text x="216" y="100" textAnchor="middle" fontSize="12" fill="rgba(86,152,255,0.55)">👤</text>

    {/* Connect button mockup */}
    <rect x="96" y="164" width="88" height="24" rx="12" fill="rgba(1,195,109,0.85)" />
    <text x="140" y="179" textAnchor="middle" fontSize="9" fontWeight="600" fill="#1a1520" fontFamily="DM Sans, sans-serif" letterSpacing="0.04em">Connect →</text>
  </svg>
);

/* ─── Exported panel ─── */

type Props = {
  chapter: StoryChapter;
};

const StoryVisualPanel = ({ chapter }: Props) => (
  <div className="story-visual">
    <div
      className={`story-visual__panel${chapter === 1 ? ' story-visual__panel--active' : ''}`}
      aria-hidden={chapter !== 1}
    >
      <PickVisual />
      <p className="story-visual__caption">pick a vibe name</p>
    </div>
    <div
      className={`story-visual__panel${chapter === 2 ? ' story-visual__panel--active' : ''}`}
      aria-hidden={chapter !== 2}
    >
      <MatchVisual />
      <p className="story-visual__caption">matched with a stranger</p>
    </div>
    <div
      className={`story-visual__panel${chapter === 3 ? ' story-visual__panel--active' : ''}`}
      aria-hidden={chapter !== 3}
    >
      <VibeVisual />
      <p className="story-visual__caption">mutual vibe → connect</p>
    </div>
  </div>
);

export default StoryVisualPanel;
