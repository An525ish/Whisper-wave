import dayjs from 'dayjs';
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
 * The ephemeral thread. Messages are grouped so consecutive messages from the
 * same sender share full corner radii and only the last one gets the tail.
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

      <div className="acr-msgs">
        {messages.map((msg, i) => {
          const isMe = msg.from === 'me';
          const prevSame = i > 0 && messages[i - 1].from === msg.from;
          const nextSame = i < messages.length - 1 && messages[i + 1].from === msg.from;
          const tail = !nextSame;
          const failed = isMe && msg.delivery === 'failed';

          return (
            <div
              key={msg.id}
              className={`acr-row ${isMe ? 'acr-row--me' : 'acr-row--them'}${prevSame ? '' : ' acr-row--gap'}`}
            >
              <div
                className={[
                  'acr-bubble',
                  isMe ? 'acr-bubble--me' : 'acr-bubble--them',
                  tail ? 'acr-bubble--tail' : '',
                  failed ? 'acr-bubble--failed' : '',
                  isMe ? 'acr-new-r' : 'acr-new-l',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                {tail && (
                  <p className="acr-time">
                    {fmt(msg.sentAt)}
                    {isMe && msg.delivery === 'sending' && (
                      <span className="acr-time__state" aria-label="Sending"> ·</span>
                    )}
                  </p>
                )}
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
        <div className="acr-typing acr-new-l" aria-live="polite">
          <div className="acr-typing__bubble">
            {[0, 1, 2].map((j) => (
              <span
                key={j}
                className="acr-typing__dot"
                style={{ animationDelay: `${j * 0.2}s` }}
              />
            ))}
            <span className="sr-only">{partnerName} is typing</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </>
  );
}
