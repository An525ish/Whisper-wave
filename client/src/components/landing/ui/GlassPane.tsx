import { useEffect, useRef } from 'react';
import { useAnimatedChat } from '@/hooks/landing/useAnimatedChat';
import { useGlassTilt } from '@/hooks/landing/useGlassTilt';
import { cn } from '@/utils/cn';
import type { ChatMessage } from '@/types/landing';

/** Three-dot "typing" indicator; each dot lags the previous by 0.15s. */
const TypingDots = () => (
  <span className="inline-flex gap-1 px-[14px] py-3 text-lw-text-dim" aria-label="typing">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="size-1.5 rounded-full bg-current opacity-50 motion-safe:animate-lw-typing"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </span>
);

/** One line in the scripted stream: the mutual spark, a "vibe" nudge, or a chat bubble. */
const StreamItem = ({ msg }: { msg: ChatMessage }) => {
  const typing = msg.state === 'typing';

  // The connect moment — the only place the reserved spark green appears.
  if (msg.isMutual) {
    return (
      <div className="inline-flex items-center gap-2 self-center rounded-[22px] border border-lw-spark/50 bg-[linear-gradient(120deg,rgba(1,195,109,0.22),rgba(1,195,109,0.1))] px-[18px] py-[9px] text-[0.92rem] font-semibold text-[#eafff4] shadow-[0_0_24px_-4px_var(--lw-spark-glow)] motion-safe:animate-lw-pop">
        <span
          className="text-[1.05rem] text-lw-spark [filter:drop-shadow(0_0_6px_var(--lw-spark-glow))]"
          aria-hidden
        >
          ✦
        </span>
        {typing ? <TypingDots /> : <span>{msg.text.replace(/^✦\s*/, '')}</span>}
      </div>
    );
  }

  // A soft "someone is vibing" system nudge.
  if (msg.isVibe) {
    return (
      <div className="self-center rounded-[20px] border border-lw-violet/[0.22] bg-lw-violet/10 px-[14px] py-1.5 font-lw-mono text-[0.72rem] tracking-[0.04em] text-lw-violet-2 motion-safe:animate-lw-pop">
        {typing ? <TypingDots /> : <span>{msg.text}</span>}
      </div>
    );
  }

  // Ordinary message. 'a' is "you" (right, violet); 'b' is the stranger (left, frosted).
  const fromYou = msg.sender === 'a';
  return (
    <div className={cn('flex max-w-full', fromYou ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-[13px] py-[9px] text-[0.92rem] leading-[1.36] motion-safe:animate-lw-pop',
          fromYou
            ? 'rounded-br-[5px] bg-[linear-gradient(150deg,var(--color-lw-violet),var(--color-lw-violet-deep))] text-white-pure shadow-[0_4px_14px_-6px_rgba(90,63,214,0.7)]'
            : 'rounded-bl-[5px] border border-white-pure/10 bg-white-pure/[0.06] text-lw-text backdrop-blur-[6px]',
        )}
      >
        {typing ? <TypingDots /> : msg.text}
      </div>
    </div>
  );
};

/**
 * The hero's signature: a living "liquid glass" chat pane that plays a looped,
 * scripted conversation and blooms from anonymous frost to a named "connect"
 * the moment the exchange turns mutual.
 *
 * The frost→spark change is driven entirely by the React `sparked` flag through
 * conditional Tailwind classes — no CSS descendant cascades. Pointer-parallax
 * tilt lives in `useGlassTilt`, which writes `--rx`/`--ry` onto the glass and
 * no-ops for touch pointers and reduced-motion users. The whole pane is
 * decorative, so it's hidden from assistive tech.
 */
