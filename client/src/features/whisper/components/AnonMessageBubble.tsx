import dayjs from 'dayjs';
import MessageReactionBar from './MessageReactionBar';
import type { AnonMessage, AnonReaction } from '../types';

const fmt = (ms: number): string => dayjs(ms).format('h:mm A');

type Props = {
  msg: AnonMessage;
  /** Same sender as the message above — no extra gap. */
  joinedAbove: boolean;
  /** Last of a run — draws the tail and the timestamp. */
  isTail: boolean;
  /** False once the thread is over — no reacting on a dead conversation. */
  live: boolean;
  onRetry: (id: string) => void;
  onReact: (messageId: string, reaction: AnonReaction) => void;
};

/**
 * One message row. Bubble geometry, radii and timestamp treatment come straight
 * from the logged-in chat (`bubble-in`/`bubble-out` + the same padding contract).
 * Spacing is padding, never margin, because the virtualizer measures the row box.
 */
export default function AnonMessageBubble({
  msg,
  joinedAbove,
  isTail,
  live,
  onRetry,
  onReact,
}: Props) {
  const isMe = msg.from === 'me';
  const failed = isMe && msg.delivery === 'failed';

  return (
    <div
      className={`acr-row flex w-full pb-[0.15rem] ${isMe ? 'acr-row--me justify-end' : 'justify-start'}${joinedAbove ? '' : ' pt-[0.85rem]'}`}
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
        {/* Sits below the absolutely-positioned stamp, so the two never collide. */}
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

      {/* Reactions live beside the bubble, not inside it. */}
      <MessageReactionBar
        reactions={msg.reactions}
        enabled={live && !failed && msg.delivery !== 'sending'}
        onReact={(reaction) => onReact(msg.id, reaction)}
      />
    </div>
  );
}
