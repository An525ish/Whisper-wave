import ConfirmationModal from '@/shared/components/ui/modal/confirmation-modal/ConfirmationModal';
import type { LeaveConfirmKind } from '../types';

type Props = {
  kind: LeaveConfirmKind;
  onResolve: (accept: boolean) => void;
};

/** "Are you sure?" for the two ways to abandon a live match (Back, skip chevron). */
export default function LeaveConfirm({ kind, onResolve }: Props) {
  const leaving = kind === 'leave';
  return (
    <ConfirmationModal
      onClose={() => onResolve(false)}
      handleConfirmationModal={({ accept }) => onResolve(accept)}
      title={leaving ? 'Leave this whisper?' : 'Skip to someone new?'}
      description={
        leaving
          ? 'This ends the chat for both of you. Nothing here is saved.'
          : 'Your current chat ends for both of you. Nothing here is saved.'
      }
      confirmLabel={leaving ? 'Leave' : 'Skip'}
      cancelLabel="Stay"
    />
  );
}
