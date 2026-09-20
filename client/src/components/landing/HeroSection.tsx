import HoloMesh from '@/components/landing/ui/HoloMesh';
import HeroCopy from '@/components/landing/ui/HeroCopy';
import GlassPane from '@/components/landing/ui/GlassPane';
import { useMatchArc } from '@/hooks/landing/useMatchArc';

/**
 * Section 2 — Live product demo arc.
 * Shows the full Match Arc (search → match → chat → spark) so visitors
 * can see exactly how the product feels before they sign up.
 */
const DemoSection = () => {
  const { phase, chatActive, onSpark, onCycleComplete } = useMatchArc();

  return (
    <section
      id="how"
      aria-label="How Whisper Wave works"
      className="relative isolate overflow-hidden bg-background px-[clamp(16px,4vw,40px)] py-[clamp(72px,12vh,120px)] font-lw-body text-lw-text antialiased"
    >
      {/* Shared mesh grid — texture carried from the hero, no coloured glow */}
      <HoloMesh blobs={false} className="absolute inset-0 z-0" />
      <div className="lw-grain pointer-events-none absolute inset-0 z-[1] opacity-[0.04] mix-blend-overlay" aria-hidden />

      {/* Section label — kept quiet so the rotating headline below leads */}
      <div className="relative z-[2] mx-auto mb-12 flex max-w-[640px] flex-col items-center gap-2.5 text-center">
        <p className="inline-flex items-center gap-2 font-lw-mono text-[0.72rem] uppercase tracking-[0.26em] text-lw-teal-2">
          <span className="size-1.5 rounded-full bg-lw-teal shadow-[0_0_6px_var(--color-lw-teal)] motion-safe:animate-lw-blink" />
          watch it happen
        </p>
        <h2 className="font-lw-body text-[clamp(1rem,1.7vw,1.2rem)] font-normal leading-relaxed text-lw-text-dim">
          No sign-up to look around — here&apos;s the whole thing, playing out live.
        </h2>
      </div>

      <div className="relative z-[2] mx-auto grid w-full max-w-[1200px] items-center gap-[clamp(32px,5vw,72px)] [grid-template-columns:minmax(0,0.95fr)_minmax(0,1.05fr)] max-[900px]:grid-cols-1 max-[900px]:gap-10">
        <div className="order-2 min-[901px]:order-1">
          <HeroCopy phase={phase} />
        </div>

        <div className="order-1 min-[901px]:order-2">
          <GlassPane
            phase={phase}
            chatActive={chatActive}
            onSpark={onSpark}
            onCycleComplete={onCycleComplete}
          />
        </div>
      </div>
    </section>
  );
};

export default DemoSection;
