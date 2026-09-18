import { createPortal } from 'react-dom';
import TrashIcon from '@/components/ui/icons/Trash';

type SelectionBarProps = {
  count: number;
  total: number;
  isDeleting: boolean;
  onSelectAll: () => void;
  onClear: () => void;
  onDelete: () => void;
};

const SelectionBar = ({
  count,
  total,
  isDeleting,
  onSelectAll,
  onClear,
  onDelete,
}: SelectionBarProps) => {
  if (count === 0) return null;

  const allSelected = count >= total;

  return createPortal(
    <div
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
      role="toolbar"
      aria-label="Selection actions"
    >
      <div className="flex items-center gap-2 rounded-2xl border border-white/12 bg-background-alt/90 px-3 py-2.5 shadow-[0_8px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <button
          type="button"
          onClick={onClear}
          className="flex h-8 items-center gap-1.5 rounded-xl px-3 text-xs font-medium text-body-300 transition hover:bg-white/6 hover:text-body"
        >
          <span className="grid h-4 w-4 place-items-center rounded-md bg-blue/20 text-[9px] font-bold text-blue ring-1 ring-blue/30">
            {count}
          </span>
          <span>selected</span>
        </button>

        <div className="h-4 w-px bg-white/10" aria-hidden />

        <button
          type="button"
          onClick={allSelected ? onClear : onSelectAll}
          className="h-8 rounded-xl px-3 text-xs font-medium text-body-300 transition hover:bg-white/6 hover:text-body"
        >
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>

        <div className="h-4 w-px bg-white/10" aria-hidden />

        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="flex h-8 items-center gap-1.5 rounded-xl bg-red/12 px-3 text-xs font-semibold text-red ring-1 ring-red/25 transition hover:bg-red/20 disabled:opacity-50"
        >
          <TrashIcon className="h-3.5 w-3.5" />
          {isDeleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default SelectionBar;
