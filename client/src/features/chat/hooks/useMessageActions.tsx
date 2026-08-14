import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { MouseEvent } from 'react';
import useContextMenu from '@/shared/hooks/useContextMenu';
import { isValidMessageId } from '@/shared/utils/helper';
import {
  buildChatCopyPayload,
  writeCopyPayloadToSystemClipboard,
} from '@/features/chat/stores/chatClipboardUtils';
import { useChatClipboardStore } from '@/features/chat/stores/chatClipboard';
import PencilIcon from '@/shared/components/icons/Pencil';
import ReplyIcon from '@/shared/components/icons/Reply';
import ForwardIcon from '@/shared/components/icons/Forward';
import CopyIcon from '@/shared/components/icons/Copy';
import SelectMessagesIcon from '@/shared/components/icons/SelectMessages';
import TrashIcon from '@/shared/components/icons/Trash';
import type { Avatar } from '@/shared/types';
import type { ChatMessage } from '@/features/chat/types';
import { useEditMessageMutation, useForwardMessagesMutation } from './useMessageMutations';

interface Params {
  chatId: string | undefined;
  user: { _id?: string; name?: string; avatar?: unknown } | null;
  canModerateGroup: boolean;
  canClearChat: boolean;
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
  const editMessageMutation = useEditMessageMutation();
  const forwardMutation = useForwardMessagesMutation();
  const { menuState, showContextMenu, hideContextMenu } = useContextMenu();

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardMessageIds, setForwardMessageIds] = useState<string[]>([]);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

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
      (msg.attachments?.length ?? 0) === 0,
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
  const openMessageContextMenu = useCallback(
    (e: MouseEvent, msg: ChatMessage) => {
      if (isEditing || !canInteractMessage(msg)) return;
      e.preventDefault();
      e.stopPropagation();
      const isOwn = canManageMessage(msg);
      const canDelete = canDeleteMessage(msg);
      const options = [
        { icon: <ReplyIcon className="h-4 w-4" />, label: 'Reply', onClick: () => startReply(msg) },
        { icon: <CopyIcon className="h-4 w-4" />, label: 'Copy', onClick: () => void copyMessagesByIds([msg._id]) },
        { icon: <ForwardIcon className="h-4 w-4" />, label: 'Forward', onClick: () => openForwardDialog([msg._id]) },
        ...(isOwn && canEditMessage(msg) ? [{ icon: <PencilIcon className="h-4 w-4" />, label: 'Edit', onClick: () => startEditMessage(msg) }] : []),
        ...(canDelete ? [{ icon: <TrashIcon className="h-4 w-4" />, label: 'Delete', onClick: () => setConfirmDelete({ type: 'one', messageId: msg._id }) }] : []),
        { icon: <SelectMessagesIcon className="h-4 w-4" />, label: 'Select', onClick: () => { onSelectModeChange?.(true); setSelectedIds(new Set([msg._id])); } },
      ];
      showContextMenu({ x: e.clientX, y: e.clientY }, options);
    },
    [canDeleteMessage, canEditMessage, canInteractMessage, canManageMessage, copyMessagesByIds,
      isEditing, onSelectModeChange, openForwardDialog, setSelectedIds, showContextMenu, startEditMessage, startReply],
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
    copyMessagesByIds, openMessageContextMenu, menuState, hideContextMenu,
    confirmClearOpen, setConfirmClearOpen, confirmDelete, setConfirmDelete,
    deletableSelectedIds, canDeleteMessage, canInteractMessage,
    editIsPending: editMessageMutation.isPending,
  };
}
