import { lazy, Suspense, type Dispatch, type SetStateAction } from 'react';
import ContextMenu from '@/shared/components/ui/context-menu/ContextMenu';
import ConfirmationModal from '@/shared/components/ui/modal/confirmation-modal/ConfirmationModal';
import MessageReceiptDialog from '@/features/chat/components/message/MessageReceiptDialog';
import type { ContextMenuState } from '@/shared/types';
import type { ChatMessage, ConfirmDeleteState } from '@/features/chat/types/chat';

const ForwardDialog = lazy(() => import('@/features/chat/components/dialogs/ForwardDialog'));

type ConversationDialogsProps = {
  chatId?: string;
  // Forward
  forwardOpen: boolean;
  forwardMessageIds: string[];
  setForwardOpen: Dispatch<SetStateAction<boolean>>;
  setForwardMessageIds: Dispatch<SetStateAction<string[]>>;
  onForward: (targetChatIds: string[]) => void | Promise<void>;
  forwardIsPending: boolean;
  // Context menu
  menuState: ContextMenuState;
  hideContextMenu: () => void;
  // Clear chat
  confirmClearOpen: boolean;
  setConfirmClearOpen: Dispatch<SetStateAction<boolean>>;
  onClearChat: () => void;
  // Delete
  confirmDelete: ConfirmDeleteState;
  setConfirmDelete: Dispatch<SetStateAction<ConfirmDeleteState>>;
  deletableSelectedCount: number;
  selectedCount: number;
  canModerateGroup: boolean;
  onDeleteOne: (messageId: string) => void;
  onDeleteSelected: () => void;
  // Receipt
  receiptMessage: ChatMessage | null;
  isGroupChat: boolean;
  onCloseReceipt: () => void;
};

/**
 * Renders the conversation panel's overlays — forward dialog, message context
 * menu, clear/delete confirmations, and the read-receipt dialog — so the panel
 * itself stays focused on the message timeline and composer.
 */
const ConversationDialogs = ({
  chatId,
  forwardOpen, forwardMessageIds, setForwardOpen, setForwardMessageIds, onForward, forwardIsPending,
  menuState, hideContextMenu,
  confirmClearOpen, setConfirmClearOpen, onClearChat,
  confirmDelete, setConfirmDelete, deletableSelectedCount, selectedCount, canModerateGroup,
  onDeleteOne, onDeleteSelected,
  receiptMessage, isGroupChat, onCloseReceipt,
}: ConversationDialogsProps) => (
  <>
    <Suspense fallback={null}>
      <ForwardDialog open={forwardOpen} sourceChatId={chatId ?? ''} messageIds={forwardMessageIds}
        onClose={() => { setForwardOpen(false); setForwardMessageIds([]); }}
        onForward={onForward} isForwarding={forwardIsPending} />
    </Suspense>
    <ContextMenu menuState={menuState} hideContextMenu={hideContextMenu} />

    {confirmClearOpen ? (
      <ConfirmationModal variant="danger" title="Clear this chat?"
        description="Messages will be cleared from your view only. Others in the chat won't be affected."
        confirmLabel="Clear all" cancelLabel="Cancel" onClose={() => setConfirmClearOpen(false)}
        handleConfirmationModal={({ accept }) => { setConfirmClearOpen(false); if (accept) onClearChat(); }} />
    ) : null}

    {confirmDelete ? (
      <ConfirmationModal variant="danger"
        title={confirmDelete.type === 'many' ? `Delete ${deletableSelectedCount} message${deletableSelectedCount === 1 ? '' : 's'}?` : 'Delete this message?'}
        description={confirmDelete.type === 'many'
          ? deletableSelectedCount < selectedCount
            ? canModerateGroup ? 'Some selected messages could not be deleted.' : 'Only your own messages in this selection will be deleted for everyone.'
            : 'Selected messages will be removed for everyone in this chat.'
          : 'This message will be removed for everyone in this chat.'}
        confirmLabel="Delete" cancelLabel="Cancel" onClose={() => setConfirmDelete(null)}
        handleConfirmationModal={({ accept }) => {
          if (!accept) { setConfirmDelete(null); return; }
          if (confirmDelete.type === 'one') onDeleteOne(confirmDelete.messageId);
          else onDeleteSelected();
          setConfirmDelete(null);
        }} />
    ) : null}

    {receiptMessage ? (
      <MessageReceiptDialog
        message={receiptMessage}
        isGroupChat={isGroupChat}
        onClose={onCloseReceipt}
      />
    ) : null}
  </>
);

export default ConversationDialogs;