const GlassPane = () => {
  const { messages } = useAnimatedChat();
  const sparked = messages.some((m) => m.isMutual && m.state === 'visible');

  const { stageRef, targetRef } = useGlassTilt<HTMLDivElement, HTMLDivElement>();
  const streamRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view within the fixed-height stream.
  useEffect(() => {
    const el = streamRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div
      ref={stageRef}
      aria-hidden
      className="relative flex justify-center [perspective:1400px] motion-safe:animate-lw-fade"
      style={{ animationDelay: '0.3s' }}
    >
      <div
        ref={targetRef}
        className={cn(
          'lw-glass lw-rim relative w-full max-w-[400px] overflow-hidden rounded-[26px]',
          '[transform:rotateX(var(--rx,4deg))_rotateY(var(--ry,-7deg))] [transform-style:preserve-3d]',
          'transition-[transform] duration-[350ms] ease-[cubic-bezier(0.2,0.7,0.2,1)]',
          'motion-safe:animate-lw-float',
          'max-[900px]:max-w-[380px] max-[900px]:[transform:none] motion-reduce:[transform:none]',
        )}
      >
        {/* Refracting colour that drifts behind the frost */}
        <div className="pointer-events-none absolute inset-[-35%] opacity-[0.55] mix-blend-screen blur-[26px] bg-[radial-gradient(circle_at_30%_25%,rgba(139,107,255,0.6),transparent_45%),radial-gradient(circle_at_75%_80%,rgba(53,224,200,0.5),transparent_48%)] motion-safe:animate-lw-refract" />
        {/* Slow light sheen sweeping across the surface */}
        <div className="pointer-events-none absolute inset-y-[-60%] left-[-30%] w-[40%] rotate-[8deg] bg-[linear-gradient(100deg,transparent,rgba(255,255,255,0.16),transparent)] motion-safe:animate-lw-sheen" />
        {/* Green bloom that flares once, only on the connect moment */}
        <div
          className={cn(
            'pointer-events-none absolute inset-0 opacity-0 bg-[radial-gradient(circle_at_50%_60%,var(--lw-spark-glow),transparent_60%)]',
            sparked && 'motion-safe:animate-lw-bloom',
          )}
        />
        {/* Darkening veil — sits above the colour layers so the pane reads a
            touch deeper than the surrounding glass, without dimming content */}
        <div className="pointer-events-none absolute inset-0 bg-[rgba(18,13,27,0.42)]" />

        <div className="relative z-[2] flex h-[460px] flex-col max-[520px]:h-[420px]">
          {/* Header — the stranger's identity, frosted until the spark */}
          <div className="flex items-center justify-between border-b border-white-pure/[0.08] px-[18px] py-4">
            <div className="flex items-center gap-[11px]">
              <div
                className={cn(
                  'relative grid size-[38px] place-items-center rounded-xl font-lw-mono text-base font-bold',
                  'transition-[filter,color,border-color,background,box-shadow] duration-[600ms] ease-out',
                  sparked
                    ? 'border border-solid border-transparent bg-[linear-gradient(150deg,var(--color-lw-violet),var(--color-lw-teal-deep))] text-white-pure shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_4px_14px_-4px_rgba(53,224,200,0.6)] [filter:blur(0)]'
                    : 'border border-dashed border-lw-violet-2/50 bg-[rgba(139,107,255,0.14)] text-lw-violet-2 [filter:blur(0.4px)]',
                )}
              >
                <span className={cn('transition-opacity duration-[400ms]', sparked && 'opacity-0')}>
                  ?
                </span>
                <span
                  className={cn(
                    'absolute transition-opacity duration-[400ms] [transition-delay:200ms]',
                    sparked ? 'opacity-100' : 'opacity-0',
                  )}
                >
                  M
                </span>
              </div>

              <div>
                <div className="relative inline-block font-lw-mono text-[0.9rem] font-bold tracking-[0.01em] text-lw-text">
                  <span className={cn('transition-opacity duration-[400ms]', sparked && 'opacity-0')}>
                    a stranger
                  </span>
                  <span
                    className={cn(
                      'lw-iri absolute left-0 top-0 whitespace-nowrap transition-[opacity,translate] duration-500 [transition-delay:150ms]',
                      sparked ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
                    )}
                  >
                    midnight_fox
                  </span>
                </div>
                <div className="mt-0.5 text-[0.7rem] text-lw-text-faint">matched · anonymous</div>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-[20px] border border-lw-teal/[0.22] bg-lw-teal/[0.08] px-2.5 py-[5px] font-lw-mono text-[0.66rem] uppercase tracking-[0.14em] text-lw-teal-2">
              <span className="size-1.5 rounded-full bg-lw-teal shadow-[0_0_8px_var(--color-lw-teal)] motion-safe:animate-lw-blink" />
              live
            </span>
          </div>

          {/* Message stream */}
          <div
            ref={streamRef}
            className="flex flex-1 flex-col justify-end gap-[9px] overflow-hidden px-4 pb-2 pt-4 [mask-image:linear-gradient(180deg,transparent_0,#000_14%)]"
          >
            <div className="self-center pb-1.5 pt-0.5 font-lw-mono text-[0.62rem] uppercase tracking-[0.16em] text-lw-text-faint">
              matched just now
            </div>
            {messages.map((msg) => (
              <StreamItem key={msg.id} msg={msg} />
            ))}
          </div>

          {/* Input mock */}
          <div className="mx-[14px] mb-[14px] mt-2 flex items-center gap-2.5 rounded-[14px] border border-white-pure/[0.09] bg-white-pure/[0.04] px-[14px] py-[11px]">
            <span className="h-[15px] w-0.5 bg-lw-teal motion-safe:animate-lw-caret" />
            <span className="flex-1 text-[0.88rem] text-lw-text-faint">say something…</span>
            <span className="grid size-[30px] place-items-center rounded-[9px] bg-[linear-gradient(150deg,var(--color-lw-violet),var(--color-lw-violet-deep))] text-white-pure shadow-[0_4px_12px_-4px_rgba(90,63,214,0.7)]">
              <svg viewBox="0 0 24 24" fill="none" className="size-3.5">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* Floating spark chip — springs in the moment it's mutual */}
      <div
        className={cn(
          'pointer-events-none absolute right-[-6px] top-2 z-[4] inline-flex items-center gap-[7px] rounded-[30px] border border-white-pure/25 px-[14px] py-2 text-[0.8rem] font-semibold text-[#eafff4]',
          'bg-[linear-gradient(120deg,rgba(1,195,109,0.9),rgba(1,163,109,0.85))] shadow-[0_10px_30px_-8px_var(--lw-spark-glow),inset_0_1px_0_rgba(255,255,255,0.4)]',
          'transition-[opacity,translate,scale] duration-500 ease-[cubic-bezier(0.2,1.4,0.4,1)]',
          'max-[520px]:right-1',
          sparked ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-2 scale-90 opacity-0',
        )}
      >
        <span className="text-white-pure [filter:drop-shadow(0_0_5px_rgba(255,255,255,0.6))]">✦</span> it&apos;s a
        vibe
      </div>
    </div>
  );
};

export default GlassPane;
