import {
  useCallback, useEffect, useImperativeHandle, useMemo, useState,
  type Ref,
} from 'react';
import { useLongPress } from '@/shared/hooks/useLongPress';
import useErrors from '@/shared/hooks/useError';
import { useSocket } from '@/shared/lib/socket/SocketProvider';
import {
  useChatDetailsQuery, useChatMessages, useChatScroll, useDeleteActions,
  useMessageActions, useMessageSelection,
  useTypingIndicator,
} from '@/features/chat/hooks';
import { useConversationSend } from '@/features/chat/hooks/useConversationSend';
import { useGetMediaQuery } from '@/features/chat/hooks/useMessageQueries';
import { getMediaKindFromFile } from '@/shared/utils/fileFormat';
import CloseIcon from '@/shared/components/ui/icons/Close';
import { useAuthStore } from '@/features/auth';
import { ChatMessagesSkeleton } from '@/features/chat/components/ChatMessageSkeleton';
import { normalizeMemberIds } from '@/shared/utils/helpers';
import MessageList from '@/features/chat/components/conversation/MessageList';
import ChatInput from '@/features/chat/components/conversation/composer/ChatInput';
import ConversationDialogs from '@/features/chat/components/conversation/ConversationDialogs';
import type {
  ChatDetailsResponse, ChatMessage, ConversationPanelHandle,
  MediaResponse, SharedMediaRow,
} from '@/features/chat/types/chat';
import type { MediaFile } from '@/shared/components/ui/image-viewer/ImageViewer';
import { isOutgoingMessageRead, buildReplySnapshot, getReplyPreviewText } from '@/features/chat/utils/chat';
import DoubleChevronDown from '@/shared/components/ui/icons/DoubleChevronDown';
import ReplyComposerBar from '@/features/chat/components/conversation/composer/ReplyBar';
import ChatDayLabel from '@/features/chat/components/conversation/ChatDayLabel';
import { CHAT_HEADER_OFFSET_CLASS, CHAT_HEADER_TOP_CLASS } from '@/features/chat/constants/chat';


export type { ConversationPanelHandle };

