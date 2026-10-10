import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAsyncMutation from '@/shared/hooks/useAsyncMutation';
import { useLeaveGroupMutation } from '@/features/chat/hooks/useGroupMutations';
import {
  useDeleteChatForMeMutation,
  useUnfriendMutation,
  useDeleteGroupMutation,
} from '@/features/chat/hooks/useMessageMutations';
import { ROUTES } from '@/shared/constants/routes';

type OtherMember = { _id: string; name: string; avatar?: string; isAdmin?: boolean };

type Params = {
  chatId?: string;
  groupChat?: boolean;
  myRole?: string | null;
  otherMembers: OtherMember[];
  /** Closes the header's dots menu when an action is triggered from it. */
  closeMenu: () => void;
};

/**
 * Owns the conversation header's destructive account/group flows: leave group,
 * delete-chat-for-me, unfriend, and delete group — including their confirmation
 * open/close state, mutations, and navigation on success. The header component
 * consumes the returned state to render its dialogs and wire its menu actions.
 */
export function useConversationHeaderActions({
  chatId,
  groupChat,
  myRole,
  otherMembers,
  closeMenu,
}: Params) {
  const navigate = useNavigate();

  const [isConfirmLeave, setIsConfirmLeave] = useState(false);
  const [isCreatorLeaveDialog, setIsCreatorLeaveDialog] = useState(false);
  const [isConfirmDeleteChat, setIsConfirmDeleteChat] = useState(false);
  const [isConfirmUnfriend, setIsConfirmUnfriend] = useState(false);
  const [isConfirmDeleteGroup, setIsConfirmDeleteGroup] = useState(false);

  const [leaveGroup, { isLoading: isLeaveGroupLoading }] = useAsyncMutation(useLeaveGroupMutation);
  const [deleteChatForMe, { isLoading: isDeleteChatLoading }] = useAsyncMutation(useDeleteChatForMeMutation);
  const [unfriend, { isLoading: isUnfriendLoading }] = useAsyncMutation(useUnfriendMutation);
  const [deleteGroup, { isLoading: isDeleteGroupLoading }] = useAsyncMutation(useDeleteGroupMutation);

  const handleConfirmationModal = useCallback(async ({ accept }: { accept: boolean }) => {
    if (accept) {
      await leaveGroup(null, { chatId: chatId ?? '' });
      navigate(ROUTES.chats);
    }
    setIsConfirmLeave(false);
  }, [chatId, leaveGroup, navigate]);

  const handleLeaveGroup = useCallback(() => {
    closeMenu();
    if (groupChat && myRole === 'creator' && otherMembers.length > 0) {
      setIsCreatorLeaveDialog(true);
    } else {
      setIsConfirmLeave(true);
    }
  }, [closeMenu, groupChat, myRole, otherMembers.length]);

  const handleCreatorLeaveConfirm = useCallback(async (newCreatorId?: string) => {
    await leaveGroup(null, { chatId: chatId ?? '', newCreatorId });
    setIsCreatorLeaveDialog(false);
    navigate(ROUTES.chats);
  }, [chatId, leaveGroup, navigate]);

  const handleDeleteChatConfirm = useCallback(async ({ accept }: { accept: boolean }) => {
    if (accept) {
      await deleteChatForMe(null, chatId ?? '');
      navigate(ROUTES.chats);
    }
    setIsConfirmDeleteChat(false);
  }, [chatId, deleteChatForMe, navigate]);

  const handleUnfriendConfirm = useCallback(async ({ accept }: { accept: boolean }) => {
    if (accept) {
      await unfriend(null, chatId ?? '');
      navigate(ROUTES.chats);
    }
    setIsConfirmUnfriend(false);
  }, [chatId, navigate, unfriend]);

  const handleDeleteGroupConfirm = useCallback(async ({ accept }: { accept: boolean }) => {
    if (accept) {
      await deleteGroup(null, chatId ?? '');
      navigate(ROUTES.chats);
    }
    setIsConfirmDeleteGroup(false);
  }, [chatId, deleteGroup, navigate]);

  return {
    isConfirmLeave, setIsConfirmLeave,
    isCreatorLeaveDialog, setIsCreatorLeaveDialog,
    isConfirmDeleteChat, setIsConfirmDeleteChat,
    isConfirmUnfriend, setIsConfirmUnfriend,
    isConfirmDeleteGroup, setIsConfirmDeleteGroup,
    handleConfirmationModal, handleLeaveGroup, handleCreatorLeaveConfirm,
    handleDeleteChatConfirm, handleUnfriendConfirm, handleDeleteGroupConfirm,
    isLeaveGroupLoading, isDeleteChatLoading, isUnfriendLoading, isDeleteGroupLoading,
  };
}
