/** The auth-screen backdrop (mesh, glows, ripples, grain) shared by the picker and waiting room. */
export default function AuthAmbience() {
  return (
    <div className="auth-ambience pointer-events-none fixed inset-0" aria-hidden>
      <div className="auth-ambience__mesh" />
      <div className="auth-ambience__glow auth-ambience__glow--a" />
      <div className="auth-ambience__glow auth-ambience__glow--b" />
      <div className="auth-ambience__glow auth-ambience__glow--c" />
      <svg className="auth-ambience__ripples" viewBox="0 0 800 800" fill="none">
        <circle className="auth-ripple auth-ripple--1" cx="400" cy="400" r="90" />
        <circle className="auth-ripple auth-ripple--2" cx="400" cy="400" r="160" />
        <circle className="auth-ripple auth-ripple--3" cx="400" cy="400" r="240" />
        <circle className="auth-ripple auth-ripple--4" cx="400" cy="400" r="330" />
        <path className="auth-ambience__sine" d="M40 400 C 120 320, 200 480, 280 400 S 440 320, 520 400 S 680 480, 760 400" />
      </svg>
      <div className="auth-ambience__signal">
        <span /><span /><span /><span />
      </div>
      <div className="auth-ambience__grain" />
      <div className="auth-ambience__vignette" />
    </div>
  );
}
