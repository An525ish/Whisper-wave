import ConfirmationModal from '@/shared/components/ui/modal/confirmation-modal/ConfirmationModal';
import CreatorLeaveDialog from '@/features/chat/components/group/CreatorLeaveDialog';

type OtherMember = { _id: string; name: string; avatar?: string; isAdmin?: boolean };

type HeaderDialogsProps = {
  name?: string;
  otherMembers: OtherMember[];
  isLeaveGroupLoading: boolean;
  isConfirmLeave: boolean;
  setIsConfirmLeave: (open: boolean) => void;
  onConfirmLeave: (result: { accept: boolean }) => void;
  isCreatorLeaveDialog: boolean;
  setIsCreatorLeaveDialog: (open: boolean) => void;
  onCreatorLeaveConfirm: (newCreatorId?: string) => void;
  isConfirmDeleteChat: boolean;
  setIsConfirmDeleteChat: (open: boolean) => void;
  onConfirmDeleteChat: (result: { accept: boolean }) => void;
  isConfirmUnfriend: boolean;
  setIsConfirmUnfriend: (open: boolean) => void;
  onConfirmUnfriend: (result: { accept: boolean }) => void;
  isConfirmDeleteGroup: boolean;
  setIsConfirmDeleteGroup: (open: boolean) => void;
  onConfirmDeleteGroup: (result: { accept: boolean }) => void;
};

/**
 * All destructive confirmation surfaces for the conversation header (leave group,
 * creator-leave hand-off, delete chat, unfriend, delete group). Pure render driven
 * by useConversationHeaderActions state.
 */
const HeaderDialogs = ({
  name, otherMembers, isLeaveGroupLoading,
  isConfirmLeave, setIsConfirmLeave, onConfirmLeave,
  isCreatorLeaveDialog, setIsCreatorLeaveDialog, onCreatorLeaveConfirm,
  isConfirmDeleteChat, setIsConfirmDeleteChat, onConfirmDeleteChat,
  isConfirmUnfriend, setIsConfirmUnfriend, onConfirmUnfriend,
  isConfirmDeleteGroup, setIsConfirmDeleteGroup, onConfirmDeleteGroup,
}: HeaderDialogsProps) => (
  <>
    {isConfirmLeave ? (
      <ConfirmationModal
        variant="default"
        title="Leave this group?"
        description="You will lose access to this conversation until someone adds you again."
        confirmLabel="Leave"
        cancelLabel="Stay"
        onClose={() => setIsConfirmLeave(false)}
        handleConfirmationModal={onConfirmLeave}
      />
    ) : null}

    <CreatorLeaveDialog
      isOpen={isCreatorLeaveDialog}
      members={otherMembers}
      onConfirm={onCreatorLeaveConfirm}
      onCancel={() => setIsCreatorLeaveDialog(false)}
      isLoading={isLeaveGroupLoading}
    />

    {isConfirmDeleteChat ? (
      <ConfirmationModal
        variant="danger"
        title="Delete this chat?"
        description="This chat will be removed from your inbox. The other person can still see it."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onClose={() => setIsConfirmDeleteChat(false)}
        handleConfirmationModal={onConfirmDeleteChat}
      />
    ) : null}

    {isConfirmUnfriend ? (
      <ConfirmationModal
        variant="danger"
        title={`Unfriend ${name ?? ''}?`}
        description="This will remove the chat for both of you and they'll be notified."
        confirmLabel="Unfriend"
        cancelLabel="Cancel"
        onClose={() => setIsConfirmUnfriend(false)}
        handleConfirmationModal={onConfirmUnfriend}
      />
    ) : null}

    {isConfirmDeleteGroup ? (
      <ConfirmationModal
        variant="danger"
        title={`Delete "${name ?? 'this group'}"?`}
        description="This will permanently delete the group and all its messages for everyone."
        confirmLabel="Delete group"
        cancelLabel="Cancel"
        onClose={() => setIsConfirmDeleteGroup(false)}
        handleConfirmationModal={onConfirmDeleteGroup}
      />
    ) : null}
  </>
);

export default HeaderDialogs;
