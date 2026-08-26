import HeroAtmosphere from '@/components/landing/ui/HeroAtmosphere';
import HeroCopy from '@/components/landing/ui/HeroCopy';
import GlassPane from '@/components/landing/ui/GlassPane';

/**
 * Section 1 — the hero. A full-viewport "liquid glass" stage: a quiet
 * signal-ripple backdrop behind a two-column grid that pairs the pitch
 * (HeroCopy) with the living chat pane (GlassPane), the page's signature.
 *
 * `isolate` + `overflow-hidden` contain the backdrop's screen blends so they
 * never bleed into the sections below. The grid collapses to a single centered
 * column under 900px.
 *
 * The base is the app's own `--color-background` (rgb(33 26 42)) so the hero
 * reads as the same surface as the rest of the product and the login page — the
 * violet/teal identity lives in the backdrop layer on top, not the base.
 */
const HeroSection = () => (
  <section
    aria-label="Whisper Wave hero"
    className="relative isolate flex min-h-screen flex-col justify-center overflow-hidden bg-background px-[clamp(16px,4vw,40px)] pt-32 font-lw-body text-lw-text antialiased max-[900px]:pt-28"
  >
    <HeroAtmosphere />

    <div className="relative z-[2] mx-auto grid w-full max-w-[1200px] items-center gap-[clamp(32px,5vw,72px)] [grid-template-columns:minmax(0,1.08fr)_minmax(0,0.92fr)] max-[900px]:grid-cols-1 max-[900px]:gap-12">
      <HeroCopy />
      <GlassPane />
    </div>
  </section>
);

export default HeroSection;
