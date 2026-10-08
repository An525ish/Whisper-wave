import type { RefObject } from 'react';
import TypingDots from '@/shared/components/ui/typing-indicator/TypingDots';
import { groupMessages } from '@/shared/utils/groupMessages';
import { THREAD_EXPIRY_TICK_MS, THREAD_LIFETIME_MS } from '../constants';
import { useNowWhile } from '../hooks/useNowWhile';
import { useThreadVirtualizer } from '../hooks/useThreadVirtualizer';
import { avatarGradient } from '../utils/vibeTag';
import AnonMessageBubble from './AnonMessageBubble';
import type { AnonMessage, AnonReaction } from '../types';

const expiryLabel = (msLeft: number): string => {
  const mins = Math.floor(msLeft / 60_000);
  if (mins < 1) return 'under a minute';
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  return hours < 24 ? `${hours}h ${mins % 60}m` : `${Math.floor(hours / 24)}d`;
};

type Props = {
  myName: string;
  partnerName: string;
  messages: AnonMessage[];
  partnerTyping: boolean;
  /** Session start; drives the expiry line. Null hides it. */
  startedAt: number | null;
  live: boolean;
  /** The scrolling `<main>` that hosts this list. */
  scrollRef: RefObject<HTMLElement | null>;
  onRetry: (id: string) => void;
  onReact: (messageId: string, reaction: AnonReaction) => void;
};

/**
 * The ephemeral thread, virtualized. Consecutive messages from the same sender
 * are grouped by the shared util so only the last of a run draws the tail.
 *
 * Accessibility: rows mount and unmount as you scroll, so the visible list is not
 * a live region (scrolling would re-announce history). A visually hidden `log`
 * announces only the newest incoming message.
 */
export default function AnonMessageList({
  myName,
  partnerName,
  messages,
  partnerTyping,
  startedAt,
  live,
  scrollRef,
  onRetry,
  onReact,
}: Props) {
  const groups = groupMessages(messages, (msg) => msg.from);
  const { virtualizer, rowAt } = useThreadVirtualizer({ scrollRef, messages, partnerTyping });
  // A countdown has to tick, so the clock lives in state — `Date.now()` in a
  // render body is impure and the compiler rejects it.
  const now = useNowWhile(live && Boolean(startedAt), THREAD_EXPIRY_TICK_MS);
  const msLeft = startedAt ? startedAt + THREAD_LIFETIME_MS - now : 0;

  const lastIncoming = [...messages].reverse().find((m) => m.from === 'them');

  const renderRow = (index: number) => {
    const row = rowAt(index);
    switch (row.kind) {
      case 'lead':
        return (
          <div className="acr-ephemeral">
            <span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Ephemeral — gone when you leave
              {live && startedAt && (
                <span className="acr-ephemeral__expiry">
                  · vanishes in {expiryLabel(msLeft)}
                </span>
              )}
            </span>
          </div>
        );
      case 'empty':
        return (
          <div className="acr-empty">
            <div className="acr-empty__link" aria-hidden>
              <div className="acr-empty__orb acr-empty__orb--you" style={{ background: avatarGradient(myName) }}>
                {myName.charAt(0).toUpperCase()}
              </div>
              <div className="acr-empty__bridge" />
              <div className="acr-empty__orb acr-empty__orb--them" style={{ background: avatarGradient(partnerName) }}>
                {partnerName.charAt(0).toUpperCase()}
              </div>
            </div>
            <div>
              <p className="acr-empty__title">You&apos;re linked</p>
              <p className="acr-empty__sub">
                Two strangers, same wavelength. Break the ice — this thread
                doesn&apos;t stick around.
              </p>
            </div>
          </div>
        );
      case 'typing':
        return <TypingDots label={`${partnerName} is typing`} className="acr-new-l mt-3" />;
      case 'message':
        return (
          <AnonMessageBubble
            msg={messages[row.index]}
            joinedAbove={groups[row.index].joinedAbove}
            isTail={groups[row.index].isTail}
            live={live}
            onRetry={onRetry}
            onReact={onReact}
          />
        );
    }
  };

  return (
    <>
      <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((item) => (
          <div
            key={item.key}
            data-index={item.index}
            ref={virtualizer.measureElement}
            className="absolute left-0 top-0 w-full"
            style={{ transform: `translateY(${item.start}px)` }}
          >
            {renderRow(item.index)}
          </div>
        ))}
      </div>

      <div
        className="sr-only"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="New messages"
      >
        {lastIncoming && (
          <p key={lastIncoming.id}>
            {partnerName}: {lastIncoming.content}
          </p>
        )}
      </div>
    </>
  );
}
