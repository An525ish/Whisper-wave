import WaveOrb from '@/components/landing/ui/WaveOrb';

/**
 * "The Whisper Wave orb", dressed as a volumetric projection. From the ground
 * up: an emitter base with pulsing rings, a faint light-cone rising into the
 * frame, the oscillating wave-orb itself (see WaveOrb), a scan bar sweeping the
 * projection, and floating glass HUD tags. The orb has no face — just signal —
 * which is the anonymity; the chrome makes it read as a live, futuristic
 * display of countless strangers being tuned in.
 *
 * Everything but WaveOrb is decorative → aria-hidden. Motion is `motion-safe`
 * gated so it holds still under reduced-motion.
 *
 * (Named HoloFace for continuity with the hero; it now projects the orb.)
 */

const HoloFace = () => (
  <div className="relative aspect-square w-full">
    {/* light-cone rising from the emitter into the projection */}
    <div
      className="pointer-events-none absolute inset-x-[18%] bottom-[6%] top-[24%] opacity-40 mix-blend-screen"
      style={{
        background: 'linear-gradient(to top, rgba(134,242,228,0.28), rgba(139,107,255,0.12) 40%, transparent 78%)',
        clipPath: 'polygon(38% 100%, 62% 100%, 88% 0, 12% 0)',
      }}
      aria-hidden
    />

    {/* the projection itself — powers on, flickers faintly */}
    <div className="absolute inset-0 motion-safe:animate-lw-holo-rise" aria-hidden>
      <div className="size-full motion-safe:animate-lw-holo-flicker">
        <WaveOrb className="absolute inset-0 size-full" />
      </div>

      {/* scan bar sweeping down the projection */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-[10%] h-[14%] motion-safe:animate-lw-scan bg-[linear-gradient(to_bottom,transparent,rgba(134,242,228,0.5),transparent)] blur-[2px]" />
      </div>

      {/* horizontal hologram scan-lines over the orb */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.1] mix-blend-overlay"
        style={{
          backgroundImage: 'repeating-linear-gradient(rgba(255,255,255,0.6) 0 1px, transparent 1px 5px)',
        }}
      />
    </div>

    {/* emitter base: glow disc + pulsing rings */}
    <div className="pointer-events-none absolute inset-x-0 bottom-[3%] flex flex-col items-center" aria-hidden>
      <div className="relative h-10 w-[62%]">
        {[0, 1.2, 2.4].map((delay) => (
          <span
            key={delay}
            className="absolute inset-0 rounded-[100%] border border-lw-teal/40 motion-safe:animate-lw-holo-ring"
            style={{ animationDelay: `${delay}s` }}
          />
        ))}
        <span className="absolute inset-x-[24%] bottom-0 h-2.5 rounded-[100%] bg-lw-teal/70 blur-[6px]" />
        <span className="absolute inset-x-[38%] bottom-[3px] h-1.5 rounded-[100%] bg-lw-teal-2 blur-[2px]" />
      </div>
    </div>

    {/* floating glass HUD tags */}
    <div className="pointer-events-none absolute left-[2%] top-[14%] motion-safe:animate-lw-float" aria-hidden>
      <div className="lw-rim relative rounded-lg border border-lw-line bg-lw-ink/60 px-2.5 py-1.5 font-lw-mono text-[0.58rem] tracking-[0.14em] backdrop-blur-sm">
        <span className="text-lw-teal-2">ANON_</span>
        <span className="text-lw-text-faint">████</span>
      </div>
    </div>
    <div
      className="pointer-events-none absolute right-[1%] top-[46%] motion-safe:animate-lw-float"
      style={{ animationDelay: '1.4s' }}
      aria-hidden
    >
      <div className="lw-rim relative flex items-center gap-1.5 rounded-lg border border-lw-line bg-lw-ink/60 px-2.5 py-1.5 font-lw-mono text-[0.56rem] tracking-[0.12em] text-lw-text-faint backdrop-blur-sm">
        <span className="size-1 rounded-full bg-lw-teal shadow-[0_0_6px_var(--color-lw-teal)] motion-safe:animate-lw-blink" />
        live signal
      </div>
    </div>
    <div className="pointer-events-none absolute bottom-[13%] left-[6%] font-lw-mono text-[0.56rem] tracking-[0.1em] text-lw-text-faint opacity-70" aria-hidden>
      carrying 2,417 voices
    </div>
  </div>
);

export default HoloFace;
