import { useEffect, useRef } from 'react';
import { useAnimatedChat } from '@/hooks/landing/useAnimatedChat';
import { useGlassTilt } from '@/hooks/landing/useGlassTilt';
import SearchingStage from '@/components/landing/ui/SearchingStage';
import MatchedStage from '@/components/landing/ui/MatchedStage';
import VibeConnectOverlay from '@/components/landing/ui/VibeConnectOverlay';
import { cn } from '@/utils/cn';
import type { ChatMessage, MatchArcPhase } from '@/types/landing';

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

/** Bubbles stay product-true; pane chrome is violet liquid-glass. */
const StreamItem = ({ msg }: { msg: ChatMessage }) => {
  const typing = msg.state === 'typing';

  if (msg.isMutual) return null;

  if (msg.isVibe) {
    return (
      <div className="self-center rounded-[20px] border border-lw-violet/[0.22] bg-lw-violet/10 px-[14px] py-1.5 font-lw-mono text-[0.72rem] tracking-[0.04em] text-lw-violet-2 motion-safe:animate-lw-pop">
        {typing ? <TypingDots /> : <span>{msg.text}</span>}
      </div>
    );
  }

  const fromYou = msg.sender === 'a';
  return (
    <div className={cn('flex max-w-full', fromYou ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-[13px] py-[9px] text-[0.92rem] leading-[1.36] text-body motion-safe:animate-lw-pop',
          fromYou
            ? 'bubble-out border border-green/35 bg-green-dark/55'
            : 'bubble-in border border-border bg-primary/90',
        )}
      >
        {typing ? <TypingDots /> : msg.text}
      </div>
    </div>
  );
};

type Props = {
  phase: MatchArcPhase;
  chatActive: boolean;
  onSpark: () => void;
  onCycleComplete: () => void;
};

/**
 * Match Arc pane — purple liquid-glass chrome (earlier look) with
 * green text boxes kept as-is.
 */
