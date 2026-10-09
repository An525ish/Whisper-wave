import ConfirmationModal from '@/shared/components/ui/modal/confirmation-modal/ConfirmationModal';

function WarningIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

type Props = {
  onClose: () => void;
};

/**
 * Shown when the server refuses `POST /match/join` because this browser already
 * holds a live chat (another tab shares the same anonymous identity).
 */
export default function AlreadyChattingModal({ onClose }: Props) {
  return (
    <ConfirmationModal
      variant="warning"
      icon={<WarningIcon />}
      hideCancel
      onClose={onClose}
      handleConfirmationModal={onClose}
      title="You're already in a chat"
      description="You're already chatting with someone in another tab or window of this browser. Finish or leave that chat first, then come back here."
      confirmLabel="Got it"
    />
  );
}
