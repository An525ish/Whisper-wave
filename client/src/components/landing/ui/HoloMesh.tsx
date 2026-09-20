import { cn } from '@/utils/cn';

/**
 * Aurora mesh — the atmosphere the holographic face is projected into. A few
 * large, soft violet/teal light-blobs drift and slowly hue-shift behind the
 * projection (via `animate-lw-aurora`), overlaid with a faint holographic
 * scan-grid so the whole field reads as a live volumetric display rather than
 * a flat gradient. Green is withheld — this is the stranger/you palette only.
 *
 * Purely decorative → aria-hidden. Motion is `motion-safe` gated; under
 * reduced-motion the blobs simply sit still. The host controls placement.
 *
 * `flip` mirrors the whole field vertically (and nudges it horizontally) so a
 * following section reads as a continuation of the one above — its blobs sit
 * high/inverted where the previous section's sat low, keeping the aurora
 * flowing across the seam instead of looking copy-pasted.
 *
 * `blobs={false}` drops the soft light-pools and keeps just the scan-grid +
 * vignette — used by sections below the hero, where we want the mesh texture
 * to carry through but not the coloured glow.
 */

type Props = { className?: string; flip?: boolean; blobs?: boolean };

const HoloMesh = ({ className, flip = false, blobs = true }: Props) => (
  <div className={cn('pointer-events-none overflow-hidden', className)} aria-hidden>
    {/* drifting light-blobs — a violet + teal pair on a balanced diagonal.
        Only the blobs flip (not the grid), so the grid stays aligned. */}
    {blobs && (
      <div
        className={cn(
          'absolute inset-0 will-change-transform motion-safe:animate-lw-aurora',
          flip && '-scale-y-100 -scale-x-100',
        )}
      >
        {/* violet — upper right */}
        <div className="absolute left-[62%] top-[32%] size-[42vw] max-w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 mix-blend-screen blur-[100px] bg-[radial-gradient(circle,rgba(139,107,255,0.55),transparent_66%)]" />
        {/* teal — lower left */}
        <div className="absolute left-[38%] top-[68%] size-[34vw] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-55 mix-blend-screen blur-[92px] bg-[radial-gradient(circle,rgba(53,224,200,0.42),transparent_68%)]" />
        {/* violet-2 — faint accent between them */}
        <div className="absolute left-[52%] top-[52%] size-[22vw] max-w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 mix-blend-screen blur-[80px] bg-[radial-gradient(circle,rgba(182,164,255,0.5),transparent_70%)]" />
      </div>
    )}

    {/* holographic scan-grid — faint perspective lines. `fixed` attachment
        anchors the grid to the viewport, not the section, so the lines line up
        seamlessly across every section boundary instead of resetting. */}
    <div
      className="absolute inset-0 opacity-[0.06] mix-blend-screen"
      style={{
        backgroundImage:
          'linear-gradient(rgba(182,164,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(134,242,228,0.7) 1px, transparent 1px)',
        backgroundSize: '46px 46px',
        backgroundAttachment: 'fixed',
        maskImage: 'radial-gradient(120% 90% at 60% 45%, #000 30%, transparent 78%)',
        WebkitMaskImage: 'radial-gradient(120% 90% at 60% 45%, #000 30%, transparent 78%)',
      }}
    />

    {/* settle the field back into the plum base at the edges */}
    <div className="absolute inset-0 bg-[radial-gradient(140%_110%_at_60%_45%,transparent_46%,rgba(20,14,32,0.72)_100%)]" />
  </div>
);

export default HoloMesh;