const GlassPane = ({ phase, chatActive, onSpark, onCycleComplete }: Props) => {
  const { messages } = useAnimatedChat({
    active: chatActive,
    onSpark,
    onCycleComplete,
  });
  const sparked = phase === 'spark' || messages.some((m) => m.isMutual && m.state === 'visible');
  const showChat = phase === 'chatting' || phase === 'spark';

  const { stageRef, targetRef } = useGlassTilt<HTMLDivElement, HTMLDivElement>();
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = streamRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div
      ref={stageRef}
      aria-hidden
      className="relative flex justify-center [perspective:1400px] motion-safe:animate-lw-fade"
      style={{ animationDelay: '0.2s' }}
    >
      <div
        ref={targetRef}
        className={cn(
          'lw-glass lw-rim relative w-full max-w-[420px] overflow-hidden rounded-[26px]',
          '[transform:rotateX(var(--rx,4deg))_rotateY(var(--ry,-7deg))] [transform-style:preserve-3d]',
          'transition-[transform] duration-[350ms] ease-[cubic-bezier(0.2,0.7,0.2,1)]',
          phase === 'searching' || phase === 'matched'
            ? 'motion-safe:animate-none'
            : 'motion-safe:animate-lw-float',
          'max-[900px]:max-w-[400px] max-[900px]:[transform:none] motion-reduce:[transform:none]',
        )}
      >
        {/* Violet / teal refracting wash — subdued over darker glass */}
        <div className="pointer-events-none absolute inset-[-35%] opacity-[0.4] mix-blend-screen blur-[26px] bg-[radial-gradient(circle_at_30%_25%,rgba(139,107,255,0.5),transparent_45%),radial-gradient(circle_at_75%_80%,rgba(53,224,200,0.38),transparent_48%)] motion-safe:animate-lw-refract" />
        <div
          className={cn(
            'pointer-events-none absolute inset-0 opacity-0 bg-[radial-gradient(circle_at_50%_60%,var(--lw-spark-glow),transparent_60%)]',
            sparked && 'motion-safe:animate-lw-bloom',
          )}
        />
        <div className="pointer-events-none absolute inset-0 bg-[rgba(8,5,16,0.62)]" />

        <div className="relative z-[2] flex h-[480px] flex-col max-[520px]:h-[440px]">
          <div className="flex items-center justify-between border-b border-white-pure/[0.08] px-[18px] py-4">
            <div className="flex items-center gap-[11px]">
              <div
                className={cn(
                  'relative grid size-[38px] place-items-center rounded-xl font-lw-mono text-base font-bold',
                  'transition-[filter,color,border-color,background,box-shadow] duration-[600ms] ease-out',
                  sparked
                    ? 'border border-solid border-transparent bg-[linear-gradient(150deg,var(--color-lw-violet),var(--color-lw-teal-deep))] text-white-pure shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_4px_14px_-4px_rgba(53,224,200,0.6)]'
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
                <div className="relative inline-block min-h-[1.2em] font-lw-mono text-[0.9rem] font-bold tracking-[0.01em] text-lw-text">
                  {phase === 'searching' ? (
                    <span className="text-lw-text-dim">searching…</span>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
                <div className="mt-0.5 text-[0.7rem] text-lw-text-faint">
                  {phase === 'searching' && 'in the queue'}
                  {phase === 'matched' && 'pairing now'}
                  {(phase === 'chatting' || phase === 'spark') && 'matched · anonymous'}
                </div>
              </div>
            </div>

            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-[20px] border px-2.5 py-[5px] font-lw-mono text-[0.66rem] uppercase tracking-[0.14em]',
                phase === 'searching'
                  ? 'border-lw-violet/[0.28] bg-lw-violet/[0.1] text-lw-violet-2'
                  : 'border-lw-teal/[0.22] bg-lw-teal/[0.08] text-lw-teal-2',
              )}
            >
              <span
                className={cn(
                  'size-1.5 rounded-full motion-safe:animate-lw-blink',
                  phase === 'searching'
                    ? 'bg-lw-violet shadow-[0_0_8px_rgba(139,107,255,0.8)]'
                    : 'bg-lw-teal shadow-[0_0_8px_var(--color-lw-teal)]',
                )}
              />
              {phase === 'searching' ? 'queue' : 'live'}
            </span>
          </div>

          {phase === 'searching' && <SearchingStage />}
          {phase === 'matched' && <MatchedStage />}
          {showChat && (
            <>
              <div
                ref={streamRef}
                className={cn(
                  'flex flex-1 flex-col justify-end gap-[9px] overflow-hidden px-4 pb-2 pt-4 [mask-image:linear-gradient(180deg,transparent_0,#000_14%)]',
                  'transition-opacity duration-400',
                  sparked && 'opacity-35',
                )}
              >
                <div className="self-center pb-1.5 pt-0.5 font-lw-mono text-[0.62rem] uppercase tracking-[0.16em] text-lw-text-faint">
                  matched just now
                </div>
                {messages.map((msg) => (
                  <StreamItem key={msg.id} msg={msg} />
                ))}
              </div>

              <div
                className={cn(
                  'mx-[14px] mb-[14px] mt-2 flex items-center gap-2.5 rounded-[14px] border border-white-pure/[0.09] bg-white-pure/[0.04] px-[14px] py-[11px]',
                  'transition-opacity duration-400',
                  sparked && 'opacity-30',
                )}
              >
                <span className="h-[15px] w-0.5 bg-lw-teal motion-safe:animate-lw-caret" />
                <span className="flex-1 text-[0.88rem] text-lw-text-faint">say something…</span>
                <span className="grid size-[30px] place-items-center rounded-[9px] bg-[linear-gradient(150deg,var(--color-lw-violet),var(--color-lw-violet-deep))] text-white-pure shadow-[0_4px_12px_-4px_rgba(90,63,214,0.7)]">
                  <svg viewBox="0 0 24 24" fill="none" className="size-3.5">
                    <path
                      d="M22 2L11 13"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M22 2L15 22L11 13L2 9L22 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </>
          )}

          <VibeConnectOverlay active={sparked} />
        </div>
      </div>
    </div>
  );
};

export default GlassPane;
