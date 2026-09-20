import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

const focusRing =
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-lw-teal-2';

/* ─────────────────────────────────────────
   Anonymous figure — SVG silhouette with
   glowing mask / visor + floating ID badge
───────────────────────────────────────── */
const AnonFigure = () => (
  <div className="relative" aria-hidden>
    {/* Aura pulse rings behind the figure */}
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-lw-violet/30 motion-safe:animate-lw-radar"
          style={{
            width: `${200 + i * 80}px`,
            height: `${200 + i * 80}px`,
            animationDelay: `${i * 0.7}s`,
          }}
        />
      ))}
    </div>

    <svg
      viewBox="0 0 220 320"
      className="relative z-[1] w-[clamp(180px,25vw,260px)] drop-shadow-[0_0_40px_rgba(139,107,255,0.6)]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="bodyGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="rgba(139,107,255,0.18)" />
          <stop offset="100%" stopColor="rgba(6,4,14,0.9)" />
        </radialGradient>
        <radialGradient id="visorGrad" cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="rgba(53,224,200,0.85)" />
          <stop offset="50%" stopColor="rgba(139,107,255,0.7)" />
          <stop offset="100%" stopColor="rgba(6,4,14,0.4)" />
        </radialGradient>
        <radialGradient id="visorReflect" cx="30%" cy="30%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <clipPath id="headClip">
          <ellipse cx="110" cy="90" rx="52" ry="60" />
        </clipPath>
        <linearGradient id="bodyEdge" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(139,107,255,0.6)" />
          <stop offset="50%" stopColor="rgba(182,164,255,0.25)" />
          <stop offset="100%" stopColor="rgba(53,224,200,0.4)" />
        </linearGradient>
        <linearGradient id="shoulderLine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(53,224,200,0)" />
          <stop offset="30%" stopColor="rgba(53,224,200,0.6)" />
          <stop offset="70%" stopColor="rgba(139,107,255,0.6)" />
          <stop offset="100%" stopColor="rgba(139,107,255,0)" />
        </linearGradient>
      </defs>

      {/* Body / torso silhouette */}
      <path
        d="M40 320 C35 280 28 240 32 210 C38 185 55 175 75 168 L85 165 C90 162 100 160 110 160 C120 160 130 162 135 165 L145 168 C165 175 182 185 188 210 C192 240 185 280 180 320 Z"
        fill="url(#bodyGrad)"
        stroke="url(#bodyEdge)"
        strokeWidth="1.5"
      />

      {/* Shoulder shimmer line */}
      <path
        d="M48 195 C70 182 90 175 110 173 C130 175 150 182 172 195"
        stroke="url(#shoulderLine)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Neck */}
      <rect x="97" y="142" width="26" height="26" rx="4" fill="url(#bodyGrad)" stroke="rgba(182,164,255,0.2)" strokeWidth="1" />

      {/* Head shell */}
      <ellipse cx="110" cy="90" rx="52" ry="60" fill="url(#bodyGrad)" stroke="rgba(182,164,255,0.3)" strokeWidth="1.5" />

      {/* Helmet detail lines */}
      <path d="M62 70 C65 48 80 30 110 28 C140 30 155 48 158 70" stroke="rgba(182,164,255,0.2)" strokeWidth="1" strokeLinecap="round" />
      <path d="M64 110 C60 120 62 132 68 140" stroke="rgba(182,164,255,0.15)" strokeWidth="1" strokeLinecap="round" />
      <path d="M156 110 C160 120 158 132 152 140" stroke="rgba(182,164,255,0.15)" strokeWidth="1" strokeLinecap="round" />

      {/* Visor — the face mask */}
      <path
        d="M72 72 C72 60 80 52 110 52 C140 52 148 60 148 72 L148 106 C148 118 140 128 110 130 C80 128 72 118 72 106 Z"
        fill="url(#visorGrad)"
        filter="url(#glow)"
      />
      {/* Visor inner reflection */}
      <path
        d="M78 72 C78 62 85 56 110 56 C135 56 142 62 142 72 L142 106 C142 116 136 124 110 126 C84 124 78 116 78 106 Z"
        fill="url(#visorReflect)"
        opacity="0.25"
      />
      {/* Visor scan line — animated */}
      <line x1="74" y1="90" x2="146" y2="90" stroke="rgba(53,224,200,0.45)" strokeWidth="1" strokeDasharray="4 6" className="motion-safe:animate-lw-signal" style={{ animationDuration: '3s' }} />

      {/* Visor glow rim */}
      <path
        d="M72 72 C72 60 80 52 110 52 C140 52 148 60 148 72 L148 106 C148 118 140 128 110 130 C80 128 72 118 72 106 Z"
        fill="none"
        stroke="rgba(53,224,200,0.7)"
        strokeWidth="1.2"
        filter="url(#glow)"
      />

      {/* Cross-hatch detail on lower visor */}
      <path d="M84 112 L90 120 M94 110 L100 120 M104 110 L108 118" stroke="rgba(53,224,200,0.2)" strokeWidth="0.8" strokeLinecap="round" />

      {/* Redacted name badge on chest */}
      <rect x="80" y="200" width="60" height="22" rx="4" fill="rgba(139,107,255,0.15)" stroke="rgba(182,164,255,0.3)" strokeWidth="1" />
      <rect x="86" y="207" width="28" height="4" rx="2" fill="rgba(182,164,255,0.5)" />
      <rect x="86" y="213" width="18" height="3" rx="1.5" fill="rgba(182,164,255,0.25)" />

      {/* Small antenna / sensor top of helmet */}
      <line x1="110" y1="28" x2="110" y2="14" stroke="rgba(53,224,200,0.5)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="110" cy="11" r="3" fill="rgba(53,224,200,0.8)" className="motion-safe:animate-lw-blink" />
    </svg>

    {/* Floating ID tag */}
    <div className="absolute -right-2 top-[15%] z-[2] font-lw-mono text-[0.55rem] tracking-[0.1em]">
      <div className="rounded-md border border-lw-violet/40 bg-[rgba(6,4,14,0.85)] px-2 py-1 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-lw-spark motion-safe:animate-lw-blink" />
          <span className="text-lw-teal-2">ANON_</span>
          <span className="text-lw-text-faint">████</span>
        </div>
        <div className="mt-0.5 text-[0.5rem] text-lw-text-faint opacity-60">identity masked</div>
      </div>
      {/* connector line */}
      <div className="ml-[-2px] mt-0.5 h-4 w-px bg-[linear-gradient(to_bottom,rgba(139,107,255,0.5),transparent)]" />
    </div>
  </div>
);

