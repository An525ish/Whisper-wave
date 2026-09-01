import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { MouseEvent, TouchEvent } from 'react';
import useContextMenu from '@/hooks/shared/useContextMenu';
import { useSocket } from '@/socket/SocketProvider';
import { SOCKET_EVENTS } from '@/constants/socket';
import { useEditMessageMutation, useForwardMessagesMutation } from '@/hooks/chat/useMessageMutations';
import ReactionStrip from '@/components/chat/message/ReactionStrip';
import { isValidMessageId } from '@/utils/helpers';
import {
  buildChatCopyPayload,
  writeCopyPayloadToSystemClipboard,
} from '@/utils/chat';
import { useChatClipboardStore } from '@/stores/chat/clipboard';
import PencilIcon from '@/components/ui/icons/Pencil';
import ReplyIcon from '@/components/ui/icons/Reply';
import ForwardIcon from '@/components/ui/icons/Forward';
import CopyIcon from '@/components/ui/icons/Copy';
import SelectMessagesIcon from '@/components/ui/icons/SelectMessages';
import TrashIcon from '@/components/ui/icons/Trash';
import ReadReceipt from '@/components/ui/icons/ReadReceipt';
import type { Avatar } from '@/types';
import type { ChatMessage } from '@/types/chat';

const clearTextSelection = () => {
  window.getSelection()?.removeAllRanges();
};

interface Params {
  chatId: string | undefined;
  user: { _id?: string; name?: string; avatar?: unknown } | null;
  canModerateGroup: boolean;
  canClearChat: boolean;
  isGroupChat?: boolean;
  allMessages: ChatMessage[];
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  onSelectModeChange?: (active: boolean) => void;
  applyUpdatedMessage: (msg: ChatMessage) => void;
  invalidateMessages: () => void;
  setLiveMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  clearTypingState: (notifyPeers: boolean) => void;
  message: string;
  setMessage: (v: string) => void;
  setAttachments: React.Dispatch<React.SetStateAction<File[]>>;
  onEditingChange?: (editing: boolean) => void;
}

