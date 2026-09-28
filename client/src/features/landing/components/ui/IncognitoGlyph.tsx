/**
 * A face-less incognito mark — hat brim + shades where the eyes should be, no
 * features. The shared "anonymous" shorthand used across the landing (hero
 * crowd, moments, floating strangers, streams, and the bento's AnonFace).
 * `color` themes it violet (stranger) or teal (you). Decorative → aria-hidden;
 * size via `className`.
 */
const IncognitoGlyph = ({ color, className }: { color: string; className?: string }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden xmlns="http://www.w3.org/2000/svg">
    <path d="M11 17 h18 a2 2 0 0 1 0 4 H11 a2 2 0 0 1 0-4Z" fill={color} />
    <path d="M15 15 q5 -6 10 0" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
    <circle cx="16" cy="26" r="3.4" fill={color} />
    <circle cx="24" cy="26" r="3.4" fill={color} opacity="0.85" />
    <path d="M19.4 26 h1.2" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export default IncognitoGlyph;
