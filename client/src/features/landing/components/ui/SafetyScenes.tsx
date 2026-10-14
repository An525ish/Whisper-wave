import type { CSSProperties } from 'react';
import { cn } from '@/shared/utils/cn';

const SHARDS = [
  { dx: '36px', dy: '-42px', delay: '0ms', size: 'size-2', color: 'bg-lw-violet-2' },
  { dx: '48px', dy: '-8px', delay: '120ms', size: 'size-1.5', color: 'bg-lw-teal' },
  { dx: '28px', dy: '34px', delay: '240ms', size: 'size-2.5', color: 'bg-lw-spark' },
  { dx: '-32px', dy: '40px', delay: '80ms', size: 'size-1.5', color: 'bg-lw-violet' },
  { dx: '-46px', dy: '-18px', delay: '200ms', size: 'size-2', color: 'bg-lw-teal-2' },
  { dx: '8px', dy: '-52px', delay: '160ms', size: 'size-1', color: 'bg-white-pure/70' },
] as const;

/** Beat 0 — age gate */
export const SceneAgeGate = () => (
  <div className="flex flex-1 flex-col items-center justify-center gap-5 px-2 text-center">
    <div className="relative grid size-[7.5rem] place-items-center">
      <span
        className="absolute inset-0 rounded-full border border-dashed border-lw-violet-2/40 motion-safe:animate-lw-radar"
        aria-hidden
      />
      <span
        className="absolute inset-[-14%] rounded-full border border-lw-violet/25 motion-safe:animate-lw-ripple"
        aria-hidden
      />
      <span className="relative grid size-[4.75rem] place-items-center rounded-[22px] border border-lw-violet-2/50 bg-lw-violet/20 font-lw-display text-[1.85rem] tracking-tight text-lw-violet-2 shadow-[0_0_32px_-8px_rgba(139,107,255,0.8)]">
        18+
      </span>
    </div>
    <div className="w-full max-w-[15rem] space-y-2">
      <div className="rounded-xl border border-lw-line bg-white-pure/[0.04] px-3 py-2.5 text-left">
        <p className="font-lw-mono text-[0.58rem] uppercase tracking-[0.14em] text-lw-text-faint">
          confirm to continue
        </p>
        <p className="mt-1 text-[0.92rem] text-lw-text">I am 18 or older</p>
      </div>
      <div className="rounded-xl border border-lw-violet/40 bg-[linear-gradient(135deg,rgba(139,107,255,0.35),rgba(90,63,214,0.25))] px-3 py-2.5 font-semibold text-lw-text shadow-[0_10px_28px_-12px_rgba(90,63,214,0.7)]">
        Enter the queue →
      </div>
    </div>
  </div>
);

/** Beat 1 — report / block / safe exit in a live chat */
export const SceneInChat = () => (
  <div className="flex flex-1 flex-col justify-center gap-3">
    <div className="mr-auto max-w-[82%] rounded-2xl rounded-bl-md border border-lw-violet/30 bg-lw-violet/15 px-3.5 py-2.5 text-[0.88rem] leading-snug text-lw-text">
      hey, random but… moon or sun person?
    </div>
    <div className="ml-auto max-w-[82%] rounded-2xl rounded-br-md border border-border bg-primary/85 px-3.5 py-2.5 text-[0.88rem] leading-snug text-body">
      moon. also please don’t be weird
    </div>

    <div className="mt-2 grid grid-cols-3 gap-1.5">
      {[
        { label: 'Report', hint: 'we see it', tone: 'text-lw-teal-2 border-lw-teal/35 bg-lw-teal/10' },
        { label: 'Block', hint: 'cut wave', tone: 'text-lw-violet-2 border-lw-violet/35 bg-lw-violet/10' },
        { label: 'Safe exit', hint: 'instant', tone: 'text-lw-spark border-lw-spark/35 bg-lw-spark/10' },
      ].map((action) => (
        <div
          key={action.label}
          className={cn(
            'rounded-xl border px-2 py-2 text-center motion-safe:animate-lw-pop',
            action.tone,
          )}
        >
          <p className="font-lw-mono text-[0.68rem] font-semibold uppercase tracking-[0.08em]">
            {action.label}
          </p>
          <p className="mt-0.5 text-[0.62rem] text-lw-text-faint">{action.hint}</p>
        </div>
      ))}
    </div>
    <p className="text-center font-lw-mono text-[0.58rem] uppercase tracking-[0.14em] text-lw-text-faint">
      partner never sees that you left
    </p>
  </div>
);

/** Beat 2 — fork: skip dissolves, mutual keeps */
export const SceneOutcome = ({ active }: { active: boolean }) => (
  <div className="flex flex-1 flex-col justify-center gap-4">
    <div className="grid grid-cols-2 gap-2">
      {/* Skip path */}
      <div className="relative overflow-hidden rounded-2xl border border-white-pure/10 bg-white-pure/[0.03] p-3">
        <p className="font-lw-mono text-[0.58rem] uppercase tracking-[0.14em] text-lw-text-faint">
          you skip
        </p>
        <div className="relative mt-3 flex justify-center">
          <span
            className={cn(
              'grid size-11 place-items-center rounded-xl border border-dashed border-white-pure/25 font-lw-mono text-sm text-lw-text-faint',
              active && 'motion-safe:animate-lw-vanish-loop',
            )}
          >
            ?
          </span>
          {active &&
            SHARDS.slice(0, 5).map((shard, i) => (
              <span
                key={i}
                aria-hidden
                className={cn(
                  'pointer-events-none absolute top-2 rounded-full motion-safe:animate-lw-shard motion-reduce:hidden',
                  shard.size,
                  shard.color,
                )}
                style={
                  {
                    '--dx': shard.dx,
                    '--dy': shard.dy,
                    animationDelay: shard.delay,
                  } as CSSProperties
                }
              />
            ))}
        </div>
        <p className="mt-3 font-lw-display text-[1.05rem] tracking-[-0.02em] text-lw-text">
          Gone.
        </p>
        <p className="mt-0.5 text-[0.72rem] leading-snug text-lw-text-dim">No trail. No re-find.</p>
      </div>

      {/* Mutual path */}
      <div className="relative overflow-hidden rounded-2xl border border-lw-spark/35 bg-lw-spark/10 p-3">
        <p className="font-lw-mono text-[0.58rem] uppercase tracking-[0.14em] text-lw-spark">
          mutual vibe
        </p>
        <div className="mt-3 flex items-center justify-center gap-1.5">
          <span className="grid size-9 place-items-center rounded-lg border border-lw-violet-2/40 bg-lw-violet/20 font-lw-mono text-[0.65rem] text-lw-violet-2">
            you
          </span>
          <span className="text-lw-spark">✦</span>
          <span className="grid size-9 place-items-center rounded-lg border border-lw-spark/40 bg-lw-spark/15 font-lw-mono text-[0.65rem] text-lw-spark">
            them
          </span>
        </div>
        <p className="mt-3 font-lw-display text-[1.05rem] tracking-[-0.02em] text-lw-text">
          Keep DM.
        </p>
        <p className="mt-0.5 text-[0.72rem] leading-snug text-lw-text-dim">Only if both spark.</p>
      </div>
    </div>
    <p className="text-center font-lw-mono text-[0.58rem] uppercase tracking-[0.14em] text-lw-text-faint">
      ephemeral by default · permanent by choice
    </p>
  </div>
);
