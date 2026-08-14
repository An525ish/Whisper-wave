import {
  forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState,
  type ChangeEvent, type KeyboardEvent,
} from 'react';
import useErrors from '@/shared/hooks/useError';
import { useSocket } from '@/socket/SocketProvider';
import {
  useChatDetailsQuery, useChatMessages, useChatScroll, useDeleteActions,
  useMessageActions, useMessageSelection, useSendAttachmentsMutation, useTypingIndicator,
} from '@/features/chat/hooks';
import ContextMenu from '@/shared/components/context-menu/ContextMenu';
import ConfirmationModal from '@/shared/components/ui/modal/confirmation-modal/ConfirmationModal';
import CloseIcon from '@/shared/components/icons/Close';
import CheckboxIcon from '@/shared/components/icons/Checkbox';
import { useAuthStore } from '@/features/auth/store';
import { ChatMessagesSkeleton } from '@/shared/components/skeletons/ChatMessageSkeleton';
import toast from 'react-hot-toast';
import type { Avatar } from '@/shared/types';
import { isValidMessageId, normalizeMemberIds } from '@/shared/utils/helper';
import ChatBox, { type MessageReplyTo } from '@/features/chat/components/message/ChatBox';
import ChatInput from './ChatInput';
import ForwardDialog from '@/features/chat/components/dialogs/ForwardDialog';
import useAsyncMutation from '@/shared/hooks/useAsyncMutation';
import type {
  ChatDetailsResponse, ChatMessage, SendAttachmentsResult,
} from '@/features/chat/types';
import { isOutgoingMessageRead } from '@/features/chat/utils/messageUtils';
import DoubleChevronDown from '@/shared/components/icons/DoubleChevronDown';
import ReplyComposerBar from './ReplyComposerBar';

