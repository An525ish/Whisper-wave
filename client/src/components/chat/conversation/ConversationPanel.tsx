import {
  forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState,
  type ChangeEvent, type KeyboardEvent, type TouchEvent,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useErrors from '@/hooks/shared/useError';
import { useSocket } from '@/socket/SocketProvider';
import {
  useChatDetailsQuery, useChatMessages, useChatScroll, useDeleteActions,
  useMessageActions, useMessageSelection,
  useSendGifMutation, useTypingIndicator, queryKeys,
} from '@/hooks/chat';
import { useAttachmentUpload } from '@/hooks/chat/useAttachmentUpload';
import ContextMenu from '@/components/ui/context-menu/ContextMenu';
import ConfirmationModal from '@/components/ui/modal/confirmation-modal/ConfirmationModal';
import MessageReceiptDialog from '@/components/chat/message/MessageReceiptDialog';
import SwipeToReply from '@/components/chat/message/SwipeToReply';
import CloseIcon from '@/components/ui/icons/Close';
import { useAuthStore } from '@/stores/auth';
import { ChatMessagesSkeleton } from '@/components/chat/ChatMessageSkeleton';
import toast from 'react-hot-toast';
import type { Avatar } from '@/types';
import { isValidMessageId, normalizeMemberIds } from '@/utils/helpers';
import ChatBox from '@/components/chat/message/MessageRow';
import MessageReactions from '@/components/chat/message/MessageReactions';
import ChatInput from '@/components/chat/conversation/composer/ChatInput';
import ForwardDialog from '@/components/chat/dialogs/ForwardDialog';
import type {
  ChatDetailsResponse, ChatMessage, MessageReplyTo,
} from '@/types/chat';
import { isOutgoingMessageRead } from '@/utils/chat';
import DoubleChevronDown from '@/components/ui/icons/DoubleChevronDown';
import ReplyComposerBar from '@/components/chat/conversation/composer/ReplyBar';
import ChatDayLabel from '@/components/chat/conversation/ChatDayLabel';
import { CHAT_HEADER_OFFSET_CLASS, CHAT_HEADER_TOP_CLASS } from '@/constants/chat';

export type ConversationPanelHandle = {
  clearChat: () => void;
  deleteSelected: () => void;
  forwardSelected: () => void;
  copySelected: () => void;
};

type ChatsViewPanelProps = {
  chatId?: string;
  focusMessageId?: string | null;
  highlightQuery?: string;
  searchOpen?: boolean;
  selectMode?: boolean;
  onSelectModeChange?: (active: boolean) => void;
  onSelectedCountChange?: (count: number) => void;
  onDeletableSelectedCountChange?: (count: number) => void;
  onDeletingSelectedChange?: (pending: boolean) => void;
  onEditingChange?: (editing: boolean) => void;
  onFetchingNextPageChange?: (loading: boolean) => void;
};

const buildReplySnapshot = (msg: ChatMessage): MessageReplyTo => {
  const firstAttachment = msg.attachments?.[0];
  return {
    messageId: msg._id, content: msg.content,
    senderName: msg.sender.name ?? 'Unknown',
    previewAttachment: firstAttachment
      ? { url: firstAttachment.url ?? firstAttachment.tempUrl ?? '', name: firstAttachment.name ?? 'Attachment', fileType: firstAttachment.type ?? '' }
      : undefined,
  };
};

const getReplyPreviewText = (reply: MessageReplyTo) =>
  reply.previewAttachment?.name || reply.content?.trim() || 'Message';

const ConversationPanel = forwardRef<ConversationPanelHandle, ChatsViewPanelProps>(({
  chatId, focusMessageId = null, highlightQuery = '', searchOpen = false,
  selectMode = false, onSelectModeChange, onSelectedCountChange,
  onDeletableSelectedCountChange, onDeletingSelectedChange, onEditingChange,
  onFetchingNextPageChange,
}, ref) => {
  const socket = useSocket();
  const user = useAuthStore((s) => s.user);
  const isImpersonated = useAuthStore((s) => s.isImpersonated);
  const actAsUser = useAuthStore((s) => s.actAsUser);
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [imageQuality, setImageQuality] = useState<'standard' | 'hd'>('standard');

  const { data: chatDetails, isLoading, error, isError } = useChatDetailsQuery(
    { id: chatId, populate: true }, { skip: !chatId },
  );
  const isGroupChat = Boolean((chatDetails as ChatDetailsResponse | undefined)?.data?.groupChat);
  const myRole = (chatDetails as ChatDetailsResponse | undefined)?.data?.myRole ?? null;
  const canModerateGroup = isGroupChat && (myRole === 'creator' || myRole === 'admin');
  const canClearChat = !isGroupChat || myRole === 'creator';
  const memberIds = useMemo(
    () => normalizeMemberIds((chatDetails as ChatDetailsResponse | undefined)?.data?.members),
    [chatDetails],
  );

  const { selectedIds, setSelectedIds, toggleSelected } = useMessageSelection({
    selectMode,
    onExitSelectMode: () => onSelectModeChange?.(false),
  });

  const {
    msgLoading, isFetchingNextPage, hasNextPage, fetchNextPage,
    dbError, dbIsError, liveMessages, setLiveMessages,
    historyMessages, allMessages, timelineItems, timelineRef,
    peerLastReadAt, invalidateMessages, applyDeletedMessages, applyUpdatedMessage,
  } = useChatMessages({
    chatId, socket, user, isGroupChat,
    onChatCleared: useCallback(() => {
      setSelectedIds(new Set()); onSelectModeChange?.(false);
    }, [onSelectModeChange, setSelectedIds]),
    onMessagesDeleted: useCallback((ids: string[]) => {
      setSelectedIds((prev) => { const next = new Set(prev); for (const id of ids) next.delete(id); return next; });
    }, [setSelectedIds]),
  });

  const { isTyping, setIsTyping, isTypingRef, timeoutRef, clearTypingState, emitStartTyping, emitStopTyping } =
    useTypingIndicator({ chatId, socket });

  const {
    editingMessageId, isEditing, cancelEdit, saveEdit,
    replyingTo, clearReply, startReply,
    forwardOpen, setForwardOpen, forwardMessageIds, setForwardMessageIds,
    openForwardDialog, handleForwardToChat, forwardIsPending,
    copyMessagesByIds, openMessageContextMenu, openMessageContextMenuFromTouch,
    menuState, hideContextMenu,
    confirmClearOpen, setConfirmClearOpen, confirmDelete, setConfirmDelete,
    deletableSelectedIds, canInteractMessage, editIsPending,
    receiptMessage, setReceiptMessage,
  } = useMessageActions({
    chatId, user, canModerateGroup, canClearChat, isGroupChat, allMessages,
    selectedIds, setSelectedIds, onSelectModeChange, applyUpdatedMessage, invalidateMessages,
    setLiveMessages, clearTypingState, message, setMessage, setAttachments,
    onEditingChange,
  });

  const { deleteOneMessage, deleteSelectedMessages, handleClearChat } = useDeleteActions({
    chatId, canModerateGroup, canClearChat, deletableSelectedIds,
    selectedIds, setSelectedIds, onSelectModeChange, applyDeletedMessages,
    invalidateMessages, setLiveMessages, cancelEdit,
    onDeletingSelectedChange,
  });

  const {
    containerRef, virtualizer, showScrollToBottom, scrollToBottom, isNearBottomRef,
    highlightedMessageId, stickyDayHeader, isDateHeaderScrolling,
  } = useChatScroll({
    chatId, timelineItems, timelineRef, hasNextPage, isFetchingNextPage, fetchNextPage,
    focusMessageId, searchOpen, liveMessagesLength: liveMessages.length, historyMessagesLength: historyMessages.length,
  });

  useEffect(() => {
    onFetchingNextPageChange?.(isFetchingNextPage);
  }, [isFetchingNextPage, onFetchingNextPageChange]);

  useEffect(() => {
    onFetchingNextPageChange?.(false);
  }, [chatId, onFetchingNextPageChange]);

  const handleComposerResize = useCallback(() => {
    if (isNearBottomRef.current) scrollToBottom();
  }, [isNearBottomRef, scrollToBottom]);

  useErrors([{ error, isError }, { error: dbError, isError: dbIsError }]);
  useEffect(() => { onSelectedCountChange?.(selectedIds.size); }, [onSelectedCountChange, selectedIds]);
  useEffect(() => { onDeletableSelectedCountChange?.(deletableSelectedIds.length); }, [deletableSelectedIds.length, onDeletableSelectedCountChange]);
  useEffect(() => { setMessage(''); setAttachments([]); setImageQuality('standard'); }, [chatId]);

useImperativeHandle(ref, () => ({
    clearChat: () => { if (canClearChat) setConfirmClearOpen(true); },
    deleteSelected: () => {
      if (selectedIds.size === 0 || deletableSelectedIds.length === 0) return;
      setConfirmDelete({ type: 'many' });
    },
    forwardSelected: () => {
      if (selectedIds.size === 0) return;
      openForwardDialog([...selectedIds]);
    },
    copySelected: () => {
      if (selectedIds.size === 0) return;
      void copyMessagesByIds([...selectedIds]);
    },
  }), [canClearChat, copyMessagesByIds, deletableSelectedIds.length, openForwardDialog, selectedIds, setConfirmClearOpen, setConfirmDelete]);

  const queryClient = useQueryClient();
  const attachmentUpload = useAttachmentUpload();
  const { mutate: sendGifMutation } = useSendGifMutation();

  const isMessageRead = useCallback(
    (msg: ChatMessage) =>
      isOutgoingMessageRead(msg, {
        userId: String(user?._id ?? ''),
        isGroupChat,
        memberIds,
        peerLastReadAt,
      }),
    [isGroupChat, memberIds, peerLastReadAt, user?._id],
  );

  // Long-press handler factory — one stable timer ref, used across all messages
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressMovedRef = useRef(false);

  const longPressHandlers = useCallback(
    (msg: ChatMessage) => ({
      onTouchStart: (e: TouchEvent) => {
        e.preventDefault();
        longPressMovedRef.current = false;
        longPressTimerRef.current = setTimeout(() => {
          if (!longPressMovedRef.current) openMessageContextMenuFromTouch(e, msg);
        }, 500);
      },
      onTouchEnd: () => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); },
      onTouchMove: () => { longPressMovedRef.current = true; if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); },
      onTouchCancel: () => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); },
      onSelectStart: (e: Event) => { e.preventDefault(); },
    }),
    [openMessageContextMenuFromTouch],
  );

  const handleMessageChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setMessage(next);
    if (isEditing || !chatId) return;
    if (!next.trim()) { clearTypingState(true); return; }
    if (!isTypingRef.current) { setIsTyping(true); emitStartTyping(); }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => { setIsTyping(false); emitStopTyping(); timeoutRef.current = null; }, 1200);
  };

  const handleEnterPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editingMessageId) { void saveEdit(); return; }
      void handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (editingMessageId) { await saveEdit(); return; }
    if (!message.trim() && (!attachments || attachments.length === 0)) return;
    // Ghost mode without "act as user" — block sends silently.
    if (isImpersonated && !actAsUser) { toast.error('Sends are blocked in ghost mode — toggle "Act as user" in the banner.'); return; }
    if (isTyping) clearTypingState(true);

    if (!attachments || attachments.length === 0) {
      const trimmed = message.trim();
      if (!trimmed || !chatId) { if (!trimmed) return; toast.error('Unable to send message right now'); return; }
      const replySnapshot = replyingTo ? buildReplySnapshot(replyingTo) : undefined;
      const replyToMessageId = replyingTo && isValidMessageId(replyingTo._id) ? replyingTo._id : undefined;
      const pendingId = `pending-${Date.now()}`;
      setLiveMessages((prev) => [...prev, { _id: pendingId, content: trimmed, sender: { _id: user?._id ?? '', name: user?.name ?? '', avatar: user?.avatar as Avatar | undefined }, createdAt: new Date().toISOString(), replyTo: replySnapshot }]);
      setMessage(''); clearReply();
      socket.emit('NEW_MESSAGE', { message: trimmed, chatId, replyToMessageId });
      scrollToBottom(); return;
    }

    const replySnapshot = replyingTo ? buildReplySnapshot(replyingTo) : undefined;
    const replyToMessageId = replyingTo && isValidMessageId(replyingTo._id) ? replyingTo._id : undefined;
    const tempId = String(Date.now());
    const tempAttachments = attachments.map((f) => ({
      tempUrl: URL.createObjectURL(f),
      name: f.name,
      type: f.type,
      size: f.size,
      uploading: true,
    }));
    setLiveMessages((prev) => [
      ...prev,
      {
        _id: tempId,
        content: message,
        sender: { _id: user?._id ?? '', name: user?.name ?? '', avatar: user?.avatar as Avatar | undefined },
        attachments: tempAttachments,
        createdAt: new Date().toISOString(),
        isUploading: true,
        replyTo: replySnapshot,
      },
    ]);
    const filesToUpload = [...attachments];
    setMessage(''); setAttachments([]); setImageQuality('standard'); clearReply();
    try {
      const result = await attachmentUpload.upload({
        chatId: chatId ?? '',
        files: filesToUpload,
        content: message,
        replyToMessageId,
        imageQuality,
      });
      if (!result) { setLiveMessages((prev) => prev.filter((m) => m._id !== tempId)); return; }
      const payload = ((result as { data?: ChatMessage }).data ?? result) as ChatMessage;
      setLiveMessages((prev) =>
        prev.map((m) =>
          m._id === tempId
            ? {
                ...payload,
                attachments: (payload.attachments ?? []).map((att, i) => ({
                  ...att,
                  tempUrl: tempAttachments[i]?.tempUrl,
                  uploading: false,
                })),
              }
            : m,
        ),
      );
      // Invalidate so the media tab and message history reflect the new attachment
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages(chatId ?? '') });
      void queryClient.invalidateQueries({ queryKey: queryKeys.media(chatId ?? '') });
      attachmentUpload.reset();
      scrollToBottom();
    } catch {
      toast.error('Failed to send attachments');
      setLiveMessages((prev) => prev.filter((m) => m._id !== tempId));
      attachmentUpload.reset();
    }
  };

  const handleGifSelect = useCallback(
    (gif: {
      url: string;
      id: string;
      title: string;
      mimeType?: string;
      kind?: 'gif' | 'meme';
    }) => {
      if (!chatId) return;
      const replyToMessageId =
        replyingTo && isValidMessageId(replyingTo._id) ? replyingTo._id : undefined;
      const replySnapGif = replyingTo ? buildReplySnapshot(replyingTo) : undefined;
      const tempId = `pending-gif-${Date.now()}`;
      const mime = gif.mimeType ?? 'image/gif';
      const label = gif.kind === 'meme' ? 'Meme' : 'GIF';
      setLiveMessages((prev) => [
        ...prev,
        {
          _id: tempId,
          sender: {
            _id: user?._id ?? '',
            name: user?.name ?? '',
            avatar: user?.avatar as Avatar | undefined,
          },
          attachments: [{ tempUrl: gif.url, name: gif.title || label, type: mime, uploading: true }],
          createdAt: new Date().toISOString(),
          isUploading: true,
          replyTo: replySnapGif,
        },
      ]);
      clearReply();
      scrollToBottom();
      sendGifMutation(
        {
          chatId,
          gifId: gif.id,
          gifUrl: gif.url,
          gifTitle: gif.title,
          mimeType: mime as 'image/gif' | 'image/png' | 'image/webp' | 'image/jpeg',
          kind: gif.kind ?? 'gif',
          replyToMessageId,
        },
        {
          onSuccess: (result) => {
            const payload = ((result as { data?: unknown })?.data ?? result) as ChatMessage;
            setLiveMessages((prev) =>
              prev.map((m) =>
                m._id === tempId
                  ? { ...payload, attachments: (payload.attachments ?? []).map((att) => ({ ...att, uploading: false })) }
                  : m
              )
            );
          },
          onError: () => {
            toast.error(`Failed to send ${label}`);
            setLiveMessages((prev) => prev.filter((m) => m._id !== tempId));
          },
        }
      );
    },
    [chatId, replyingTo, user, setLiveMessages, clearReply, scrollToBottom, sendGifMutation]
  );

  const replySnapshot = replyingTo ? buildReplySnapshot(replyingTo) : null;

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="bg-glass-background relative min-h-0 flex-1 overflow-hidden md:rounded-xl">
        <div ref={containerRef} className={`relative h-full min-h-0 overflow-x-hidden overflow-y-auto overscroll-x-none bg-[rgba(33,26,42,0.75)] px-2 pb-3 backdrop-blur-lg backdrop-saturate-100 scrollbar-hide md:rounded-xl md:px-2 md:pb-2 ${CHAT_HEADER_OFFSET_CLASS} ${isEditing ? 'pointer-events-none select-none' : ''}`}>
          {msgLoading ? <ChatMessagesSkeleton /> : (
            <>
              <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
                {virtualizer.getVirtualItems().map((item) => {
                  const entry = timelineItems[item.index];
                  if (!entry) return null;
                  if (entry.kind === 'day') {
                    const hideInlineDay =
                      isDateHeaderScrolling
                      && stickyDayHeader?.dayIndex === item.index;
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
                  const sameSender = String(msg.sender._id) === String(user?._id ?? '');
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
                            {...longPressHandlers(msg)}
                            onKeyDown={selectable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSelected(msg._id); } } : undefined}>
                            <ChatBox chatData={msg} isGroupChat={isGroupChat} showReadReceipt={sameSender}
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
            </>
          )}
        </div>
        {stickyDayHeader && isDateHeaderScrolling && !msgLoading ? (
          <div
            className={`pointer-events-none absolute inset-x-0 z-10 flex justify-center transition-opacity duration-200 ${CHAT_HEADER_TOP_CLASS}`}
            style={{transform: `translateY(${stickyDayHeader.pushY}px)` }}
          >
            <ChatDayLabel label={stickyDayHeader.label} />
          </div>
        ) : null}
        {showScrollToBottom ? (
          <button type="button" onClick={() => scrollToBottom(true)} aria-label="Scroll to latest messages"
            className={`absolute right-3 z-20 grid h-10 w-10 place-items-center rounded-full border border-border/80 bg-primary/95 text-body shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition hover:border-green/40 hover:bg-background-alt hover:text-green md:right-4 ${attachments.length > 0 ? 'bottom-20 md:bottom-24' : 'bottom-[max(0.75rem,env(safe-area-inset-bottom))] md:bottom-4'}`}>
            <DoubleChevronDown className="h-4 w-4" />
          </button>
        ) : null}
        {isEditing ? <div aria-hidden className="pointer-events-auto absolute inset-0 z-30 bg-black/45 backdrop-blur-[2px]" onClick={cancelEdit} /> : null}
      </div>

      {isEditing ? (
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-green/25 bg-green/10 px-3 py-1.5 text-xs text-green md:rounded-t-xl">
          <span className="font-medium">Editing message</span>
          <button type="button" onClick={cancelEdit} className="grid h-8 w-8 place-items-center rounded-full text-body-700 transition hover:bg-white/8 hover:text-body" aria-label="Cancel edit"><CloseIcon className="h-3.5 w-3.5" /></button>
        </div>
      ) : null}

      <div className="relative z-40 shrink-0 border-t border-border/40 bg-background/95 px-2 py-2 backdrop-blur-md md:border-0 md:bg-transparent md:px-0 md:pb-0 md:pt-3">
        <ChatInput message={message} setMessage={setMessage} disabled={isLoading || editIsPending}
          replySlot={replySnapshot && replyingTo ? (
            <ReplyComposerBar
              senderName={replyingTo.sender.name ?? 'Unknown'}
              previewText={getReplyPreviewText(replySnapshot)}
              previewAttachment={replySnapshot.previewAttachment}
              onCancel={clearReply}
            />
          ) : undefined}
          autoFocus={true} onKeyDown={handleEnterPress} handleSubmit={handleSubmit}
          onChange={handleMessageChange} attachments={attachments} setAttachments={setAttachments}
          imageQuality={imageQuality} setImageQuality={setImageQuality}
          onGifSelect={handleGifSelect}
          onComposerResize={handleComposerResize}
          editMode={isEditing} className="text-body-700 placeholder:text-body-300" placeholder={isEditing ? 'Edit message…' : 'Message…'} />
      </div>

      <ForwardDialog open={forwardOpen} sourceChatId={chatId ?? ''} messageIds={forwardMessageIds}
        onClose={() => { setForwardOpen(false); setForwardMessageIds([]); }}
        onForward={handleForwardToChat} isForwarding={forwardIsPending} />
      <ContextMenu menuState={menuState} hideContextMenu={hideContextMenu} />

      {confirmClearOpen ? (
        <ConfirmationModal variant="danger" title="Clear this chat?"
          description="Messages will be cleared from your view only. Others in the chat won't be affected."
          confirmLabel="Clear all" cancelLabel="Cancel" onClose={() => setConfirmClearOpen(false)}
          handleConfirmationModal={({ accept }) => { setConfirmClearOpen(false); if (accept) void handleClearChat(); }} />
      ) : null}

      {confirmDelete ? (
        <ConfirmationModal variant="danger"
          title={confirmDelete.type === 'many' ? `Delete ${deletableSelectedIds.length} message${deletableSelectedIds.length === 1 ? '' : 's'}?` : 'Delete this message?'}
          description={confirmDelete.type === 'many'
            ? deletableSelectedIds.length < selectedIds.size
              ? canModerateGroup ? 'Some selected messages could not be deleted.' : 'Only your own messages in this selection will be deleted for everyone.'
              : 'Selected messages will be removed for everyone in this chat.'
            : 'This message will be removed for everyone in this chat.'}
          confirmLabel="Delete" cancelLabel="Cancel" onClose={() => setConfirmDelete(null)}
          handleConfirmationModal={({ accept }) => {
            if (!accept) { setConfirmDelete(null); return; }
            if (confirmDelete.type === 'one') void deleteOneMessage(confirmDelete.messageId);
            else void deleteSelectedMessages();
            setConfirmDelete(null);
          }} />
      ) : null}

      {receiptMessage ? (
        <MessageReceiptDialog
          message={receiptMessage}
          isGroupChat={isGroupChat}
          onClose={() => setReceiptMessage(null)}
        />
      ) : null}
    </div>
  );
});

ConversationPanel.displayName = 'ConversationPanel';

export default ConversationPanel;
