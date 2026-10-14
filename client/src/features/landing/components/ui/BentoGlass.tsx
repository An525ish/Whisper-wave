import { cn } from '@/shared/utils/cn';
import { BENTO_TONE_RGB } from '../../bentoConstants';
import type { BentoTone } from '../../types';

/* A blown-glass sphere: bright top-left specular, coloured body, dark base for
   weight, a rim light, and a cast glow. The signature primitive of the grid. */
export const GlassSphere = ({
  tone,
  className,
  style,
  children,
}: {
  tone: BentoTone;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) => {
  const rgb = BENTO_TONE_RGB[tone];
  return (
    <span
      className={cn('relative grid shrink-0 place-items-center rounded-full', className)}
      style={{
        background: `radial-gradient(circle at 34% 24%, rgba(255,255,255,0.6), rgba(${rgb},0.34) 36%, rgba(${rgb},0.14) 62%, rgba(8,5,16,0.5) 100%)`,
        border: `1px solid rgba(${rgb},0.45)`,
        boxShadow: `inset 0 2px 6px rgba(255,255,255,0.55), inset 0 -10px 20px rgba(0,0,0,0.5), 0 16px 34px -10px rgba(${rgb},0.6)`,
        ...style,
      }}
    >
      {/* crisp specular highlight */}
      <span className="pointer-events-none absolute left-[24%] top-[15%] h-[24%] w-[34%] -rotate-12 rounded-full bg-white-pure/70 blur-[3px]" aria-hidden />
      {/* faint lower inner bounce */}
      <span
        className="pointer-events-none absolute inset-x-[18%] bottom-[10%] h-[22%] rounded-full opacity-60 blur-[6px]"
        style={{ background: `radial-gradient(ellipse, rgba(${rgb},0.5), transparent 70%)` }}
        aria-hidden
      />
      <span className="relative z-[1] grid size-full place-items-center">{children}</span>
    </span>
  );
};

/* The specimen "well" — a recessed dark pane the glass object sits inside, with
   a soft coloured glow behind it and a hairline floor reflection. Gives every
   illustration the same lit-vitrine feel. */
export const GlassStage = ({
  tone,
  className,
  children,
}: {
  tone: BentoTone;
  className?: string;
  children?: React.ReactNode;
}) => {
  const rgb = BENTO_TONE_RGB[tone];
  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-2xl border border-white-pure/10',
        className,
      )}
      style={{
        background: `linear-gradient(158deg, rgba(${rgb},0.14), rgba(255,255,255,0.04) 42%, rgba(10,7,18,0.55))`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -20px 40px -24px rgba(${rgb},0.5)`,
      }}
    >
      {/* cast glow behind the specimen */}
      <span
        className="pointer-events-none absolute left-1/2 top-1/2 size-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80 blur-2xl"
        style={{ background: `radial-gradient(circle, rgba(${rgb},0.42), transparent 70%)` }}
        aria-hidden
      />
      {/* hairline floor reflection */}
      <span
        className="pointer-events-none absolute inset-x-6 bottom-5 h-px opacity-50"
        style={{ background: `linear-gradient(90deg, transparent, rgba(${rgb},0.55), transparent)` }}
        aria-hidden
      />
      <span className="relative z-[1] grid size-full place-items-center">{children}</span>
    </div>
  );
};

/* Two glass rings fusing at a bright core — the spark mark, in glass. */
export const Spark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 24" className={cn('drop-shadow-[0_0_12px_var(--lw-spark-glow)]', className)} aria-hidden>
    <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.6" opacity="0.9" fill="none" />
    <circle cx="20" cy="12" r="7" stroke="currentColor" strokeWidth="1.6" opacity="0.9" fill="none" />
    <circle cx="16" cy="12" r="2.6" fill="currentColor" />
  </svg>
);

/* ── Tile chrome ─────────────────────────────────────────────────────────── */

export const Head = ({ index, kicker, tone }: { index: string; kicker: string; tone: BentoTone }) => (
  <div className="flex items-center gap-2.5">
    <span
      className="grid size-6 place-items-center rounded-full font-lw-mono text-[0.6rem] font-bold"
      style={{ color: `rgb(${BENTO_TONE_RGB[tone]})`, background: `rgba(${BENTO_TONE_RGB[tone]},0.12)`, border: `1px solid rgba(${BENTO_TONE_RGB[tone]},0.35)` }}
    >
      {index}
    </span>
    <span className="font-lw-mono text-[0.66rem] uppercase tracking-[0.24em] text-lw-text-faint">{kicker}</span>
  </div>
);

/* A frosted-glass panel that holds one specimen + its copy. */
export const Tile = ({
  className,
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) => (
  <article
    className={cn(
      'lw-glass lw-rim relative flex flex-col gap-4 overflow-hidden rounded-[1.6rem] p-5 sm:p-6',
      className,
    )}
    style={style}
  >
    {/* top edge highlight */}
    <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white-pure/40 to-transparent" aria-hidden />
    {children}
  </article>
);

/* Copy block shared by all tiles. */
export const Copy = ({ title, body }: { title: string; body: string }) => (
  <div className="mt-auto flex flex-col gap-2">
    <h3 className="font-lw-display text-[1.4rem] font-medium leading-tight tracking-[-0.01em] text-lw-text">{title}</h3>
    <p className="text-[0.92rem] leading-relaxed text-lw-text-dim">{body}</p>
  </div>
);
