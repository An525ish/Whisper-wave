import dayjs from 'dayjs';
import TypingDots from '@/shared/components/ui/typing-indicator/TypingDots';
import { groupMessages } from '@/shared/utils/groupMessages';
import { avatarGradient } from '../utils/vibeTag';
import type { AnonMessage } from '../types';

const fmt = (ms: number): string => dayjs(ms).format('h:mm A');

type Props = {
  myName: string;
  partnerName: string;
  messages: AnonMessage[];
  partnerTyping: boolean;
  onRetry: (id: string) => void;
  bottomRef: React.RefObject<HTMLDivElement | null>;
};

/**
 * The ephemeral thread. Bubble geometry, radii and timestamp treatment come
 * straight from the logged-in chat (`bubble-in`/`bubble-out` + the same padding
 * contract), so the two screens read as one product. Consecutive messages from
 * the same sender are grouped by the shared util so only the last of a run draws
 * the tail.
 */
export default function AnonMessageList({
  myName,
  partnerName,
  messages,
  partnerTyping,
  onRetry,
  bottomRef,
}: Props) {
  const showEmpty = messages.length === 0;
  const groups = groupMessages(messages, (msg) => msg.from);

  return (
    <>
      <div className="acr-ephemeral">
        <span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Ephemeral — gone when you leave
        </span>
      </div>

      {showEmpty && (
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
      )}

      <div className="flex flex-col gap-[0.15rem]">
        {messages.map((msg, i) => {
          const isMe = msg.from === 'me';
          const { joinedAbove, isTail } = groups[i];
          const failed = isMe && msg.delivery === 'failed';

          return (
            <div
              key={msg.id}
              className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}${joinedAbove ? '' : ' mt-[0.85rem]'}`}
            >
              <div
                className={[
                  // `acr-bubble` is the hook the failed-state override hangs off.
                  'acr-bubble min-w-0 w-fit max-w-[min(100%,22rem)] select-none text-left',
                  isMe
                    ? 'bubble-out border border-green/35 bg-green-dark/55 pl-3.5 pr-2 py-2'
                    : 'bubble-in border border-border bg-primary/90 pl-3.5 pr-3.5 py-2',
                  failed ? 'acr-bubble--failed' : '',
                  isMe ? 'acr-new-r' : 'acr-new-l',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="relative min-w-0 max-w-full">
                  <p className="m-0 text-sm leading-[19px] wrap-break-word whitespace-pre-wrap text-body">
                    {msg.content}
                    {/* Reserve the timestamp's footprint on the last line so the
                        absolute stamp can never sit on top of the last word. */}
                    {isTail && (
                      <span aria-hidden className="pointer-events-none ml-2 inline-flex h-[19px] select-none items-center whitespace-nowrap align-bottom text-[11px] leading-none tabular-nums opacity-0">
                        {fmt(msg.sentAt)}
                      </span>
                    )}
                  </p>
                  {isTail && (
                    <time
                      dateTime={new Date(msg.sentAt).toISOString()}
                      className={`pointer-events-none absolute bottom-0 right-0 translate-y-1 select-none text-[11px] leading-none tabular-nums ${isMe ? 'text-body-700' : 'text-body-300'}`}
                    >
                      {fmt(msg.sentAt)}
                      {msg.delivery === 'sending' && (
                        <span className="acr-time__state" aria-label="Sending"> ·</span>
                      )}
                    </time>
                  )}
                </div>
                {/* Sits below the absolutely-positioned stamp, so the two never
                    collide and the bubble needs no extra padding. */}
                {failed && (
                  <button
                    type="button"
                    className="acr-retry"
                    onClick={() => onRetry(msg.id)}
                    title={msg.failureReason ?? 'Tap to resend'}
                  >
                    {msg.failureReason ?? 'Not sent — tap to resend'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {partnerTyping && (
        <TypingDots label={`${partnerName} is typing`} className="acr-new-l mt-3" />
      )}

      <div ref={bottomRef} />
    </>
  );
}