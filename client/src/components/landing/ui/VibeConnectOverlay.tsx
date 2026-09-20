import { cn } from '@/utils/cn';

type Props = {
  active: boolean;
};

/**
 * Mutual-vibe climax — dark overlay, soft green oval, merge → Connect.
 * Keeps green reserved for accents, not a neon green screen.
 */
const VibeConnectOverlay = ({ active }: Props) => (
  <div
    className={cn(
      'absolute inset-0 z-[6] flex flex-col items-center justify-center overflow-hidden px-6',
      'bg-[rgba(26,21,32,0.82)] backdrop-blur-[10px]',
      'transition-[opacity,visibility] duration-500 ease-out',
      active ? 'visible opacity-100' : 'invisible opacity-0',
    )}
  >
    <div className="pointer-events-none absolute left-1/2 top-[40%] size-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green/[0.12] blur-3xl" />

    <div className="relative mb-7 flex h-[72px] w-full max-w-[220px] items-center justify-center">
      {active && (
        <>
          <span className="absolute size-[46px] rounded-full border border-border bg-primary/80 motion-safe:animate-lw-merge-left motion-reduce:opacity-0" />
          <span className="absolute size-[46px] rounded-full border border-border bg-primary/70 motion-safe:animate-lw-merge-right motion-reduce:opacity-0" />
          <span className="absolute grid size-[56px] place-items-center rounded-2xl border border-green/40 bg-green-dark/80 text-[1.45rem] text-green shadow-[0_0_28px_-8px_rgba(1,195,109,0.45)] motion-safe:animate-lw-fuse-in motion-reduce:opacity-100">
            ✦
          </span>
        </>
      )}
    </div>

    <p
      className={cn(
        'relative z-[1] font-lw-mono text-[0.7rem] uppercase tracking-[0.28em] text-green',
        'transition-[opacity,translate] duration-500',
        active ? 'translate-y-0 opacity-100 delay-600' : 'translate-y-2 opacity-0',
      )}
    >
      mutual spark
    </p>

    <h3
      className={cn(
        'relative z-[1] mt-2 font-lw-display text-[clamp(1.85rem,4vw,2.35rem)] tracking-[-0.03em] text-body',
        'transition-[opacity,translate] duration-500',
        active ? 'translate-y-0 opacity-100 delay-700' : 'translate-y-3 opacity-0',
      )}
    >
      It&apos;s a <span className="text-green">vibe.</span>
    </h3>

    <p
      className={cn(
        'relative z-[1] mt-2 max-w-[18rem] text-center text-[0.82rem] leading-relaxed text-body-300',
        'transition-[opacity,translate] duration-500',
        active ? 'translate-y-0 opacity-100 delay-[800ms]' : 'translate-y-2 opacity-0',
      )}
    >
      Both of you felt it. Connect to keep this stranger for real.
    </p>

    <div
      className={cn(
        'relative z-[1] mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5',
        'border border-green/35 bg-gradient-action-button-green text-[0.9rem] font-semibold text-body',
        'transition-[opacity,translate,scale] duration-500 ease-[cubic-bezier(0.2,1.2,0.4,1)]',
        active
          ? 'translate-y-0 scale-100 opacity-100 delay-[900ms]'
          : 'translate-y-3 scale-95 opacity-0',
      )}
    >
      Connect
      <svg viewBox="0 0 24 24" fill="none" className="size-3.5" aria-hidden>
        <path
          d="M5 12H19M12 5L19 12L12 19"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  </div>
);

export default VibeConnectOverlay;
