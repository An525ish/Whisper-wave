import Modal from '../Modal';
import Button from '../../Button';

type ConfirmationResult = {
  accept: boolean;
};

type ConfirmationModalProps = {
  onClose: () => void;
  handleConfirmationModal: (result: ConfirmationResult) => void;
};

const ConfirmationModal = ({
  onClose,
  handleConfirmationModal,
}: ConfirmationModalProps) => {
  return (
    <Modal onClose={onClose}>
      <div className="w-[min(100%,25rem)] rounded-2xl border border-border bg-background-alt/80 p-6 sm:p-8">
        <p className="text-center text-lg sm:text-xl">Are you sure you want to leave ?</p>
        <div className="mt-6 flex gap-4">
          <Button
            variant="outlineGreen"
            className="w-full"
            onClick={() => handleConfirmationModal({ accept: true })}
          >
            Yes
          </Button>
          <Button
            variant="outlineRed"
            className="w-full"
            onClick={() => handleConfirmationModal({ accept: false })}
          >
            No
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
