/**
 * Brief flash between searching and chat — the “we found someone” beat.
 */
const MatchedStage = () => (
  <div className="relative flex flex-1 flex-col items-center justify-center gap-4 px-6 motion-safe:animate-lw-pop">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(1,195,109,0.22),transparent_58%)] motion-safe:animate-lw-bloom" />

    <div className="relative z-[1] grid size-[64px] place-items-center rounded-2xl border border-lw-spark/40 bg-[linear-gradient(150deg,rgba(1,195,109,0.25),rgba(53,224,200,0.12))] text-2xl text-lw-spark shadow-[0_0_32px_-6px_var(--lw-spark-glow)]">
      ✦
    </div>

    <div className="relative z-[1] text-center">
      <p className="font-lw-mono text-[0.72rem] uppercase tracking-[0.22em] text-lw-spark">
        match found
      </p>
      <p className="mt-2 font-lw-display text-[1.55rem] tracking-[-0.02em] text-lw-text">
        a stranger
      </p>
      <p className="mt-1 text-[0.8rem] text-lw-text-faint">dropping you in…</p>
    </div>
  </div>
);

export default MatchedStage;
