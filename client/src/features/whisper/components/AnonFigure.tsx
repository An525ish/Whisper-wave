/**
 * A faceless stranger in a fedora and shades — the app's "anonymous someone".
 * Takes its colour from the parent's `color`. Decorative only.
 */
export default function AnonFigure() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden>
      {/* shoulders */}
      <path d="M4.5 30c0-5.6 4.6-8.4 11.5-8.4S27.5 24.4 27.5 30Z" fill="currentColor" opacity="0.55" />
      {/* faceless head */}
      <ellipse cx="16" cy="16.5" rx="5.2" ry="5.6" fill="#16111d" stroke="currentColor" strokeWidth="1" />
      {/* shades */}
      <rect x="10.8" y="15" width="4.6" height="2.6" rx="1.3" fill="currentColor" />
      <rect x="16.6" y="15" width="4.6" height="2.6" rx="1.3" fill="currentColor" />
      <path d="M15.4 16.1h1.2" stroke="currentColor" strokeWidth="1" />
      {/* fedora */}
      <ellipse cx="16" cy="11.6" rx="10" ry="2.3" fill="currentColor" />
      <path d="M10.6 11.2C10.6 6.4 12.2 4 16 4s5.4 2.4 5.4 7.2Z" fill="currentColor" />
      <path d="M10.7 9.6h10.6" stroke="#16111d" strokeWidth="1.4" opacity="0.6" />
    </svg>
  );
}
