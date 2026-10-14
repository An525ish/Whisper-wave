import type { MouseEvent as ReactMouseEvent } from 'react';
import type { useLongPress } from '@/shared/hooks/useLongPress';
import { useStickToBottom } from '../hooks/useStickToBottom';
import { isJoinedAbove, quoteOf } from '../utils/thread';
import type { RoomMessage, RoomReactionKey, RoomYou } from '../types';
import RoomMessageRow from './RoomMessageRow';
import './roomThread.css';

type Props = {
  messages: RoomMessage[];
  you: RoomYou | null;
  myReactions: Record<string, RoomReactionKey[]>;
  onReact: (messageId: string, reaction: RoomReactionKey) => void;
  onReply: (messageId: string) => void;
  onContextMenu: (e: ReactMouseEvent, message: RoomMessage) => void;
  onOpenMenu: (message: RoomMessage, button: HTMLElement) => void;
  bindLongPress: ReturnType<typeof useLongPress<RoomMessage>>;
};

/** The scrolling message log: sticks to the newest message, offers a jump pill when you are reading above it. */
const RoomThread = ({ messages, you, myReactions, onReact, onReply, onContextMenu, onOpenMenu, bindLongPress }: Props) => {
  const { listRef, onScroll, jumpToLatest, showJump } = useStickToBottom(messages.at(-1)?.id);

  return (
    <div className="rm-threadwrap">
      <div
        ref={listRef}
        onScroll={onScroll}
        role="log"
        aria-label="Room messages"
        className="rm-threadlist min-h-0 flex-1 overflow-y-auto py-2"
      >
        <div>
          <div className="rm-ephemeral" aria-hidden>
            <span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Live only — nothing is kept
            </span>
          </div>
          {messages.length === 0 ? (
            <div className="rm-threadempty">
              <span aria-hidden className="rm-threadempty__orb">〜</span>
              <p className="rm-threadempty__title">Nothing here yet.</p>
              <p className="rm-threadempty__sub">Say hi — someone’s always lurking.</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <RoomMessageRow
                key={message.id}
                message={message}
                replyQuote={quoteOf(messages, message.replyTo)}
                mine={you !== null && !message.system && message.from.alias === you.alias}
                joinedAbove={isJoinedAbove(messages[index - 1], message)}
                myKeys={myReactions[message.id] ?? []}
                onReact={onReact}
                onReply={onReply}
                onContextMenu={onContextMenu}
                onOpenMenu={onOpenMenu}
                bindLongPress={bindLongPress}
              />
            ))
          )}
        </div>
      </div>
      {showJump && (
        <button type="button" onClick={jumpToLatest} className="rm-jump">
          New messages
          <span aria-hidden>↓</span>
        </button>
      )}
    </div>
  );
};

export default RoomThread;
