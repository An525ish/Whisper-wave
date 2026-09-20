/**
 * Searching beat — violet signal rings (earlier chrome).
 */
const SearchingStage = () => (
  <div className="relative flex flex-1 flex-col items-center justify-center gap-5 px-6">
    <div className="relative grid size-[168px] place-items-center max-[520px]:size-[148px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute inset-0 rounded-full border border-lw-violet-2/35 motion-safe:animate-lw-radar motion-reduce:opacity-30"
          style={{ animationDelay: `${i * 0.7}s` }}
        />
      ))}
      <span className="absolute size-[72%] rounded-full border border-dashed border-lw-teal/25" />
      <span className="relative z-[1] grid size-[58px] place-items-center rounded-2xl border border-dashed border-lw-violet-2/55 bg-[rgba(139,107,255,0.16)] font-lw-mono text-2xl font-bold text-lw-violet-2 shadow-[0_0_28px_-8px_rgba(139,107,255,0.7)]">
        ?
      </span>
      <span
        className="pointer-events-none absolute inset-[8%] rounded-full motion-safe:animate-lw-sweep motion-reduce:hidden"
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0deg, rgba(53,224,200,0.28) 40deg, transparent 70deg)',
          maskImage: 'radial-gradient(circle, transparent 42%, #000 43%, #000 70%, transparent 71%)',
          WebkitMaskImage:
            'radial-gradient(circle, transparent 42%, #000 43%, #000 70%, transparent 71%)',
        }}
      />
    </div>

    <div className="text-center">
      <p className="font-lw-mono text-[0.78rem] uppercase tracking-[0.2em] text-lw-teal-2">
        finding someone
        <span className="motion-safe:animate-lw-blink">…</span>
      </p>
      <p className="mt-2 text-[0.82rem] text-lw-text-faint">no profile · no feed · just a vibe</p>
    </div>

    <div className="flex flex-wrap justify-center gap-2">
      {['cozy', 'deep talks', 'chaotic'].map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-lw-line bg-white-pure/[0.04] px-2.5 py-1 font-lw-mono text-[0.66rem] tracking-[0.04em] text-lw-text-dim"
        >
          {tag}
        </span>
      ))}
    </div>
  </div>
);

export default SearchingStage;