export function useMessageActions({
  chatId,
  user,
  canModerateGroup,
  allMessages,
  isGroupChat,
  selectedIds,
  setSelectedIds,
  onSelectModeChange,
  applyUpdatedMessage,
  invalidateMessages,
  message,
  setMessage,
  setAttachments,
  clearTypingState,
  onEditingChange,
}: Params) {
  const socket = useSocket();
  const editMessageMutation = useEditMessageMutation();
  const forwardMutation = useForwardMessagesMutation();
  const { menuState, showContextMenu, hideContextMenu, setContextMenuOptionsVisible } = useContextMenu();

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardMessageIds, setForwardMessageIds] = useState<string[]>([]);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [receiptMessage, setReceiptMessage] = useState<ChatMessage | null>(null);

  const isEditing = Boolean(editingMessageId);

  const canManageMessage = useCallback(
    (msg: ChatMessage) =>
      String(msg.sender._id) === String(user?._id ?? '') &&
      isValidMessageId(msg._id) &&
      !msg.isDeleted &&
      !msg.isUploading,
    [user?._id],
  );

  const canDeleteMessage = useCallback(
    (msg: ChatMessage) =>
      isValidMessageId(msg._id) &&
      !msg.isDeleted &&
      !msg.isUploading &&
      (String(msg.sender._id) === String(user?._id ?? '') || canModerateGroup),
    [canModerateGroup, user?._id],
  );

  const canInteractMessage = useCallback(
    (msg: ChatMessage) => isValidMessageId(msg._id) && !msg.isDeleted && !msg.isUploading,
    [],
  );

  const canEditMessage = useCallback(
    (msg: ChatMessage) =>
      canManageMessage(msg) &&
      Boolean(msg.content?.trim()) &&
      (msg.attachments?.length ?? 0) === 0 &&
      // Mirror server-side 15-min window so the option disappears client-side too
      (msg.createdAt ? Date.now() - new Date(msg.createdAt).getTime() < 15 * 60 * 1000 : false),
    [canManageMessage],
  );

  const deletableSelectedIds = useMemo(() => {
    if (selectedIds.size === 0) return [] as string[];
    return allMessages
      .filter((msg) => selectedIds.has(msg._id) && canDeleteMessage(msg))
      .map((msg) => msg._id);
  }, [allMessages, canDeleteMessage, selectedIds]);

  // Edit
  const cancelEdit = useCallback(() => { setEditingMessageId(null); setMessage(''); }, [setMessage]);

  const startEditMessage = useCallback(
    (msg: ChatMessage) => {
      if (!canEditMessage(msg)) return;
      clearTypingState(true);
      setAttachments([]);
      setEditingMessageId(msg._id);
      setMessage(msg.content ?? '');
      onSelectModeChange?.(false);
      setSelectedIds(new Set());
    },
    [canEditMessage, clearTypingState, onSelectModeChange, setAttachments, setMessage, setSelectedIds],
  );

  const saveEdit = useCallback(async () => {
    const trimmed = message.trim();
    if (!chatId || !editingMessageId || !trimmed) return;
    try {
      await editMessageMutation.mutateAsync({ messageId: editingMessageId, content: trimmed, chatId });
      applyUpdatedMessage({
        _id: editingMessageId, content: trimmed,
        editedAt: new Date().toISOString(),
        sender: { _id: user?._id ?? '', name: user?.name, avatar: user?.avatar as Avatar | undefined },
      });
      cancelEdit();
      invalidateMessages();
      toast.success('Message updated');
    } catch {
      toast.error('Failed to edit message');
    }
  }, [applyUpdatedMessage, cancelEdit, chatId, editMessageMutation, editingMessageId, invalidateMessages, message, user]);

  // Reply
  const clearReply = useCallback(() => setReplyingTo(null), []);

  const startReply = useCallback(
    (msg: ChatMessage) => {
      if (!canInteractMessage(msg)) return;
      cancelEdit();
      clearTypingState(true);
      onSelectModeChange?.(false);
      setSelectedIds(new Set());
      setReplyingTo(msg);
    },
    [canInteractMessage, cancelEdit, clearTypingState, onSelectModeChange, setSelectedIds],
  );

  // Forward
  const openForwardDialog = useCallback(
    (messageIds: string[]) => {
      const ids = messageIds.filter(isValidMessageId);
      if (!chatId || ids.length === 0) return;
      setForwardMessageIds(ids);
      setForwardOpen(true);
    },
    [chatId],
  );

  const handleForwardToChat = useCallback(
    async (targetChatIds: string[]) => {
      if (!chatId || forwardMessageIds.length === 0 || targetChatIds.length === 0) return;
      try {
        const results = await Promise.allSettled(
          targetChatIds.map((targetChatId) =>
            forwardMutation.mutateAsync({ targetChatId, sourceChatId: chatId, messageIds: forwardMessageIds }),
          ),
        );
        const succeeded = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.length - succeeded;
        if (succeeded === 0) { toast.error('Failed to forward'); return; }
        setForwardOpen(false);
        setForwardMessageIds([]);
        setSelectedIds(new Set());
        onSelectModeChange?.(false);
        invalidateMessages();
        toast.success(failed > 0
          ? `Forwarded to ${succeeded} chat${succeeded === 1 ? '' : 's'} (${failed} failed)`
          : succeeded === 1 ? 'Forwarded' : `Forwarded to ${succeeded} chats`);
      } catch {
        toast.error('Failed to forward');
      }
    },
    [chatId, forwardMessageIds, forwardMutation, invalidateMessages, onSelectModeChange, setSelectedIds],
  );

  // Copy
  const copyMessagesByIds = useCallback(
    async (messageIds: string[]) => {
      const idSet = new Set(messageIds);
      const messages = allMessages.filter((m) => idSet.has(m._id) && !m.isDeleted);
      if (messages.length === 0) { toast.error('Nothing to copy'); return; }
      try {
        const payload = await buildChatCopyPayload(messages);
        if (!payload.text && payload.files.length === 0) { toast.error('Nothing to copy'); return; }
        useChatClipboardStore.getState().setPayload(payload);
        try { await writeCopyPayloadToSystemClipboard(payload); } catch { /* in-app paste still works */ }
        const fc = payload.files.length;
        if (fc > 0 && payload.text) toast.success(fc === 1 ? 'Copied message and attachment' : `Copied with ${fc} attachments`);
        else if (fc > 0) toast.success(fc === 1 ? 'Attachment copied' : `${fc} attachments copied`);
        else toast.success(messages.length === 1 ? 'Copied' : `Copied ${messages.length} messages`);
      } catch { toast.error('Failed to copy'); }
    },
    [allMessages],
  );

  // Context menu
  const buildMenuOptions = useCallback(
    (msg: ChatMessage) => {
      const isOwn = canManageMessage(msg);
      const canDelete = canDeleteMessage(msg);
      return [
        { icon: <ReplyIcon className="h-4 w-4" />, label: 'Reply', onClick: () => startReply(msg) },
        { icon: <CopyIcon className="h-4 w-4" />, label: 'Copy', onClick: () => void copyMessagesByIds([msg._id]) },
        { icon: <ForwardIcon className="h-4 w-4" />, label: 'Forward', onClick: () => openForwardDialog([msg._id]) },
        ...(isOwn && canEditMessage(msg) ? [{ icon: <PencilIcon className="h-4 w-4" />, label: 'Edit', onClick: () => startEditMessage(msg) }] : []),
        ...(canDelete ? [{ icon: <TrashIcon className="h-4 w-4" />, label: 'Delete', onClick: () => setConfirmDelete({ type: 'one', messageId: msg._id }) }] : []),
        { icon: <SelectMessagesIcon className="h-4 w-4" />, label: 'Select', onClick: () => { onSelectModeChange?.(true); setSelectedIds(new Set([msg._id])); } },
        // Read by: own messages always; moderators/creator can view receipts for any message
        ...((isOwn || canModerateGroup) && isGroupChat ? [{ icon: <ReadReceipt read className="h-4 w-4" />, label: 'Read by', onClick: () => setReceiptMessage(msg) }] : []),
      ];
    },
    [canDeleteMessage, canEditMessage, canManageMessage, canModerateGroup, copyMessagesByIds, isGroupChat,
      onSelectModeChange, openForwardDialog, setSelectedIds, startEditMessage, startReply],
  );

  // Reactions
  const toggleReaction = useCallback(
    (msg: ChatMessage, emoji: string) => {
      if (!chatId || !canInteractMessage(msg)) return;
      socket.emit(SOCKET_EVENTS.MESSAGE_REACTION, {
        messageId: msg._id,
        chatId,
        emoji,
      });
    },
    [canInteractMessage, chatId, socket],
  );

  const openMenuAt = useCallback(
    (pos: { x: number; y: number }, msg: ChatMessage) => {
      if (isEditing || !canInteractMessage(msg)) return;
      const header = (
        <ReactionStrip
          reactions={msg.reactions}
          myUserId={String(user?._id ?? '')}
          onReact={(emoji) => toggleReaction(msg, emoji)}
          onClose={hideContextMenu}
          onPickerOpenChange={(open) => setContextMenuOptionsVisible(!open)}
        />
      );
      showContextMenu(pos, buildMenuOptions(msg), header);
    },
    [buildMenuOptions, canInteractMessage, hideContextMenu, isEditing, setContextMenuOptionsVisible, showContextMenu, toggleReaction, user?._id],
  );

  const openMessageContextMenu = useCallback(
    (e: MouseEvent, msg: ChatMessage) => {
      e.preventDefault();
      e.stopPropagation();
      clearTextSelection();
      openMenuAt({ x: e.clientX, y: e.clientY }, msg);
    },
    [openMenuAt],
  );

  const openMessageContextMenuFromTouch = useCallback(
    (e: TouchEvent, msg: ChatMessage) => {
      e.preventDefault();
      clearTextSelection();
      const touch = e.changedTouches[0] ?? e.touches[0];
      if (!touch) return;
      openMenuAt({ x: touch.clientX, y: touch.clientY }, msg);
    },
    [openMenuAt],
  );

  // External ref so delete actions can set confirmDelete
  const [confirmDelete, setConfirmDelete] = useState<
    null | { type: 'one'; messageId: string } | { type: 'many' }
  >(null);

  useEffect(() => { onEditingChange?.(isEditing); }, [isEditing, onEditingChange]);

  useEffect(() => {
    if (!isEditing) return;
    const onKeyDown = (ev: globalThis.KeyboardEvent) => { if (ev.key === 'Escape') cancelEdit(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cancelEdit, isEditing]);

  useEffect(() => {
    if (!replyingTo) return;
    const onKeyDown = (ev: globalThis.KeyboardEvent) => { if (ev.key === 'Escape') clearReply(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [clearReply, replyingTo]);

  return {
    editingMessageId, isEditing, cancelEdit, startEditMessage, saveEdit,
    replyingTo, startReply, clearReply,
    forwardOpen, setForwardOpen, forwardMessageIds, setForwardMessageIds,
    openForwardDialog, handleForwardToChat, forwardIsPending: forwardMutation.isPending,
    copyMessagesByIds, openMessageContextMenu, openMessageContextMenuFromTouch,
    menuState, hideContextMenu,
    confirmClearOpen, setConfirmClearOpen, confirmDelete, setConfirmDelete,
    deletableSelectedIds, canDeleteMessage, canInteractMessage,
    editIsPending: editMessageMutation.isPending,
    receiptMessage, setReceiptMessage,
    toggleReaction,
  };
}
