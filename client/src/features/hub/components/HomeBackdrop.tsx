/**
 * Full-page atmosphere for the hub home — the landing/auth treatment,
 * retuned to the home's midnight-shore palette.
 *
 * Layers (all decorative, `aria-hidden` by the caller):
 * mesh scan-grid + aurora blobs (violet / teal / faint green) + expanding
 * ripple rings + a drifting sine thread + signal bars + grain + vignette.
 * Still under `prefers-reduced-motion` via home.css.
 */
const HomeBackdrop = () => (
  <div aria-hidden className="hw-bg">
    <div className="hw-mesh" />
    <div className="hw-glow hw-glow--violet" />
    <div className="hw-glow hw-glow--teal" />
    <div className="hw-glow hw-glow--green" />
    <svg
      className="hw-ripples"
      viewBox="0 0 800 800"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle className="hw-ripple hw-ripple--1" cx="400" cy="400" r="90" />
      <circle className="hw-ripple hw-ripple--2" cx="400" cy="400" r="160" />
      <circle className="hw-ripple hw-ripple--3" cx="400" cy="400" r="240" />
      <circle className="hw-ripple hw-ripple--4" cx="400" cy="400" r="330" />
      <path
        className="hw-sine"
        d="M40 400 C 120 320, 200 480, 280 400 S 440 320, 520 400 S 680 480, 760 400"
      />
    </svg>
    <div className="hw-signal">
      <span />
      <span />
      <span />
      <span />
    </div>
    <div className="hw-grain" />
    <div className="hw-vignette" />
  </div>
);

export default HomeBackdrop;