type ChatsViewPanelProps = {
  ref?: Ref<ConversationPanelHandle>;
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


const ConversationPanel = ({
  ref,
  chatId, focusMessageId = null, highlightQuery = '', searchOpen = false,
  selectMode = false, onSelectModeChange, onSelectedCountChange,
  onDeletableSelectedCountChange, onDeletingSelectedChange, onEditingChange,
  onFetchingNextPageChange,
}: ChatsViewPanelProps) => {
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
  const canClearChat = true; // clear-for-me — available to everyone
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
    edit, reply, forward, contextMenu, confirm, receipt,
    copyMessagesByIds, deletableSelectedIds, canInteractMessage,
  } = useMessageActions({
    chatId, user, canModerateGroup, canClearChat, isGroupChat, allMessages,
    selectedIds, setSelectedIds, onSelectModeChange, applyUpdatedMessage, invalidateMessages,
    setLiveMessages, clearTypingState, message, setMessage, setAttachments,
    onEditingChange,
  });

  const { data: mediaData } = useGetMediaQuery({ chatId }, { skip: !chatId });
  const sharedGalleryFiles = useMemo<MediaFile[]>(() => {
    const raw = (mediaData as MediaResponse | undefined)?.data;
    const rows: SharedMediaRow[] = !raw ? [] : Array.isArray(raw) ? raw : (raw.attachments ?? []);
    return rows
      .filter((f) => Boolean(f.url))
      .filter((f) => { const k = getMediaKindFromFile(f); return k === 'image' || k === 'video'; })
      .map((f) => ({
        _id: f._id ?? f.publicId ?? f.url!,
        url: f.url!,
        name: f.name,
        publicId: f.publicId,
        fileType: f.fileType,
        messageId: f.messageId,
        senderId: f.senderId,
      }));
  }, [mediaData]);

  const { deleteOneMessage, deleteSelectedMessages, handleClearChat } = useDeleteActions({
    chatId, canModerateGroup, canClearChat, deletableSelectedIds,
    selectedIds, setSelectedIds, onSelectModeChange, applyDeletedMessages,
    invalidateMessages, setLiveMessages, cancelEdit: edit.cancelEdit,
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
    clearChat: () => { if (canClearChat) confirm.setConfirmClearOpen(true); },
    deleteSelected: () => {
      if (selectedIds.size === 0 || deletableSelectedIds.length === 0) return;
      confirm.setConfirmDelete({ type: 'many' });
    },
    forwardSelected: () => {
      if (selectedIds.size === 0) return;
      forward.openForwardDialog([...selectedIds]);
    },
    copySelected: () => {
      if (selectedIds.size === 0) return;
      void copyMessagesByIds([...selectedIds]);
    },
  }), [canClearChat, copyMessagesByIds, deletableSelectedIds.length, forward.openForwardDialog, selectedIds, confirm.setConfirmClearOpen, confirm.setConfirmDelete]);

  const { handleMessageChange, handleSubmit, handleEnterPress, handleGifSelect } = useConversationSend({
    chatId, user, socket, isImpersonated, actAsUser,
    message, setMessage, attachments, setAttachments, imageQuality, setImageQuality,
    editingMessageId: edit.editingMessageId, saveEdit: edit.saveEdit,
    replyingTo: reply.replyingTo, clearReply: reply.clearReply,
    isEditing: edit.isEditing, isTyping, clearTypingState,
    isTypingRef, timeoutRef, setIsTyping, emitStartTyping, emitStopTyping,
    setLiveMessages, scrollToBottom,
  });

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

  const bindLongPress = useLongPress<ChatMessage>((msg, { clientX, clientY }) => {
    contextMenu.openMessageContextMenuFromTouch(clientX, clientY, msg);
  });

  const replySnapshot = useMemo(
    () => (reply.replyingTo ? buildReplySnapshot(reply.replyingTo) : null),
    [reply.replyingTo],
  );

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="bg-glass-background relative min-h-0 flex-1 overflow-hidden md:rounded-xl">
        <div ref={containerRef} className={`relative h-full min-h-0 overflow-x-hidden overflow-y-auto overscroll-x-none bg-[rgba(33,26,42,0.75)] px-2 pb-3 backdrop-blur-lg backdrop-saturate-100 scrollbar-hide md:rounded-xl md:px-2 md:pb-2 ${CHAT_HEADER_OFFSET_CLASS} ${edit.isEditing ? 'pointer-events-none select-none' : ''}`}>
          {msgLoading ? <ChatMessagesSkeleton /> : (
            <MessageList
              virtualizer={virtualizer}
              timelineItems={timelineItems}
              isDateHeaderScrolling={isDateHeaderScrolling}
              stickyDayHeader={stickyDayHeader}
              currentUserId={String(user?._id ?? '')}
              selectedIds={selectedIds}
              selectMode={selectMode}
              canInteractMessage={canInteractMessage}
              toggleSelected={toggleSelected}
              chatId={chatId}
              sharedGalleryFiles={sharedGalleryFiles}
              isGroupChat={isGroupChat}
              isMessageRead={isMessageRead}
              highlightedMessageId={highlightedMessageId}
              highlightQuery={highlightQuery}
              setConfirmDelete={confirm.setConfirmDelete}
              openForwardDialog={forward.openForwardDialog}
              startReply={reply.startReply}
              openMessageContextMenu={contextMenu.openMessageContextMenu}
              bindLongPress={bindLongPress}
            />
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
            className={`absolute right-3 z-20 grid h-12 w-12 place-items-center rounded-full border border-border/80 bg-primary/95 text-body shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition hover:border-green/40 hover:bg-background-alt hover:text-green md:right-4 md:h-10 md:w-10 ${attachments.length > 0 ? 'bottom-20 md:bottom-24' : 'bottom-[max(0.75rem,env(safe-area-inset-bottom))] md:bottom-4'}`}>
            <DoubleChevronDown className="h-4 w-4" />
          </button>
        ) : null}
        {edit.isEditing ? <div aria-hidden className="pointer-events-auto absolute inset-0 z-30 bg-black/45 backdrop-blur-[2px]" onClick={edit.cancelEdit} /> : null}
      </div>

      {edit.isEditing ? (
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-green/25 bg-green/10 px-3 py-1.5 text-xs text-green md:rounded-t-xl">
          <span className="font-medium">Editing message</span>
          <button type="button" onClick={edit.cancelEdit} className="grid h-8 w-8 place-items-center rounded-full text-body-700 transition hover:bg-white/8 hover:text-body" aria-label="Cancel edit"><CloseIcon className="h-3.5 w-3.5" /></button>
        </div>
      ) : null}

      <div className="relative z-40 shrink-0 border-t border-border/40 bg-background/95 px-2 py-2 backdrop-blur-md md:border-0 md:bg-transparent md:px-0 md:pb-0 md:pt-3">
        <ChatInput message={message} setMessage={setMessage} disabled={isLoading || edit.editIsPending}
          replySlot={replySnapshot && reply.replyingTo ? (
            <ReplyComposerBar
              senderName={reply.replyingTo.sender.name ?? 'Unknown'}
              previewText={getReplyPreviewText(replySnapshot)}
              previewAttachment={replySnapshot.previewAttachment}
              onCancel={reply.clearReply}
            />
          ) : undefined}
          autoFocus={true} onKeyDown={handleEnterPress} handleSubmit={handleSubmit}
          onChange={handleMessageChange} attachments={attachments} setAttachments={setAttachments}
          imageQuality={imageQuality} setImageQuality={setImageQuality}
          onGifSelect={handleGifSelect}
          onComposerResize={handleComposerResize}
          editMode={edit.isEditing} className="text-body-700 placeholder:text-body-300" placeholder={edit.isEditing ? 'Edit message…' : 'Message…'} />
      </div>

      <ConversationDialogs
        chatId={chatId}
        forwardOpen={forward.forwardOpen} forwardMessageIds={forward.forwardMessageIds}
        setForwardOpen={forward.setForwardOpen} setForwardMessageIds={forward.setForwardMessageIds}
        onForward={forward.handleForwardToChat} forwardIsPending={forward.forwardIsPending}
        menuState={contextMenu.menuState} hideContextMenu={contextMenu.hideContextMenu}
        confirmClearOpen={confirm.confirmClearOpen} setConfirmClearOpen={confirm.setConfirmClearOpen}
        onClearChat={() => void handleClearChat()}
        confirmDelete={confirm.confirmDelete} setConfirmDelete={confirm.setConfirmDelete}
        deletableSelectedCount={deletableSelectedIds.length} selectedCount={selectedIds.size}
        canModerateGroup={canModerateGroup}
        onDeleteOne={(messageId) => void deleteOneMessage(messageId)}
        onDeleteSelected={() => void deleteSelectedMessages()}
        receiptMessage={receipt.receiptMessage} isGroupChat={isGroupChat}
        onCloseReceipt={() => receipt.setReceiptMessage(null)}
      />
    </div>
  );
};

export default ConversationPanel;
