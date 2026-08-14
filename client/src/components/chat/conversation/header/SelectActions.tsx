import CopyIcon from '@/components/ui/icons/Copy';
import CloseIcon from '@/components/ui/icons/Close';
import ForwardIcon from '@/components/ui/icons/Forward';
import TrashIcon from '@/components/ui/icons/Trash';

type SelectModeActionsProps = {
  selectedCount: number;
  deletableSelectedCount: number;
  isDeletingSelected?: boolean;
  onCancelSelect?: () => void;
  onCopySelected?: () => void;
  onDeleteSelected?: () => void;
  onForwardSelected?: () => void;
};

const btnBase =
  'grid h-11 w-11 place-items-center rounded-full border text-body transition md:h-10 md:w-10';

const SelectActions = ({
  selectedCount,
  deletableSelectedCount,
  isDeletingSelected = false,
  onCancelSelect,
  onCopySelected,
  onDeleteSelected,
  onForwardSelected,
}: SelectModeActionsProps) => {
  const canDelete =
    selectedCount > 0 &&
    deletableSelectedCount > 0 &&
    selectedCount === deletableSelectedCount;

  return (
    <>
      <button
        type="button"
        disabled={selectedCount === 0}
        onClick={onCopySelected}
        className={`${btnBase} border-border enabled:hover:border-green-light enabled:hover:text-green`}
        aria-label="Copy selected messages"
      >
        <CopyIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        disabled={selectedCount === 0}
        onClick={onForwardSelected}
        className={`${btnBase} border-border enabled:hover:border-green-light enabled:hover:text-green`}
        aria-label="Forward selected messages"
      >
        <ForwardIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        disabled={!canDelete || isDeletingSelected}
        onClick={onDeleteSelected}
        className={`${btnBase} border-red/35 text-red enabled:hover:border-red/60 enabled:hover:bg-red/15 disabled:opacity-40`}
        aria-label="Delete selected messages"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onCancelSelect}
        className={`${btnBase} border-white/15 hover:border-green-light hover:text-white`}
        aria-label="Cancel selection"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </>
  );
};

export default SelectActions;
