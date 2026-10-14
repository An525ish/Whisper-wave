import { useScrollReveal } from '../hooks/useScrollReveal';
import HoloMesh from './ui/HoloMesh';
import { SparkPassTeaser } from './ui/BentoSparkPassTeaser';
import { ConnectionsTile, GoneTile, SafeExitTile, ZeroProfileTile } from './ui/BentoTiles';
import { cn } from '@/shared/utils/cn';

/**
 * "Why Whisper Wave" — an asymmetric frosted-glass bento. Each tile carries ONE
 * crafted glass specimen (a blown-glass object with real depth: rim light,
 * specular highlight, inner shadow, a soft cast glow) rather than a flat icon,
 * so the whole grid reads as one liquid-glass material system — the brand's
 * own mark, made physical. Colour keeps its meaning: violet = anonymity /
 * the stranger, teal = you, green = the spark (reserved for the connection
 * climax only).
 *
 * One scroll observer drives a staggered reveal; everything degrades to
 * fully-visible + still under `prefers-reduced-motion`.
 */

/* ── Section ─────────────────────────────────────────────────────────────── */

const BentoSection = () => {
  const { ref, isVisible } = useScrollReveal<HTMLElement>();

  return (
    <section id="why" ref={ref} className="relative overflow-hidden bg-lw-base py-24 sm:py-32">
      <HoloMesh blobs={false} />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        {/* header */}
        <div className="mb-14 flex flex-col gap-4">
          <span className="font-lw-mono text-[0.7rem] uppercase tracking-[0.32em] text-lw-text-faint">
            built different
          </span>
          <h2 className="max-w-2xl font-lw-display text-[clamp(2rem,4.5vw,3.1rem)] font-medium leading-[1.05] tracking-[-0.02em] text-lw-text">
            Why Whisper Wave.
          </h2>
          <p className="max-w-xl text-[1.02rem] leading-relaxed text-lw-text-dim">
            Every choice here bends toward the same thing: honest talk between strangers, with a clean way in and a clean
            way out.
          </p>
        </div>

        {/* bento grid — staggered reveal */}
        <div
          className={cn(
            'grid grid-cols-1 gap-4 transition-all duration-700 ease-out min-[720px]:grid-cols-2 min-[960px]:grid-cols-[1fr_1.4fr_1fr] min-[960px]:auto-rows-fr',
            isVisible ? 'opacity-100' : 'translate-y-6 opacity-0',
          )}
        >
          {[ZeroProfileTile, GoneTile, ConnectionsTile, SafeExitTile, SparkPassTeaser].map((TileEl, i) => (
            <TileEl key={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BentoSection;

