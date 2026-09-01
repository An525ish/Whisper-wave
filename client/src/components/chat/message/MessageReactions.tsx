import { useState, useRef, useEffect, useCallback, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useSocket } from '@/socket/SocketProvider';
import { SOCKET_EVENTS } from '@/constants/socket';
import { useAuthStore } from '@/stores/auth';
import ReactionAddIcon from '@/components/chat/message/ReactionAddIcon';
import ReactionStrip, { REACTION_SURFACE_CLASS, saveRecentEmoji } from '@/components/chat/message/ReactionStrip';
import type { MessageReaction } from '@/types/chat';

type MessageReactionsProps = {
  reactions: MessageReaction[];
  messageId: string;
  chatId: string;
  sameSender: boolean;
};

const MessageReactions = ({ reactions, messageId, chatId, sameSender }: MessageReactionsProps) => {
  const socket = useSocket();
  const user = useAuthStore((s) => s.user);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerStyle, setPickerStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  const closePicker = useCallback(() => setPickerOpen(false), []);

  // Close picker on outside click (excluding trigger and portal content)
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || portalRef.current?.contains(t)) return;
      closePicker();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen, closePicker]);

  const myId = user?._id ? String(user._id) : '';
  if (!myId) return null;

  const hasReactions = reactions.length > 0;

  const handleToggle = (emoji: string) => {
    const alreadyReacted = reactions.find((r) => r.emoji === emoji)?.users.includes(myId);
    if (!alreadyReacted) saveRecentEmoji(emoji);
    socket.emit(SOCKET_EVENTS.MESSAGE_REACTION, { messageId, chatId, emoji });
    closePicker();
  };

  const openPicker = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const stripHeight = 52;
      const gap = 8;
      const style: CSSProperties = {
        position: 'fixed',
        zIndex: 9999,
      };

      if (rect.top >= stripHeight + gap) {
        style.bottom = window.innerHeight - rect.top + gap;
      } else {
        style.top = rect.bottom + gap;
      }

      if (sameSender) {
        style.right = Math.max(8, window.innerWidth - rect.right);
      } else {
        style.left = Math.max(8, rect.left);
      }
      setPickerStyle(style);
    }
    setPickerOpen((p) => !p);
  };

  // Portal renders outside all overflow-hidden ancestors — no clipping
  const pickerPortal = pickerOpen
    ? createPortal(
        <div ref={portalRef} style={pickerStyle}>
          {/* No overflow-hidden here so inner EmojiPicker can open freely */}
          <div className="rounded-xl border border-border bg-primary shadow-xl">
            <ReactionStrip
              reactions={reactions}
              myUserId={myId}
              onReact={handleToggle}
              onClose={closePicker}
            />
          </div>
        </div>,
        document.body,
      )
    : null;

  const alignClass = sameSender ? 'right-2' : 'left-2';
  const rowClass = `-mt-1 z-10 flex flex-wrap items-center gap-1 ${sameSender ? 'self-end mr-2 justify-end' : 'self-start ml-2 justify-start'}`;

  const smileyTrigger = !hasReactions ? (
    <button
      ref={triggerRef}
      type="button"
      onClick={openPicker}
      className={`flex h-[22px] w-[22px] items-center justify-center text-body-300 transition-all duration-150 hover:text-body ${REACTION_SURFACE_CLASS} ${pickerOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      aria-label="Add reaction"
    >
      <ReactionAddIcon className="h-5 w-5" />
    </button>
  ) : null;

  return (
    <>
      {hasReactions ? (
        <div className={rowClass}>
          {reactions.map(({ emoji, users }) => {
            const count = users.length;
            const reacted = users.includes(myId);
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => handleToggle(emoji)}
                className={`flex h-[22px] items-center gap-0.5 px-1.5 transition-all duration-150 active:scale-95 ${REACTION_SURFACE_CLASS} ${reacted ? 'text-body ring-1 ring-green/35' : 'text-body-700 hover:text-body'}`}
                title={`${emoji} · ${count}`}
              >
                <span className="text-[15px] leading-none">{emoji}</span>
                {count > 1 && (
                  <span className="text-[10px] font-medium tabular-nums leading-none">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className={`absolute bottom-0 z-10 ${alignClass}`}>{smileyTrigger}</div>
      )}
      {pickerPortal}
    </>
  );
};

export default MessageReactions;
