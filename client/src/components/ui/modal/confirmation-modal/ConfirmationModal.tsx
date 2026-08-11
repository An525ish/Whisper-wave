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
      <div className="w-[25rem] border border-border bg-background-alt/80 rounded-2xl p-8">
        <p className="text-xl text-center">Are you sure you want to leave ?</p>
        <div className="flex gap-4 mt-6">
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
