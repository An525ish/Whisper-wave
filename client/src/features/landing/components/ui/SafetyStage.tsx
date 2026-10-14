import { cn } from '@/shared/utils/cn';
import type { SafetyBeat } from '../../types';
import { SceneAgeGate, SceneInChat, SceneOutcome } from './SafetyScenes';

const BEAT_META = [
  {
    kicker: '01 · before you enter',
    title: 'Age gate first.',
    caption: 'Confirm you’re 18+. No queue until you do.',
  },
  {
    kicker: '02 · inside the chat',
    title: 'Exits always on.',
    caption: 'Report, block, or safe-exit — partner never gets a goodbye note.',
  },
  {
    kicker: '03 · when it ends',
    title: 'Skip = gone forever.',
    caption: 'No history. No re-find. Mutual spark is the only way they stay.',
  },
] as const;

/**
 * Floating glass that plays the full safety loop:
 * age gate → report/block/exit → skip dissolve vs mutual keep.
 */
export const SafetyStage = ({ active, beat }: { active: boolean; beat: SafetyBeat }) => {
  const meta = BEAT_META[beat];

  return (
    <div className="relative mx-auto w-full max-w-[380px] min-[900px]:mx-0 min-[900px]:max-w-none">
      <div
        className="pointer-events-none absolute inset-x-[12%] -bottom-4 h-16 rounded-[100%] bg-[radial-gradient(ellipse,rgba(139,107,255,0.45),transparent_70%)] blur-xl"
        aria-hidden
      />

      <div
        className={cn(
          'lw-glass lw-rim relative flex min-h-[460px] w-full flex-col overflow-hidden rounded-[30px]',
          '[transform:perspective(1200px)_rotateY(8deg)_rotateX(3deg)]',
          'shadow-[0_40px_80px_-28px_rgba(6,3,16,0.95),0_0_0_1px_rgba(255,255,255,0.06)]',
          'max-[900px]:min-h-[420px] max-[900px]:[transform:none]',
          active && 'motion-safe:animate-lw-float',
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[#07050f]" aria-hidden />
        <div
          className="pointer-events-none absolute inset-[-45%] opacity-50 mix-blend-screen blur-[30px] bg-[conic-gradient(from_210deg_at_50%_45%,rgba(139,107,255,0.55),transparent_28%,rgba(53,224,200,0.4),transparent_58%,rgba(1,195,109,0.35),transparent_78%)] motion-safe:animate-lw-refract"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,transparent_18%,rgba(7,5,15,0.78)_78%)]" aria-hidden />

        <div className="relative z-[2] flex flex-1 flex-col px-5 pb-5 pt-5">
          {/* Beat stepper */}
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-white-pure/[0.07] pb-3">
            <p className="font-lw-mono text-[0.62rem] uppercase tracking-[0.18em] text-lw-teal-2">
              {meta.kicker}
            </p>
            <div className="flex items-center gap-1.5" aria-hidden>
              {([0, 1, 2] as const).map((i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1 rounded-full transition-all duration-500',
                    i === beat ? 'w-5 bg-lw-teal' : i < beat ? 'w-2.5 bg-lw-violet-2/70' : 'w-2.5 bg-white-pure/15',
                  )}
                />
              ))}
            </div>
          </div>

          {/* Scenes stacked in one box to avoid layout jump */}
          <div className="relative grid min-h-[280px] flex-1">
            <div
              className={cn(
                'col-start-1 row-start-1 flex transition-opacity duration-500',
                beat === 0 ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
              aria-hidden={beat !== 0}
            >
              <SceneAgeGate />
            </div>
            <div
              className={cn(
                'col-start-1 row-start-1 flex transition-opacity duration-500',
                beat === 1 ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
              aria-hidden={beat !== 1}
            >
              <SceneInChat />
            </div>
            <div
              className={cn(
                'col-start-1 row-start-1 flex transition-opacity duration-500',
                beat === 2 ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
              aria-hidden={beat !== 2}
            >
              <SceneOutcome active={active && beat === 2} />
            </div>
          </div>

          <div className="mt-4 border-t border-white-pure/[0.07] pt-4 text-center">
            <p className="font-lw-display text-[1.2rem] tracking-[-0.02em] text-lw-text">{meta.title}</p>
            <p className="mt-1 text-[0.86rem] leading-snug text-lw-text-dim">{meta.caption}</p>
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.12)_0%,transparent_28%,transparent_72%,rgba(53,224,200,0.07)_100%)]"
          aria-hidden
        />
      </div>
    </div>
  );
};
