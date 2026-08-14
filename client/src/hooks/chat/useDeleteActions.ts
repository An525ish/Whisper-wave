import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { isValidMessageId } from '@/utils/helpers';
import type { ChatMessage } from '@/types/chat';
import {
  useClearChatMessagesMutation,
  useDeleteManyMessagesMutation,
  useDeleteMessageMutation,
} from '@/hooks/chat/useMessageMutations';

interface Params {
  chatId: string | undefined;
  canModerateGroup: boolean;
  canClearChat: boolean;
  deletableSelectedIds: string[];
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  onSelectModeChange?: (active: boolean) => void;
  applyDeletedMessages: (ids: string[]) => void;
  invalidateMessages: () => void;
  setLiveMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  cancelEdit: () => void;
  onDeletingSelectedChange?: (pending: boolean) => void;
}

export function useDeleteActions({
  chatId,
  canClearChat,
  deletableSelectedIds,
  setSelectedIds,
  onSelectModeChange,
  applyDeletedMessages,
  invalidateMessages,
  setLiveMessages,
  cancelEdit,
  onDeletingSelectedChange,
}: Params) {
  const deleteMessageMutation = useDeleteMessageMutation();
  const deleteManyMutation = useDeleteManyMessagesMutation();
  const clearChatMutation = useClearChatMessagesMutation();

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<
    null | { type: 'one'; messageId: string } | { type: 'many' }
  >(null);

  const deleteOneMessage = useCallback(
    async (messageId: string) => {
      if (!chatId || !isValidMessageId(messageId)) return;
      try {
        await deleteMessageMutation.mutateAsync({ messageId, chatId });
        applyDeletedMessages([messageId]);
        invalidateMessages();
        toast.success('Message deleted');
      } catch {
        toast.error('Failed to delete message');
      }
    },
    [applyDeletedMessages, chatId, deleteMessageMutation, invalidateMessages],
  );

  const deleteSelectedMessages = useCallback(async () => {
    if (!chatId || deletableSelectedIds.length === 0) return;
    const messageIds = deletableSelectedIds.filter(isValidMessageId);
    if (messageIds.length === 0) return;
    try {
      await deleteManyMutation.mutateAsync({ chatId, messageIds });
      applyDeletedMessages(messageIds);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of messageIds) next.delete(id);
        if (next.size === 0) onSelectModeChange?.(false);
        return next;
      });
      invalidateMessages();
      toast.success(messageIds.length === 1 ? 'Message deleted' : `${messageIds.length} messages deleted`);
    } catch {
      toast.error('Failed to delete messages');
    }
  }, [applyDeletedMessages, chatId, deleteManyMutation, deletableSelectedIds, invalidateMessages, onSelectModeChange, setSelectedIds]);

  const handleClearChat = useCallback(async () => {
    if (!chatId) return;
    try {
      await clearChatMutation.mutateAsync(chatId);
      setLiveMessages([]);
      setSelectedIds(new Set());
      onSelectModeChange?.(false);
      cancelEdit();
      invalidateMessages();
      toast.success('Chat cleared');
    } catch {
      toast.error('Failed to clear chat');
    } finally {
      setConfirmClearOpen(false);
    }
  }, [cancelEdit, chatId, clearChatMutation, invalidateMessages, onSelectModeChange, setLiveMessages, setSelectedIds]);

  useEffect(() => {
    onDeletingSelectedChange?.(deleteManyMutation.isPending);
  }, [deleteManyMutation.isPending, onDeletingSelectedChange]);

  return {
    confirmClearOpen,
    setConfirmClearOpen,
    confirmDelete,
    setConfirmDelete,
    deleteOneMessage,
    deleteSelectedMessages,
    handleClearChat,
    canClearChat,
  };
}
