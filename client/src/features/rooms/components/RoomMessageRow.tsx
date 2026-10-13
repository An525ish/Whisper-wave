import { useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react';
import { createPortal } from 'react-dom';
import dayjs from 'dayjs';
import ReactionAddIcon from '@/features/chat/components/message/ReactionAddIcon';
import ReactionStrip from '@/features/chat/components/message/ReactionStrip';
import ReplyQuote from '@/features/chat/components/message/ReplyQuote';
import SwipeToReply from '@/features/chat/components/message/SwipeToReply';
import { ROOM_REACTION_GLYPHS, type RoomReactionGlyph } from '../constants';
import type { RoomMessage } from '../types';
import type { useLongPress } from '@/shared/hooks/useLongPress';
import './rooms.css';

type Props = {
  message: RoomMessage;
  /** Quoted message for `replyTo`, resolved from the thread. */
  replyQuote?: { alias: string; preview: string };
  /** This message is the viewer's own — right-aligned bubble. */
  mine: boolean;
  /** Same author as the message above — no avatar/name. */
  joinedAbove: boolean;
  onReact: (messageId: string, reaction: string) => void;
  onReply: (messageId: string) => void;
  /** Right-click a bubble — opens the message menu at the cursor. */
  onContextMenu: (e: ReactMouseEvent, message: RoomMessage) => void;
  /** Touch long-press binder — same menu at the fingertip. */
  bindLongPress: ReturnType<typeof useLongPress<RoomMessage>>;
};

const timeOf = (ts: number): string => dayjs(ts).format('hh:mm A');

/**
 * One room message in the main-chat row anatomy: avatar beside the bubble
 * (others, run starts only), name inside the bubble top in the persona
 * color, timestamp reserved on the tail, reactions below the bubble.
 * Gestures match the main app: right-click and long-press open the message
 * menu, swipe replies on touch screens.
 */
const RoomMessageRow = ({
  message,
  replyQuote,
  mine,
  joinedAbove,
  onReact,
  onReply,
  onContextMenu,
  bindLongPress,
}: Props) => {
  // Quick-react strip in a portal, like the main chat — positioned under
  // the smiley so no overflow-hidden ancestor can clip it.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerStyle, setPickerStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || portalRef.current?.contains(t)) return;
      setPickerOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  if (message.system) {
    return (
      <div className="rm-sys">
        <p>〜 {message.text}</p>
      </div>
    );
  }

  const totalReactions = Object.values(message.reactions ?? {}).reduce((sum, n) => sum + n, 0);
  const initial = (message.from.alias.trim().charAt(0) || '?').toUpperCase();
  const showHead = !mine && !joinedAbove;

  const openPicker = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPickerStyle({
        position: 'fixed',
        zIndex: 9999,
        top: rect.bottom + 6,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    }
    setPickerOpen((p) => !p);
  };

  const usedReactions = (Object.keys(ROOM_REACTION_GLYPHS) as RoomReactionGlyph[]).filter(
    (reaction) => (message.reactions?.[reaction] ?? 0) > 0
  );

  return (
    <div className={`rm-bubblerow group${mine ? ' rm-bubblerow--mine' : ''}`}>
      <div className={`rm-bubblewrap${mine ? ' rm-bubblewrap--mine' : ''}`}>
        <div className="rm-bubbleavatarrow">
          {!mine && !joinedAbove && (
            <span
              aria-hidden
              className="rm-avatar"
              style={{
                color: message.from.color,
                backgroundColor: `${message.from.color}1f`,
                boxShadow: `0 0 0 1.5px ${message.from.color}`,
              }}
            >
              {initial}
            </span>
          )}
          <SwipeToReply
            side={mine ? 'end' : 'start'}
            shellClassName={mine ? 'bubble-out' : 'bubble-in'}
            onReply={() => onReply(message.id)}
          >
            <div className={`rm-bubble ${mine ? 'bubble-out border border-green/35 bg-green-dark/55' : 'bubble-in border border-border bg-primary/90'}${mine ? ' rm-new-r' : ' rm-new-l'}`}
              onContextMenu={(e) => onContextMenu(e, message)}
              {...bindLongPress(message)}
            >
              {showHead && (
                <p className="rm-bubblename" style={{ color: message.from.color }}>
                  {message.from.alias}
                  {message.from.role !== 'member' && (
                    <span className="rm-rolebadge">{message.from.role.toUpperCase()}</span>
                  )}
                </p>
              )}
              {replyQuote && (
                <div className="mb-1.5">
                  <ReplyQuote
                    tone={mine ? 'outgoing' : 'incoming'}
                    senderName={replyQuote.alias}
                    previewText={replyQuote.preview}
                  />
                </div>
              )}
              <p className="rm-bubbletext">
                {message.text}
                <span
                  aria-hidden
                  className="rm-bubbletime rm-bubbletime--ghost"
                >
                  {timeOf(message.ts)}
                </span>
              </p>
              <time
                className={`rm-bubbletime${mine ? ' rm-bubbletime--mine' : ''}`}
                dateTime={new Date(message.ts).toISOString()}
              >
                {timeOf(message.ts)}
              </time>
            </div>
          </SwipeToReply>
        </div>

        {totalReactions > 0 && (
          <div
            className={`rm-reacts ${mine ? 'self-end mr-2 justify-end' : 'self-start ml-2 justify-start'}`}
            aria-label="Reactions"
          >
            {usedReactions.map((reaction) => {
              const count = message.reactions?.[reaction] ?? 0;
              return (
                <button
                  key={reaction}
                  type="button"
                  onClick={() => onReact(message.id, reaction)}
                  aria-label={`${reaction}, ${count}`}
                  aria-pressed={count > 0}
                  title={`${reaction} · ${count}`}
                  className={`rm-react${count > 0 ? ' rm-react--on' : ''}`}
                >
                  <span className="rm-react__glyph">{ROOM_REACTION_GLYPHS[reaction]}</span>
                  {count > 1 && <span className="rm-react__count">{count}</span>}
                </button>
              );
            })}
          </div>
        )}
        {totalReactions === 0 && (
          <div className="rm-reactaddwrap">
            <button
              ref={triggerRef}
              type="button"
              onClick={openPicker}
              aria-label="Add reaction"
              className="rm-reactadd"
            >
              <ReactionAddIcon className="h-5 w-5" />
            </button>
          </div>
        )}
        {pickerOpen &&
          createPortal(
            <div ref={portalRef} style={pickerStyle} className="flex origin-top-right scale-[0.85] flex-col items-end">
              <ReactionStrip
                reactions={[]}
                myUserId=""
                onReact={(emoji) => {
                  onReact(message.id, emoji);
                  setPickerOpen(false);
                }}
                onClose={() => setPickerOpen(false)}
              />
            </div>,
            document.body
          )}
      </div>
    </div>
  );
};

export default RoomMessageRow;
