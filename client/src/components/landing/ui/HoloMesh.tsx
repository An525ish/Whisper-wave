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
 */

type Props = { className?: string };

const HoloMesh = ({ className }: Props) => (
  <div className={cn('pointer-events-none overflow-hidden', className)} aria-hidden>
    {/* drifting light-blobs */}
    <div className="absolute inset-0 motion-safe:animate-lw-aurora will-change-transform">
      <div className="absolute left-[54%] top-[30%] size-[62vw] max-w-[820px] -translate-x-1/2 rounded-full opacity-70 mix-blend-screen blur-[110px] bg-[radial-gradient(circle,rgba(139,107,255,0.55),transparent_64%)]" />
      <div className="absolute left-[72%] top-[58%] size-[42vw] max-w-[560px] rounded-full opacity-55 mix-blend-screen blur-[100px] bg-[radial-gradient(circle,rgba(53,224,200,0.42),transparent_66%)]" />
      <div className="absolute left-[40%] top-[68%] size-[36vw] max-w-[460px] rounded-full opacity-45 mix-blend-screen blur-[90px] bg-[radial-gradient(circle,rgba(182,164,255,0.5),transparent_68%)]" />
    </div>

    {/* holographic scan-grid — faint perspective lines */}
    <div
      className="absolute inset-0 opacity-[0.06] mix-blend-screen"
      style={{
        backgroundImage:
          'linear-gradient(rgba(182,164,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(134,242,228,0.7) 1px, transparent 1px)',
        backgroundSize: '46px 46px',
        maskImage: 'radial-gradient(120% 90% at 60% 45%, #000 30%, transparent 78%)',
        WebkitMaskImage: 'radial-gradient(120% 90% at 60% 45%, #000 30%, transparent 78%)',
      }}
    />

    {/* settle the field back into the plum base at the edges */}
    <div className="absolute inset-0 bg-[radial-gradient(140%_110%_at_60%_45%,transparent_46%,rgba(20,14,32,0.72)_100%)]" />
  </div>
);

export default HoloMesh;
