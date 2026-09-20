import HeroAtmosphere from '@/components/landing/ui/HeroAtmosphere';
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
      <HeroAtmosphere />

      {/* Section label */}
      <div className="relative z-[2] mx-auto mb-12 max-w-[1200px] text-center">
        <p className="font-lw-mono text-[0.72rem] uppercase tracking-[0.26em] text-lw-teal-2">
          watch it happen
        </p>
        <h2 className="mt-3 font-lw-display text-[clamp(1.85rem,3.5vw,2.8rem)] font-normal tracking-[-0.03em] text-lw-text">
          This is the product. Right here.
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