export type ChatsViewPanelHandle = {
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

const ChatsViewPanel = forwardRef<ChatsViewPanelHandle, ChatsViewPanelProps>(({
  chatId, focusMessageId = null, highlightQuery = '', searchOpen = false,
  selectMode = false, onSelectModeChange, onSelectedCountChange,
  onDeletableSelectedCountChange, onDeletingSelectedChange, onEditingChange,
}, ref) => {
  const socket = useSocket();
  const user = useAuthStore((s) => s.user);
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

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
  const memberIdsRef = useRef(memberIds);
  memberIdsRef.current = memberIds;

  const { selectedIds, setSelectedIds, toggleSelected } = useMessageSelection({ selectMode });

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
    useTypingIndicator({ chatId, socket, memberIdsRef });

  const {
    editingMessageId, isEditing, cancelEdit, saveEdit,
    replyingTo, clearReply,
    forwardOpen, setForwardOpen, forwardMessageIds, setForwardMessageIds,
    openForwardDialog, handleForwardToChat, forwardIsPending,
    copyMessagesByIds, openMessageContextMenu, menuState, hideContextMenu,
    confirmClearOpen, setConfirmClearOpen, confirmDelete, setConfirmDelete,
    deletableSelectedIds, canInteractMessage, editIsPending,
  } = useMessageActions({
    chatId, user, canModerateGroup, canClearChat, allMessages,
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

  const { containerRef, virtualizer, showScrollToBottom, scrollToBottom, highlightedMessageId } = useChatScroll({
    chatId, timelineItems, timelineRef, hasNextPage, isFetchingNextPage, fetchNextPage,
    focusMessageId, searchOpen, liveMessagesLength: liveMessages.length, historyMessagesLength: historyMessages.length,
  });

  useErrors([{ error, isError }, { error: dbError, isError: dbIsError }]);
  useEffect(() => { onSelectedCountChange?.(selectedIds.size); }, [onSelectedCountChange, selectedIds]);
  useEffect(() => { onDeletableSelectedCountChange?.(deletableSelectedIds.length); }, [deletableSelectedIds.length, onDeletableSelectedCountChange]);
  useEffect(() => { setMessage(''); setAttachments([]); }, [chatId]);

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

  const [sendAttachments] = useAsyncMutation(useSendAttachmentsMutation);

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

  const handleMessageChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setMessage(next);
    if (isEditing || !chatId || memberIdsRef.current.length === 0) return;
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
    if (isTyping) clearTypingState(true);

    if (!attachments || attachments.length === 0) {
      const trimmed = message.trim();
      if (!trimmed || !chatId || memberIds.length === 0) { if (!trimmed) return; toast.error('Unable to send message right now'); return; }
      const replySnapshot = replyingTo ? buildReplySnapshot(replyingTo) : undefined;
      const replyToMessageId = replyingTo && isValidMessageId(replyingTo._id) ? replyingTo._id : undefined;
      const pendingId = `pending-${Date.now()}`;
      setLiveMessages((prev) => [...prev, { _id: pendingId, content: trimmed, sender: { _id: user?._id ?? '', name: user?.name ?? '', avatar: user?.avatar as Avatar | undefined }, createdAt: new Date().toISOString(), replyTo: replySnapshot }]);
      setMessage(''); clearReply();
      socket.emit('NEW_MESSAGE', { message: trimmed, chatId, members: memberIds, replyToMessageId });
      scrollToBottom(); return;
    }

    const replySnapshot = replyingTo ? buildReplySnapshot(replyingTo) : undefined;
    const replyToMessageId = replyingTo && isValidMessageId(replyingTo._id) ? replyingTo._id : undefined;
    const tempId = String(Date.now());
    const tempAttachments = attachments.map((f) => ({ tempUrl: URL.createObjectURL(f), name: f.name, type: f.type, size: f.size, uploading: true }));
    setLiveMessages((prev) => [...prev, { _id: tempId, content: message, sender: { _id: user?._id ?? '', name: user?.name ?? '', avatar: user?.avatar as Avatar | undefined }, attachments: tempAttachments, createdAt: new Date().toISOString(), isUploading: true, replyTo: replySnapshot }]);
    setMessage(''); setAttachments([]); clearReply();
    const formData = new FormData();
    formData.append('chatId', chatId ?? ''); formData.append('content', message);
    if (replyToMessageId) formData.append('replyToMessageId', replyToMessageId);
    attachments.forEach((f) => formData.append('files', f));
    try {
      const result = (await sendAttachments('', formData)) as SendAttachmentsResult | null;
      if (!result) { setLiveMessages((prev) => prev.filter((m) => m._id !== tempId)); return; }
      const payload = (result.data ?? result) as ChatMessage;
      setLiveMessages((prev) => prev.map((m) => m._id === tempId
        ? { ...payload, attachments: (payload.attachments ?? []).map((att, i) => ({ ...att, tempUrl: tempAttachments[i]?.tempUrl, uploading: false })) }
        : m));
      scrollToBottom();
    } catch { toast.error('Failed to send attachments'); setLiveMessages((prev) => prev.filter((m) => m._id !== tempId)); }
  };

  const replySnapshot = replyingTo ? buildReplySnapshot(replyingTo) : null;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="bg-glass-background relative min-h-0 flex-1 overflow-hidden md:rounded-xl">
        <div ref={containerRef} className={`relative h-full min-h-0 overflow-y-auto bg-[rgba(33,26,42,0.75)] px-2 py-3 pt-[5.75rem] backdrop-blur-lg backdrop-saturate-100 scrollbar-hide md:rounded-xl md:p-2 md:pt-28 ${isEditing ? 'pointer-events-none select-none' : ''}`}>
          {msgLoading ? <ChatMessagesSkeleton /> : (
            <>
              {isFetchingNextPage ? (
                <div className="pointer-events-none absolute inset-x-0 top-2 z-10 flex justify-center">
                  <span className="rounded-full border border-border bg-primary/90 px-3 py-1 text-xs text-body-300">Loading older messages…</span>
                </div>
              ) : null}
              <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
                {virtualizer.getVirtualItems().map((item) => {
                  const entry = timelineItems[item.index];
                  if (!entry) return null;
                  if (entry.kind === 'day') {
                    return (
                      <div key={entry.key} data-index={item.index} ref={virtualizer.measureElement}
                        className="absolute left-0 flex w-full justify-center px-4 pb-3 pt-2" style={{ transform: `translateY(${item.start}px)` }}>
                        <time className={`rounded-md px-2.5 py-1 font-display text-[12px] leading-none tracking-[0.03em] ${entry.label === 'Today' ? 'bg-green-light text-green' : 'bg-body/8 text-body-700'}`}>{entry.label}</time>
                      </div>
                    );
                  }
                  const msg = entry.message;
                  const sameSender = String(msg.sender._id) === String(user?._id ?? '');
                  const isSelected = selectedIds.has(msg._id);
                  const selectable = selectMode && canInteractMessage(msg);
                  return (
                    <div key={entry.key} data-index={item.index} ref={virtualizer.measureElement}
                      className={`absolute left-0 w-full pb-4 ${sameSender ? 'flex justify-end' : 'flex justify-start'}`} style={{ transform: `translateY(${item.start}px)` }}>
                      <div className={`flex max-w-[min(88%,20rem)] items-center gap-2 md:max-w-[70%] ${sameSender ? 'flex-row-reverse' : 'flex-row'}`}>
                        {selectable ? (
                          <button type="button" onClick={() => toggleSelected(msg._id)} className={`grid h-5 w-5 shrink-0 place-items-center transition ${isSelected ? 'text-green' : 'text-body-700'}`} aria-label={isSelected ? 'Deselect message' : 'Select message'}>
                            <CheckboxIcon className="h-5 w-5" checked={isSelected} />
                          </button>
                        ) : null}
                        <div className="w-fit max-w-full rounded-2xl" onContextMenu={(e) => openMessageContextMenu(e, msg)}
                          onClick={() => { if (selectable) toggleSelected(msg._id); }}
                          role={selectable ? 'button' : undefined} tabIndex={selectable ? 0 : undefined}
                          onKeyDown={selectable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSelected(msg._id); } } : undefined}>
                          <ChatBox chatData={msg} isGroupChat={isGroupChat} showReadReceipt={sameSender}
                            isRead={isMessageRead(msg)} searchHighlight={msg._id === highlightedMessageId}
                            highlightQuery={msg._id === highlightedMessageId && highlightQuery ? highlightQuery : undefined}
                            isDeleted={Boolean(msg.isDeleted)} editedAt={msg.editedAt} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
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

      {replySnapshot && replyingTo ? (
        <ReplyComposerBar
          senderName={replyingTo.sender.name ?? 'Unknown'}
          previewText={getReplyPreviewText(replySnapshot)}
          previewAttachment={replySnapshot.previewAttachment}
          onCancel={clearReply}
        />
      ) : null}

      <div className="relative z-40 shrink-0 border-t border-border/40 bg-background/95 px-2 py-2 backdrop-blur-md md:border-0 md:bg-transparent md:px-0 md:pb-0 md:pt-3">
        <ChatInput message={message} setMessage={setMessage} disabled={isLoading || editIsPending}
          autoFocus={true} onKeyDown={handleEnterPress} handleSubmit={handleSubmit}
          onChange={handleMessageChange} attachments={attachments} setAttachments={setAttachments}
          editMode={isEditing} className="text-body-700 placeholder:text-body-300" placeholder={isEditing ? 'Edit message…' : 'Message…'} />
      </div>

      <ForwardDialog open={forwardOpen} sourceChatId={chatId ?? ''} messageIds={forwardMessageIds}
        onClose={() => { setForwardOpen(false); setForwardMessageIds([]); }}
        onForward={handleForwardToChat} isForwarding={forwardIsPending} />
      <ContextMenu menuState={menuState} hideContextMenu={hideContextMenu} />

      {confirmClearOpen ? (
        <ConfirmationModal variant="danger" title="Clear this chat?"
          description="All messages will be removed for everyone in this conversation. This cannot be undone."
          confirmLabel="Clear all" cancelLabel="Cancel" onClose={() => setConfirmClearOpen(false)}
          handleConfirmationModal={({ accept }) => { if (accept) void handleClearChat(); else setConfirmClearOpen(false); }} />
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
    </div>
  );
});

ChatsViewPanel.displayName = 'ChatsViewPanel';

export default ChatsViewPanel;
