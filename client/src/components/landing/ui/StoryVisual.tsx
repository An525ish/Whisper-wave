import { cn } from '@/utils/cn';

/**
 * The per-step glass vignette shown inside the scroll-story's visual card.
 * Each step owns a colour from the loop's journey — violet (anonymous) →
 * teal (matched) → the reserved spark green (connect) — so the picture warms
 * toward connection exactly as the copy does. Built from the same material
 * vocabulary as the hero (glass chips, mono labels, the ripple motif) so the
 * two sections read as one product. Purely decorative → aria-hidden by caller.
 */

/* A small frosted "vibe tag" pill. */
const Tag = ({ children, tone = 'dim' }: { children: React.ReactNode; tone?: 'violet' | 'dim' }) => (
  <span
    className={cn(
      'rounded-full border px-2.5 py-1 font-lw-mono text-[0.66rem] leading-none',
      tone === 'violet'
        ? 'border-lw-violet/30 bg-lw-violet/10 text-lw-violet-2'
        : 'border-lw-line bg-white-pure/[0.03] text-lw-text-dim',
    )}
  >
    {children}
  </span>
);

/* An identity: monogram tile + vibe name, themed violet or teal. */
const IdentityChip = ({
  name,
  monogram,
  tone,
}: {
  name: string;
  monogram: string;
  tone: 'violet' | 'teal';
}) => (
  <div className="relative z-10 flex flex-col items-center gap-2">
    <div
      className={cn(
        'grid size-11 place-items-center rounded-xl font-lw-mono text-sm font-bold',
        tone === 'violet'
          ? 'bg-lw-violet/15 text-lw-violet-2 shadow-[0_0_0_1px_rgba(139,107,255,0.3)]'
          : 'bg-lw-teal/15 text-lw-teal-2 shadow-[0_0_0_1px_rgba(53,224,200,0.3)]',
      )}
    >
      {monogram}
    </div>
    <span className="font-lw-mono text-[0.72rem] text-lw-text-dim">{name}</span>
  </div>
);

/* Step 01 — a vibe name is your whole identity. */
const PickVisual = () => (
  <div className="flex h-full w-full flex-col items-center justify-center p-6">
    <div className="w-full max-w-[248px] rounded-2xl border border-white-pure/10 bg-white-pure/[0.04] p-4 backdrop-blur-[6px]">
      <div className="font-lw-mono text-[0.58rem] uppercase tracking-[0.18em] text-lw-text-faint">
        vibe name
      </div>
      <div className="mt-2 flex items-center rounded-lg border border-lw-violet/30 bg-lw-violet/10 px-3 py-2">
        <span className="font-lw-mono text-[0.9rem] text-lw-violet-2">midnight_fox</span>
        <span className="ml-0.5 h-[14px] w-0.5 bg-lw-violet motion-safe:animate-lw-caret" />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Tag tone="violet">cozy</Tag>
        <Tag>deep talks</Tag>
        <Tag>overthinker</Tag>
      </div>
    </div>
    <p className="mt-4 font-lw-mono text-[0.62rem] tracking-[0.04em] text-lw-text-faint">
      no real name · no photo
    </p>
  </div>
);

/* Step 02 — two strangers, paired in real time, linked by a live signal. */
const MatchVisual = () => (
  <div className="flex h-full w-full flex-col items-center justify-center gap-6 p-6">
    <div className="relative flex w-full max-w-[264px] items-start justify-between">
      {/* Live signal wave flowing between the two identities */}
      <svg
        className="pointer-events-none absolute left-[54px] right-[54px] top-[22px] h-6 -translate-y-1/2"
        viewBox="0 0 100 24"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden
      >
        <path
          d="M0 12 Q 8 3 16 12 T 32 12 T 48 12 T 64 12 T 84 12 T 100 12"
          stroke="rgba(53,224,200,0.55)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="3 5"
          className="motion-safe:animate-lw-signal"
        />
      </svg>
      <IdentityChip name="midnight_fox" monogram="M" tone="violet" />
      <IdentityChip name="blue_static" monogram="B" tone="teal" />
    </div>
    <div className="inline-flex items-center gap-1.5 rounded-full border border-lw-teal/30 bg-lw-teal/10 px-3 py-1 font-lw-mono text-[0.66rem] tracking-[0.08em] text-lw-teal-2">
      <span className="size-1.5 rounded-full bg-lw-teal motion-safe:animate-lw-blink" />
      matched
    </div>
  </div>
);

/* Step 03 — the mutual spark. The one place the reserved green appears. */
const ConnectVisual = () => (
  <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 p-6">
    {/* Ripple rings — the hero's motif, echoed at the connect moment */}
    <div className="absolute left-1/2 top-[38%] size-[188px] -translate-x-1/2 -translate-y-1/2 motion-reduce:hidden">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute inset-0 rounded-full border border-lw-spark/25 motion-safe:animate-lw-ripple"
          style={{ animationDelay: `${i * 3}s` }}
        />
      ))}
    </div>

    <div className="relative grid size-16 place-items-center rounded-full border border-lw-spark/40 bg-lw-spark/[0.12] text-2xl text-lw-spark [filter:drop-shadow(0_0_10px_var(--lw-spark-glow))]">
      ✦
    </div>
    <div className="relative rounded-full border border-lw-spark/30 bg-lw-spark/10 px-3 py-1 font-lw-mono text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-lw-spark">
      it&apos;s a vibe
    </div>
    <div className="relative mt-1 inline-flex items-center gap-1.5 rounded-full bg-lw-spark px-4 py-2 text-[0.8rem] font-semibold text-[#08160f] shadow-[0_8px_24px_-8px_var(--lw-spark-glow)]">
      Connect <span aria-hidden>→</span>
    </div>
  </div>
);

type Props = {
  /** 1-based step index (1 = pick, 2 = match, 3 = connect). */
  step: 1 | 2 | 3;
  className?: string;
};

const StoryVisual = ({ step, className }: Props) => (
  <div className={cn('h-full w-full', className)} aria-hidden>
    {step === 1 && <PickVisual />}
    {step === 2 && <MatchVisual />}
    {step === 3 && <ConnectVisual />}
  </div>
);

export default StoryVisual;
