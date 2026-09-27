import type { Dispatch, MouseEvent, SetStateAction } from 'react';
import type { Virtualizer } from '@tanstack/react-virtual';
import SwipeToReply from '@/features/chat/components/message/SwipeToReply';
import ChatBox from '@/features/chat/components/message/MessageRow';
import MessageReactions from '@/features/chat/components/message/MessageReactions';
import ChatDayLabel from '@/features/chat/components/conversation/ChatDayLabel';
import type { useLongPress } from '@/shared/hooks/useLongPress';
import type { StickyDayHeader } from '@/features/chat/hooks/useChatScroll';
import type { ChatMessage, ConfirmDeleteState, TimelineItem } from '@/features/chat/types/chat';
import type { MediaFile } from '@/shared/components/ui/image-viewer/ImageViewer';

type MessageListProps = {
  virtualizer: Virtualizer<HTMLDivElement, Element>;
  timelineItems: TimelineItem[];
  isDateHeaderScrolling: boolean;
  stickyDayHeader: StickyDayHeader | null;
  currentUserId: string;
  selectedIds: Set<string>;
  selectMode: boolean;
  canInteractMessage: (msg: ChatMessage) => boolean;
  toggleSelected: (id: string) => void;
  chatId?: string;
  sharedGalleryFiles: MediaFile[];
  isGroupChat: boolean;
  isMessageRead: (msg: ChatMessage) => boolean;
  highlightedMessageId: string | null;
  highlightQuery: string;
  setConfirmDelete: Dispatch<SetStateAction<ConfirmDeleteState>>;
  openForwardDialog: (ids: string[]) => void;
  startReply: (msg: ChatMessage) => void;
  openMessageContextMenu: (e: MouseEvent, msg: ChatMessage) => void;
  bindLongPress: ReturnType<typeof useLongPress<ChatMessage>>;
};

/**
 * The virtualized message timeline: day separators plus message bubbles with
 * swipe-to-reply, long-press/context menu, selection, and reactions. Pure render
 * driven by the panel's message/scroll/selection hooks.
 */
const MessageList = ({
  virtualizer, timelineItems, isDateHeaderScrolling, stickyDayHeader,
  currentUserId, selectedIds, selectMode, canInteractMessage, toggleSelected,
  chatId, sharedGalleryFiles, isGroupChat, isMessageRead,
  highlightedMessageId, highlightQuery,
  setConfirmDelete, openForwardDialog, startReply, openMessageContextMenu, bindLongPress,
}: MessageListProps) => (
  <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
    {virtualizer.getVirtualItems().map((item) => {
      const entry = timelineItems[item.index];
      if (!entry) return null;
      if (entry.kind === 'day') {
        const hideInlineDay = isDateHeaderScrolling && stickyDayHeader?.dayIndex === item.index;
        return (
          <div
            key={entry.key}
            data-index={item.index}
            ref={virtualizer.measureElement}
            className={`absolute left-0 flex w-full justify-center px-4 pb-3 pt-2 transition-opacity duration-150 ${
              hideInlineDay ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
            style={{ transform: `translateY(${item.start}px)` }}
            aria-hidden={hideInlineDay}
          >
            <ChatDayLabel label={entry.label} />
          </div>
        );
      }
      const msg = entry.message;
      const sameSender = String(msg.sender._id) === currentUserId;
      const isSelected = selectedIds.has(msg._id);
      const selectable = selectMode && canInteractMessage(msg);
      const hasReactions = Boolean(msg.reactions?.length);
      return (
        <div key={entry.key} data-index={item.index} ref={virtualizer.measureElement}
          className={`absolute left-0 w-full overflow-visible pb-4 ${sameSender ? 'flex justify-end' : 'flex justify-start'}`}
          style={{ transform: `translateY(${item.start}px)` }}
          onClick={() => { if (selectable) toggleSelected(msg._id); }}>
          {/* selection bg — inset so it only wraps the bubble, not the bottom padding */}
          {selectable ? (
            <span aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 bottom-3 -z-0 transition-opacity duration-150 bg-linear-to-r from-transparent via-green/15 to-transparent ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
          ) : null}
          {/* flex-col wrapper so reactions sit below the bubble, outside SwipeToReply (which has overflow-hidden) */}
          <div className={`group relative z-1 flex flex-col w-fit min-w-0 max-w-[min(100%,22rem)] shrink-0 ${!hasReactions && msg._id && chatId && !msg.isDeleted ? 'pb-4.5 -mb-4.5' : ''} ${sameSender ? 'self-end items-end' : 'self-start items-start'}`}>
            <SwipeToReply
              side={sameSender ? 'end' : 'start'}
              shellClassName={sameSender ? 'bubble-out' : 'bubble-in'}
              disabled={!canInteractMessage(msg) || selectMode}
              onReply={() => startReply(msg)}
            >
              <div className="relative w-fit max-w-full select-none [-webkit-touch-callout:none]" onContextMenu={(e) => openMessageContextMenu(e, msg)}
                role={selectable ? 'button' : undefined} tabIndex={selectable ? 0 : undefined}
                {...bindLongPress(msg)}
                onKeyDown={selectable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSelected(msg._id); } } : undefined}>
                <ChatBox chatData={msg} chatId={chatId} sharedGalleryFiles={sharedGalleryFiles} isGroupChat={isGroupChat} showReadReceipt={sameSender}
                  isRead={isMessageRead(msg)} searchHighlight={msg._id === highlightedMessageId}
                  highlightQuery={msg._id === highlightedMessageId && highlightQuery ? highlightQuery : undefined}
                  isDeleted={Boolean(msg.isDeleted)} editedAt={msg.editedAt}
                  onDeleteMessage={(msgId) => setConfirmDelete({ type: 'one', messageId: msgId })}
                  onForwardMessage={(msgId) => openForwardDialog([msgId])} />
              </div>
            </SwipeToReply>
            {/* Reactions rendered here — outside SwipeToReply so they aren't clipped */}
            {msg._id && chatId && !msg.isDeleted ? (
              <MessageReactions
                reactions={msg.reactions ?? []}
                messageId={msg._id}
                chatId={chatId}
                sameSender={sameSender}
              />
            ) : null}
          </div>
        </div>
      );
    })}
  </div>
);

export default MessageList;
