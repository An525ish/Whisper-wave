/**
 * Purely decorative hero backdrop, tuned to the app's own
 * `--color-background` (rgb(33 26 42)) base. A soft violet glow pools behind
 * the chat pane, balanced by a low teal counterweight, a fine grain film, and
 * a gentle vignette that seats the content. All the boldness is spent on the
 * chat pane itself; the backdrop stays disciplined, still, and calm.
 *
 * Every layer is aria-hidden and pointer-transparent, and nothing here
 * animates — so the scene is identical whether motion is on or off, and
 * nothing sweeps or blooms around the pane on load.
 *
 * The parent hero uses `isolate` + `overflow-hidden` so these screen blends
 * stay contained and never bleed into the sections below.
 */
const HeroAtmosphere = () => (
  <>
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
      {/* Soft violet glow pooled behind the chat pane */}
      <div className="absolute left-1/2 top-1/2 size-[min(92vh,780px)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80 mix-blend-screen blur-[64px] bg-[radial-gradient(circle,rgba(139,107,255,0.5),transparent_62%)] min-[900px]:left-[64%]" />

      {/* Low teal glow — a cooler counterweight, bottom-left */}
      <div className="absolute bottom-[-14%] left-[-10%] size-[46vw] rounded-full opacity-60 mix-blend-screen blur-[80px] bg-[radial-gradient(circle,rgba(53,224,200,0.36),transparent_66%)]" />

      {/* Gentle vignette — eases toward the app's darkest shade near the frame */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_88%_at_50%_42%,transparent_56%,rgba(26,21,32,0.55)_100%)] min-[900px]:bg-[radial-gradient(115%_85%_at_64%_45%,transparent_54%,rgba(26,21,32,0.55)_100%)]" />
    </div>

    {/* Grain film over the whole hero */}
    <div className="lw-grain pointer-events-none absolute inset-0 z-[1] opacity-[0.04] mix-blend-overlay" aria-hidden />
  </>
);

export default HeroAtmosphere;
