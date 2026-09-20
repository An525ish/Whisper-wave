import AnonScene from '@/components/landing/ui/AnonScene';
import AnonCrowd from '@/components/landing/ui/AnonCrowd';

/**
 * The hero stage — the auth page's beloved "quiet circle" treatment, retuned
 * for the landing: a soft glow, slow orbiting rings + a breathing signal arc,
 * floating glass status chips, and a live equalizer pill, all wrapped around
 * the anonymous-chat illustration (AnonScene). Violet = the stranger, teal =
 * you; the spark green stays withheld for the connect moment later.
 *
 * Everything here is decorative → aria-hidden inside AnonScene; motion is
 * `motion-safe` gated so the whole scene holds still under reduced-motion.
 */

const EQ_BARS = Array.from({ length: 22 }, (_, i) => i);

const HeroStage = () => (
  <div className="relative aspect-square w-full">
    {/* soft glow behind the scene */}
    <div
      className="pointer-events-none absolute inset-[12%] rounded-full opacity-80 blur-[12px] bg-[radial-gradient(circle,rgba(139,107,255,0.28),transparent_66%)]"
      aria-hidden
    />

    {/* orbiting rings + breathing arc */}
    <svg
      className="pointer-events-none absolute inset-0 size-full"
      viewBox="0 0 360 360"
      fill="none"
      aria-hidden
    >
      <circle cx="180" cy="180" r="80" stroke="rgba(182,164,255,0.1)" strokeWidth="1" />
      <circle
        cx="180"
        cy="180"
        r="122"
        stroke="rgba(139,107,255,0.22)"
        strokeWidth="1"
        strokeDasharray="4 12"
        className="motion-safe:animate-lw-orbit"
        style={{ transformOrigin: '180px 180px' }}
      />
      <circle
        cx="180"
        cy="180"
        r="162"
        stroke="rgba(53,224,200,0.16)"
        strokeWidth="1"
        strokeDasharray="2 16"
        className="motion-safe:animate-lw-orbit-rev"
        style={{ transformOrigin: '180px 180px' }}
      />
      <path
        d="M52 180 A128 128 0 0 1 180 52"
        stroke="rgba(53,224,200,0.6)"
        strokeWidth="2"
        strokeLinecap="round"
        className="motion-safe:animate-lw-arc [filter:drop-shadow(0_0_6px_rgba(53,224,200,0.4))]"
        style={{ transformOrigin: '180px 180px' }}
      />
    </svg>

    {/* the anonymous people scattered around, tethered by signal threads */}
    <AnonCrowd />

    {/* the central illustration */}
    <div className="absolute inset-[17%] motion-safe:animate-lw-rise">
      <AnonScene className="relative size-full drop-shadow-[0_18px_40px_rgba(10,6,20,0.6)]" />
    </div>

    {/* live equalizer pill */}
    <div
      className="pointer-events-none absolute bottom-[6%] left-1/2 flex h-11 -translate-x-1/2 items-end gap-[3px] rounded-full border border-lw-line-soft bg-lw-ink/55 px-4 py-2 backdrop-blur-md"
      aria-hidden
    >
      {EQ_BARS.map((i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-[linear-gradient(180deg,var(--color-lw-teal-2),var(--color-lw-violet))] motion-safe:animate-lw-eq motion-reduce:h-1/2"
          style={{
            height: '70%',
            transformOrigin: 'bottom',
            animationDelay: `${(i % 8) * 0.09}s`,
          }}
        />
      ))}
    </div>

    {/* floating glass chips */}
    <div
      className="pointer-events-none absolute right-[2%] top-[8%] motion-safe:animate-lw-float"
      aria-hidden
    >
      <div className="flex items-center gap-1.5 rounded-full border border-lw-line bg-lw-ink/75 px-3 py-1.5 font-lw-body text-[0.68rem] font-semibold tracking-[0.02em] text-lw-text-dim backdrop-blur-md shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
        <span className="size-1.5 rounded-full bg-lw-teal shadow-[0_0_6px_var(--color-lw-teal)] motion-safe:animate-lw-blink" />
        quietly online
      </div>
    </div>
    <div
      className="pointer-events-none absolute bottom-[24%] left-[-2%] motion-safe:animate-lw-float"
      style={{ animationDelay: '1.4s' }}
      aria-hidden
    >
      <div className="flex items-center gap-1.5 rounded-full border border-lw-violet/30 bg-lw-ink/75 px-3 py-1.5 font-lw-mono text-[0.62rem] tracking-[0.1em] text-lw-text-faint backdrop-blur-md shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
        <span className="text-lw-violet-2">ANON_</span>████
      </div>
    </div>
  </div>
);

export default HeroStage;