/* ─────────────────────────────────────────
   Redacted chat bubbles that float around
───────────────────────────────────────── */
const BUBBLES = [
  { side: 'left',  lines: [28, 44, 20], delay: '0s',    dur: '18s', x: '-5%',  y: '20%' },
  { side: 'right', lines: [36, 22],     delay: '4s',    dur: '22s', x: '88%',  y: '15%' },
  { side: 'left',  lines: [18, 32],     delay: '8s',    dur: '20s', x: '-2%',  y: '65%' },
  { side: 'right', lines: [44, 28, 16], delay: '2s',    dur: '25s', x: '84%',  y: '58%' },
  { side: 'left',  lines: [30],         delay: '12s',   dur: '19s', x: '5%',   y: '42%' },
  { side: 'right', lines: [22, 38],     delay: '6s',    dur: '28s', x: '80%',  y: '38%' },
] as const;

const RedactedBubbles = () => (
  <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
    {BUBBLES.map((b, i) => (
      <div
        key={i}
        className="absolute opacity-0 motion-safe:animate-[lw-drift_var(--dur)_var(--delay)_ease-in-out_infinite]"
        style={{ left: b.x, top: b.y, '--dur': b.dur, '--delay': b.delay } as React.CSSProperties}
      >
        <div
          className={cn(
            'rounded-[12px] border border-lw-line-soft bg-[rgba(20,14,32,0.75)] px-3 py-2 backdrop-blur-[4px]',
            b.side === 'left' ? 'rounded-tl-none' : 'rounded-tr-none',
          )}
        >
          {b.lines.map((w, j) => (
            <div
              key={j}
              className="mb-1 h-[5px] rounded-full bg-lw-violet/30 last:mb-0"
              style={{ width: `${w}px` }}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────
   Perspective grid floor (CSS-only)
───────────────────────────────────────── */
const PerspectiveGrid = () => (
  <div
    className="pointer-events-none absolute bottom-0 left-0 right-0 z-0 h-[45%] overflow-hidden"
    aria-hidden
    style={{ perspective: '600px' }}
  >
    <div
      className="absolute inset-x-0 bottom-0 h-full opacity-[0.12]"
      style={{
        transform: 'rotateX(72deg)',
        transformOrigin: 'bottom center',
        backgroundImage:
          'linear-gradient(rgba(139,107,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(139,107,255,0.8) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }}
    />
    {/* Horizon glow */}
    <div className="absolute inset-x-0 top-0 h-16 bg-[linear-gradient(to_bottom,rgba(139,107,255,0.18),transparent)]" />
  </div>
);

/* ─────────────────────────────────────────
   Glitch scanlines overlay
───────────────────────────────────────── */
const Scanlines = () => (
  <div
    className="pointer-events-none absolute inset-0 z-[2] opacity-[0.04] mix-blend-overlay"
    aria-hidden
    style={{
      backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 1px, transparent 1px, transparent 4px)',
    }}
  />
);

/* ─────────────────────────────────────────
   Vibe name cycling text
───────────────────────────────────────── */
const VIBE_NAMES = ['midnight_fox', 'echo_ghost', 'neon_drifter', 'void_signal', 'anon_7821', 'cipher_null'];

const VibeNameCycle = () => {
  const [idx, setIdx] = useState(0);
  const [vis, setVis] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      setVis(false);
      setTimeout(() => { setIdx(p => (p + 1) % VIBE_NAMES.length); setVis(true); }, 280);
    }, 2000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className={cn('font-lw-mono text-lw-teal transition-opacity duration-280', vis ? 'opacity-100' : 'opacity-0')}>
      {VIBE_NAMES[idx]}
    </span>
  );
};

/* ─────────────────────────────────────────
   Encrypted identity labels floating top
───────────────────────────────────────── */
const IDENTITIES = [
  { label: 'USER_7A2F', x: '8%',  y: '12%', col: 'text-lw-teal-2',    delay: '0s'   },
  { label: 'MASK_E91C', x: '72%', y: '8%',  col: 'text-lw-violet-2',  delay: '3.5s' },
  { label: 'ANON_B3D0', x: '82%', y: '72%', col: 'text-lw-teal-2',    delay: '7s'   },
  { label: 'VOID_4499', x: '4%',  y: '76%', col: 'text-lw-violet-2',  delay: '11s'  },
] as const;

const EncryptedLabels = () => (
  <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
    {IDENTITIES.map((id, i) => (
      <div
        key={i}
        className="absolute opacity-0 motion-safe:animate-[lw-drift_20s_var(--delay)_ease-in-out_infinite]"
        style={{ left: id.x, top: id.y, '--delay': id.delay } as React.CSSProperties}
      >
        <span className={cn('font-lw-mono text-[0.55rem] tracking-[0.18em]', id.col, 'opacity-40')}>
          {id.label}
        </span>
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────
   Main SplashHero
───────────────────────────────────────── */
const SplashHero = () => {
  const reduced = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  ).current;

  return (
    <section
      className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#06040e] font-lw-body text-lw-text"
      aria-label="Whisper Wave — find a stranger"
    >
      {/* ── Background layers ── */}
      {/* Deep violet haze */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <div className="absolute right-[-15%] top-[-10%] size-[85vmax] rounded-full opacity-[0.22] blur-[120px] bg-[radial-gradient(circle,rgba(139,107,255,1),transparent_58%)]" />
        <div className="absolute bottom-[-20%] left-[-10%] size-[65vmax] rounded-full opacity-[0.16] blur-[100px] bg-[radial-gradient(circle,rgba(53,224,200,0.9),transparent_60%)]" />
        {/* Dark center to push eyes to content */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_50%,rgba(6,4,14,0.3)_0%,rgba(6,4,14,0.85)_100%)]" />
      </div>

      <Scanlines />
      <PerspectiveGrid />
      {!reduced && <RedactedBubbles />}
      {!reduced && <EncryptedLabels />}

      {/* Grain */}
      <div className="lw-grain pointer-events-none absolute inset-0 z-[1] opacity-[0.06] mix-blend-overlay" aria-hidden />

      {/* Edge vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background: 'linear-gradient(to bottom, rgba(6,4,14,0.55) 0%, transparent 15%, transparent 78%, rgba(6,4,14,0.8) 100%)',
        }}
        aria-hidden
      />

      {/* ── Main content ── */}
      <div className="relative z-[3] flex w-full max-w-[1200px] flex-col items-center gap-0 px-[clamp(16px,4vw,48px)] min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between min-[900px]:gap-12">

        {/* LEFT — copy */}
        <div className="flex flex-col items-center gap-6 text-center min-[900px]:items-start min-[900px]:text-left">
          {/* Status pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-lw-line-soft bg-white-pure/[0.04] px-4 py-1.5 backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-lw-spark shadow-[0_0_8px_var(--lw-spark-glow)] motion-safe:animate-lw-blink" />
            <span className="font-lw-mono text-[0.65rem] uppercase tracking-[0.22em] text-lw-text-faint">
              strangers online
            </span>
          </div>

          {/* Headline */}
          <h1 className="max-w-[12ch] font-lw-display text-[clamp(3rem,7.5vw,6.2rem)] font-normal leading-[0.95] tracking-[-0.04em]">
            <span className="block text-lw-text">Talk to</span>
            <span className="block text-lw-text">no-one.</span>
            <span className="lw-iri block italic">Everyone.</span>
          </h1>

          <p className="max-w-[28rem] text-[clamp(1rem,1.5vw,1.15rem)] leading-[1.6] text-lw-text-dim">
            You're <VibeNameCycle /> right now. No name. No face. No record.
            Just find someone and see what happens.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              className={cn(
                'lw-sheen group inline-flex items-center gap-2 rounded-[14px] border border-white-pure/20 px-6 py-[13px]',
                'text-[1rem] font-semibold text-white-pure no-underline',
                'bg-[linear-gradient(135deg,var(--color-lw-violet)_0%,var(--color-lw-violet-deep)_55%,var(--color-lw-teal-deep)_130%)]',
                'shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_12px_36px_-10px_rgba(90,63,214,0.85)]',
                'transition-[translate,box-shadow] duration-[260ms] hover:-translate-y-0.5',
                focusRing,
              )}
            >
              Enter the void
              <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-[14px] transition-transform duration-[260ms] group-hover:translate-x-[3px]">
                <path d="M5 12H19M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              to="/auth?mode=login"
              className={cn(
                'inline-flex items-center rounded-[14px] border border-white-pure/[0.11] px-6 py-[13px]',
                'text-[1rem] font-medium text-lw-text-dim no-underline',
                'bg-white-pure/[0.04] backdrop-blur-sm',
                'transition-[border-color,color] duration-200 hover:border-white-pure/22 hover:text-lw-text',
                focusRing,
              )}
            >
              Log in
            </Link>
          </div>

          <p className="font-lw-mono text-[0.62rem] tracking-[0.1em] text-lw-text-faint opacity-70">
            no signup · no trace · 18+
          </p>
        </div>

        {/* RIGHT — anonymous figure */}
        <div className="relative mt-8 flex items-center justify-center min-[900px]:mt-0 min-[900px]:shrink-0">
          <AnonFigure />

          {/* Speech bubble above figure — "who are you?" */}
          <div className="absolute -top-2 left-[60%] z-[2] min-[900px]:-top-4 min-[900px]:left-[58%]">
            <div className="relative rounded-[10px] rounded-bl-none border border-lw-line bg-[rgba(20,14,32,0.88)] px-3 py-2 backdrop-blur-sm">
              <p className="font-lw-mono text-[0.6rem] tracking-[0.08em] text-lw-teal-2">who are you?</p>
              <p className="mt-0.5 font-lw-mono text-[0.55rem] text-lw-text-faint opacity-70">
                — <span className="text-lw-violet-2">anon_4492</span>
              </p>
              {/* Typing response below */}
              <div className="mt-1.5 flex items-center gap-1 border-t border-lw-line-soft pt-1.5">
                <span className="font-lw-mono text-[0.5rem] text-lw-text-faint">typing</span>
                <span className="flex gap-[2px]">
                  {[0,1,2].map(i => (
                    <span key={i} className="size-1 rounded-full bg-lw-violet-2/60 motion-safe:animate-lw-typing" style={{ animationDelay: `${i * 200}ms` }} />
                  ))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll nudge */}
      <div className="absolute bottom-8 left-1/2 z-[3] -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-35" aria-hidden>
        <span className="font-lw-mono text-[0.55rem] uppercase tracking-[0.25em] text-lw-text-faint">scroll</span>
        <svg viewBox="0 0 10 18" className="w-[10px] text-lw-violet/50">
          <path d="M5 0v14M1 10l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
};

export default SplashHero;
